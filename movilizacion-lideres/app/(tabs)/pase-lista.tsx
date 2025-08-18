import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Card, Title, Button, TextInput, Searchbar, ActivityIndicator, Divider, List, Paragraph } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../src/api';

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
  id_movilizador: number;
};

type Persona = {
  id: number;
  nombre: string;
  telefono?: string;
  id_lider_responsable?: number;
  clave_elector?: string;
  curp?: string;
  direccion?: string;
};

type Asignacion = {
  id: number;
  id_evento: number;
  id_vehiculo: number;
  id_persona: number;
  asistio?: boolean;
};

type Lider = {
  id: number;
  nombre: string;
  rol: string;
  id_lider_superior?: number;
};

export default function PaseLista() {
  const { token, user, logout } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGeneralSearch, setShowGeneralSearch] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [searching, setSearching] = useState(false);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);

  // Cargar datos al iniciar
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  // Búsqueda dinámica en tiempo real
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPersonas([]);
      return;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    console.log('Búsqueda dinámica con término:', searchTerm);
    
    const filtered = personas.filter(persona => {
      // Buscar en nombre
      if (persona.nombre?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en ID
      if (persona.id.toString().includes(searchTerm)) return true;
      
      // Buscar en teléfono
      if (persona.telefono?.includes(searchTerm)) return true;
      
      // Buscar en clave de elector
      if (persona.clave_elector?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en CURP
      if (persona.curp?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en dirección
      if (persona.direccion?.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });

    console.log('Personas filtradas:', filtered?.length || 0);
    setFilteredPersonas(filtered);
  }, [searchQuery, personas]);

  const loadInitialData = async () => {
    try {
      console.log('🔍 Cargando datos iniciales...');
      
      const [eventosData, lideresData] = await Promise.all([
        api.get('/eventos/?activos=true'),
        api.get('/usuarios/?rol=lider')
      ]);

      console.log('✅ Eventos cargados:', eventosData);
      console.log('✅ Líderes cargados:', lideresData);
      
      setEventos(eventosData || []);
      setLideres(lideresData || []);
    } catch (err) {
      console.error('❌ Error al cargar datos iniciales:', err);
      Alert.alert(
        'Error de Conexión', 
        'No se pudieron cargar los datos. Verifica tu conexión a internet.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadEventoData = async (eventoId: number) => {
    try {
      console.log(`🔍 Cargando datos del evento: ${eventoId}`);
      
      const [vehiculosData, personasData, asignacionesData] = await Promise.all([
        api.get('/vehiculos/'),
        api.get('/personas/'),
        api.get(`/movilizaciones/?evento_id=${eventoId}`)
      ]);

      console.log('✅ Vehículos cargados:', vehiculosData);
      console.log('✅ Personas cargadas:', personasData);
      console.log('✅ Asignaciones cargadas:', asignacionesData);
      
      setVehiculos(vehiculosData || []);
      setPersonas(personasData || []);
      setAsignaciones(asignacionesData || []);
    } catch (err) {
      console.error('❌ Error al cargar datos del evento:', err);
      Alert.alert(
        'Error de Conexión', 
        'No se pudieron cargar los datos del evento. Verifica tu conexión a internet.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEventoSelect = async (evento: Evento) => {
    setSelectedEvento(evento);
    await loadEventoData(evento.id);
  };

  const handleMarcarAsistencia = async (asignacionId: number) => {
    try {
      console.log('=== INICIANDO CHECKIN ===');
      console.log('Asignación ID:', asignacionId);
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('URL:', `http://192.168.2.150:8000/movilizaciones/${asignacionId}/checkin`);
      
      const response = await api.post(`/movilizaciones/${asignacionId}/checkin`);

      console.log('Respuesta del servidor:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);

      if (response.status === 401) {
        console.log('❌ Token expirado - Redirigiendo al login');
        Alert.alert(
          'Sesión Expirada', 
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar token y redirigir al login
                logout();
              }
            }
          ]
        );
        return;
      }

      if (response.ok) {
        const responseData = response.data;
        console.log('✅ Checkin exitoso - Datos de respuesta:', responseData);
        
        Alert.alert('Éxito', 'Asistencia marcada correctamente');
        
        // Recargar asignaciones
        if (selectedEvento) {
          console.log('🔄 Recargando asignaciones después del checkin...');
          const asignacionesRes = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
          
          if (asignacionesRes.ok) {
            const nuevasAsignaciones = asignacionesRes.data;
            console.log('✅ Nuevas asignaciones cargadas:', nuevasAsignaciones);
            
            // Verificar el estado actualizado
            const conAsistencia = nuevasAsignaciones.filter((a: any) => a.asistio);
            const sinAsistencia = nuevasAsignaciones.filter((a: any) => !a.asistio);
                  console.log('📊 Después del checkin - Con asistencia:', conAsistencia?.length || 0);
      console.log('📊 Después del checkin - Sin asistencia:', sinAsistencia?.length || 0);
            
            setAsignaciones(nuevasAsignaciones);
          } else {
            console.log('❌ Error al recargar asignaciones:', asignacionesRes.status);
          }
        }
      } else {
        const errorText = response.data?.detail || response.statusText;
        console.log('❌ Error en checkin:');
        console.log('- Status:', response.status);
        console.log('- Error Text:', errorText);
        
        Alert.alert('Error', errorText || 'No se pudo marcar la asistencia');
      }
    } catch (err) {
      console.log('💥 Excepción en marcar asistencia:', err);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleAdvancedSearch = async () => {
    // Esta función ya no es necesaria con búsqueda dinámica
    // Pero la mantenemos por si acaso
    console.log('Búsqueda dinámica activa - no se necesita botón de buscar');
  };

  const performLocalSearch = (query: string): Persona[] => {
    const searchTerm = query.toLowerCase().trim();
    console.log('Realizando búsqueda local con término:', searchTerm);
    
    return personas.filter(persona => {
      // Buscar en nombre
      if (persona.nombre?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en ID
      if (persona.id.toString().includes(searchTerm)) return true;
      
      // Buscar en teléfono
      if (persona.telefono?.includes(searchTerm)) return true;
      
      // Buscar en clave de elector
      if (persona.clave_elector?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en CURP
      if (persona.curp?.toLowerCase().includes(searchTerm)) return true;
      
      // Buscar en dirección
      if (persona.direccion?.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });
  };

  const handleMarcarAsistenciaDirecta = async (personaId: number) => {
    if (!selectedEvento) {
      Alert.alert('Error', 'Primero selecciona un evento');
      return;
    }

    console.log('Buscando asignación para persona ID:', personaId);
    
    // Buscar si la persona está asignada al evento
    const asignacion = asignaciones.find(a => a.id_persona === personaId);
    
    if (!asignacion) {
      console.log('No se encontró asignación para persona:', personaId);
      Alert.alert('Error', 'Esta persona no está asignada a este evento');
      return;
    }

    console.log('Asignación encontrada:', asignacion);
    await handleMarcarAsistencia(asignacion.id);
  };

  const getPersonaById = (id: number) => personas.find(p => p.id === id);
  const getVehiculoById = (id: number) => vehiculos.find(v => v.id === id);
  const getLiderById = (id: number) => lideres.find(l => l.id === id);

  const getAsignacionesPorVehiculo = (vehiculoId: number) => {
    return asignaciones.filter(a => a.id_vehiculo === vehiculoId);
  };

  const getAsignacionesPorLider = (liderId: number) => {
    // Obtener personas del líder y sus sublíderes
    const personasDelLider = personas.filter(p => p.id_lider_responsable === liderId);
    const personaIds = personasDelLider.map(p => p.id);
    return asignaciones.filter(a => personaIds.includes(a.id_persona));
  };

  const canAccessGeneralSearch = () => {
    return user?.rol === 'admin' || user?.rol === 'presidente';
  };

  const filteredAsignaciones = showGeneralSearch && searchTerm 
    ? getAsignacionesPorLider(parseInt(searchTerm))
    : asignaciones;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={4}>
        <Title style={styles.title}>Pase de Lista</Title>
        
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Selector de evento */}
        <Card style={styles.eventCard}>
          <Card.Content>
            <Title>Seleccionar Evento</Title>
            {loading ? (
              <ActivityIndicator size="small" style={{ marginVertical: 10 }} />
            ) : !eventos || eventos.length === 0 ? (
              <Text style={styles.noData}>No hay eventos disponibles.</Text>
            ) : (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {eventos.map(evento => (
                    <Button
                      key={evento.id}
                      mode={selectedEvento?.id === evento.id ? "contained" : "outlined"}
                      onPress={() => handleEventoSelect(evento)}
                      style={styles.eventButton}
                    >
                      {evento.nombre}
                    </Button>
                  ))}
                </ScrollView>
                
                {selectedEvento && (
                  <Button
                    mode="outlined"
                    onPress={() => loadEventoData(selectedEvento.id)}
                    style={styles.refreshButton}
                    icon="refresh"
                  >
                    Refrescar Datos
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Búsqueda avanzada */}
        {selectedEvento && (
          <Card style={styles.searchCard}>
            <Card.Content>
              <Title>Búsqueda Avanzada</Title>
              <Paragraph>Buscar por nombre, clave de elector, ID, etc.</Paragraph>
              
              <View style={styles.searchRow}>
                <Button
                  mode={showAdvancedSearch ? "contained" : "outlined"}
                  onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  style={styles.searchToggleButton}
                >
                  {showAdvancedSearch ? "Ocultar" : "Mostrar"} Búsqueda
                </Button>
              </View>

              {showAdvancedSearch && (
                <View>
                  <Text style={styles.searchInfo}>
                    Personas disponibles para búsqueda: {personas?.length || 0}
                  </Text>
                  <Searchbar
                    placeholder="Buscar por nombre, clave, ID, teléfono..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                  />
                  
                  <View style={styles.searchButtons}>
                    <Button 
                      mode="outlined" 
                      onPress={() => {
                        setSearchQuery('');
                        setFilteredPersonas([]);
                      }}
                      style={styles.clearButton}
                    >
                      Limpiar Búsqueda
                    </Button>
                  </View>

                  {/* Resultados de búsqueda dinámica */}
                  {searchQuery.trim() !== '' && (
                    <View style={styles.searchResults}>
                      <Title style={styles.resultsTitle}>
                        Resultados ({filteredPersonas?.length || 0})
                      </Title>
                      
                                              {!filteredPersonas || filteredPersonas.length === 0 ? (
                        <Text style={styles.noResults}>
                          No se encontraron personas con "{searchQuery}"
                        </Text>
                      ) : (
                        filteredPersonas.map(persona => (
                          <Card key={persona.id} style={styles.resultCard}>
                            <Card.Content>
                              <View style={styles.resultHeader}>
                                <Text style={styles.resultName}>{persona.nombre}</Text>
                                <Button
                                  mode="contained"
                                  onPress={() => handleMarcarAsistenciaDirecta(persona.id)}
                                  style={styles.marcarDirectoButton}
                                  compact
                                >
                                  Marcar
                                </Button>
                              </View>
                              <Text style={styles.resultDetails}>
                                ID: {persona.id} | Tel: {persona.telefono || 'N/A'}
                              </Text>
                              {persona.clave_elector && (
                                <Text style={styles.resultDetails}>
                                  Clave: {persona.clave_elector}
                                </Text>
                              )}
                              {persona.curp && (
                                <Text style={styles.resultDetails}>
                                  CURP: {persona.curp}
                                </Text>
                              )}
                            </Card.Content>
                          </Card>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Búsqueda general para administradores */}
        {canAccessGeneralSearch() && selectedEvento && (
          <Card style={styles.adminSearchCard}>
            <Card.Content>
              <Title>Búsqueda por Líder (Admin)</Title>
              <Paragraph>Buscar personas de un líder específico</Paragraph>
              
              <View style={styles.searchRow}>
                <Button
                  mode={showGeneralSearch ? "contained" : "outlined"}
                  onPress={() => setShowGeneralSearch(!showGeneralSearch)}
                  style={styles.searchToggleButton}
                >
                  {showGeneralSearch ? "Ocultar" : "Mostrar"} Búsqueda
                </Button>
              </View>

              {showGeneralSearch && (
                <View>
                  <TextInput
                    label="ID del Líder"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    keyboardType="numeric"
                    style={styles.searchInput}
                    mode="outlined"
                    placeholder="Ej: 2, 3, 4..."
                  />
                  <Text style={styles.searchHelp}>
                    Ingresa el ID del líder para ver sus personas asignadas
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Lista de vehículos y personas */}
        {selectedEvento && (
          <Card style={styles.vehiclesCard}>
            <Card.Content>
              <Title>Vehículos y Personas Asignadas</Title>
              
                              {!vehiculos || vehiculos.length === 0 ? (
                <Text style={styles.noData}>No hay vehículos registrados para este evento.</Text>
              ) : (
                vehiculos.map(vehiculo => {
                  const asignacionesVehiculo = getAsignacionesPorVehiculo(vehiculo.id);
                  const movilizador = getLiderById(vehiculo.id_movilizador);
                  
                  return (
                    <View key={vehiculo.id} style={styles.vehiculoSection}>
                      <View style={styles.vehiculoHeader}>
                        <MaterialIcons name="directions-car" size={24} color="#3949ab" />
                        <View style={styles.vehiculoInfo}>
                          <Text style={styles.vehiculoTitle}>
                            {vehiculo.tipo} {vehiculo.placas && `(${vehiculo.placas})`}
                          </Text>
                          <Text style={styles.vehiculoDetails}>
                            Capacidad: {vehiculo.capacidad} | Responsable: {movilizador?.nombre || 'N/A'}
                          </Text>
                          <Text style={styles.vehiculoOcupacion}>
                            Ocupación: {asignacionesVehiculo?.length || 0} / {vehiculo.capacidad}
                          </Text>
                        </View>
                      </View>

                      {!asignacionesVehiculo || asignacionesVehiculo.length === 0 ? (
                        <Text style={styles.noPersonas}>Nadie asignado a este vehículo.</Text>
                      ) : (
                        <View style={styles.personasList}>
                          {asignacionesVehiculo.map(asignacion => {
                            const persona = getPersonaById(asignacion.id_persona);
                            return persona ? (
                              <View key={asignacion.id} style={styles.personaItem}>
                                <View style={styles.personaRow}>
                                  <View style={styles.personaInfo}>
                                    <MaterialIcons 
                                      name="person" 
                                      size={20} 
                                      color="#666" 
                                    />
                                    <Text style={styles.personaText}>
                                      {persona.nombre}
                                    </Text>
                                    {persona.telefono && (
                                      <Text style={styles.telefonoText}>
                                        {persona.telefono}
                                      </Text>
                                    )}
                                  </View>
                                  <View style={styles.statusContainer}>
                                    {asignacion.asistio ? (
                                      <MaterialIcons 
                                        name="check-circle" 
                                        size={24} 
                                        color="#4CAF50" 
                                      />
                                    ) : (
                                      <MaterialIcons 
                                        name="cancel" 
                                        size={24} 
                                        color="#F44336" 
                                      />
                                    )}
                                  </View>
                                </View>
                                {!asignacion.asistio && (
                                  <Button
                                    mode="contained"
                                    onPress={() => handleMarcarAsistencia(asignacion.id)}
                                    style={styles.checkinButton}
                                    labelStyle={styles.checkinButtonLabel}
                                  >
                                    Marcar Asistencia
                                  </Button>
                                )}
                              </View>
                            ) : null;
                          })}
                        </View>
                      )}
                      <Divider style={styles.divider} />
                    </View>
                  );
                })
              )}
            </Card.Content>
          </Card>
        )}

        {/* Resumen */}
                        {selectedEvento && asignaciones && asignaciones.length > 0 && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Title>Resumen del Evento</Title>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>Total de personas: {asignaciones?.length || 0}</Text>
                <Text style={styles.summaryText}>Presentes: {asignaciones?.filter(a => a.asistio)?.length || 0}</Text>
                <Text style={styles.summaryText}>Faltantes: {asignaciones?.filter(a => !a.asistio)?.length || 0}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  eventButton: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
  },
  refreshButton: {
    marginTop: 10,
    alignSelf: 'center',
    borderRadius: 20,
  },
  searchCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  searchButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  clearButton: {
    flex: 1,
    maxWidth: 200,
  },
  searchResults: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  resultCard: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  marcarDirectoButton: {
    backgroundColor: '#FF9800',
  },
  searchInput: {
    marginVertical: 10,
  },
  searchHelp: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  vehiclesCard: {
    marginBottom: 16,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  vehiculoSection: {
    marginBottom: 16,
  },
  vehiculoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehiculoInfo: {
    marginLeft: 10,
    flex: 1,
  },
  vehiculoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  vehiculoDetails: {
    fontSize: 12,
    color: '#666',
  },
  vehiculoOcupacion: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  noPersonas: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  personasList: {
    marginLeft: 34,
  },
  personaItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personaText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  telefonoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  statusContainer: {
    marginLeft: 10,
  },
  checkinButton: {
    backgroundColor: '#2196F3',
    marginTop: 8,
    borderRadius: 20,
  },
  checkinButtonLabel: {
    color: '#fff',
    fontSize: 12,
  },
  divider: {
    marginVertical: 8,
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  searchResultsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  searchResultDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchResultButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    marginLeft: 10,
  },
  searchResultButtonLabel: {
    color: '#fff',
    fontSize: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  searchToggleButton: {
    marginRight: 10,
  },
  searchBar: {
    marginVertical: 10,
  },
  searchInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  noResults: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  adminSearchCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e8',
  },
}); 