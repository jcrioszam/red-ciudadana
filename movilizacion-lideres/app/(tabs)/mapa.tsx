import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Surface, Title, FAB } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useAuth } from '../../src/contexts/AuthContext';
import LocationMap from '../../components/LocationMap';
import LocationNotifications from '../../components/LocationNotifications';
import { useRouter } from 'expo-router';

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

export default function MapaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  
  // Roles permitidos para ver seguimiento (solo líderes superiores)
  const allowedRoles = ['admin', 'presidente', 'lider_estatal', 'lider_municipal'];
  
  // Verificar si el usuario tiene permisos
  if (!allowedRoles.includes(user?.rol)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome5 name="lock" size={48} color="#f44336" style={styles.restrictedIcon} />
          <Text style={styles.title}>Acceso Restringido</Text>
          <Text style={styles.subtitle}>No tienes permisos para acceder al mapa de seguimiento</Text>
          <Text style={styles.contactText}>Contacta a tu administrador para solicitar acceso</Text>
        </View>
      </View>
    );
  }
  
  const {
    location,
    errorMsg,
    isTracking,
    startTracking,
    stopTracking,
    getVehiclesLocation,
  } = useLocationTracking(30000);

  // Cargar ubicaciones de vehículos
  const loadVehiclesLocation = async () => {
    try {
      setRefreshing(true);
      const vehiclesData = await getVehiclesLocation();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las ubicaciones');
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadVehiclesLocation();
  }, []);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadVehiclesLocation();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  // Manejar clic en vehículo
  const handleVehiclePress = (vehicle: Vehicle) => {
    Alert.alert(
      vehicle.nombre,
      `Rol: ${vehicle.rol.replace('_', ' ').toUpperCase()}\n` +
      `Ubicación: ${vehicle.latitud.toFixed(6)}, ${vehicle.longitud.toFixed(6)}\n` +
      `Última actualización: ${new Date(vehicle.timestamp).toLocaleTimeString('es-MX')}` +
      (vehicle.velocidad ? `\nVelocidad: ${vehicle.velocidad.toFixed(1)} km/h` : '') +
      (vehicle.bateria ? `\nBatería: ${vehicle.bateria}%` : '') +
      (vehicle.direccion ? `\nDirección: ${vehicle.direccion}` : ''),
      [
        { text: 'Ver en lista', onPress: () => router.push('/ubicacion') },
        { text: 'OK' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={3}>
        <View style={styles.headerContent}>
          <View>
            <Title style={styles.title}>Mapa de Seguimiento</Title>
            <Text style={styles.subtitle}>
              {vehicles.length} vehículos activos
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadVehiclesLocation}
            disabled={refreshing}
          >
            <FontAwesome5 
              name="sync-alt" 
              size={20} 
              color={refreshing ? "#ccc" : "#1a237e"} 
              spin={refreshing}
            />
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <LocationMap
          vehicles={vehicles}
          myLocation={location}
          onVehiclePress={handleVehiclePress}
        />
      </View>

      {/* Notificaciones */}
      <LocationNotifications
        vehicles={vehicles}
        myLocation={location}
      />

      {/* Controles flotantes */}
      <View style={styles.floatingControls}>
        {/* Botón de seguimiento */}
        <FAB
          style={[
            styles.fab,
            isTracking ? styles.fabStop : styles.fabStart
          ]}
          icon={isTracking ? 'stop' : 'play'}
          onPress={handleTrackingToggle}
          label={isTracking ? 'Detener' : 'Iniciar'}
        />

        {/* Botón de leyenda */}
        <FAB
          style={styles.fabLegend}
          icon={showLegend ? 'eye-off' : 'eye'}
          onPress={() => setShowLegend(!showLegend)}
          small
        />

        {/* Botón de lista */}
        <FAB
          style={styles.fabList}
          icon="list"
          onPress={() => router.push('/ubicacion')}
          small
        />
      </View>

      {/* Mensaje de error */}
      {errorMsg && (
        <Surface style={styles.errorContainer} elevation={3}>
          <FontAwesome5 name="exclamation-triangle" size={16} color="#f44336" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </Surface>
      )}

      {/* Estado de seguimiento */}
      {isTracking && (
        <Surface style={styles.trackingStatus} elevation={3}>
          <FontAwesome5 name="location-arrow" size={16} color="#4CAF50" />
          <Text style={styles.trackingText}>Seguimiento activo</Text>
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  fab: {
    backgroundColor: '#4CAF50',
  },
  fabStart: {
    backgroundColor: '#4CAF50',
  },
  fabStop: {
    backgroundColor: '#f44336',
  },
  fabLegend: {
    backgroundColor: '#FF9800',
  },
  fabList: {
    backgroundColor: '#2196F3',
  },
  errorContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
  },
  trackingStatus: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
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
}); 