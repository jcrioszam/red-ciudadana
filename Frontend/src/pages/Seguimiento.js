import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Paper
} from '@mui/material';
import { 
  Refresh, 
  LocationOn, 
  Speed, 
  Battery90,
  DirectionsCar,
  Map,
  Event,
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

export default function Seguimiento() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  // Roles permitidos para ver seguimiento (solo líderes superiores)
  const allowedRoles = ['admin', 'presidente', 'lider_estatal', 'lider_municipal'];

  // Cargar eventos activos
  useEffect(() => {
    loadActiveEvents();
  }, []);

  // Cargar ubicaciones cuando cambie el evento
  useEffect(() => {
    if (selectedEvento) {
      loadVehiclesLocation();
    }
  }, [selectedEvento]);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvento) {
        loadVehiclesLocation();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedEvento]);

  // Inicializar mapa cuando se monte el componente
  useEffect(() => {
    const initializeMapWithRetry = () => {
      if (typeof window !== 'undefined' && window.L) {
        initializeMap();
      } else {
        // Reintentar después de un breve delay
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.L) {
            initializeMap();
          } else {
            console.error('Leaflet no se pudo cargar');
            setError('Error al cargar el mapa. Por favor, recarga la página.');
          }
        }, 1000);
      }
    };

    initializeMapWithRetry();

    // Limpiar mapa cuando el componente se desmonte
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || map) return;

    // Verificar si el contenedor ya tiene un mapa
    if (mapRef.current._leaflet_id) {
      console.log('Mapa ya inicializado, saltando...');
      return;
    }

    try {
      const mapInstance = window.L.map(mapRef.current).setView([19.4326, -99.1332], 12);

      // Agregar capa de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      setMap(mapInstance);
      console.log('Mapa inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar mapa:', error);
      setError('Error al cargar el mapa. Por favor, recarga la página.');
    }
  };

  const loadActiveEvents = async () => {
    try {
      const response = await api.get('/eventos/?activos=true');
      setEventos(response.data);
      if (response.data.length > 0) {
        setSelectedEvento(response.data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setError('Error al cargar eventos');
    }
  };

  const loadVehiclesLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = selectedEvento 
        ? `/ubicacion/vehiculos?evento_id=${selectedEvento}`
        : '/ubicacion/vehiculos';
      
      const response = await api.get(endpoint);
      const vehiclesData = response.data?.ubicaciones || [];
      setVehicles(vehiclesData);
      
      // Actualizar marcadores en el mapa
      updateMapMarkers(vehiclesData);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      setError('Error al cargar las ubicaciones de vehículos');
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (vehiclesData) => {
    if (!map) {
      console.log('Mapa no disponible para actualizar marcadores');
      return;
    }

    try {
      // Limpiar marcadores anteriores
      markers.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });

      const newMarkers = vehiclesData.map(vehicle => {
        const position = [vehicle.latitud, vehicle.longitud];
        
        // Crear icono personalizado según el rol
        const icon = createVehicleIcon(vehicle);

        const marker = window.L.marker(position, { icon }).addTo(map);

        // Crear contenido de popup
        const popupContent = createPopupContent(vehicle);
        marker.bindPopup(popupContent);

        return marker;
      });

      setMarkers(newMarkers);

      // Ajustar vista del mapa para mostrar todos los marcadores
      if (newMarkers.length > 0) {
        const group = new window.L.featureGroup(newMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    } catch (error) {
      console.error('Error al actualizar marcadores:', error);
    }
  };

  const createVehicleIcon = (vehicle) => {
    const colors = {
      'admin': '#FF9800',
      'presidente': '#9C27B0',
      'lider_estatal': '#F44336',
      'lider_municipal': '#4CAF50',
      'lider_zona': '#2196F3',
      'default': '#607D8B'
    };
    
    const color = colors[vehicle.rol] || colors.default;
    
    // Crear un identificador único para el vehículo
    const vehicleId = vehicle.vehiculo_placas || vehicle.vehiculo_tipo || vehicle.id_usuario;
    
    return window.L.divIcon({
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background-color: ${color}; 
          border: 2px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <span style="color: white; font-size: 16px;">🚗</span>
        </div>
      `,
      className: 'custom-vehicle-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createPopupContent = (vehicle) => {
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
      return date.toLocaleDateString('es-MX');
    };

    let popupContent = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #1a237e; font-weight: bold;">${vehicle.nombre}${vehicle.vehiculo_placas ? ` - ${vehicle.vehiculo_placas}` : ''}</h3>
        <p style="margin: 4px 0; color: #666;">
          <strong>Rol:</strong> ${vehicle.rol.replace('_', ' ').toUpperCase()}
        </p>
        <p style="margin: 4px 0; color: #666;">
          <strong>Ubicación:</strong> ${vehicle.latitud.toFixed(6)}, ${vehicle.longitud.toFixed(6)}
        </p>
        ${vehicle.velocidad ? `<p style="margin: 4px 0; color: #666;"><strong>Velocidad:</strong> ${vehicle.velocidad.toFixed(1)} km/h</p>` : ''}
        ${vehicle.bateria ? `<p style="margin: 4px 0; color: #666;"><strong>Batería:</strong> ${vehicle.bateria}%</p>` : ''}
        ${vehicle.direccion ? `<p style="margin: 4px 0; color: #666;"><strong>Dirección:</strong> ${vehicle.direccion}</p>` : ''}
        <p style="margin: 4px 0; color: #666;">
          <strong>Última actualización:</strong> ${formatTimestamp(vehicle.timestamp)}
        </p>
    `;

    // Agregar información de movilización si está disponible
    if (vehicle.evento_nombre) {
      popupContent += `
        <hr style="margin: 12px 0; border: 1px solid #ddd;">
        <h4 style="margin: 8px 0; color: #4CAF50; font-weight: bold;">🚗 Información de Movilización</h4>
        <p style="margin: 4px 0; color: #666;">
          <strong>Evento:</strong> ${vehicle.evento_nombre}
        </p>
        <p style="margin: 4px 0; color: #666;">
          <strong>Vehículo:</strong> ${vehicle.vehiculo_tipo || 'N/A'}
        </p>
        ${vehicle.vehiculo_placas ? `<p style="margin: 4px 0; color: #666;"><strong>Placas:</strong> ${vehicle.vehiculo_placas}</p>` : ''}
        ${vehicle.total_personas ? `<p style="margin: 4px 0; color: #666;"><strong>Personas:</strong> ${vehicle.total_personas}${vehicle.vehiculo_capacidad ? ` de ${vehicle.vehiculo_capacidad}` : ''}</p>` : ''}
      `;
    }

    popupContent += `</div>`;
    return popupContent;
  };

  const getRoleColor = (rol) => {
    const colors = {
      'admin': '#FF9800',
      'presidente': '#9C27B0',
      'lider_estatal': '#F44336',
      'lider_municipal': '#4CAF50',
      'lider_zona': '#2196F3',
      'default': '#607D8B'
    };
    return colors[rol] || colors.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('es-MX');
  };

  // Verificar si el usuario tiene permisos
  if (!allowedRoles.includes(user?.rol)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder al módulo de seguimiento en tiempo real.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Seguimiento en Tiempo Real
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Monitorea la ubicación de vehículos y personal durante movilizaciones
        </Typography>
      </Box>

      {/* Controles */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Event sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Seleccionar Evento</Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Evento</InputLabel>
                <Select
                  value={selectedEvento || ''}
                  onChange={(e) => setSelectedEvento(e.target.value)}
                  label="Evento"
                >
                  {eventos.map(evento => (
                    <MenuItem key={evento.id} value={evento.id}>
                      {evento.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Vehículos Activos</Typography>
              </Box>
              <Typography variant="h3" color="primary" gutterBottom>
                {vehicles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En seguimiento
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Refresh sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Actualizar</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={loadVehiclesLocation}
                disabled={loading}
                fullWidth
                startIcon={<Refresh sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
              >
                {loading ? 'Actualizando...' : 'Actualizar Ahora'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mapa Interactivo */}
      <Card sx={{ mb: 3, height: 500 }}>
        <CardContent sx={{ height: '100%', p: 0 }}>
          {typeof window !== 'undefined' && window.L ? (
            <div 
              ref={mapRef}
              style={{ 
                height: '100%', 
                width: '100%',
                borderRadius: '8px'
              }}
            />
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              p: 3
            }}>
              <Map sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Cargando mapa...
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Si el mapa no aparece, recarga la página
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Recargar Página
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lista de vehículos */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Vehículos en Seguimiento ({vehicles.length})
          </Typography>

          {vehicles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <DirectionsCar sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No hay vehículos en seguimiento para este evento
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {vehicles.map((vehicle, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {vehicle.nombre}
                          </Typography>
                          <Chip 
                            label={vehicle.rol.replace('_', ' ').toUpperCase()} 
                            size="small"
                            sx={{ 
                              backgroundColor: getRoleColor(vehicle.rol),
                              color: 'white'
                            }}
                          />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(vehicle.timestamp)}
                          </Typography>
                          {vehicle.activo && (
                            <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', mt: 1, ml: 'auto' }} />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ space: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.latitud.toFixed(6)}, {vehicle.longitud.toFixed(6)}
                          </Typography>
                        </Box>

                        {vehicle.velocidad && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Speed sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Velocidad: {vehicle.velocidad.toFixed(1)} km/h
                            </Typography>
                          </Box>
                        )}

                        {vehicle.bateria && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Battery90 sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Batería: {vehicle.bateria}%
                            </Typography>
                          </Box>
                        )}

                        {vehicle.direccion && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {vehicle.direccion}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Estilos para animación */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
} 