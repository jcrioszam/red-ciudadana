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
  CircularProgress,
  Badge,
  Avatar,
  Divider,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
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
  Photo,
  Comment,
  Assignment,
  Person,
  CalendarToday,
  AccessTime,
  Flag,
  PriorityHigh,
  LowPriority
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SeguimientoReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [userRole, setUserRole] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enRevision: 0,
    enProceso: 0,
    resueltos: 0,
    rechazados: 0,
    urgentes: 0
  });

  useEffect(() => {
    loadReportes();
    getUserRole();
  }, [filterEstado, filterTipo]);



  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.rol);
      } else {
        console.error('Error al obtener rol del usuario:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error);
    }
  };

  const canUpdateReporte = () => {
    const rolesPermitidos = ['admin', 'presidente', 'lider_estatal', 'lider_municipal'];
    const tienePermiso = rolesPermitidos.includes(userRole);
    return tienePermiso;
  };

  const getObservacionesLabel = () => {
    const labels = {
      'admin': 'Observaciones del Administrador',
      'presidente': 'Observaciones del Presidente',
      'lider_estatal': 'Observaciones del Líder Estatal',
      'lider_municipal': 'Observaciones del Líder Municipal'
    };
    return labels[userRole] || 'Observaciones';
  };

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

        // Aplicar filtros
        if (filterEstado !== 'todos') {
          filteredData = filteredData.filter(reporte => reporte.estado === filterEstado);
        }
        if (filterTipo !== 'todos') {
          filteredData = filteredData.filter(reporte => reporte.tipo === filterTipo);
        }

        setReportes(filteredData);
        calculateStats(data);
      } else {
        console.error('Error en la respuesta:', response.status, response.statusText);
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
      rechazados: data.filter(r => r.estado === 'rechazado').length,
      urgentes: data.filter(r => r.prioridad === 'urgente').length
    };
    setStats(stats);
  };

  const handleUpdateEstado = async () => {
    if (!selectedReporte || !nuevoEstado) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/reportes-ciudadanos/${selectedReporte.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          estado: nuevoEstado,
          observaciones_admin: observaciones
        })
      });

      if (response.ok) {
        loadReportes();
        setUpdateDialogOpen(false);
        setDialogOpen(false);
        setSelectedReporte(null);
        setNuevoEstado('');
        setObservaciones('');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const openUpdateDialog = () => {
    setNuevoEstado(selectedReporte.estado);
    setObservaciones('');
    setUpdateDialogOpen(true);
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
      'baches': '#FF5722',
      'iluminacion': '#FFC107',
      'salud': '#E91E63',
      'seguridad': '#F44336',
      'agua': '#2196F3',
      'drenaje': '#795548',
      'basura': '#4CAF50',
      'parques': '#8BC34A',
      'semaforos': '#FF9800',
      'otros': '#9C27B0'
    };
    return colors[tipo] || '#9C27B0';
  };

  const getPrioridadIcon = (prioridad) => {
    const icons = {
      'baja': <LowPriority />,
      'normal': <Assignment />,
      'alta': <Flag />,
      'urgente': <PriorityHigh />
    };
    return icons[prioridad] || <Assignment />;
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'baja': 'success',
      'normal': 'info',
      'alta': 'warning',
      'urgente': 'error'
    };
    return colors[prioridad] || 'info';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const getTimelineSteps = (reporte) => {
    if (!reporte) return [];
    
    const steps = [
      {
        estado: 'pendiente',
        label: 'Reporte Creado',
        icon: <Schedule />,
        color: 'warning',
        fecha: reporte.fecha_creacion
      }
    ];

    if (reporte.estado !== 'pendiente') {
      steps.push({
        estado: 'en_revision',
        label: 'En Revisión',
        icon: <Visibility />,
        color: 'secondary',
        fecha: reporte.fecha_actualizacion
      });
    }

    if (['en_progreso', 'resuelto'].includes(reporte.estado)) {
      steps.push({
        estado: 'en_progreso',
        label: 'En Progreso',
        icon: <Speed />,
        color: 'info',
        fecha: reporte.fecha_actualizacion
      });
    }

    if (reporte.estado === 'resuelto') {
      steps.push({
        estado: 'resuelto',
        label: 'Resuelto',
        icon: <CheckCircle />,
        color: 'success',
        fecha: reporte.fecha_resolucion || reporte.fecha_actualizacion
      });
    }

    if (reporte.estado === 'rechazado') {
      steps.push({
        estado: 'rechazado',
        label: 'Rechazado',
        icon: <Warning />,
        color: 'error',
        fecha: reporte.fecha_actualizacion
      });
    }

    return steps;
  };

  const renderReporteDetalle = (reporte) => {
    if (!reporte) return null;
    
    const timelineSteps = getTimelineSteps(reporte);

    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Seguimiento: {reporte?.titulo}
            </Typography>
            <Chip
              icon={getEstadoIcon(reporte?.estado)}
              label={reporte?.estado}
              color={getEstadoColor(reporte?.estado)}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {reporte && (
            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Información del Reporte
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Título:</strong> {reporte.titulo}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Descripción:</strong> {reporte.descripcion}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Tipo:</strong> {reporte.tipo}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Prioridad:</strong> {reporte.prioridad}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Ciudadano:</strong> {reporte.ciudadano_nombre}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Fecha de creación:</strong> {formatDate(reporte.fecha_creacion)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Ubicación */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ubicación
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Dirección:</strong> {reporte.direccion || 'No especificada'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Coordenadas:</strong> {reporte.latitud}, {reporte.longitud}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 200, width: '100%' }}>
                      <MapContainer
                        center={[reporte.latitud, reporte.longitud]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[reporte.latitud, reporte.longitud]}>
                          <Popup>
                            <Typography variant="body2">{reporte.titulo}</Typography>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fotos */}
              {reporte.foto_url && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Fotos del Reporte
                      </Typography>
                      <ImageList sx={{ width: '100%', height: 300 }} cols={3} rowHeight={200}>
                        <ImageListItem>
                          <img
                            src={reporte.foto_url}
                            alt={reporte.titulo}
                            loading="lazy"
                            style={{ objectFit: 'cover' }}
                          />
                          <ImageListItemBar
                            title="Foto del problema"
                            subtitle={`Reportado el ${formatDate(reporte.fecha_creacion)}`}
                          />
                        </ImageListItem>
                      </ImageList>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Timeline */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Historial de Seguimiento
                    </Typography>
                    <Timeline position="alternate">
                      {timelineSteps.map((step, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                            {formatDate(step.fecha)}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineConnector />
                            <TimelineDot color={step.color}>
                              {step.icon}
                            </TimelineDot>
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Typography variant="h6" component="span">
                              {step.label}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </CardContent>
                </Card>
              </Grid>

              {/* Observaciones */}
              {reporte.observaciones_admin && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Observaciones Administrativas
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {reporte.observaciones_admin}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
                                   <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
            {canUpdateReporte() && (
              <Button
                onClick={openUpdateDialog}
                variant="contained"
                color="primary"
                sx={{
                  backgroundColor: '#FF5722',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '12px 24px',
                  margin: '8px',
                  border: '3px solid #D32F2F',
                  '&:hover': {
                    backgroundColor: '#D32F2F',
                    border: '3px solid #B71C1C'
                  }
                }}
              >
                🔧 ACTUALIZAR ESTADO
              </Button>
            )}
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
          📋 Seguimiento de Reportes Ciudadanos
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestión detallada y seguimiento de reportes comunitarios
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
          <Card sx={{ borderLeft: '4px solid #E91E63' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PriorityHigh color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.urgentes}</Typography>
                  <Typography variant="body2" color="textSecondary">Urgentes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterEstado}
                  label="Estado"
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
            </Grid>
            <Grid item>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filterTipo}
                  label="Tipo"
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="baches">Baches</MenuItem>
                  <MenuItem value="iluminacion">Iluminación</MenuItem>
                  <MenuItem value="salud">Salud</MenuItem>
                  <MenuItem value="seguridad">Seguridad</MenuItem>
                  <MenuItem value="agua">Agua</MenuItem>
                  <MenuItem value="drenaje">Drenaje</MenuItem>
                  <MenuItem value="basura">Basura</MenuItem>
                  <MenuItem value="parques">Parques</MenuItem>
                  <MenuItem value="semaforos">Semáforos</MenuItem>
                  <MenuItem value="otros">Otros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <IconButton onClick={loadReportes} color="primary">
                <Refresh />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Reportes */}
      <Grid container spacing={2}>
        {reportes && reportes.length > 0 ? (
          reportes.map((reporte) => (
            reporte && (
          <Grid item xs={12} md={6} lg={4} key={reporte.id}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" noWrap>
                      {reporte.titulo || 'Sin título'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {reporte.fecha_creacion ? formatDate(reporte.fecha_creacion) : 'Fecha no disponible'}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getEstadoIcon(reporte.estado)}
                    label={reporte.estado}
                    color={getEstadoColor(reporte.estado)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {reporte.descripcion || 'Sin descripción'}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={reporte.tipo}
                    size="small"
                    sx={{ backgroundColor: getTipoColor(reporte.tipo), color: 'white' }}
                  />
                  <Chip
                    icon={getPrioridadIcon(reporte.prioridad)}
                    label={reporte.prioridad}
                    color={getPrioridadColor(reporte.prioridad)}
                    size="small"
                  />
                </Box>

                {reporte.foto_url && (
                  <Box mb={2}>
                    <img
                      src={reporte.foto_url}
                      alt={reporte.titulo}
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                    />
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    {reporte.ciudadano_nombre || 'Ciudadano'}
                  </Typography>
                                     <IconButton
                     size="small"
                     onClick={() => {
                       setSelectedReporte(reporte);
                       setDialogOpen(true);
                     }}
                   >
                     <Visibility />
                   </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
            ))
          )
        ) : (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="h6" color="textSecondary">
                No hay reportes disponibles
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {renderReporteDetalle(selectedReporte)}

                           {/* Diálogo para actualizar estado */}
        <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Actualizar Estado del Reporte
            </Typography>
            <Chip
              icon={getEstadoIcon(selectedReporte?.estado)}
              label={selectedReporte?.estado}
              color={getEstadoColor(selectedReporte?.estado)}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                <strong>Reporte:</strong> {selectedReporte?.titulo}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedReporte?.descripcion}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Nuevo Estado</InputLabel>
                <Select
                  value={nuevoEstado}
                  label="Nuevo Estado"
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                                     <MenuItem value="pendiente">
                     <Box display="flex" alignItems="center">
                       <Schedule sx={{ mr: 1, color: '#FF9800' }} />
                       🟡 Pendiente
                     </Box>
                   </MenuItem>
                   <MenuItem value="en_revision">
                     <Box display="flex" alignItems="center">
                       <Visibility sx={{ mr: 1, color: '#9C27B0' }} />
                       🟣 En Revisión
                     </Box>
                   </MenuItem>
                   <MenuItem value="en_progreso">
                     <Box display="flex" alignItems="center">
                       <Speed sx={{ mr: 1, color: '#2196F3' }} />
                       🔵 En Progreso
                     </Box>
                   </MenuItem>
                   <MenuItem value="resuelto">
                     <Box display="flex" alignItems="center">
                       <CheckCircle sx={{ mr: 1, color: '#4CAF50' }} />
                       🟢 Resuelto
                     </Box>
                   </MenuItem>
                   <MenuItem value="rechazado">
                     <Box display="flex" alignItems="center">
                       <Warning sx={{ mr: 1, color: '#F44336' }} />
                       🔴 Rechazado
                     </Box>
                   </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={getObservacionesLabel()}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={`Ingresa las observaciones como ${userRole}...`}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Rol actual:</strong> {userRole}
                </Typography>
                <Typography variant="body2">
                  Las observaciones quedarán registradas con tu perfil de {userRole}.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpdateEstado}
            variant="contained"
            color="primary"
            disabled={!nuevoEstado}
          >
            Actualizar Estado
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SeguimientoReportes; 