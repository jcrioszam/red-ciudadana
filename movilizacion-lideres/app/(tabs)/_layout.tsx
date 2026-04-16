import { Stack } from 'expo-router';
import { View } from 'react-native';
import BottomTabBar from '../../components/BottomTabBar';

export default function PrivateLayout() {
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
        <Stack.Screen name="ubicacion" />
        <Stack.Screen name="mapa" />
        <Stack.Screen name="movilizador-seguimiento" />
      </Stack>
      <BottomTabBar />
    </View>
  );
}
