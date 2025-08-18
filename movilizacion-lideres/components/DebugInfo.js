import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAuth } from '../src/contexts/AuthContext';
import { checkConnectivity } from '../src/config';
import { api } from '../src/api';

export const DebugInfo = ({ visible = false }) => {
  const { token, user } = useAuth();
  const [connectivityStatus, setConnectivityStatus] = useState('checking');
  const [serverStatus, setServerStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  const checkServerStatus = async () => {
    try {
      setConnectivityStatus('checking');
      setServerStatus('checking');
      
      // Verificar conectividad básica
      const isConnected = await checkConnectivity();
      setConnectivityStatus(isConnected ? 'connected' : 'disconnected');
      
      // Verificar estado del servidor
      try {
        const response = await api.get('/health');
        setServerStatus('online');
      } catch (error) {
        setServerStatus('error');
      }
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error en debug check:', error);
      setConnectivityStatus('error');
      setServerStatus('error');
    }
  };

  useEffect(() => {
    if (visible) {
      checkServerStatus();
    }
  }, [visible]);

  if (!visible) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'online':
        return '#4caf50';
      case 'disconnected':
      case 'error':
        return '#f44336';
      case 'checking':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'online':
        return 'En línea';
      case 'error':
        return 'Error';
      case 'checking':
        return 'Verificando...';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <Text style={styles.title}>Información de Debug</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Conectividad:</Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(connectivityStatus) }]} />
        <Text style={styles.statusText}>{getStatusText(connectivityStatus)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Servidor:</Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(serverStatus) }]} />
        <Text style={styles.statusText}>{getStatusText(serverStatus)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Token:</Text>
        <Text style={styles.value}>{token ? 'Presente' : 'Ausente'}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Usuario:</Text>
        <Text style={styles.value}>{user?.nombre || 'No autenticado'}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Rol:</Text>
        <Text style={styles.value}>{user?.rol || 'N/A'}</Text>
      </View>
      
      {lastCheck && (
        <View style={styles.row}>
          <Text style={styles.label}>Última verificación:</Text>
          <Text style={styles.value}>{lastCheck.toLocaleTimeString()}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.refreshButton} onPress={checkServerStatus}>
        <Text style={styles.refreshText}>Actualizar</Text>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    width: 120,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#2196f3',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
}); 