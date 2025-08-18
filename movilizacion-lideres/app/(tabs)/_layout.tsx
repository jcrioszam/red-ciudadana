import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import DynamicBottomMenu from '../../components/DynamicBottomMenu';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="movilizacion" />
        <Stack.Screen name="estructura-red" />
        <Stack.Screen name="eventos-historicos" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="register" />
        <Stack.Screen name="reassign" />
        <Stack.Screen name="pase-lista" />
        <Stack.Screen name="noticias" />
        <Stack.Screen name="reportes-ciudadanos" />
        <Stack.Screen name="nuevo-reporte" />
        <Stack.Screen name="seguimiento-reportes" />
        <Stack.Screen name="dashboard-ciudadanos" />
      </Stack>
      
      {/* Menú dinámico inferior */}
      <DynamicBottomMenu />
    </View>
  );
}
