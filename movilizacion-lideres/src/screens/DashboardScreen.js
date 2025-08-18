import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const goToProfile = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido a Red Ciudadana!</Text>
      <Text style={styles.subtitle}>Este es tu dashboard móvil.</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.profileButton}>
          <FontAwesome5 name="user-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.profileButtonText} onPress={goToProfile}>Perfil</Text>
        </View>
        <Button title="Cerrar sesión" onPress={logout} color="#d32f2f" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1a237e' },
  subtitle: { fontSize: 16, marginBottom: 32, color: '#3949ab' },
  buttonContainer: { width: '100%', alignItems: 'center' },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 