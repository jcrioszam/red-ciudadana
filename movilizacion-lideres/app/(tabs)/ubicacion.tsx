import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { Surface, Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useAuth } from '../../src/contexts/AuthContext';

// Tipos para TypeScript
interface Vehicle {
  id_usuario: number;
  nombre: string;
  rol: string;
  latitud: number;
  longitud: number;
  velocidad?: number;
  direccion?: string;
  timestamp: string;
  bateria?: number | null;
  activo?: boolean;
  id_evento?: number;
  id_vehiculo?: number;
  evento_nombre?: string;
  vehiculo_placas?: string;
}

interface Stats {
  total: number;
  activos: number;
  porRol: { [key: string]: number };
}

interface LocationData {
  latitud: number;
  longitud: number;
  precision?: number;
  velocidad?: number;
  bateria?: number;
  direccion?: string;
  timestamp?: string;
}

export default function UbicacionScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    activos: 0,
    porRol: {}
  });
  
  // Roles permitidos para ver seguimiento (solo líderes superiores)
  const allowedRoles = ['admin', 'presidente', 'lider_estatal', 'lider_municipal'];
  
  // Verificar si el usuario tiene permisos
  if (!allowedRoles.includes(user?.rol)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome5 name="lock" size={48} color="#f44336" style={styles.restrictedIcon} />
          <Text style={styles.title}>Acceso Restringido</Text>
          <Text style={styles.subtitle}>No tienes permisos para acceder al seguimiento en tiempo real</Text>
          <Text style={styles.contactText}>Contacta a tu administrador para solicitar acceso</Text>
        </View>
      </View>
    );
  }
  
  const {
    location,
    errorMsg,
    isTracking,
    address,
    batteryLevel,
    lastUpdate,
    startTracking,
    stopTracking,
    getVehiclesLocation,
    getMyLocation,
    getActiveEvents,
  } = useLocationTracking(30000); // Actualizar cada 30 segundos

  // Calcular estadísticas
  const calculateStats = (vehiclesData: Vehicle[]): Stats => {
    const stats: Stats = {
      total: vehiclesData.length,
      activos: vehiclesData.filter(v => v.activo !== false).length,
      porRol: {}
    };

    vehiclesData.forEach(vehicle => {
      if (!stats.porRol[vehicle.rol]) {
        stats.porRol[vehicle.rol] = 0;
      }
      stats.porRol[vehicle.rol]++;
    });

    return stats;
  };

  // Cargar eventos activos
  const loadActiveEvents = async () => {
    try {
      const eventosData = await getActiveEvents();
      setEventos(eventosData);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  // Cargar ubicaciones de vehículos
  const loadVehiclesLocation = async () => {
    try {
      setRefreshing(true);
      const vehiclesData = await getVehiclesLocation(selectedEvento?.id);
      setVehicles(vehiclesData);
      setStats(calculateStats(vehiclesData));
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las ubicaciones');
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadActiveEvents();
    loadVehiclesLocation();
  }, []);

  // Actualizar cuando cambie el evento seleccionado
  useEffect(() => {
    loadVehiclesLocation();
  }, [selectedEvento]);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadVehiclesLocation();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedEvento]);

  // Manejar inicio/detención de seguimiento
  const handleTrackingToggle = async () => {
    if (isTracking) {
      stopTracking();
      Alert.alert('Seguimiento detenido', 'Ya no se está enviando tu ubicación');
    } else {
      await startTracking();
      Alert.alert('Seguimiento iniciado', 'Tu ubicación se está enviando cada 30 segundos');
    }
  };

  // Obtener color según el rol
  const getRoleColor = (rol: string): string => {
    const colors: { [key: string]: string } = {
      'admin': '#FF5722',
      'presidente': '#E91E63',
      'lider_estatal': '#2196F3',
      'lider_regional': '#4CAF50',
      'lider_municipal': '#FF9800',
      'lider_zona': '#9C27B0',
      'lider_seccional': '#607D8B',
    };
    return colors[rol] || '#607D8B';
  };

  // Formatear timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('es-MX');
  };

  // Filtrar vehículos por rol
  const filteredVehicles = filterRole === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.rol === filterRole);

  // Obtener roles únicos
  const uniqueRoles = [...new Set(vehicles.map(v => v.rol))];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadVehiclesLocation} />
      }
    >
      <View style={styles.header}>
        <FontAwesome5 name="map-marked-alt" size={32} color="#1a237e" />
        <Text style={styles.title}>Seguimiento en Tiempo Real</Text>
        <Text style={styles.subtitle}>Ubicaciones de vehículos y líderes</Text>
      </View>

      {/* Estadísticas */}
      <Surface style={styles.statsCard} elevation={3}>
        <Title style={styles.cardTitle}>Estadísticas</Title>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.activos}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{uniqueRoles.length}</Text>
            <Text style={styles.statLabel}>Roles</Text>
          </View>
        </View>
      </Surface>

      {/* Controles de seguimiento */}
      <Surface style={styles.controlCard} elevation={3}>
        <Title style={styles.cardTitle}>Mi Ubicación</Title>
        
        {errorMsg && (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#f44336" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {location && (
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#1a237e" />
              <Text style={styles.locationText}>
                Lat: {location.latitud.toFixed(6)} | Lon: {location.longitud.toFixed(6)}
              </Text>
            </View>
            
            {address && (
              <View style={styles.locationRow}>
                <FontAwesome5 name="road" size={16} color="#1a237e" />
                <Text style={styles.locationText} numberOfLines={2}>{address}</Text>
              </View>
            )}
            
            {location.velocidad && (
              <View style={styles.locationRow}>
                <FontAwesome5 name="tachometer-alt" size={16} color="#1a237e" />
                <Text style={styles.locationText}>
                  Velocidad: {location.velocidad.toFixed(1)} km/h
                </Text>
              </View>
            )}
            
            {batteryLevel && (
              <View style={styles.locationRow}>
                <FontAwesome5 
                  name={batteryLevel > 50 ? "battery-three-quarters" : "battery-half"} 
                  size={16} 
                  color={batteryLevel > 20 ? "#4CAF50" : "#f44336"} 
                />
                <Text style={styles.locationText}>
                  Batería: {batteryLevel}%
                </Text>
              </View>
            )}
            
            {lastUpdate && (
              <View style={styles.locationRow}>
                <FontAwesome5 name="clock" size={16} color="#1a237e" />
                <Text style={styles.locationText}>
                  Última actualización: {formatTimestamp(lastUpdate.toISOString())}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={handleTrackingToggle}
        >
          <FontAwesome5 
            name={isTracking ? 'stop-circle' : 'play-circle'} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.trackingButtonText}>
            {isTracking ? 'Detener Seguimiento' : 'Iniciar Seguimiento'}
          </Text>
        </TouchableOpacity>
      </Surface>

      {/* Filtros */}
      <Surface style={styles.filtersCard} elevation={3}>
        <Title style={styles.cardTitle}>Filtros</Title>
        
        {/* Filtro por evento */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Evento:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={selectedEvento === null}
              onPress={() => setSelectedEvento(null)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              Todos los eventos
            </Chip>
            {eventos.map(evento => (
              <Chip
                key={evento.id}
                selected={selectedEvento?.id === evento.id}
                onPress={() => setSelectedEvento(evento)}
                style={styles.filterChip}
                textStyle={styles.filterChipText}
              >
                {evento.nombre}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Filtro por rol */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Rol:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={filterRole === 'all'}
              onPress={() => setFilterRole('all')}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
            >
              Todos ({stats.total})
            </Chip>
            {uniqueRoles.map(role => (
              <Chip
                key={role}
                selected={filterRole === role}
                onPress={() => setFilterRole(role)}
                style={[styles.filterChip, { backgroundColor: getRoleColor(role) + '20' }]}
                textStyle={styles.filterChipText}
              >
                {role.replace('_', ' ').toUpperCase()} ({stats.porRol[role] || 0})
              </Chip>
            ))}
          </ScrollView>
        </View>
      </Surface>

      {/* Lista de vehículos */}
      <Surface style={styles.vehiclesCard} elevation={3}>
        <View style={styles.cardHeader}>
          <Title style={styles.cardTitle}>
            Vehículos Activos ({filteredVehicles.length})
          </Title>
          <TouchableOpacity onPress={loadVehiclesLocation} disabled={refreshing}>
            <FontAwesome5 
              name="sync-alt" 
              size={16} 
              color={refreshing ? "#ccc" : "#1a237e"} 
              spin={refreshing}
            />
          </TouchableOpacity>
        </View>

        {filteredVehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="map" size={48} color="#ccc" />
            <Text style={styles.noVehiclesText}>
              {filterRole === 'all' 
                ? 'No hay vehículos activos en este momento'
                : `No hay vehículos activos con rol ${filterRole}`
              }
            </Text>
          </View>
        ) : (
          filteredVehicles.map((vehicle, index) => (
            <Card key={index} style={styles.vehicleCard}>
              <Card.Content>
                <View style={styles.vehicleHeader}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(vehicle.rol) }]}>
                    <Text style={styles.roleText}>{vehicle.rol.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.timestampText}>
                    {formatTimestamp(vehicle.timestamp)}
                  </Text>
                </View>
                
                <Text style={styles.vehicleName}>{vehicle.nombre}</Text>
                
                <View style={styles.vehicleDetails}>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="map-marker-alt" size={12} color="#666" />
                    <Text style={styles.detailText}>
                      Lat: {vehicle.latitud.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="map-marker-alt" size={12} color="#666" />
                    <Text style={styles.detailText}>
                      Lon: {vehicle.longitud.toFixed(6)}
                    </Text>
                  </View>
                  {vehicle.velocidad && (
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="tachometer-alt" size={12} color="#666" />
                      <Text style={styles.detailText}>
                        Velocidad: {vehicle.velocidad.toFixed(1)} km/h
                      </Text>
                    </View>
                  )}
                  {vehicle.bateria && (
                    <View style={styles.detailRow}>
                      <FontAwesome5 
                        name={vehicle.bateria > 50 ? "battery-three-quarters" : "battery-half"} 
                        size={12} 
                        color={vehicle.bateria > 20 ? "#4CAF50" : "#f44336"} 
                      />
                      <Text style={styles.detailText}>
                        Batería: {vehicle.bateria}%
                      </Text>
                    </View>
                  )}
                </View>

                {vehicle.direccion && (
                  <View style={styles.addressContainer}>
                    <FontAwesome5 name="road" size={12} color="#666" />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {vehicle.direccion}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#3949ab',
    textAlign: 'center',
  },
  restrictedIcon: {
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 8,
    flex: 1,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  trackingButtonActive: {
    backgroundColor: '#f44336',
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#e3f2fd',
  },
  filterChipText: {
    color: '#1a237e',
  },
  vehiclesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noVehiclesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  },
  vehicleCard: {
    marginBottom: 12,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  vehicleDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
}); 