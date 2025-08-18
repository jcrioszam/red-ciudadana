import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { Surface, Text, ActivityIndicator, Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

interface EventoHistorico {
  id: number;
  nombre: string;
  fecha: string;
  tipo: string;
  lugar: string;
  total_asignados: number;
  asistencias_confirmadas: number;
  movilizados: number;
  porcentaje_asistencia: number;
  porcentaje_movilizacion: number;
}

interface ReporteHistoricos {
  total_eventos: number;
  eventos_por_tipo: Record<string, number>;
  eventos_por_mes: Record<string, number>;
  eventos_detallados: EventoHistorico[];
  resumen: {
    promedio_asistencia: number;
    promedio_movilizacion: number;
    total_asignados: number;
    total_asistencias: number;
    total_movilizados: number;
  };
}

export default function EventosHistoricosScreen() {
  const { token, logout } = useAuth();
  const [data, setData] = useState<ReporteHistoricos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadEventosHistoricos();
    }
  }, [token]);

  const loadEventosHistoricos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://192.168.2.150:8000/reportes/eventos-historicos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 401) {
        Alert.alert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', [
          { text: 'OK', onPress: () => logout() }
        ]);
        return;
      }
      
      if (!response.ok) {
        const text = await response.text();
        setError(`Error ${response.status}: ${text}`);
        setLoading(false);
        return;
      }
      
      const responseData = await response.json();
      setData(responseData);
      setLoading(false);
    } catch (e) {
      setError('Error de conexión: ' + e);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAsistenciaColor = (porcentaje: number) => {
    if (porcentaje >= 80) return '#10B981';
    if (porcentaje >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getAsistenciaIcon = (porcentaje: number) => {
    if (porcentaje >= 80) return 'check-circle';
    if (porcentaje >= 60) return 'user';
    return 'times-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando eventos históricos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error al cargar datos</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Button mode="contained" onPress={loadEventosHistoricos} style={styles.retryButton}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <MaterialIcons name="history" size={32} color="#2196F3" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Eventos Históricos</Text>
            <Text style={styles.headerSubtitle}>Reportes de eventos pasados</Text>
          </View>
          <Button 
            mode="text" 
            onPress={loadEventosHistoricos}
            icon="refresh"
            compact
          >
            Actualizar
          </Button>
        </View>
      </Surface>

      {/* Resumen Global */}
      {data?.resumen && (
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Resumen Global</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="event" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{data.total_eventos}</Text>
              <Text style={styles.statLabel}>Total Eventos</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{data.resumen.total_asignados}</Text>
              <Text style={styles.statLabel}>Total Asignados</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{data.resumen.total_asistencias}</Text>
              <Text style={styles.statLabel}>Total Asistencias</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{data.resumen.promedio_asistencia}%</Text>
              <Text style={styles.statLabel}>Promedio Asistencia</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="local-shipping" size={24} color="#EF4444" />
              <Text style={styles.statNumber}>{data.resumen.promedio_movilizacion}%</Text>
              <Text style={styles.statLabel}>Promedio Movilización</Text>
            </View>
          </View>
        </Surface>
      )}

      {/* Estadísticas por Tipo */}
      {data?.eventos_por_tipo && Object.keys(data.eventos_por_tipo).length > 0 && (
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Eventos por Tipo</Title>
          <View style={styles.chipContainer}>
            {Object.entries(data.eventos_por_tipo)
              .sort(([,a], [,b]) => Number(b) - Number(a))
              .map(([tipo, cantidad]) => (
                <Chip key={tipo} style={styles.chip} textStyle={styles.chipText}>
                  {tipo}: {cantidad}
                </Chip>
              ))}
          </View>
        </Surface>
      )}

      {/* Lista de Eventos Históricos */}
      <Surface style={styles.card} elevation={2}>
        <Title style={styles.cardTitle}>Eventos Históricos Detallados</Title>
        
        {data?.eventos_detallados && data.eventos_detallados.length > 0 ? (
          <View style={styles.eventosList}>
            {data.eventos_detallados.map((evento) => (
              <Card key={evento.id} style={styles.eventoCard}>
                <Card.Content>
                  <View style={styles.eventoHeader}>
                    <View style={styles.eventoInfo}>
                      <Title style={styles.eventoNombre}>{evento.nombre}</Title>
                      <Chip style={styles.eventoTipo} textStyle={styles.chipText}>
                        {evento.tipo}
                      </Chip>
                    </View>
                    <View style={styles.eventoStats}>
                      <MaterialIcons 
                        name={getAsistenciaIcon(evento.porcentaje_asistencia)} 
                        size={24} 
                        color={getAsistenciaColor(evento.porcentaje_asistencia)} 
                      />
                      <Text style={[styles.porcentajeAsistencia, { color: getAsistenciaColor(evento.porcentaje_asistencia) }]}>
                        {evento.porcentaje_asistencia}%
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.eventoFecha}>
                    <MaterialIcons name="event" size={16} color="#666" />
                    {' '}{formatDate(evento.fecha)}
                  </Text>
                  
                  {evento.lugar && (
                    <Text style={styles.eventoLugar}>
                      <MaterialIcons name="location-on" size={16} color="#666" />
                      {' '}{evento.lugar}
                    </Text>
                  )}
                  
                  <View style={styles.eventoEstadisticas}>
                    <View style={styles.estadisticaItem}>
                      <Text style={styles.estadisticaLabel}>Asignados</Text>
                      <Text style={styles.estadisticaValor}>{evento.total_asignados}</Text>
                    </View>
                    <View style={styles.estadisticaItem}>
                      <Text style={styles.estadisticaLabel}>Presentes</Text>
                      <Text style={[styles.estadisticaValor, { color: '#10B981' }]}>{evento.asistencias_confirmadas}</Text>
                    </View>
                    <View style={styles.estadisticaItem}>
                      <Text style={styles.estadisticaLabel}>Movilizados</Text>
                      <Text style={[styles.estadisticaValor, { color: '#2196F3' }]}>{evento.movilizados}</Text>
                    </View>
                    <View style={styles.estadisticaItem}>
                      <Text style={styles.estadisticaLabel}>Movilización</Text>
                      <Text style={[styles.estadisticaValor, { color: '#8B5CF6' }]}>{evento.porcentaje_movilizacion}%</Text>
                    </View>
                  </View>
                  
                  {/* Barra de progreso */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progreso de asistencia</Text>
                      <Text style={styles.progressValue}>{evento.porcentaje_asistencia}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${evento.porcentaje_asistencia}%`,
                            backgroundColor: getAsistenciaColor(evento.porcentaje_asistencia)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialIcons name="history" size={64} color="#9CA3AF" />
            <Text style={styles.noDataTitle}>No hay eventos históricos</Text>
            <Text style={styles.noDataText}>Los eventos aparecerán aquí una vez que hayan pasado más de 24 horas.</Text>
          </View>
        )}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#E0E7FF',
    marginBottom: 8,
  },
  chipText: {
    color: '#3730A3',
    fontSize: 12,
  },
  eventosList: {
    gap: 12,
  },
  eventoCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  eventoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventoTipo: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
  },
  eventoStats: {
    alignItems: 'center',
  },
  porcentajeAsistencia: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  eventoFecha: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  eventoLugar: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  eventoEstadisticas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  estadisticaItem: {
    alignItems: 'center',
    flex: 1,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  estadisticaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 