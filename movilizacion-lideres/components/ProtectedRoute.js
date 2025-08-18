import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3949ab" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>No autenticado</Text>
      </View>
    );
  }

  return children;
}; 