import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';
import { Surface, Text, Chip } from 'react-native-paper';

interface Vehicle {
  id_usuario: number;
  nombre: string;
  rol: string;
  latitud: number;
  longitud: number;
  velocidad?: number;
  direccion?: string;
  timestamp: string;
  bateria?: number;
  activo?: boolean;
}

interface LocationMapProps {
  vehicles: Vehicle[];
  myLocation?: {
    latitud: number;
    longitud: number;
  } | null;
  onVehiclePress?: (vehicle: Vehicle) => void;
}

const { width, height } = Dimensions.get('window');

export default function LocationMap({ vehicles, myLocation, onVehiclePress }: LocationMapProps) {
  const [region, setRegion] = useState({
    latitude: 19.4326, // Ciudad de México por defecto
    longitude: -99.1332,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

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

  // Calcular región que incluya todos los marcadores
  useEffect(() => {
    if (vehicles.length === 0 && !myLocation) return;

    const coordinates = [...vehicles.map(v => ({ lat: v.latitud, lng: v.longitud }))];
    
    if (myLocation) {
      coordinates.push({ lat: myLocation.latitud, lng: myLocation.longitud });
    }

    if (coordinates.length === 0) return;

    const minLat = Math.min(...coordinates.map(c => c.lat));
    const maxLat = Math.max(...coordinates.map(c => c.lat));
    const minLng = Math.min(...coordinates.map(c => c.lng));
    const maxLng = Math.max(...coordinates.map(c => c.lng));

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max(maxLat - minLat, 0.01);
    const deltaLng = Math.max(maxLng - minLng, 0.01);

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat * 1.5,
      longitudeDelta: deltaLng * 1.5,
    });
  }, [vehicles, myLocation]);

  const handleVehiclePress = (vehicle: Vehicle) => {
    if (onVehiclePress) {
      onVehiclePress(vehicle);
    } else {
      Alert.alert(
        vehicle.nombre,
        `Rol: ${vehicle.rol.replace('_', ' ').toUpperCase()}\n` +
        `Ubicación: ${vehicle.latitud.toFixed(6)}, ${vehicle.longitud.toFixed(6)}\n` +
        `Última actualización: ${formatTimestamp(vehicle.timestamp)}` +
        (vehicle.velocidad ? `\nVelocidad: ${vehicle.velocidad.toFixed(1)} km/h` : '') +
        (vehicle.bateria ? `\nBatería: ${vehicle.bateria}%` : ''),
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={true}
      >
        {/* Marcador de mi ubicación */}
        {myLocation && (
          <Marker
            coordinate={{
              latitude: myLocation.latitud,
              longitude: myLocation.longitud,
            }}
            title="Mi Ubicación"
            description="Tu ubicación actual"
            pinColor="#4CAF50"
          >
            <View style={styles.myLocationMarker}>
              <FontAwesome5 name="user-circle" size={20} color="#4CAF50" />
            </View>
          </Marker>
        )}

        {/* Marcadores de vehículos */}
        {vehicles.map((vehicle, index) => (
          <Marker
            key={`${vehicle.id_usuario}-${index}`}
            coordinate={{
              latitude: vehicle.latitud,
              longitude: vehicle.longitud,
            }}
            title={vehicle.nombre}
            description={`${vehicle.rol.replace('_', ' ').toUpperCase()} - ${formatTimestamp(vehicle.timestamp)}`}
            onPress={() => handleVehiclePress(vehicle)}
          >
            <View style={[styles.vehicleMarker, { backgroundColor: getRoleColor(vehicle.rol) }]}>
              <FontAwesome5 
                name={vehicle.rol.includes('admin') ? 'crown' : 'user'} 
                size={12} 
                color="#fff" 
              />
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{vehicle.nombre}</Text>
                <Chip 
                  style={[styles.roleChip, { backgroundColor: getRoleColor(vehicle.rol) }]}
                  textStyle={styles.roleChipText}
                >
                  {vehicle.rol.replace('_', ' ').toUpperCase()}
                </Chip>
                <Text style={styles.calloutText}>
                  Última actualización: {formatTimestamp(vehicle.timestamp)}
                </Text>
                {vehicle.velocidad && (
                  <Text style={styles.calloutText}>
                    Velocidad: {vehicle.velocidad.toFixed(1)} km/h
                  </Text>
                )}
                {vehicle.bateria && (
                  <Text style={styles.calloutText}>
                    Batería: {vehicle.bateria}%
                  </Text>
                )}
                {vehicle.direccion && (
                  <Text style={styles.calloutText} numberOfLines={2}>
                    {vehicle.direccion}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Leyenda */}
      <Surface style={styles.legend} elevation={3}>
        <Text style={styles.legendTitle}>Leyenda</Text>
        <View style={styles.legendItems}>
          {myLocation && (
            <View style={styles.legendItem}>
              <FontAwesome5 name="user-circle" size={16} color="#4CAF50" />
              <Text style={styles.legendText}>Mi ubicación</Text>
            </View>
          )}
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#FF5722' }]}>
              <FontAwesome5 name="crown" size={10} color="#fff" />
            </View>
            <Text style={styles.legendText}>Administradores</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#2196F3' }]}>
              <FontAwesome5 name="user" size={10} color="#fff" />
            </View>
            <Text style={styles.legendText}>Líderes</Text>
          </View>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height: height * 0.7,
  },
  myLocationMarker: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  vehicleMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  calloutText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    maxWidth: 150,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a237e',
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
}); 