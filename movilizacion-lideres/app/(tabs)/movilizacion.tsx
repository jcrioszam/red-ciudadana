import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Surface, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { DebugInfo } from '../../components/DebugInfo';

type Evento = {
  id: number;
  nombre: string;
  fecha: string;
};
type Vehiculo = {
  id: number;
  tipo: string;
  capacidad: number;
  placas?: string;
  descripcion?: string;
  id_movilizador: number;
};
type Persona = {
  id: number;
  nombre: string;
  telefono?: string;
};
type Asignacion = {
  id: number;
  id_evento: number;
  id_vehiculo: number;
  id_persona: number;
};

export default function MovilizacionScreen() {
  const { token, user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);
  const [asignarLoading, setAsignarLoading] = useState(false);
  const [alerta, setAlerta] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  // Cargar eventos y personas al iniciar
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    
    const loadData = async () => {
      try {
        console.log('🔍 Cargando eventos y personas...');
        const [eventosData, personasData] = await Promise.all([
          api.get('/eventos/?activos=true'),
          api.get('/personas/')
        ]);
        
        console.log('✅ Eventos cargados:', eventosData);
        console.log('✅ Personas cargadas:', personasData);
        
        setEventos(eventosData || []);
        setPersonas(personasData || []);
      } catch (error) {
        console.error('❌ Error al cargar datos iniciales:', error);
        setError('Error al cargar eventos y personas');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [token]);

  // Cargar vehículos y asignaciones del evento seleccionado
  useEffect(() => {
    if (!token || !selectedEvento) return;
    setLoading(true);
    setError('');
    
    const loadVehiculosData = async () => {
      try {
        console.log(`🔍 Cargando vehículos y asignaciones para evento ${selectedEvento.id}...`);
        console.log('🔍 INICIO DE loadVehiculosData - VERSION CORREGIDA');
        
        // Llamar a vehículos
        console.log('🔍 Llamando a /vehiculos/...');
        let vehiculosData;
        try {
          vehiculosData = await api.get('/vehiculos/');
          console.log('✅ Vehículos cargados exitosamente:', vehiculosData);
        } catch (error) {
          console.error('❌ Error al cargar vehículos:', error);
          vehiculosData = [];
        }
        
        // Llamar a asignaciones
        console.log('🔍 Llamando a /movilizaciones/...');
        let asignacionesData;
        try {
          asignacionesData = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
          console.log('✅ Asignaciones cargadas exitosamente:', asignacionesData);
        } catch (error) {
          console.error('❌ Error al cargar asignaciones:', error);
          asignacionesData = [];
        }
        
        // Filtrar solo vehículos activos
        const vehiculosActivos = vehiculosData?.filter((v: any) => v.activo) || [];
        console.log('✅ Vehículos activos:', vehiculosActivos);
        console.log('🔍 Tipo de datos vehiculosData:', typeof vehiculosData);
        console.log('🔍 Es array:', Array.isArray(vehiculosData));
        console.log('🔍 Longitud vehiculosData:', vehiculosData?.length);
        
        setVehiculos(vehiculosActivos);
        setAsignaciones(asignacionesData || []);
      } catch (error) {
        console.error('❌ Error al cargar vehículos y asignaciones:', error);
        setError('Error al cargar vehículos y asignaciones');
      } finally {
        setLoading(false);
      }
    };
    
    loadVehiculosData();
  }, [token, selectedEvento]);

  // Helpers
  const getOcupacion = (vehiculoId: number) => asignaciones.filter(a => a.id_vehiculo === vehiculoId).length;
  const getResponsableNombre = (id: number) => {
    const mov = personas.find(p => p.id === id);
    return mov ? mov.nombre : id;
  };
  const asignacionesPorVehiculo = (vehiculoId: number) => asignaciones.filter(a => a.id_vehiculo === vehiculoId);

  // Helpers extendidos
  const personasAsignadas = (vehiculoId: number) => asignaciones.filter(a => a.id_vehiculo === vehiculoId).map(a => a.id_persona);
  const personasDisponibles = (vehiculoId: number) => {
    const asignadas = asignaciones.map(a => a.id_persona);
    return personas.filter(p => !asignadas.includes(p.id));
  };

  // Asignar personas a vehículo
  const handleAsignarPersonas = async () => {
    if (!vehiculoSeleccionado || personasSeleccionadas.length === 0 || !selectedEvento) return;
    setAsignarLoading(true);
    setAlerta('');
    try {
      console.log('🔍 Asignando personas...');
      await api.post('/movilizaciones/masivo', {
        id_evento: selectedEvento.id,
        id_vehiculo: vehiculoSeleccionado.id,
        ids_persona: personasSeleccionadas,
      });
      
      // Refrescar asignaciones
      console.log('🔄 Refrescando asignaciones...');
      const asignacionesData = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
      setAsignaciones(asignacionesData || []);
      setPersonasSeleccionadas([]);
      setShowAsignarModal(false);
      console.log('✅ Personas asignadas exitosamente');
    } catch (err) {
      console.error('❌ Error al asignar personas:', err);
      setAlerta('Error al asignar personas');
    }
    setAsignarLoading(false);
  };

  // Quitar persona de vehículo
  const handleQuitarPersona = async (asignacionId: number) => {
    if (!selectedEvento) return;
    Alert.alert('Quitar persona', '¿Quitar a esta persona del vehículo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: async () => {
        try {
          console.log(`🔍 Quitando asignación ${asignacionId}...`);
          await api.delete(`/movilizaciones/${asignacionId}`);
          const asignacionesData = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
          setAsignaciones(asignacionesData || []);
          console.log('✅ Persona quitada exitosamente');
        } catch (error) {
          console.error('❌ Error al quitar persona:', error);
          Alert.alert('Error', 'No se pudo quitar a la persona');
        }
      }}
    ]);
  };

  // Marcar asistencia (pase de lista)
  const handleMarcarAsistencia = async (asignacionId: number) => {
    if (!selectedEvento) return;
    try {
      console.log(`🔍 Marcando asistencia para asignación ${asignacionId}...`);
      await api.post(`/movilizaciones/${asignacionId}/checkin`);
      const asignacionesData = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
      setAsignaciones(asignacionesData || []);
      console.log('✅ Asistencia marcada exitosamente');
    } catch (err) {
      console.error('❌ Error al marcar asistencia:', err);
      Alert.alert('Error', 'No se pudo marcar la asistencia');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.outer}>
        <Surface style={styles.card} elevation={4}>
          <View style={styles.header}>
            <Text style={styles.title}>Movilización de Eventos</Text>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={() => setShowDebug(!showDebug)}
            >
              <MaterialIcons name="bug-report" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {showDebug && <DebugInfo visible={true} />}
          
          {loading && <ActivityIndicator animating size="large" style={{ marginTop: 20 }} />}
          {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
          
          {/* Debug info */}
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
            Eventos cargados: {eventos?.length || 0} | Personas: {personas?.length || 0} | Vehículos: {vehiculos?.length || 0}
          </Text>
          
          {/* Selector de evento */}
          <Text style={{ marginBottom: 8 }}>Selecciona un evento:</Text>
          <View style={styles.selectRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {!eventos || eventos.length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>No hay eventos disponibles</Text>
              ) : (
                eventos.map(ev => (
                  <TouchableOpacity
                    key={ev.id}
                    style={[styles.eventButton, selectedEvento?.id === ev.id && styles.eventButtonSelected]}
                    onPress={() => setSelectedEvento(ev)}
                  >
                    <Text style={{ color: selectedEvento?.id === ev.id ? '#fff' : '#3949ab' }}>{ev.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          
          {/* Tabla de vehículos */}
          {selectedEvento && (
            <View style={{ width: '100%', marginTop: 18 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                Vehículos asignados al evento: {selectedEvento.nombre}
              </Text>
              {(!vehiculos || vehiculos.length === 0) && <Text style={{ color: '#888' }}>No hay vehículos registrados para este evento.</Text>}
              {vehiculos.map(vehiculo => (
                <Surface key={vehiculo.id} style={styles.vehiculoCard} elevation={2}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{vehiculo.tipo} ({vehiculo.placas || '-'})</Text>
                  <Text>Capacidad: {vehiculo.capacidad}</Text>
                  <Text>Responsable: {getResponsableNombre(vehiculo.id_movilizador)}</Text>
                  <Text>Ocupación: {getOcupacion(vehiculo.id)} / {vehiculo.capacidad}</Text>
                  <Text style={{ marginTop: 6, fontWeight: 'bold' }}>Personas asignadas:</Text>
                  {(!asignacionesPorVehiculo(vehiculo.id) || asignacionesPorVehiculo(vehiculo.id).length === 0) && <Text style={{ color: '#888' }}>Nadie asignado aún.</Text>}
                  {asignacionesPorVehiculo(vehiculo.id).map(asig => {
                    const persona = personas.find(p => p.id === asig.id_persona);
                    return persona ? (
                      <View key={asig.id} style={styles.personaRow}>
                        <MaterialIcons name="person" size={18} color="#3949ab" style={{ marginRight: 4 }} />
                        <Text>{persona.nombre} ({persona.telefono})</Text>
                        {/* Solo mostrar botón de quitar si el rol lo permite */}
                        {(user?.rol === 'admin' || user?.rol?.includes('lider')) && (
                          <TouchableOpacity onPress={() => handleQuitarPersona(asig.id)} style={{ marginLeft: 8 }}>
                            <MaterialIcons name="remove-circle" size={20} color="#d32f2f" />
                          </TouchableOpacity>
                        )}
                        {/* Botón de pase de lista (asistencia) */}
                        {(user?.rol === 'admin' || user?.rol?.includes('lider') || user?.rol === 'movilizador') && (
                          <TouchableOpacity onPress={() => handleMarcarAsistencia(asig.id)} style={{ marginLeft: 8 }}>
                            <MaterialIcons name="check-circle" size={20} color="#43a047" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null;
                  })}
                  {/* Botón para asignar personas si el rol lo permite */}
                  {(user?.rol === 'admin' || user?.rol?.includes('lider')) && (
                    <Button
                      mode="outlined"
                      style={{ marginTop: 10 }}
                      onPress={() => {
                        setVehiculoSeleccionado(vehiculo);
                        setShowAsignarModal(true);
                      }}
                    >
                      Asignar personas
                    </Button>
                  )}
                </Surface>
              ))}
            </View>
          )}
        </Surface>
        
        {/* Modal para asignar personas */}
        <Modal
          visible={showAsignarModal && !!vehiculoSeleccionado}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAsignarModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 320, maxHeight: 500 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Asignar personas a {vehiculoSeleccionado?.tipo}</Text>
              {alerta ? <Text style={{ color: 'red', marginBottom: 8 }}>{alerta}</Text> : null}
              <ScrollView style={{ maxHeight: 300 }}>
                {personasDisponibles(vehiculoSeleccionado?.id || 0).map(persona => (
                  <TouchableOpacity
                    key={persona.id}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                    onPress={() => {
                      setPersonasSeleccionadas(sel =>
                        sel.includes(persona.id)
                          ? sel.filter(id => id !== persona.id)
                          : [...sel, persona.id]
                      );
                    }}
                  >
                    <MaterialIcons
                      name={personasSeleccionadas.includes(persona.id) ? 'check-box' : 'check-box-outline-blank'}
                      size={20}
                      color={personasSeleccionadas.includes(persona.id) ? '#3949ab' : '#888'}
                      style={{ marginRight: 8 }}
                    />
                    <Text>{persona.nombre} ({persona.telefono})</Text>
                  </TouchableOpacity>
                ))}
                {(!personasDisponibles(vehiculoSeleccionado?.id || 0) || personasDisponibles(vehiculoSeleccionado?.id || 0).length === 0) && <Text style={{ color: '#888' }}>No hay personas disponibles.</Text>}
              </ScrollView>
              <Button
                mode="contained"
                style={{ marginTop: 12 }}
                loading={asignarLoading}
                disabled={!personasSeleccionadas || personasSeleccionadas.length === 0}
                onPress={handleAsignarPersonas}
              >
                Asignar seleccionados
              </Button>
              <Button mode="text" onPress={() => setShowAsignarModal(false)} style={{ marginTop: 8 }}>
                Cancelar
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  card: {
    width: '100%',
    maxWidth: 900,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a237e',
    flex: 1,
  },
  debugButton: {
    padding: 8,
  },
  selectRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  eventButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e3e6f3',
    marginRight: 8,
  },
  eventButtonSelected: {
    backgroundColor: '#3949ab',
  },
  vehiculoCard: {
    width: '100%',
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: 8,
  },
}); 