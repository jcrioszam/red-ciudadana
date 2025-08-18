import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDynamicTabs } from '../../hooks/useDynamicTabs';
import { usePermissionsContext } from '../../src/contexts/PermissionsContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ personas: 0, eventos: 0, asistencias: 0 });
  const [loading, setLoading] = useState(true);
  const { refetch: refetchPermissions } = useDynamicTabs(user?.rol);
  const { triggerRefresh } = usePermissionsContext();

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas desde el backend
      const [personasResponse, eventosResponse, asistenciasResponse] = await Promise.all([
        fetch('http://192.168.2.150:8000/reportes/personas'),
        fetch('http://192.168.2.150:8000/reportes/eventos?historicos=false'),
        fetch('http://192.168.2.150:8000/reportes/asistencias-tiempo-real')
      ]);

      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [personasData, eventosData, asistenciasData] = await Promise.all([
        fetch('http://192.168.2.150:8000/reportes/personas', { headers }).then(r => r.json()),
        fetch('http://192.168.2.150:8000/reportes/eventos?historicos=false', { headers }).then(r => r.json()),
        fetch('http://192.168.2.150:8000/reportes/asistencias-tiempo-real', { headers }).then(r => r.json())
      ]);

      setStats({
        personas: personasData.total_personas || 0,
        eventos: eventosData.total_eventos || 0,
        asistencias: asistenciasData.total_asistencias || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // En caso de error, mantener valores en 0
      setStats({ personas: 0, eventos: 0, asistencias: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3949ab" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
        <Text style={styles.userText}>{user?.nombre || 'Usuario'}</Text>
        <Text style={styles.roleText}>{user?.rol || 'Rol'}</Text>
      </View>

      {/* Tarjeta de usuario con botones de perfil y cerrar sesión */}
      <Surface style={styles.userCard} elevation={3}>
        <View style={styles.userCardRow}>
          <FontAwesome5 name="user-circle" size={36} color="#1a237e" style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userCardName}>{user?.nombre || 'Usuario'}</Text>
            <Text style={styles.userCardRole}>{user?.rol || 'Rol'}</Text>
          </View>
        </View>
        <View style={styles.userCardButtonsRow}>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <FontAwesome5 name="user" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.profileButtonText}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <FontAwesome5 name="sign-out-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={4}>
        <Text style={styles.cardTitle}>Resumen Rápido</Text>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <FontAwesome5 name="users" size={24} color="#2196F3" />
              <Title style={styles.statNumber}>{stats.personas}</Title>
              <Paragraph style={styles.statLabel}>Personas</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <FontAwesome5 name="calendar-alt" size={24} color="#4CAF50" />
              <Title style={styles.statNumber}>{stats.eventos}</Title>
              <Paragraph style={styles.statLabel}>Eventos</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <FontAwesome5 name="check-circle" size={24} color="#FF9800" />
              <Title style={styles.statNumber}>{stats.asistencias}</Title>
              <Paragraph style={styles.statLabel}>Asistencias</Paragraph>
            </Card.Content>
          </Card>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={4}>
        <Text style={styles.cardTitle}>Accesos Rápidos</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/register')}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 name="user-plus" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Registrar{'\n'}Persona</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/reassign')}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 name="exchange-alt" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Reasignar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/pase-lista')}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 name="check-square" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Pase de{'\n'}Lista</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.instructionText}>
          Usa la barra de navegación inferior para acceder a todas las funciones disponibles según tu perfil.
        </Text>
      </Surface>

      <Surface style={styles.card} elevation={4}>
        <Text style={styles.cardTitle}>Administración</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={async () => {
            await refetchPermissions();
            loadQuickStats();
            triggerRefresh(); // Forzar re-renderizado del layout
          }}
        >
          <FontAwesome5 name="sync-alt" size={16} color="#fff" />
          <Text style={styles.refreshButtonText}>Actualizar Permisos</Text>
        </TouchableOpacity>
        <Text style={styles.instructionText}>
          Presiona este botón si has cambiado permisos en la web y quieres que se apliquen en la app.
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  userText: {
    fontSize: 18,
    color: '#3949ab',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 90,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3949ab',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    color: '#1a237e',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 2,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userCardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  userCardRole: {
    fontSize: 13,
    color: '#3949ab',
    textTransform: 'capitalize',
  },
  userCardButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginRight: 10,
    flex: 1,
    justifyContent: 'center',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    flex: 1,
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
