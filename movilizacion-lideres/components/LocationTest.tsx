import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Surface, Button, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';

export default function LocationTest() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Solicitar permisos de ubicación
  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Se requieren permisos de ubicación para el seguimiento');
        return false;
      }
      
      Alert.alert('Éxito', 'Permisos de ubicación concedidos');
      return true;
    } catch (error) {
      setErrorMsg('Error al solicitar permisos de ubicación');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setLocation(location);
      Alert.alert(
        'Ubicación Obtenida',
        `Latitud: ${location.coords.latitude.toFixed(6)}\nLongitud: ${location.coords.longitude.toFixed(6)}\nPrecisión: ${location.coords.accuracy}m`
      );
    } catch (error) {
      setErrorMsg('Error al obtener ubicación: ' + (error as Error).message);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoading(false);
    }
  };

  // Obtener dirección
  const getAddress = async () => {
    if (!location) {
      Alert.alert('Error', 'Primero obtén tu ubicación');
      return;
    }

    try {
      setLoading(true);
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (reverseGeocode.length > 0) {
        const addressData = reverseGeocode[0];
        const addressString = [
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.region
        ].filter(Boolean).join(', ');
        
        Alert.alert('Dirección', addressString || 'Dirección no disponible');
      } else {
        Alert.alert('Dirección', 'Dirección no disponible');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la dirección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={3}>
        <View style={styles.header}>
          <FontAwesome5 name="map-marker-alt" size={32} color="#1a237e" />
          <Text style={styles.title}>Prueba de Ubicación</Text>
          <Text style={styles.subtitle}>Verifica que el sistema de ubicación funcione correctamente</Text>
        </View>

        {/* Estado de permisos */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Estado de Permisos:</Text>
          <Text style={[
            styles.statusText,
            permissionStatus === 'granted' ? styles.successText : styles.errorText
          ]}>
            {permissionStatus ? 
              (permissionStatus === 'granted' ? '✅ Concedidos' : '❌ Denegados') : 
              '⏳ No solicitados'
            }
          </Text>
        </View>

        {/* Ubicación actual */}
        {location && (
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Ubicación Actual:</Text>
            <Text style={styles.locationText}>
              Latitud: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitud: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Precisión: {location.coords.accuracy}m
            </Text>
            {location.coords.speed && (
              <Text style={styles.locationText}>
                Velocidad: {(location.coords.speed * 3.6).toFixed(1)} km/h
              </Text>
            )}
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            onPress={requestLocationPermission}
            style={styles.button}
            loading={loading}
            disabled={loading}
            icon="shield-check"
          >
            Solicitar Permisos
          </Button>

          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.button}
            loading={loading}
            disabled={loading || permissionStatus !== 'granted'}
            icon="crosshairs-gps"
          >
            Obtener Ubicación
          </Button>

          <Button
            mode="outlined"
            onPress={getAddress}
            style={styles.button}
            loading={loading}
            disabled={loading || !location}
            icon="map-marker"
          >
            Obtener Dirección
          </Button>
        </View>

        {/* Mensaje de error */}
        {errorMsg && (
          <View style={styles.errorSection}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#f44336" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Información:</Text>
          <Text style={styles.infoText}>
            • Esta prueba verifica que los permisos y la ubicación funcionen correctamente
          </Text>
          <Text style={styles.infoText}>
            • Si todo funciona, el sistema de seguimiento estará listo
          </Text>
          <Text style={styles.infoText}>
            • Los mapas funcionarán con OpenStreetMap (gratuito)
          </Text>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  statusSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#f44336',
  },
  locationSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  buttonSection: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 12,
  },
  errorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3949ab',
    marginBottom: 4,
  },
}); 