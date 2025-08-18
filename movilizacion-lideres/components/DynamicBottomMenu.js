import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePermissionsContext } from '../src/contexts/PermissionsContext';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/api';

const { width } = Dimensions.get('window');

export default function DynamicBottomMenu() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const router = useRouter();
  const { refreshTrigger } = usePermissionsContext();
  const { user } = useAuth();

  // Definir todas las opciones disponibles
  const allOptions = [
    {
      id: 'home',
      title: 'Inicio',
      icon: 'home',
      route: '/',
      permission: 'dashboard',
      color: '#4CAF50'
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'chart-bar',
      route: '/dashboard',
      permission: 'dashboard',
      color: '#2196F3'
    },
    {
      id: 'register',
      title: 'Registrar Persona',
      icon: 'user-plus',
      route: '/register',
      permission: 'register',
      color: '#FF9800'
    },
    {
      id: 'reassign',
      title: 'Reasignar',
      icon: 'exchange-alt',
      route: '/reassign',
      permission: 'reassign',
      color: '#9C27B0'
    },
    {
      id: 'pase-lista',
      title: 'Pase de Lista',
      icon: 'check-square',
      route: '/pase-lista',
      permission: 'pase-lista',
      color: '#4CAF50'
    },
    {
      id: 'movilizacion',
      title: 'Movilización',
      icon: 'car',
      route: '/movilizacion',
      permission: 'movilizacion',
      color: '#FF5722'
    },
    {
      id: 'estructura-red',
      title: 'Estructura',
      icon: 'network-wired',
      route: '/estructura-red',
      permission: 'estructura-red',
      color: '#607D8B'
    },
    {
      id: 'eventos-historicos',
      title: 'Históricos',
      icon: 'history',
      route: '/eventos-historicos',
      permission: 'eventos-historicos',
      color: '#795548'
    },
    {
      id: 'reportes',
      title: 'Reportes',
      icon: 'file-alt',
      route: '/reportes',
      permission: 'reportes',
      color: '#E91E63'
    },
    {
      id: 'ubicacion',
      title: 'Ubicación',
      icon: 'map-marker-alt',
      route: '/ubicacion',
      permission: 'seguimiento',
      color: '#00BCD4'
    },
    {
      id: 'mapa',
      title: 'Mapa',
      icon: 'map',
      route: '/mapa',
      permission: 'seguimiento',
      color: '#4CAF50'
    },
    {
      id: 'movilizador-seguimiento',
      title: 'Movilizador',
      icon: 'car',
      route: '/movilizador-seguimiento',
      permission: 'movilizador-seguimiento',
      color: '#FF9800'
    },
    {
      id: 'test-ubicacion',
      title: 'Test Ubicación',
      icon: 'map-marker-alt',
      route: '/test-ubicacion',
      permission: 'seguimiento',
      color: '#9C27B0'
    },
    {
      id: 'profile',
      title: 'Perfil',
      icon: 'user-circle',
      route: '/profile',
      permission: 'perfil',
      color: '#3F51B5'
    },
    {
      id: 'noticias',
      title: 'Noticias',
      icon: 'newspaper',
      route: '/noticias',
      permission: 'noticias',
      color: '#1a237e'
    },
    {
      id: 'reportes-ciudadanos',
      title: 'Reportes Ciudadanos',
      icon: 'exclamation-triangle',
      route: '/reportes-ciudadanos',
      permission: 'reportes_ciudadanos',
      color: '#FF5722'
    },
    {
      id: 'nuevo-reporte',
      title: 'Nuevo Reporte',
      icon: 'plus-circle',
      route: '/nuevo-reporte',
      permission: 'reportes_ciudadanos',
      color: '#4CAF50'
    },
    {
      id: 'seguimiento-reportes',
      title: 'Seguimiento Reportes',
      icon: 'chart-line',
      route: '/seguimiento-reportes',
      permission: 'seguimiento_reportes',
      color: '#9C27B0'
    },
    {
      id: 'dashboard-ciudadanos',
      title: 'Panel Ciudadano',
      icon: 'users',
      route: '/dashboard-ciudadanos',
      permission: 'dashboard',
      color: '#2196F3'
    }
  ];

  // Obtener permisos del usuario
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.rol) return;
      
      try {
        setLoading(true);
        const response = await api.get('/perfiles/mi-configuracion');
        console.log('Permisos obtenidos:', response?.configuracion?.opciones_app);
        if (response?.configuracion?.opciones_app) {
          setUserPermissions(response.configuracion.opciones_app);
        } else {
          // Si no hay configuración específica, usar permisos por defecto según el rol
          const defaultPermissions = getDefaultPermissions(user.rol);
          setUserPermissions(defaultPermissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // Permisos por defecto en caso de error
        const defaultPermissions = getDefaultPermissions(user.rol);
        setUserPermissions(defaultPermissions);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.rol, refreshTrigger]);

  // Función para obtener permisos por defecto según el rol
  const getDefaultPermissions = (rol) => {
    switch (rol) {
      case 'admin':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'seguimiento', 'movilizador-seguimiento', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'presidente':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'seguimiento', 'movilizador-seguimiento', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'lider_estatal':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'seguimiento', 'movilizador-seguimiento', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'lider_municipal':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'seguimiento', 'movilizador-seguimiento', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'lider_zona':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'perfil', 'movilizador-seguimiento', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'lider':
        return ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'perfil', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'capturista':
        return ['dashboard', 'register', 'pase-lista', 'perfil', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'];
      case 'ciudadano':
        return ['dashboard', 'noticias', 'reportes_ciudadanos', 'perfil'];
      default:
        return ['dashboard', 'perfil'];
    }
  };

  // Filtrar opciones según permisos
  const visibleOptions = allOptions.filter(option => 
    userPermissions.includes(option.permission)
  );

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const handleOptionPress = (option) => {
    router.push(option.route);
    // Cerrar el menú después de seleccionar una opción
    if (isExpanded) {
      toggleMenu();
    }
  };

  const menuHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, Dimensions.get('window').height], // Toma toda la pantalla
  });

    return (
    <Animated.View style={[styles.container, { height: menuHeight }]}>
      {/* Fondo opaco cuando está expandido */}
      {isExpanded && (
        <View style={styles.overlay} />
      )}
      
      <Surface style={[styles.menuSurface, isExpanded && styles.menuSurfaceExpanded]} elevation={12}>
        {/* Botón principal para expandir/contraer */}
        <TouchableOpacity 
          style={[styles.mainButton, isExpanded && styles.mainButtonExpanded]} 
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          {/* Indicador de arrastre dentro del botón */}
          <View style={styles.dragIndicator} />
          
          <View style={styles.mainButtonContent}>
            <FontAwesome5 
              name={isExpanded ? 'times' : 'bars'} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.mainButtonText}>
              {isExpanded ? 'Cerrar Menú' : 'Abrir Menú'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Opciones del menú */}
        {isExpanded && (
          <View style={styles.optionsContainer}>
            <ScrollView style={styles.optionsScroll} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {/* Header con información del usuario */}
              <View style={styles.headerSection}>
                <View style={styles.userAvatar}>
                  <FontAwesome5 name="user-circle" size={40} color="#3949ab" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user?.nombre || user?.username}
                  </Text>
                  <Text style={styles.userRole}>
                    {user?.rol}
                  </Text>
                  <View style={styles.permissionsBadge}>
                    <Text style={styles.permissionsText}>
                      {visibleOptions.length} funciones disponibles
                    </Text>
                  </View>
                </View>
              </View>
              {/* Separador */}
              <View style={styles.separator} />
              {/* Grid de opciones */}
              <View style={styles.optionsGrid}>
                {visibleOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, { animationDelay: `${index * 50}ms` }]}
                    onPress={() => handleOptionPress(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionCard}>
                      <View style={[styles.optionIconContainer, { backgroundColor: option.color }]}>
                        <FontAwesome5 name={option.icon} size={24} color="#fff" />
                      </View>
                      <Text style={styles.optionText} numberOfLines={2} ellipsizeMode="tail">
                        {option.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Opciones no disponibles */}
              {allOptions.filter(option => !userPermissions.includes(option.permission)).length > 0 && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.disabledSection}>
                    <Text style={styles.disabledTitle}>
                      <FontAwesome5 name="lock" size={12} color="#999" />
                      {' '}Funciones restringidas
                    </Text>
                    <View style={styles.disabledOptions}>
                      {allOptions
                        .filter(option => !userPermissions.includes(option.permission))
                        .map((option) => (
                          <View key={option.id} style={styles.disabledOption}>
                            <FontAwesome5 name={option.icon} size={14} color="#ccc" />
                            <Text style={styles.disabledOptionText}>{option.title}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        )}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0, // Extender hasta la parte superior
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 35, 126, 0.85)', // Overlay azul institucional semi-transparente
    zIndex: 999,
    pointerEvents: 'none', // No intercepta eventos táctiles
  },
  menuSurface: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginBottom: 10, // Margen adicional para separar de la barra de navegación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1001, // Asegura que el menú esté por encima del overlay
  },
  menuSurfaceExpanded: {
    backgroundColor: '#1a237e', // Fondo azul institucional
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: 0,
    flex: 1,
    minHeight: '100%', // Asegura que ocupe toda la pantalla
    paddingBottom: 0,
    paddingTop: 0,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  mainButton: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonExpanded: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336',
  },
  mainButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: Dimensions.get('window').height * 0.88, // Ocupa casi toda la pantalla, deja margen inferior
  },
  optionsScroll: {
    flexGrow: 0,
    maxHeight: Dimensions.get('window').height * 0.88,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#2236a8', // Azul más claro para header
    borderRadius: 0,
    marginBottom: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3949ab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    color: '#b3c0f7',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  permissionsBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  permissionsText: {
    fontSize: 13,
    color: '#2236a8',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    flex: 1,
    gap: 0,
  },
  optionButton: {
    flexBasis: '47%',
    maxWidth: '47%',
    height: 120,
    marginBottom: 20,
    marginHorizontal: 0,
    minWidth: 120,
    minHeight: 120,
    maxHeight: 120,
    alignItems: 'center',
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#e3e6f0',
    minHeight: 120,
    maxHeight: 120,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  optionText: {
    fontSize: 15,
    color: '#1a237e',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 18,
    marginTop: 6,
    letterSpacing: 0.2,
    maxWidth: 150,
    minHeight: 32,
    flexWrap: 'wrap',
    includeFontPadding: false,
  },
  disabledSection: {
    paddingTop: 16,
  },
  disabledTitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  disabledOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  disabledOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledOptionText: {
    fontSize: 11,
    color: '#adb5bd',
    marginLeft: 6,
    fontWeight: '500',
  },
}); 