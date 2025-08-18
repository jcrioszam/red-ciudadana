import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';

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

interface LocationNotificationsProps {
  vehicles: Vehicle[];
  myLocation?: {
    latitud: number;
    longitud: number;
  } | null;
}

interface Notification {
  id: string;
  type: 'vehicle_moved' | 'battery_low' | 'speed_alert' | 'new_vehicle';
  title: string;
  message: string;
  vehicle?: Vehicle;
  timestamp: Date;
}

export default function LocationNotifications({ vehicles, myLocation }: LocationNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const slideAnim = new Animated.Value(-300);

  // Detectar cambios en vehículos
  useEffect(() => {
    if (vehicles.length === 0) return;

    const newNotifications: Notification[] = [];

    vehicles.forEach(vehicle => {
      // Detectar batería baja
      if (vehicle.bateria && vehicle.bateria < 20) {
        const existingNotification = notifications.find(
          n => n.type === 'battery_low' && n.vehicle?.id_usuario === vehicle.id_usuario
        );
        
        if (!existingNotification) {
          newNotifications.push({
            id: `battery_${vehicle.id_usuario}_${Date.now()}`,
            type: 'battery_low',
            title: 'Batería Baja',
            message: `${vehicle.nombre} tiene batería baja (${vehicle.bateria}%)`,
            vehicle,
            timestamp: new Date()
          });
        }
      }

      // Detectar velocidad alta
      if (vehicle.velocidad && vehicle.velocidad > 80) {
        const existingNotification = notifications.find(
          n => n.type === 'speed_alert' && n.vehicle?.id_usuario === vehicle.id_usuario
        );
        
        if (!existingNotification) {
          newNotifications.push({
            id: `speed_${vehicle.id_usuario}_${Date.now()}`,
            type: 'speed_alert',
            title: 'Velocidad Alta',
            message: `${vehicle.nombre} viaja a ${vehicle.velocidad.toFixed(1)} km/h`,
            vehicle,
            timestamp: new Date()
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
      showNotificationPanel();
    }
  }, [vehicles]);

  const showNotificationPanel = () => {
    setShowNotifications(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideNotificationPanel = () => {
    Animated.spring(slideAnim, {
      toValue: -300,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowNotifications(false);
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'battery_low':
        return 'battery-quarter';
      case 'speed_alert':
        return 'tachometer-alt';
      case 'vehicle_moved':
        return 'location-arrow';
      case 'new_vehicle':
        return 'user-plus';
      default:
        return 'info-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'battery_low':
        return '#f44336';
      case 'speed_alert':
        return '#ff9800';
      case 'vehicle_moved':
        return '#2196f3';
      case 'new_vehicle':
        return '#4caf50';
      default:
        return '#607d8b';
    }
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }] }
      ]}
    >
      <Surface style={styles.notificationPanel} elevation={5}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <IconButton
            icon="close"
            size={20}
            onPress={hideNotificationPanel}
          />
        </View>
        
        {notifications.slice(-5).map((notification) => (
          <View key={notification.id} style={styles.notificationItem}>
            <View style={styles.notificationIcon}>
              <FontAwesome5 
                name={getNotificationIcon(notification.type)} 
                size={16} 
                color={getNotificationColor(notification.type)} 
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {notification.timestamp.toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <IconButton
              icon="close"
              size={16}
              onPress={() => removeNotification(notification.id)}
            />
          </View>
        ))}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notificationPanel: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: '#999',
  },
}); 