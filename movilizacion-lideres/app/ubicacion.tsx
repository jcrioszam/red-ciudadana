import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

export default function UbicacionScreen() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  
  // Roles permitidos para ver seguimiento
  const allowedRoles = ['admin', 'presidente', 'lider_estatal', 'lider_municipal', 'lider_zona'];
  
  // Debug logs
  console.log('UbicacionScreen: user.rol', user?.rol);
  console.log('UbicacionScreen: allowedRoles.includes(user?.rol)', allowedRoles.includes(user?.rol));
  
  // Verificar si el usuario tiene permisos
  if (!allowedRoles.includes(user?.rol)) {
    console.log('UbicacionScreen: Acceso Restringido');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Acceso Restringido</Text>
          <Text style={styles.subtitle}>No tienes permisos para acceder al seguimiento en tiempo real</Text>
        </View>
      </View>
    );
  }

  console.log('UbicacionScreen: Renderizando contenido principal');

  // Manejar inicio/parada del seguimiento
  const handleTrackingToggle = () => {
    if (isTracking) {
      setIsTracking(false);
      Alert.alert('Seguimiento Detenido', 'Ya no se está enviando tu ubicación');
    } else {
      setIsTracking(true);
      Alert.alert('Seguimiento Iniciado', 'Tu ubicación se está enviando cada 30 segundos');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Seguimiento en Tiempo Real</Text>
        <Text style={styles.subtitle}>Ubicaciones de vehículos y líderes</Text>
        <Text style={styles.userInfo}>Usuario: {user?.nombre} ({user?.rol})</Text>
      </View>

      {/* Mi Ubicación */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>
            <FontAwesome5 name="map-marker-alt" size={20} color="#2196F3" /> Mi Ubicación
          </Title>
          
          <Text style={styles.noLocation}>
            {isTracking ? 'Seguimiento activo - Enviando ubicación...' : 'Seguimiento inactivo'}
          </Text>

          <TouchableOpacity
            style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
            onPress={handleTrackingToggle}
          >
            <FontAwesome5 
              name={isTracking ? 'stop' : 'play'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.trackingButtonText}>
              {isTracking ? 'Detener Seguimiento' : 'Iniciar Seguimiento'}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Lista de vehículos */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>
            <FontAwesome5 name="car" size={20} color="#4CAF50" /> Vehículos Activos
          </Title>

          <Text style={styles.noVehicles}>
            No hay vehículos activos en este momento
          </Text>
          
          <Text style={styles.infoText}>
            Los vehículos aparecerán aquí cuando inicien el seguimiento de ubicación
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    fontStyle: 'italic',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  noLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
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
  noVehicles: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 