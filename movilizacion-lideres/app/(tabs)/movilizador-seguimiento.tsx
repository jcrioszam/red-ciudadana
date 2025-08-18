import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Surface, Title, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';

interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  tipo: string;
}

interface Vehiculo {
  id: number;
  tipo: string;
  capacidad: number;
  placas?: string;
  descripcion?: string;
  id_movilizador: number;
}

interface Asignacion {
  id: number;
  id_evento: number;
  id_vehiculo: number;
  id_persona: number;
  evento?: Evento;
  vehiculo?: Vehiculo;
}

export default function MovilizadorSeguimientoScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTrackings, setActiveTrackings] = useState<any[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);

  // Roles que pueden ser movilizadores
  const movilizadorRoles = ['lider_municipal', 'lider_zona', 'lider_seccional', 'coordinador'];
  
  // Verificar si el usuario puede ser movilizador
  if (!movilizadorRoles.includes(user?.rol)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome5 name="car" size={48} color="#f44336" style={styles.restrictedIcon} />
          <Text style={styles.title}>Acceso Restringido</Text>
          <Text style={styles.subtitle}>Solo los movilizadores pueden acceder a esta función</Text>
          <Text style={styles.contactText}>Contacta a tu administrador para solicitar permisos de movilizador</Text>
        </View>
      </View>
    );
  }

  const {
    location,
    errorMsg,
    isTracking,
    startTracking,
    stopTracking,
    getMyActiveTrackings,
    checkTrackingStatus,
  } = useLocationTracking(30000, selectedEvento && selectedVehiculo ? {
    evento_id: selectedEvento.id,
    vehiculo_id: selectedVehiculo.id,
    evento_nombre: selectedEvento.nombre,
    vehiculo_tipo: selectedVehiculo.tipo,
    vehiculo_placas: selectedVehiculo.placas,
    vehiculo_capacidad: selectedVehiculo.capacidad,
    total_personas: asignaciones.filter(a => a.id_vehiculo === selectedVehiculo.id).length,
  } : undefined);

  // Cargar eventos activos
  useEffect(() => {
    loadActiveEvents();
  }, []);

  // Verificar estado del seguimiento al cargar la pantalla
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await checkTrackingStatus();
      } catch (error) {
        console.error('Error al verificar estado de seguimiento:', error);
      }
    };
    checkStatus();
  }, []);

  // Limpiar selecciones cuando se detiene el seguimiento
  useEffect(() => {
    if (!isTracking) {
      setSelectedEvento(null);
      setSelectedVehiculo(null);
      setVehiculos([]);
      setAsignaciones([]);
    }
  }, [isTracking]);

  const loadActiveEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/eventos/?activos=true');
      setEventos(response);
    } catch (error) {
      console.error('❌ Error al cargar eventos:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar seguimientos activos al montar el componente
  useEffect(() => {
    loadActiveTrackings();
  }, []);

  // Cargar vehículos asignados al evento seleccionado
  useEffect(() => {
    if (selectedEvento) {
      loadVehiclesForEvent();
    }
  }, [selectedEvento]);

  const loadVehiclesForEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vehiculos/?evento_id=${selectedEvento!.id}`);
      
      // Obtener vehículos únicos de las asignaciones
      const vehiculosUnicos = response.reduce((acc: Vehiculo[], vehiculo: any) => {
        if (vehiculo && !acc.find(v => v.id === vehiculo.id)) {
          acc.push(vehiculo);
        }
        return acc;
      }, []);

      setVehiculos(vehiculosUnicos);
      setAsignaciones(response);
    } catch (error) {
      console.error('❌ Error al cargar vehículos:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos del evento');
    } finally {
      setLoading(false);
    }
  };

  // Cargar seguimientos activos
  const loadActiveTrackings = async () => {
    try {
      const trackings = await getMyActiveTrackings();
      setActiveTrackings(trackings);
    } catch (error) {
      console.error('Error al cargar seguimientos activos:', error);
      setActiveTrackings([]);
    }
  };

  // Verificar si un vehículo ya está en seguimiento activo
  const isVehicleActive = (vehiculoId: number): boolean => {
    return activeTrackings.some(tracking => 
      tracking.vehiculo_id === vehiculoId && 
      tracking.evento_id === selectedEvento?.id
    );
  };

  // Manejar inicio de movilización
  const handleStartMovilizacion = async () => {
    if (!selectedEvento || !selectedVehiculo) {
      Alert.alert('Error', 'Debes seleccionar un evento y un vehículo');
      return;
    }

    // Verificar si ya está en seguimiento activo
    if (isVehicleActive(selectedVehiculo.id)) {
      Alert.alert('Vehículo en Seguimiento', 'Este vehículo ya está siendo seguido activamente.');
      return;
    }

    Alert.alert(
      'Iniciar Movilización',
      `¿Estás seguro de que quieres iniciar el seguimiento para el evento "${selectedEvento.nombre}" con el vehículo ${selectedVehiculo.placas || selectedVehiculo.tipo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Iniciar', 
          onPress: async () => {
            try {
              await startTracking();
              Alert.alert(
                'Movilización Iniciada',
                'El seguimiento de ubicación ha sido activado. Tu ubicación se enviará cada 30 segundos.',
                [
                  { 
                    text: 'Ver Mapa', 
                    onPress: () => router.push('/mapa')
                  },
                  { text: 'OK' }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo iniciar el seguimiento');
            }
          }
        }
      ]
    );
  };

  // Manejar fin de movilización
  const handleStopMovilizacion = () => {
    Alert.alert(
      'Finalizar Movilización',
      '¿Estás seguro de que quieres detener el seguimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Detener', 
          onPress: async () => {
            try {
              await stopTracking();
              // Limpiar selecciones después de detener
              setSelectedEvento(null);
              setSelectedVehiculo(null);
              setVehiculos([]);
              setAsignaciones([]);
              Alert.alert('Movilización Finalizada', 'El seguimiento ha sido detenido');
            } catch (error) {
              console.error('Error al detener seguimiento:', error);
              Alert.alert('Error', 'No se pudo detener el seguimiento');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="car" size={32} color="#1a237e" />
        <Text style={styles.title}>Movilizador - Seguimiento</Text>
        <Text style={styles.subtitle}>Activa el seguimiento cuando inicies una movilización</Text>
      </View>



      {/* Seguimientos Activos */}
      <Surface style={styles.statusCard} elevation={3}>
        <View style={[styles.statusHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="location-arrow" size={20} color="#4CAF50" />
            <Text style={styles.statusTitle}>Seguimientos Activos ({activeTrackings.length})</Text>
          </View>
          <TouchableOpacity onPress={loadActiveTrackings} style={styles.refreshButton}>
            <FontAwesome5 name="sync" size={16} color="#1a237e" />
          </TouchableOpacity>
        </View>
        {activeTrackings.length > 0 ? (
          activeTrackings.map((tracking, index) => (
            <View key={index} style={styles.activeTrackingItem}>
              <Text style={styles.statusText}>
                🚗 {tracking.vehiculo_tipo || 'Vehículo'} - {tracking.vehiculo_placas || 'Sin placas'}
              </Text>
              <Text style={styles.statusText}>
                📅 Evento: {tracking.evento_nombre}
              </Text>
              <Text style={styles.statusText}>
                👥 Personas: {tracking.total_personas || 0} de {tracking.vehiculo_capacidad || 'N/A'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No hay seguimientos activos</Text>
        )}
      </Surface>

      {/* Estado actual */}
      {isTracking && selectedEvento && selectedVehiculo && (
        <Surface style={styles.statusCard} elevation={3}>
          <View style={styles.statusHeader}>
            <FontAwesome5 name="location-arrow" size={20} color="#4CAF50" />
            <Text style={styles.statusTitle}>Seguimiento Activo</Text>
          </View>
          <Text style={styles.statusText}>
            Evento: {selectedEvento?.nombre}
          </Text>
          <Text style={styles.statusText}>
            Vehículo: {selectedVehiculo?.placas || selectedVehiculo?.tipo}
          </Text>
          {location && (
            <Text style={styles.statusText}>
              Última ubicación: {location.latitud.toFixed(6)}, {location.longitud.toFixed(6)}
            </Text>
          )}
          <Button 
            mode="contained" 
            onPress={handleStopMovilizacion}
            style={styles.stopButton}
            buttonColor="#f44336"
          >
            Detener Seguimiento
          </Button>
        </Surface>
      )}

      {/* Mostrar opciones de selección si hay eventos cargados */}
      {eventos && eventos.length > 0 && (
        <>
          {/* Selección de Evento */}
          <Surface style={styles.card} elevation={3}>
            <Title style={styles.cardTitle}>Seleccionar Evento</Title>
            <Text style={styles.cardSubtitle}>Elige el evento para el cual vas a movilizar</Text>
            
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : eventos && eventos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {eventos.map(evento => (
                  <Chip
                    key={evento.id}
                    selected={selectedEvento?.id === evento.id}
                    onPress={() => {
                      setSelectedEvento(evento);
                    }}
                    style={[styles.chip, selectedEvento?.id === evento.id && styles.selectedChip]}
                    textStyle={styles.chipText}
                  >
                    {evento.nombre}
                  </Chip>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noDataText}>No hay eventos activos disponibles</Text>
            )}
            
            {selectedEvento && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Evento seleccionado:</Text>
                <Text style={styles.selectedValue}>{selectedEvento.nombre}</Text>
                <Text style={styles.selectedDate}>{new Date(selectedEvento.fecha).toLocaleDateString('es-MX')}</Text>
              </View>
            )}
          </Surface>

          {/* Selección de Vehículo */}
          {selectedEvento && (
            <Surface style={styles.card} elevation={3}>
              <Title style={styles.cardTitle}>Seleccionar Vehículo</Title>
              <Text style={styles.cardSubtitle}>Elige el vehículo que vas a utilizar</Text>
              

              
              {loading ? (
                <ActivityIndicator style={styles.loading} />
              ) : vehiculos && vehiculos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  {vehiculos.map(vehiculo => {
                    const isActive = isVehicleActive(vehiculo.id);
                    return (
                      <Chip
                        key={vehiculo.id}
                        selected={selectedVehiculo?.id === vehiculo.id}
                        onPress={() => !isActive && setSelectedVehiculo(vehiculo)}
                        disabled={isActive}
                        style={[
                          styles.chip, 
                          selectedVehiculo?.id === vehiculo.id && styles.selectedChip,
                          isActive && styles.activeChip
                        ]}
                        textStyle={[styles.chipText, isActive && styles.activeChipText]}
                      >
                        {vehiculo.placas || vehiculo.tipo}
                        {isActive && ' ✅'}
                      </Chip>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.noDataText}>No hay vehículos asignados a este evento</Text>
              )}
              
              {selectedVehiculo && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedLabel}>Vehículo seleccionado:</Text>
                  <Text style={styles.selectedValue}>{selectedVehiculo.placas || selectedVehiculo.tipo}</Text>
                  <Text style={styles.selectedDetails}>
                    Tipo: {selectedVehiculo.tipo} | Capacidad: {selectedVehiculo.capacidad} personas
                  </Text>
                </View>
              )}
            </Surface>
          )}

          {/* Botón de Iniciar */}
          {selectedEvento && selectedVehiculo && (
            <Surface style={styles.card} elevation={3}>
              <Title style={styles.cardTitle}>Iniciar Movilización</Title>
              <Text style={styles.cardSubtitle}>
                Estás listo para iniciar el seguimiento
              </Text>
              
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <FontAwesome5 name="calendar" size={16} color="#666" />
                  <Text style={styles.summaryText}>Evento: {selectedEvento.nombre}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <FontAwesome5 name="car" size={16} color="#666" />
                  <Text style={styles.summaryText}>Vehículo: {selectedVehiculo.placas || selectedVehiculo.tipo}</Text>
                </View>
              </View>
              
              <Button 
                mode="contained" 
                onPress={handleStartMovilizacion}
                style={styles.startButton}
                buttonColor="#4CAF50"
              >
                Iniciar Movilización
              </Button>
            </Surface>
          )}
        </>
      )}

      {/* Información adicional */}
      <Surface style={styles.infoCard} elevation={3}>
        <Title style={styles.cardTitle}>Información Importante</Title>
        <View style={styles.infoItem}>
          <FontAwesome5 name="info-circle" size={16} color="#1a237e" />
          <Text style={styles.infoText}>
            El seguimiento se activará solo cuando inicies una movilización
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name="clock" size={16} color="#1a237e" />
          <Text style={styles.infoText}>
            Tu ubicación se actualiza cada 30 segundos
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name="eye" size={16} color="#1a237e" />
          <Text style={styles.infoText}>
            Los líderes podrán ver tu ubicación en tiempo real
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name="battery-half" size={16} color="#1a237e" />
          <Text style={styles.infoText}>
            Se monitorea el nivel de batería del dispositivo
          </Text>
        </View>
      </Surface>

      {/* Mensaje de error */}
      {errorMsg && (
        <Surface style={styles.errorCard} elevation={3}>
          <FontAwesome5 name="exclamation-triangle" size={16} color="#f44336" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </Surface>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#3949ab',
    textAlign: 'center',
  },
  restrictedIcon: {
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  stopButton: {
    marginTop: 12,
  },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loading: {
    marginTop: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 120,
  },
  chipText: {
    fontSize: 14,
    color: '#1a237e',
  },
  selectedChip: {
    backgroundColor: '#1a237e',
  },
  selectedInfo: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  selectedDate: {
    fontSize: 12,
    color: '#666',
  },
  noVehiclesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  vehicleDetails: {
    fontSize: 12,
    color: '#666',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  startButton: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  selectedDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  activeTrackingItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  activeChip: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  activeChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 