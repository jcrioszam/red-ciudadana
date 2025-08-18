import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, RefreshControl } from 'react-native';
import { Surface, Text, ActivityIndicator, Card, Button, Chip, Divider, FAB } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';

export default function SeguimientoReportesScreen() {
  const { token, logout } = useAuth();
  const [reportesData, setReportesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReporte, setSelectedReporte] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 27.082347,
    longitude: -109.445866,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (token) {
      loadReportesData();
    }
  }, [token]);

  const loadReportesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://192.168.2.150:8000/reportes-ciudadanos', {
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
      
      const data = await response.json();
      setReportesData(data);
      
      // Actualizar el centro del mapa basado en los reportes
      const newMapRegion = calculateMapCenter(data);
      setMapRegion(newMapRegion);
      setLoading(false);
    } catch (e) {
      setError('Error de conexión: ' + e);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportesData();
    setRefreshing(false);
  };

  const getReporteColor = (estado: string) => {
    const colors: { [key: string]: string } = {
      'pendiente': '#FF9800',
      'en_revision': '#9C27B0',
      'en_progreso': '#2196F3',
      'resuelto': '#4CAF50',
      'rechazado': '#F44336'
    };
    return colors[estado] || '#9C27B0';
  };

  const getReporteIcon = (estado: string) => {
    const icons: { [key: string]: any } = {
      'pendiente': 'schedule',
      'en_revision': 'visibility',
      'en_progreso': 'speed',
      'resuelto': 'check-circle',
      'rechazado': 'cancel'
    };
    return icons[estado] || 'schedule';
  };

  const getEstadisticas = () => {
    const total = reportesData.length;
    const pendientes = reportesData.filter((r: any) => r.estado === 'pendiente').length;
    const enRevision = reportesData.filter((r: any) => r.estado === 'en_revision').length;
    const enProgreso = reportesData.filter((r: any) => r.estado === 'en_progreso').length;
    const resueltos = reportesData.filter((r: any) => r.estado === 'resuelto').length;
    const rechazados = reportesData.filter((r: any) => r.estado === 'rechazado').length;
    const urgentes = reportesData.filter((r: any) => r.prioridad === 'urgente').length;

    return { total, pendientes, enRevision, enProgreso, resueltos, rechazados, urgentes };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando seguimiento de reportes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button mode="contained" onPress={loadReportesData} style={styles.retryButton}>
          Reintentar
        </Button>
      </View>
    );
  }

  const stats = getEstadisticas();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="analytics" size={28} color="#2196F3" />
          <Text style={styles.headerTitle}>Seguimiento de Reportes</Text>
        </View>

        {/* Estadísticas en Tiempo Real */}
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="analytics" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Estadísticas en Tiempo Real</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="assessment" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="schedule" size={20} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.pendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <MaterialIcons name="visibility" size={20} color="#9C27B0" />
              <Text style={styles.statNumber}>{stats.enRevision}</Text>
              <Text style={styles.statLabel}>En Revisión</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="speed" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.enProgreso}</Text>
              <Text style={styles.statLabel}>En Progreso</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.resueltos}</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
              <MaterialIcons name="cancel" size={20} color="#F44336" />
              <Text style={styles.statNumber}>{stats.rechazados}</Text>
              <Text style={styles.statLabel}>Rechazados</Text>
            </View>
          </View>
        </Surface>

        {/* Mapa en Tiempo Real */}
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="map" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Mapa en Tiempo Real</Text>
            <Button 
              mode="text" 
              onPress={() => setMapKey(prev => prev + 1)}
              icon="refresh"
              compact
            >
              Actualizar
            </Button>
          </View>
          
          <View style={styles.mapContainer}>
                         <MapView
               key={mapKey}
               style={styles.map}
               region={mapRegion}
               onRegionChangeComplete={setMapRegion}
               showsUserLocation={true}
               showsMyLocationButton={true}
               showsCompass={true}
               showsScale={true}
               zoomEnabled={true}
               scrollEnabled={true}
               rotateEnabled={true}
               pitchEnabled={true}
             >
              {reportesData.map((reporte: any, index: number) => (
                <Marker
                  key={reporte.id}
                  coordinate={{
                    latitude: reporte.latitud || 19.4326,
                    longitude: reporte.longitud || -99.1332,
                  }}
                  pinColor={getReporteColor(reporte.estado)}
                  onPress={() => setSelectedReporte(reporte)}
                >
                  <Callout>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{reporte.titulo}</Text>
                      <Text style={styles.calloutDescription}>{reporte.descripcion}</Text>
                      <Chip 
                        mode="outlined" 
                        textStyle={{ color: getReporteColor(reporte.estado) }}
                        style={{ borderColor: getReporteColor(reporte.estado) }}
                      >
                        {reporte.estado}
                      </Chip>
                      <Text style={styles.calloutDate}>
                        {formatDate(reporte.fecha_creacion)}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          </View>
        </Surface>

        {/* Lista de Reportes Recientes */}
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="list" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Reportes Recientes</Text>
          </View>
          
          {reportesData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="report-problem" size={48} color="#ccc" />
              <Text style={styles.noData}>No hay reportes disponibles</Text>
            </View>
          ) : (
            reportesData.slice(0, 10).map((reporte: any, index: number) => (
              <Card key={reporte.id} style={[styles.reporteCard, { borderLeftWidth: 4, borderLeftColor: getReporteColor(reporte.estado) }]}>
                <Card.Content>
                  <View style={styles.reporteHeader}>
                    <View style={styles.reporteInfo}>
                      <Text style={styles.reporteTitulo}>{reporte.titulo}</Text>
                      <Text style={styles.reporteFecha}>{formatDate(reporte.fecha_creacion)}</Text>
                      <Chip mode="outlined" compact style={styles.reporteChip}>
                        {reporte.prioridad}
                      </Chip>
                    </View>
                    <View style={styles.reporteStats}>
                      <MaterialIcons 
                        name={getReporteIcon(reporte.estado)} 
                        size={24} 
                        color={getReporteColor(reporte.estado)} 
                      />
                      <Chip 
                        mode="outlined" 
                        compact
                        textStyle={{ color: getReporteColor(reporte.estado) }}
                        style={{ borderColor: getReporteColor(reporte.estado) }}
                      >
                        {reporte.estado}
                      </Chip>
                    </View>
                  </View>
                  
                  <Text style={styles.reporteDescripcion}>{reporte.descripcion}</Text>
                  
                  {reporte.ciudadano_nombre && (
                    <Text style={styles.reporteCiudadano}>
                      Reportado por: {reporte.ciudadano_nombre}
                    </Text>
                  )}
                  
                  {reporte.foto_url && (
                    <View style={styles.fotoContainer}>
                      <MaterialIcons name="photo" size={16} color="#666" />
                      <Text style={styles.fotoText}>Foto disponible</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </Surface>
      </ScrollView>

      {/* FAB para actualizar */}
      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={onRefresh}
        label="Actualizar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 8,
  },
  card: {
    width: '100%',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 18,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: 80,
    elevation: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
    fontSize: 18,
    marginTop: 4,
  },
  statLabel: {
    color: '#555',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 250,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  reporteCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reporteInfo: {
    flex: 1,
  },
  reporteTitulo: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 16,
  },
  reporteFecha: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reporteChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  reporteStats: {
    alignItems: 'center',
  },
  reporteDescripcion: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  reporteCiudadano: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  fotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fotoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
}); 