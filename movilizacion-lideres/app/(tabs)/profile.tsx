import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, List, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login'); // Redirige al login y reemplaza el stack
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user?.nombre?.charAt(0) || 'U'} 
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.nombre || 'Usuario'}</Text>
        <Text style={styles.role}>{user?.rol || 'Rol'}</Text>
      </View>

      <Surface style={styles.card} elevation={4}>
        <Text style={styles.cardTitle}>Información Personal</Text>
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="envelope" size={16} color="#3949ab" />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'No disponible'}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="phone" size={16} color="#3949ab" />
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{user?.telefono || 'No disponible'}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="map-marker-alt" size={16} color="#3949ab" />
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>{user?.direccion || 'No disponible'}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="calendar" size={16} color="#3949ab" />
          <Text style={styles.label}>Edad:</Text>
          <Text style={styles.value}>{user?.edad ? `${user.edad} años` : 'No disponible'}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome5 name="user" size={16} color="#3949ab" />
          <Text style={styles.label}>Sexo:</Text>
          <Text style={styles.value}>{user?.sexo || 'No disponible'}</Text>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={4}>
        <List.Item
          title="Cerrar sesión"
          left={props => <List.Icon {...props} icon="logout" color="#fff" />}
          style={styles.logoutButton}
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          onPress={handleLogout}
        />
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
  avatar: {
    backgroundColor: '#3949ab',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    color: '#3949ab',
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
}); 