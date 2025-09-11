import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import TablaPadronEditable from '../components/TablaPadronEditable';
import {
  FiUpload,
  FiSearch,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiEye,
  FiFilter
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api';

const AdminPadron = () => {
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Estados para importación desde Excel
  const [excelFile, setExcelFile] = useState(null);
  const [datosTexto, setDatosTexto] = useState('');
  const [datosProcesados, setDatosProcesados] = useState(null);
  const [mostrarImportacion, setMostrarImportacion] = useState(false);
  const [mostrarDatos, setMostrarDatos] = useState(false);
  const [mostrarTablaEditable, setMostrarTablaEditable] = useState(false);
  const [searchParams, setSearchParams] = useState({
    elector: '',
    curp: '',
    nombre: '',
    ape_pat: '',
    ape_mat: '',
    seccion: '',
    municipio: '',
    distrito: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Obtener estadísticas del padrón
  const { data: estadisticas, isLoading: loadingStats } = useQuery(
    'estadisticas-padron',
    () => api.get('/api/padron/estadisticas').then(res => res.data),
    {
      refetchInterval: 30000, // Actualizar cada 30 segundos
      onError: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    }
  );

  // Obtener métricas de movilización
  const { data: metricas, isLoading: loadingMetricas } = useQuery(
    'metricas-movilizacion',
    () => api.get('/metricas-movilizacion/').then(res => res.data),
    {
      refetchInterval: 30000,
      onError: (error) => {
        console.error('Error cargando métricas:', error);
      }
    }
  );

  // Función para importación real
  const handleRealImport = () => {
    if (!uploadFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploadStatus('uploading');
    uploadMutation.mutate(formData);
  };

  // Mutación para probar archivo DBF (usar endpoint optimizado para archivos grandes)
  const testMutation = useMutation(
    (formData) => api.post('/api/padron/test-dbf-large', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 1800000, // 30 minutos de timeout para archivos DBF grandes (658MB)
    }),
    {
      onSuccess: (response) => {
        console.log('✅ Prueba DBF exitosa:', response.data);
        setUploadProgress(50);
        setUploadMessage(`Archivo válido: ${response.data.total_records} registros encontrados. Campos: ${response.data.field_names?.join(', ')}`);
        setUploadStatus('success');
        // Si la prueba es exitosa, proceder con la importación real
        if (response.data.success) {
          setTimeout(() => {
            setUploadProgress(60);
            setUploadMessage('Iniciando importación...');
            handleRealImport();
          }, 1000);
        }
      },
      onError: (error) => {
        setUploadStatus('error');
        setUploadProgress(0);
        console.error('Error probando archivo:', error);
        setUploadMessage(`Error probando archivo: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Mutación para subir archivo (importación real)
  const uploadMutation = useMutation(
    (formData) => {
      // Usar endpoint chunked para archivos grandes (>100MB)
      const file = formData.get('file');
      const endpoint = file.size > 100 * 1024 * 1024 ? '/api/padron/importar-dbf-chunked' : '/api/padron/importar-dbf';
      
      return api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 3600000, // 60 minutos de timeout para archivos DBF grandes
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
    },
    {
      onSuccess: (response) => {
        setUploadStatus('success');
        setUploadProgress(100);
        queryClient.invalidateQueries('estadisticas-padron');
        queryClient.invalidateQueries('metricas-movilizacion');
        setUploadMessage(response.data.mensaje || 'Archivo subido exitosamente.');
        setTimeout(() => {
          setUploadStatus('');
          setUploadProgress(0);
          setUploadFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      },
      onError: (error) => {
        setUploadStatus('error');
        setUploadProgress(0);
        console.error('Error subiendo archivo:', error);
        setUploadMessage(`Error subiendo archivo: ${error.response?.data?.detail || error.message}`);
      }
    }
  );

  // Mutación para buscar en padrón
  const searchMutation = useMutation(
    (params) => api.post('/api/padron/buscar', params).then(res => res.data),
    {
      onSuccess: (data) => {
        setSearchResults(data.registros);
        setSearchDialogOpen(true);
      },
      onError: (error) => {
        console.error('Error buscando en padrón:', error);
      }
    }
  );

  // Mutación para limpiar padrón
  const clearMutation = useMutation(
    () => api.delete('/api/padron/limpiar'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('estadisticas-padron');
        queryClient.invalidateQueries('metricas-movilizacion');
      }
    }
  );

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.dbf')) {
        setUploadFile(file);
        setUploadStatus('');
        setUploadProgress(0);
        setUploadMessage('');
      } else {
        setUploadStatus('error');
        setUploadMessage('Por favor selecciona un archivo DBF válido');
      }
    }
  };

  const handleUpload = () => {
    if (uploadFile) {
      // Primero probar el archivo
      console.log('🧪 Iniciando test de archivo DBF:', uploadFile.name, 'Tamaño:', uploadFile.size);
      const formData = new FormData();
      formData.append('file', uploadFile);
      setUploadStatus('uploading');
      setUploadProgress(10);
      setUploadMessage('Probando archivo DBF...');
      testMutation.mutate(formData);
    }
  };

  const handleAnalyze = () => {
    if (uploadFile) {
      console.log('🔍 Analizando estructura del archivo DBF:', uploadFile.name);
      const formData = new FormData();
      formData.append('file', uploadFile);
      setUploadStatus('analyzing');
      setUploadMessage('Analizando estructura del archivo DBF...');
      
      // Llamar al endpoint de análisis
      api.post('/api/padron/analizar-dbf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos
      })
      .then(response => {
        console.log('✅ Análisis completado:', response.data);
        setUploadStatus('success');
        setUploadMessage(`Análisis completado. Campos encontrados: ${response.data.campos_disponibles?.length || 0}`);
        
        // Mostrar información detallada en consola
        if (response.data.campos_disponibles) {
          console.log('📋 Campos disponibles:', response.data.campos_disponibles);
          console.log('📊 Total registros:', response.data.total_registros);
          console.log('📝 Muestra de registros:', response.data.registros_muestra);
        }
      })
      .catch(error => {
        console.error('❌ Error en análisis:', error);
        setUploadStatus('error');
        setUploadMessage(`Error analizando archivo: ${error.response?.data?.error || error.message}`);
      });
    }
  };

  const handleSearch = () => {
    const params = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value.trim() !== '')
    );
    if (Object.keys(params).length > 0) {
      searchMutation.mutate(params);
    }
  };

  const handleClearSearch = () => {
    setSearchParams({
      elector: '',
      curp: '',
      nombre: '',
      ape_pat: '',
      ape_mat: '',
      seccion: '',
      municipio: '',
      distrito: ''
    });
    setSearchResults([]);
  };

  // Funciones para importación desde Excel
  const handleExcelFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (['xlsx', 'xls', 'csv'].includes(extension)) {
        setExcelFile(file);
        setUploadStatus('');
        setUploadMessage('');
      } else {
        setUploadStatus('error');
        setUploadMessage('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      }
    }
  };

  const handleExcelUpload = () => {
    if (excelFile) {
      console.log('📊 Subiendo archivo Excel:', excelFile.name);
      const formData = new FormData();
      formData.append('file', excelFile);
      setUploadStatus('uploading');
      setUploadMessage('Procesando archivo Excel...');
      
      api.post('/api/padron/importar-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos
      })
      .then(response => {
        console.log('✅ Archivo Excel procesado:', response.data);
        setUploadStatus('success');
        setUploadMessage(`Archivo procesado: ${response.data.total_registros} registros encontrados`);
        setDatosProcesados(response.data);
        setMostrarDatos(true);
      })
      .catch(error => {
        console.error('❌ Error procesando Excel:', error);
        setUploadStatus('error');
        setUploadMessage(`Error procesando archivo: ${error.response?.data?.error || error.message}`);
      });
    }
  };

  const handleDatosTextoChange = (event) => {
    setDatosTexto(event.target.value);
  };

  const handleProcesarDatosTexto = () => {
    if (datosTexto.trim()) {
      console.log('📋 Procesando datos de texto');
      setUploadStatus('uploading');
      setUploadMessage('Procesando datos copiados...');
      
      api.post('/api/padron/importar-datos-masivos', datosTexto, {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 300000, // 5 minutos
      })
      .then(response => {
        console.log('✅ Datos procesados:', response.data);
        setUploadStatus('success');
        setUploadMessage(`Datos procesados: ${response.data.total_registros} registros encontrados`);
        setDatosProcesados(response.data);
        setMostrarDatos(true);
      })
      .catch(error => {
        console.error('❌ Error procesando datos:', error);
        setUploadStatus('error');
        setUploadMessage(`Error procesando datos: ${error.response?.data?.error || error.message}`);
      });
    }
  };

  const handleConfirmarImportacion = () => {
    if (datosProcesados && datosProcesados.datos_completos) {
      console.log('💾 Confirmando importación');
      setUploadStatus('uploading');
      setUploadMessage('Importando datos a la base de datos...');
      
      // Usar datos_completos del backend
      const datosCompletos = datosProcesados.datos_completos.map(registro => ({
        cedula: registro.cedula || '',
        nombre: registro.nombre || '',
        apellido_paterno: registro.apellido_paterno || '',
        apellido_materno: registro.apellido_materno || '',
        fecha_nacimiento: registro.fecha_nacimiento || null,
        sexo: registro.sexo || '',
        estado: registro.estado || '',
        municipio: registro.municipio || '',
        seccion: registro.seccion || '',
        localidad: registro.localidad || '',
        casilla: registro.casilla || '',
        tipo_casilla: registro.tipo_casilla || '',
        domicilio: registro.domicilio || '',
        colonia: registro.colonia || '',
        codigo_postal: registro.codigo_postal || '',
        telefono: registro.telefono || '',
        email: registro.email || ''
      }));
      
      api.post('/api/padron/confirmar-importacion', datosCompletos, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 600000, // 10 minutos
      })
      .then(response => {
        console.log('✅ Importación completada:', response.data);
        setUploadStatus('success');
        setUploadMessage(`Importación completada: ${response.data.total_guardados} registros guardados`);
        setMostrarDatos(false);
        setDatosProcesados(null);
        setDatosTexto('');
        setExcelFile(null);
        queryClient.invalidateQueries('estadisticas-padron');
        queryClient.invalidateQueries('metricas-movilizacion');
      })
      .catch(error => {
        console.error('❌ Error en importación:', error);
        setUploadStatus('error');
        setUploadMessage(`Error en importación: ${error.response?.data?.error || error.message}`);
      });
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administración del Padrón Electoral
      </Typography>

      <Grid container spacing={3}>
        {/* Estadísticas Generales */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estadísticas del Padrón
              </Typography>
              {loadingStats ? (
                <LinearProgress />
              ) : estadisticas ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total de Registros:</Typography>
                    <Typography variant="h6">{formatNumber(estadisticas.total_registros)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Asignados:</Typography>
                    <Typography color="primary">{formatNumber(estadisticas.registros_asignados)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Disponibles:</Typography>
                    <Typography color="success.main">{formatNumber(estadisticas.registros_disponibles)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Líderes Activos:</Typography>
                    <Typography>{estadisticas.total_lideres}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="error">Error cargando estadísticas</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Métricas de Movilización */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Movilización
              </Typography>
              {loadingMetricas ? (
                <LinearProgress />
              ) : metricas ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Personas Registradas:</Typography>
                    <Typography variant="h6">{formatNumber(metricas.resumen_general.total_personas_registradas)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Líderes Activos:</Typography>
                    <Typography>{metricas.resumen_general.total_lideres_activos}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="error">Error cargando métricas</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Subir Archivo DBF */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Importar Padrón Electoral
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dbf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FiUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mr: 2 }}
                >
                  Seleccionar Archivo DBF
                </Button>
                {uploadFile && (
                  <Chip
                    label={uploadFile.name}
                    onDelete={() => {
                      setUploadFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    color="primary"
                  />
                )}
              </Box>

              {uploadFile && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      if (uploadFile) {
                        console.log('🧪 Iniciando test de archivo DBF:', uploadFile.name, 'Tamaño:', uploadFile.size);
                        const formData = new FormData();
                        formData.append('file', uploadFile);
                        setUploadStatus('testing');
                        setUploadMessage('Probando archivo DBF...');
                        testMutation.mutate(formData);
                      }
                    }}
                    disabled={testMutation.isLoading || uploadStatus === 'testing'}
                    startIcon={<FiCheckCircle />}
                    sx={{ mr: 2 }}
                  >
                    {uploadStatus === 'testing' ? 'Probando...' : 'Probar Archivo'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploadMutation.isLoading}
                    startIcon={<FiUpload />}
                    sx={{ mr: 2 }}
                  >
                    Subir Archivo
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={handleAnalyze}
                    disabled={uploadStatus === 'analyzing'}
                    startIcon={<FiSearch />}
                    sx={{ mr: 2 }}
                  >
                    {uploadStatus === 'analyzing' ? 'Analizando...' : 'Analizar Estructura'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setUploadFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}

              {uploadStatus === 'uploading' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Subiendo archivo... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {uploadStatus === 'testing' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Probando archivo DBF...
                  </Typography>
                </Box>
              )}

              {uploadStatus === 'analyzing' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Analizando estructura del archivo DBF...
                  </Typography>
                </Box>
              )}

              {uploadStatus === 'success' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {uploadMessage || '¡Operación completada exitosamente!'}
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadMessage || 'Error al procesar el archivo. Verifica que sea un archivo DBF válido.'}
                </Alert>
              )}

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FiTrash2 />}
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres limpiar todo el padrón? Esta acción no se puede deshacer.')) {
                      clearMutation.mutate();
                    }
                  }}
                  disabled={clearMutation.isLoading}
                >
                  Limpiar Padrón
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Importación desde Excel */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Importar desde Excel/CSV
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Opción 1: Seleccionar archivo Excel o CSV
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FiUpload />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.xlsx,.xls,.csv';
                    input.onchange = handleExcelFileSelect;
                    input.click();
                  }}
                  sx={{ mr: 2 }}
                >
                  Seleccionar Archivo Excel/CSV
                </Button>
                {excelFile && (
                  <Chip
                    label={excelFile.name}
                    onDelete={() => setExcelFile(null)}
                    color="primary"
                  />
                )}
                {excelFile && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleExcelUpload}
                    disabled={uploadStatus === 'uploading'}
                    startIcon={<FiCheckCircle />}
                    sx={{ ml: 2 }}
                  >
                    Procesar Archivo
                  </Button>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Opción 2: Copiar y pegar datos desde Excel
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Copia y pega aquí los datos desde Excel (incluyendo encabezados)..."
                  value={datosTexto}
                  onChange={handleDatosTextoChange}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleProcesarDatosTexto}
                  disabled={!datosTexto.trim() || uploadStatus === 'uploading'}
                  startIcon={<FiSearch />}
                >
                  Procesar Datos
                </Button>
              </Box>
              
              {/* Nueva opción: Tabla Editable */}
              <Box sx={{ mt: 3, p: 2, border: '2px dashed #e0e0e0', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Opción 3: Tabla Editable (Recomendado)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
                  Copia y pega datos desde Excel directamente en una tabla editable. 
                  Puedes editar cualquier celda antes de guardar.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FiUsers />}
                  onClick={() => setMostrarTablaEditable(true)}
                  sx={{ mr: 2 }}
                >
                  📊 Abrir Tabla Editable
                </Button>
              </Box>

              {uploadStatus === 'uploading' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {uploadMessage || 'Procesando datos...'}
                  </Typography>
                </Box>
              )}

              {uploadStatus === 'success' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {uploadMessage || '¡Datos procesados exitosamente!'}
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadMessage || 'Error al procesar los datos.'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Búsqueda en Padrón */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Búsqueda en Padrón
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Clave de Elector"
                    value={searchParams.elector}
                    onChange={(e) => setSearchParams({...searchParams, elector: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="CURP"
                    value={searchParams.curp}
                    onChange={(e) => setSearchParams({...searchParams, curp: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={searchParams.nombre}
                    onChange={(e) => setSearchParams({...searchParams, nombre: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Apellido Paterno"
                    value={searchParams.ape_pat}
                    onChange={(e) => setSearchParams({...searchParams, ape_pat: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Apellido Materno"
                    value={searchParams.ape_mat}
                    onChange={(e) => setSearchParams({...searchParams, ape_mat: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Sección"
                    value={searchParams.seccion}
                    onChange={(e) => setSearchParams({...searchParams, seccion: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Municipio"
                    value={searchParams.municipio}
                    onChange={(e) => setSearchParams({...searchParams, municipio: e.target.value})}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Distrito"
                    value={searchParams.distrito}
                    onChange={(e) => setSearchParams({...searchParams, distrito: e.target.value})}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box>
                <Button
                  variant="contained"
                  startIcon={<FiSearch />}
                  onClick={handleSearch}
                  disabled={searchMutation.isLoading}
                  sx={{ mr: 2 }}
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearSearch}
                >
                  Limpiar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ranking de Líderes */}
        {metricas && metricas.ranking_movilizacion && metricas.ranking_movilizacion.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ranking de Movilización por Líder
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Posición</TableCell>
                        <TableCell>Líder</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell align="right">Total Movilización</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metricas.ranking_movilizacion.slice(0, 10).map((lider, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={index + 1}
                              color={index < 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{lider.lider}</TableCell>
                          <TableCell>{lider.rol}</TableCell>
                          <TableCell align="right">{formatNumber(lider.total_movilizacion)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog de Datos Procesados */}
      <Dialog
        open={mostrarDatos}
        onClose={() => setMostrarDatos(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Datos Procesados - Vista Previa
        </DialogTitle>
        <DialogContent>
          {datosProcesados && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resumen de Importación
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography><strong>Total de registros:</strong> {datosProcesados.total_registros}</Typography>
                <Typography><strong>Columnas detectadas:</strong> {datosProcesados.columnas_disponibles?.join(', ')}</Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Muestra de Datos (Primeros 10 registros)
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cédula</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Apellido Paterno</TableCell>
                      <TableCell>Apellido Materno</TableCell>
                      <TableCell>Sexo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Municipio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosProcesados.datos_muestra?.map((registro, index) => (
                      <TableRow key={index}>
                        <TableCell>{registro.cedula || '-'}</TableCell>
                        <TableCell>{registro.nombre || '-'}</TableCell>
                        <TableCell>{registro.apellido_paterno || '-'}</TableCell>
                        <TableCell>{registro.apellido_materno || '-'}</TableCell>
                        <TableCell>{registro.sexo || '-'}</TableCell>
                        <TableCell>{registro.estado || '-'}</TableCell>
                        <TableCell>{registro.municipio || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarDatos(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarImportacion}
            variant="contained"
            color="primary"
            disabled={uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? 'Importando...' : 'Confirmar Importación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Resultados de Búsqueda */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Resultados de Búsqueda ({searchResults.length} registros)
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Clave Elector</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellidos</TableCell>
                  <TableCell>Sección</TableCell>
                  <TableCell>Municipio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Asignado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.elector}</TableCell>
                    <TableCell>{registro.nombre}</TableCell>
                    <TableCell>{registro.ape_pat} {registro.ape_mat}</TableCell>
                    <TableCell>{registro.seccion}</TableCell>
                    <TableCell>{registro.municipio}</TableCell>
                    <TableCell>{registro.entidad}</TableCell>
                    <TableCell>
                      {registro.id_lider_asignado ? (
                        <Chip
                          label="Asignado"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Disponible"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Tabla Editable */}
      {mostrarTablaEditable && (
        <TablaPadronEditable onClose={() => setMostrarTablaEditable(false)} />
      )}
    </Box>
  );
};

export default AdminPadron;
