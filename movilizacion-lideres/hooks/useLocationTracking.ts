import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '../src/api';
import { useAuth } from '../src/contexts/AuthContext';

// Tipos para TypeScript
interface LocationData {
  latitud: number;
  longitud: number;
  precision?: number;
  velocidad?: number;
  bateria?: number;
  direccion?: string;
  timestamp?: string;
}

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

export const useLocationTracking = (intervalMs: number = 30000, movilizacionData?: {
  evento_id?: number;
  vehiculo_id?: number;
  evento_nombre?: string;
  vehiculo_tipo?: string;
  vehiculo_placas?: string;
  vehiculo_capacidad?: number;
  total_personas?: number;
}) => { // 30 segundos por defecto
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Solicitar permisos de ubicación
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Se requieren permisos de ubicación para el seguimiento');
        return false;
      }
      
      return true;
    } catch (error) {
      setErrorMsg('Error al solicitar permisos de ubicación');
      return false;
    }
  };

  // Obtener dirección a partir de coordenadas
  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (reverseGeocode.length > 0) {
        const addressData = reverseGeocode[0];
        const addressString = [
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.region
        ].filter(Boolean).join(', ');
        
        return addressString || 'Dirección no disponible';
      }
      return 'Dirección no disponible';
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      return 'Dirección no disponible';
    }
  };

  // Obtener nivel de batería (simulado por ahora)
  const getBatteryLevel = async (): Promise<number | null> => {
    try {
      // En una implementación real, usarías expo-battery
      // Por ahora simulamos un valor entre 20-100%
      return Math.floor(Math.random() * 80) + 20;
    } catch (error) {
      console.error('Error al obtener nivel de batería:', error);
      return null;
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const ubicacionData: LocationData = {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        precision: location.coords.accuracy,
        velocidad: location.coords.speed ? location.coords.speed * 3.6 : undefined, // Convertir m/s a km/h
        bateria: await getBatteryLevel() || undefined,
        timestamp: new Date().toISOString(),
      };

      // Obtener dirección
      const addressString = await getAddressFromCoords(
        ubicacionData.latitud, 
        ubicacionData.longitud
      );
      
      ubicacionData.direccion = addressString;

      setLocation(ubicacionData);
      setAddress(addressString);
      setBatteryLevel(ubicacionData.bateria || null);
      setLastUpdate(new Date());
      
      return ubicacionData;
    } catch (error) {
      setErrorMsg('Error al obtener ubicación: ' + (error as Error).message);
      return null;
    }
  };

  // Enviar ubicación al backend
  const sendLocationToServer = async (ubicacionData: LocationData): Promise<void> => {
    try {
      // Incluir información de movilización si está disponible
      const ubicacionCompleta = {
        ...ubicacionData,
        ...(movilizacionData && {
          evento_id: movilizacionData.evento_id,
          vehiculo_id: movilizacionData.vehiculo_id,
          evento_nombre: movilizacionData.evento_nombre,
          vehiculo_tipo: movilizacionData.vehiculo_tipo,
          vehiculo_placas: movilizacionData.vehiculo_placas,
          vehiculo_capacidad: movilizacionData.vehiculo_capacidad,
          total_personas: movilizacionData.total_personas,
        })
      };

      const result = await api.ubicacion.actualizar(ubicacionCompleta);
      if (result !== null) {
        console.log('Ubicación enviada exitosamente con datos de movilización');
      } else {
        console.log('⚠️ Ubicación no enviada - Token expirado, continuando seguimiento...');
      }
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
      // No establecer error para evitar interrumpir el seguimiento
      // setErrorMsg('Error al enviar ubicación al servidor');
    }
  };

  // Iniciar seguimiento
  const startTracking = async (): Promise<void> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsTracking(true);
    setErrorMsg(null);
    
    // Obtener ubicación inicial
    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      await sendLocationToServer(initialLocation);
    }

    // Configurar intervalo para seguimiento continuo
    intervalRef.current = setInterval(async () => {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        await sendLocationToServer(currentLocation);
      }
    }, intervalMs);
  };

  // Detener seguimiento
  const stopTracking = async (): Promise<void> => {
    try {
      // Enviar señal de detener seguimiento al servidor
      if (movilizacionData?.evento_id && movilizacionData?.vehiculo_id) {
        const stopData = {
          latitud: 0,
          longitud: 0,
          seguimiento_activo: false,
          evento_id: movilizacionData.evento_id,
          vehiculo_id: movilizacionData.vehiculo_id,
          evento_nombre: movilizacionData.evento_nombre,
          vehiculo_tipo: movilizacionData.vehiculo_tipo,
          vehiculo_placas: movilizacionData.vehiculo_placas,
          vehiculo_capacidad: movilizacionData.vehiculo_capacidad,
          total_personas: movilizacionData.total_personas,
        };
        
        await api.ubicacion.actualizar(stopData);
        console.log('✅ Seguimiento específico detenido en el servidor');
      }
    } catch (error) {
      console.error('Error al detener seguimiento en servidor:', error);
    }
    
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Obtener ubicaciones de vehículos
  const getVehiclesLocation = async (): Promise<Vehicle[]> => {
    try {
      const response = await api.ubicacion.obtenerVehiculos();
      return response.ubicaciones || [];
    } catch (error) {
      console.error('Error al obtener ubicaciones de vehículos:', error);
      return [];
    }
  };

  // Obtener mis seguimientos activos
  const getMyActiveTrackings = async (): Promise<any[]> => {
    try {
      const response = await api.ubicacion.obtenerMiUbicacion();
      console.log('📡 Mis seguimientos activos:', response);
      
      if (response && response.ubicaciones) {
        return response.ubicaciones;
      } else {
        console.log('⚠️ No hay seguimientos activos');
        return [];
      }
    } catch (error) {
      console.error('❌ Error al obtener mis seguimientos activos:', error);
      return [];
    }
  };

  // Obtener mi ubicación actual
  const getMyLocation = async (): Promise<LocationData | null> => {
    try {
      const response = await api.ubicacion.obtenerMiUbicacion();
      console.log('📡 Respuesta de mi ubicación:', response);
      
      if (response && response.ubicacion) {
        return response.ubicacion;
      } else {
        console.log('⚠️ No hay ubicación registrada en el servidor');
        return null;
      }
    } catch (error) {
      console.error('❌ Error al obtener mi ubicación:', error);
      return null;
    }
  };

  // Verificar si el seguimiento está activo en el servidor
  const checkTrackingStatus = async (): Promise<void> => {
    try {
      console.log('🔍 Verificando estado de seguimiento...');
      const myLocation = await getMyLocation();
      console.log('📍 Mi ubicación actual:', myLocation);
      
      if (myLocation && myLocation.latitud !== 0 && myLocation.longitud !== 0) {
        console.log('✅ Seguimiento activo detectado');
        setIsTracking(true);
        setLocation({
          latitud: myLocation.latitud,
          longitud: myLocation.longitud,
          precision: myLocation.precision,
          velocidad: myLocation.velocidad,
          bateria: myLocation.bateria,
          direccion: myLocation.direccion,
          timestamp: myLocation.timestamp,
        });
      } else {
        console.log('❌ No hay seguimiento activo o ubicación inválida');
        setIsTracking(false);
      }
    } catch (error) {
      console.error('❌ Error al verificar estado de seguimiento:', error);
      setIsTracking(false);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    // Verificar estado inicial de seguimiento
    checkTrackingStatus();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    isTracking,
    permissionStatus,
    address,
    batteryLevel,
    lastUpdate,
    startTracking,
    stopTracking,
    getCurrentLocation,
    getVehiclesLocation,
    getMyActiveTrackings,
    getMyLocation,
    requestLocationPermission,
    checkTrackingStatus,
  };
}; 