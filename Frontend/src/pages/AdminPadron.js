import React, { useState, useRef } from 'react';
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

  // Mutación para subir archivo
  const uploadMutation = useMutation(
    (formData) => api.post('/api/padron/importar-dbf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutos de timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      },
    }),
    {
      onSuccess: (response) => {
        setUploadStatus('success');
        setUploadProgress(100);
        queryClient.invalidateQueries('estadisticas-padron');
        queryClient.invalidateQueries('metricas-movilizacion');
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
        console.error('Error subiendo archivo:', error);
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
      } else {
        setUploadStatus('error');
        alert('Por favor selecciona un archivo DBF válido');
      }
    }
  };

  const handleUpload = () => {
    if (uploadFile) {
      const formData = new FormData();
      formData.append('file', uploadFile);
      setUploadStatus('uploading');
      uploadMutation.mutate(formData);
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
                    onClick={handleUpload}
                    disabled={uploadMutation.isLoading}
                    startIcon={<FiUpload />}
                    sx={{ mr: 2 }}
                  >
                    Subir Archivo
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

              {uploadStatus === 'success' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ¡Archivo subido exitosamente!
                </Alert>
              )}

              {uploadStatus === 'error' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error al subir el archivo. Verifica que sea un archivo DBF válido.
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
    </Box>
  );
};

export default AdminPadron;
