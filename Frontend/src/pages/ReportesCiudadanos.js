import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
  Badge,
  Fab,
  Snackbar,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  LocationOn,
  Warning,
  CheckCircle,
  Schedule,
  Visibility,
  Edit,
  Delete,
  Add,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  Speed,
  MyLocation,
  PhotoCamera,
  Map,
  GpsFixed
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Componente para detectar clics en el mapa
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <Typography variant="body2">
          Ubicación seleccionada: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </Typography>
      </Popup>
    </Marker>
  );
}

const ReportesCiudadanos = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enRevision: 0,
    enProceso: 0,
    resueltos: 0,
    rechazados: 0
  });

  // Estados para el modal de crear reporte
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'otros',
    prioridad: 'normal',
    latitud: 0,
    longitud: 0,
    direccion: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estados para el mapa de ubicación
  const [mapPosition, setMapPosition] = useState([27.082347, -109.445866]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    loadReportes();
  }, [filterEstado]);

  const loadReportes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/reportes-ciudadanos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let filteredData = data;

        // Aplicar filtro
        if (filterEstado !== 'todos') {
          filteredData = data.filter(reporte => reporte.estado === filterEstado);
        }

        setReportes(filteredData);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      pendientes: data.filter(r => r.estado === 'pendiente').length,
      enRevision: data.filter(r => r.estado === 'en_revision').length,
      enProceso: data.filter(r => r.estado === 'en_progreso').length,
      resueltos: data.filter(r => r.estado === 'resuelto').length,
      rechazados: data.filter(r => r.estado === 'rechazado').length
    };
    setStats(stats);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': 'warning',
      'en_revision': 'secondary',
      'en_progreso': 'info',
      'resuelto': 'success',
      'rechazado': 'error'
    };
    return colors[estado] || 'default';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      'pendiente': <Schedule />,
      'en_revision': <Visibility />,
      'en_progreso': <Speed />,
      'resuelto': <CheckCircle />,
      'rechazado': <Warning />
    };
    return icons[estado] || <Schedule />;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'baches': '#FF9800',
      'iluminacion': '#9C27B0',
      'salud': '#F44336',
      'seguridad': '#2196F3',
      'agua': '#00BCD4',
      'basura': '#795548',
      'transporte': '#607D8B',
      'otros': '#9E9E9E'
    };
    return colors[tipo] || '#9E9E9E';
  };

  const handleUpdateEstado = async (reporteId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/reportes-ciudadanos/${reporteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        loadReportes();
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const getMapCenter = () => {
    if (reportes.length === 0) return [27.082347, -109.445866]; // Sonora por defecto
    
    const lats = reportes.map(r => r.latitud).filter(lat => lat !== 0);
    const lngs = reportes.map(r => r.longitud).filter(lng => lng !== 0);
    
    if (lats.length === 0) return [27.082347, -109.445866];
    
    const centerLat = lats.reduce((a, b) => a + b) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
    
    return [centerLat, centerLng];
  };

  const getMarkerColor = (estado) => {
    const colors = {
      'pendiente': '#FF9800',
      'en_revision': '#9C27B0',
      'en_progreso': '#2196F3',
      'resuelto': '#4CAF50',
      'rechazado': '#F44336'
    };
    return colors[estado] || '#9C27B0';
  };

  const detectarReportesCercanos = () => {
    const reportesCercanos = [];
    const umbral = 0.001; // Aproximadamente 100 metros

    for (let i = 0; i < reportes.length; i++) {
      for (let j = i + 1; j < reportes.length; j++) {
        const r1 = reportes[i];
        const r2 = reportes[j];
        
        const distancia = Math.sqrt(
          Math.pow(r1.latitud - r2.latitud, 2) + 
          Math.pow(r1.longitud - r2.longitud, 2)
        );
        
        if (distancia < umbral) {
          reportesCercanos.push({ r1, r2, distancia });
        }
      }
    }
    
    return reportesCercanos;
  };

  // Funciones para crear reporte
  const handleCreateReporte = async () => {
    if (!createForm.titulo || !createForm.descripcion || !selectedLocation) {
      setSnackbar({
        open: true,
        message: '❌ Por favor completa todos los campos requeridos',
        severity: 'warning'
      });
      return;
    }

    setCreateLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Si hay foto, usar el endpoint con foto
      if (selectedPhoto) {
        const formData = new FormData();
        formData.append('titulo', createForm.titulo);
        formData.append('descripcion', createForm.descripcion);
        formData.append('tipo', createForm.tipo);
        formData.append('prioridad', createForm.prioridad);
        formData.append('latitud', createForm.latitud);
        formData.append('longitud', createForm.longitud);
        formData.append('direccion', createForm.direccion);
        formData.append('foto', selectedPhoto);

        const response = await fetch('http://localhost:8000/reportes-ciudadanos-con-foto/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setSnackbar({
            open: true,
            message: '✅ Reporte creado exitosamente con foto',
            severity: 'success'
          });
          setCreateDialogOpen(false);
          resetCreateForm();
          loadReportes();
        } else {
          const errorData = await response.json();
          setSnackbar({
            open: true,
            message: `❌ Error: ${errorData.detail || 'Error al crear el reporte'}`,
            severity: 'error'
          });
        }
      } else {
        // Sin foto, usar el endpoint normal
        const response = await fetch('http://localhost:8000/reportes-ciudadanos/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createForm)
        });

        if (response.ok) {
          const data = await response.json();
          setSnackbar({
            open: true,
            message: '✅ Reporte creado exitosamente',
            severity: 'success'
          });
          setCreateDialogOpen(false);
          resetCreateForm();
          loadReportes();
        } else {
          const errorData = await response.json();
          setSnackbar({
            open: true,
            message: `❌ Error: ${errorData.detail || 'Error al crear el reporte'}`,
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      setSnackbar({
        open: true,
        message: '❌ Error al crear el reporte',
        severity: 'error'
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      titulo: '',
      descripcion: '',
      tipo: 'otros',
      prioridad: 'normal',
      latitud: 0,
      longitud: 0,
      direccion: ''
    });
    setSelectedLocation(null);
    setMapPosition([27.082347, -109.445866]);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: '❌ Por favor selecciona solo archivos de imagen',
          severity: 'warning'
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: '❌ La imagen debe ser menor a 5MB',
          severity: 'warning'
        });
        return;
      }

      setSelectedPhoto(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setMapPosition([latitude, longitude]);
            setSelectedLocation([latitude, longitude]);
            setCreateForm(prev => ({
              ...prev,
              latitud: latitude,
              longitud: longitude
            }));
            
            // Obtener dirección automáticamente
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('http://localhost:8000/geocodificar', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  direccion: `${latitude}, ${longitude}`,
                  reverse: true
                })
              });

              if (response.ok) {
                const data = await response.json();
                setCreateForm(prev => ({
                  ...prev,
                  direccion: data.direccion_formateada || `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                }));
              }
            } catch (error) {
              console.error('Error al obtener dirección:', error);
              setCreateForm(prev => ({
                ...prev,
                direccion: `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
            }
            
            setSnackbar({
              open: true,
              message: '📍 Ubicación obtenida exitosamente',
              severity: 'success'
            });
          },
          (error) => {
            console.error('Error al obtener ubicación:', error);
            setSnackbar({
              open: true,
              message: '❌ No se pudo obtener tu ubicación. Verifica los permisos de ubicación.',
              severity: 'warning'
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        setSnackbar({
          open: true,
          message: '❌ Tu navegador no soporta geolocalización',
          severity: 'warning'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '❌ Error al obtener ubicación',
        severity: 'error'
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation([lat, lng]);
    setCreateForm(prev => ({
      ...prev,
      latitud: lat,
      longitud: lng
    }));
  };

  const handleGeocodeAddress = async () => {
    if (!createForm.direccion) {
      setSnackbar({
        open: true,
        message: '❌ Ingresa una dirección para geocodificar',
        severity: 'warning'
      });
      return;
    }

    setLocationLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/geocodificar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          direccion: createForm.direccion
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMapPosition([data.latitud, data.longitud]);
        setSelectedLocation([data.latitud, data.longitud]);
        setCreateForm(prev => ({
          ...prev,
          latitud: data.latitud,
          longitud: data.longitud
        }));
        setSnackbar({
          open: true,
          message: '📍 Dirección geocodificada exitosamente',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: '❌ No se pudo geocodificar la dirección',
          severity: 'warning'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '❌ Error al geocodificar',
        severity: 'error'
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Nueva función para obtener dirección al hacer clic en el mapa
  const handleMapClick = async (lat, lng) => {
    setSelectedLocation([lat, lng]);
    setCreateForm(prev => ({
      ...prev,
      latitud: lat,
      longitud: lng
    }));

    // Obtener dirección automáticamente
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/geocodificar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          direccion: `${lat}, ${lng}`,
          reverse: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCreateForm(prev => ({
          ...prev,
          direccion: data.direccion_formateada || `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      }
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      setCreateForm(prev => ({
        ...prev,
        direccion: `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    }
  };

  const renderReporteDetalle = (reporte) => {
    if (!reporte) return null;

    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {getEstadoIcon(reporte.estado)}
            <Typography variant="h6">{reporte.titulo}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Detalles del Reporte
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Descripción:</strong> {reporte.descripcion}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Tipo:</strong> {reporte.tipo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Prioridad:</strong> {reporte.prioridad}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Fecha:</strong> {new Date(reporte.fecha_creacion).toLocaleString()}
              </Typography>
              {reporte.ciudadano_nombre && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Reportado por:</strong> {reporte.ciudadano_nombre}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Ubicación
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Dirección:</strong> {reporte.direccion || 'No especificada'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Coordenadas:</strong> {reporte.latitud}, {reporte.longitud}
              </Typography>
            </Grid>

            {/* Fotos del reporte */}
            {reporte.foto_url && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📸 Fotos del Reporte
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {console.log('🖼️ Intentando cargar imagen en diálogo:', reporte.foto_url)}
                      <img
                        src={reporte.foto_url}
                        alt={reporte.titulo}
                        style={{
                          maxWidth: '100%',
                          maxHeight: 400,
                          objectFit: 'contain',
                          borderRadius: 8,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                        onLoad={() => console.log('✅ Imagen cargada exitosamente en diálogo:', reporte.foto_url)}
                        onError={(e) => console.error('❌ Error al cargar imagen en diálogo:', reporte.foto_url, e)}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                      Foto tomada el {new Date(reporte.fecha_creacion).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Estado actual */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado Actual
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      icon={getEstadoIcon(reporte.estado)}
                      label={reporte.estado}
                      color={getEstadoColor(reporte.estado)}
                      size="large"
                    />
                    <Typography variant="body2" color="textSecondary">
                      Última actualización: {new Date(reporte.fecha_actualizacion || reporte.fecha_creacion).toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          <Button
            onClick={() => {
              // Aquí podrías abrir un modal para actualizar el estado
              setDialogOpen(false);
            }}
            variant="contained"
          >
            Actualizar Estado
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          📋 Dashboard de Reportes Ciudadanos
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestión y seguimiento de reportes comunitarios
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Badge badgeContent={stats.total} color="primary">
                  <Typography variant="h6">Total</Typography>
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '4px solid #FF9800' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.pendientes}</Typography>
                  <Typography variant="body2" color="textSecondary">Pendientes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '4px solid #9C27B0' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Visibility color="secondary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.enRevision}</Typography>
                  <Typography variant="body2" color="textSecondary">En Revisión</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '4px solid #2196F3' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.enProceso}</Typography>
                  <Typography variant="body2" color="textSecondary">En Proceso</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '4px solid #4CAF50' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.resueltos}</Typography>
                  <Typography variant="body2" color="textSecondary">Resueltos</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '4px solid #F44336' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.rechazados}</Typography>
                  <Typography variant="body2" color="textSecondary">Rechazados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <IconButton onClick={loadReportes} color="primary">
                  <Refresh />
                </IconButton>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Filtrar</InputLabel>
                  <Select
                    value={filterEstado}
                    label="Filtrar"
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="pendiente">Pendientes</MenuItem>
                    <MenuItem value="en_revision">En Revisión</MenuItem>
                    <MenuItem value="en_progreso">En Proceso</MenuItem>
                    <MenuItem value="resuelto">Resueltos</MenuItem>
                    <MenuItem value="rechazado">Rechazados</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mapa */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📍 Mapa de Reportes
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            <MapContainer
              center={getMapCenter()}
              zoom={reportes.length > 1 ? 16 : 13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {reportes.map((reporte, index) => (
                <Marker
                  key={reporte.id}
                  position={[reporte.latitud, reporte.longitud]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${getMarkerColor(reporte.estado)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })}
                >
                  <Popup>
                    <Box>
                      <Typography variant="h6">{reporte.titulo}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {reporte.descripcion}
                      </Typography>
                      <Chip
                        icon={getEstadoIcon(reporte.estado)}
                        label={reporte.estado}
                        color={getEstadoColor(reporte.estado)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        ID: {reporte.id}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de Reportes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Lista de Reportes
          </Typography>
          <Grid container spacing={2}>
            {reportes.map((reporte) => (
              <Grid item xs={12} md={6} lg={4} key={reporte.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => {
                    setSelectedReporte(reporte);
                    setDialogOpen(true);
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                        {reporte.titulo}
                      </Typography>
                      <Chip
                        icon={getEstadoIcon(reporte.estado)}
                        label={reporte.estado}
                        color={getEstadoColor(reporte.estado)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {reporte.descripcion}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={reporte.tipo}
                        size="small"
                        sx={{ backgroundColor: getTipoColor(reporte.tipo), color: 'white' }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(reporte.fecha_creacion).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Botón flotante para crear reporte */}
      <Fab
        color="primary"
        aria-label="Crear Reporte"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Modal para crear reporte */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              📝 Crear Nuevo Reporte Ciudadano
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)} 
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem'
              }
            }}
          >
            <Tab label="📋 Información del Reporte" />
            <Tab label="📍 Seleccionar Ubicación" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    📝 Información del Problema
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Título del Reporte"
                        value={createForm.titulo}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, titulo: e.target.value }))}
                        required
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Descripción Detallada"
                        multiline
                        rows={4}
                        value={createForm.descripcion}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, descripcion: e.target.value }))}
                        required
                        variant="outlined"
                        placeholder="Describe el problema con el mayor detalle posible..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Reporte</InputLabel>
                        <Select
                          value={createForm.tipo}
                          label="Tipo de Reporte"
                          onChange={(e) => setCreateForm(prev => ({ ...prev, tipo: e.target.value }))}
                          variant="outlined"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                          <MenuItem value="baches">🕳️ Baches</MenuItem>
                          <MenuItem value="iluminacion">💡 Iluminación</MenuItem>
                          <MenuItem value="salud">🏥 Salud</MenuItem>
                          <MenuItem value="seguridad">🛡️ Seguridad</MenuItem>
                          <MenuItem value="agua">💧 Agua</MenuItem>
                          <MenuItem value="basura">🗑️ Basura</MenuItem>
                          <MenuItem value="transporte">🚌 Transporte</MenuItem>
                          <MenuItem value="otros">📋 Otros</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Prioridad</InputLabel>
                        <Select
                          value={createForm.prioridad}
                          label="Prioridad"
                          onChange={(e) => setCreateForm(prev => ({ ...prev, prioridad: e.target.value }))}
                          variant="outlined"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                          <MenuItem value="baja">🟢 Baja</MenuItem>
                          <MenuItem value="normal">🟡 Normal</MenuItem>
                          <MenuItem value="alta">🟠 Alta</MenuItem>
                          <MenuItem value="urgente">🔴 Urgente</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    📸 Foto del Problema (Opcional)
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Agrega una foto que ayude a describir mejor el problema. Máximo 5MB.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="photo-upload"
                        type="file"
                        onChange={handlePhotoSelect}
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<PhotoCamera />}
                          sx={{ borderRadius: 2 }}
                        >
                          📷 Seleccionar Foto
                        </Button>
                      </label>
                      {selectedPhoto && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={handleRemovePhoto}
                          sx={{ borderRadius: 2 }}
                        >
                          🗑️ Eliminar
                        </Button>
                      )}
                    </Box>
                    
                    {photoPreview && (
                      <Card variant="outlined" sx={{ p: 2, backgroundColor: 'white' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          📸 Vista Previa:
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={photoPreview}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 200,
                              objectFit: 'contain',
                              borderRadius: 8,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                          Archivo: {selectedPhoto?.name} ({(selectedPhoto?.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>
                      </Card>
                    )}
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Siguiente paso:</strong> Ve a la pestaña "Seleccionar Ubicación" para elegir dónde se encuentra el problema.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    📍 Seleccionar Ubicación del Reporte
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Puedes usar tu ubicación actual, buscar por dirección, o hacer clic en el mapa para seleccionar la ubicación exacta.
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    🔍 Opciones de Ubicación
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={createForm.direccion}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Ej: Av. Principal 123, Colonia Centro"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<GpsFixed />}
                      onClick={handleGeocodeAddress}
                      disabled={locationLoading || !createForm.direccion}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Buscar por Dirección
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={locationLoading ? <CircularProgress size={16} /> : <MyLocation />}
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Mi Ubicación
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    📊 Coordenadas Seleccionadas:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Latitud"
                    type="number"
                    value={createForm.latitud}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      setCreateForm(prev => ({ ...prev, latitud: lat }));
                      setMapPosition([lat, createForm.longitud]);
                      setSelectedLocation([lat, createForm.longitud]);
                    }}
                    size="small"
                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Longitud"
                    type="number"
                    value={createForm.longitud}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      setCreateForm(prev => ({ ...prev, longitud: lng }));
                      setMapPosition([createForm.latitud, lng]);
                      setSelectedLocation([createForm.latitud, lng]);
                    }}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box sx={{ height: 500, position: 'relative' }}>
                    <MapContainer
                      center={mapPosition}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <LocationMarker 
                        position={selectedLocation} 
                        setPosition={(pos) => {
                          if (pos) {
                            handleMapClick(pos[0], pos[1]);
                          }
                        }}
                      />
                    </MapContainer>
                  </Box>
                  <Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
                      💡 <strong>Consejo:</strong> Haz clic en el mapa para seleccionar la ubicación exacta del problema.
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {selectedLocation && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      ✅ Ubicación seleccionada: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            {activeTab === 0 ? 'Siguiente: Ubicación' : 'Anterior: Información'}
          </Button>
          <Button
            onClick={handleCreateReporte}
            variant="contained"
            disabled={createLoading || !createForm.titulo || !createForm.descripcion || !selectedLocation}
            startIcon={createLoading ? <CircularProgress size={20} /> : <Add />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            {createLoading ? 'Creando...' : 'Crear Reporte'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Renderizar el diálogo de detalles */}
      {renderReporteDetalle(selectedReporte)}
    </Container>
  );
};

export default ReportesCiudadanos; 