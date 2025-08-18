import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, RefreshControl } from 'react-native';
import { Surface, Text, ActivityIndicator, Card, Title, Paragraph, Button, Chip, Divider } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';

export default function DashboardScreen() {
  const { token, logout } = useAuth();
  const [globalStats, setGlobalStats] = useState({ 
    personas: 0, 
    eventos: 0, 
    lideres: 0, 
    secciones: 0,
    reportes: 0,
    movilizaciones: 0
  });
  const [topSecciones, setTopSecciones] = useState<Array<{ seccion: string, total: number }>>([]);
  const [topLideres, setTopLideres] = useState<Array<{ nombre: string, total: number }>>([]);
  const [asistenciasData, setAsistenciasData] = useState<any>(null);
  const [movilizacionData, setMovilizacionData] = useState<any>(null);
  const [reportesData, setReportesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 27.082347,
    longitude: -109.445866,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de personas
      const personasRes = await fetch('http://192.168.2.150:8000/reportes/personas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (personasRes.status === 401) {
        Alert.alert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', [
          { text: 'OK', onPress: () => logout() }
        ]);
        return;
      }
      
      if (!personasRes.ok) {
        const text = await personasRes.text();
        setError(`Error ${personasRes.status}: ${text}`);
        setLoading(false);
        return;
      }
      
      const personasData = await personasRes.json();
      setRawData(personasData);
      
      // Adaptar a la estructura recibida
      setGlobalStats({
        personas: personasData.total_personas || 0,
        eventos: personasData.total_eventos || 0,
        lideres: personasData?.personas_por_lider ? Object.keys(personasData.personas_por_lider).length : 0,
        secciones: personasData?.personas_por_seccion ? Object.keys(personasData.personas_por_seccion).length : 0,
        reportes: 0, // Se cargará por separado
        movilizaciones: 0, // Se cargará por separado
      });
      
      // Rankings: convertir objetos a arrays ordenados
      const topSecciones = personasData.personas_por_seccion
        ? Object.entries(personasData.personas_por_seccion)
            .map(([seccion, total]) => ({ seccion, total: Number(total) }))
            .sort((a, b) => b.total - a.total)
        : [];
      setTopSecciones(topSecciones);
      
      const topLideres = personasData.personas_por_lider
        ? Object.entries(personasData.personas_por_lider)
            .map(([nombre, total]) => ({ nombre, total: Number(total) }))
            .sort((a, b) => b.total - a.total)
        : [];
      setTopLideres(topLideres);
      
      // Cargar datos de asistencias
      const asistenciasRes = await fetch('http://192.168.2.150:8000/reportes/asistencias-tiempo-real', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (asistenciasRes.ok) {
        const asistenciasData = await asistenciasRes.json();
        setAsistenciasData(asistenciasData);
      }
      
      // Cargar datos de movilización por vehículos
      const movilizacionRes = await fetch('http://192.168.2.150:8000/reportes/movilizacion-vehiculos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (movilizacionRes.ok) {
        const movilizacionData = await movilizacionRes.json();
        setMovilizacionData(movilizacionData);
        setGlobalStats(prev => ({
          ...prev,
          movilizaciones: movilizacionData.resumen_global?.total_asignaciones || 0
        }));
      }

      // Cargar datos de reportes ciudadanos
      const reportesRes = await fetch('http://192.168.2.150:8000/reportes-ciudadanos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (reportesRes.ok) {
        const reportesData = await reportesRes.json();
        setReportesData(reportesData);
        setGlobalStats(prev => ({
          ...prev,
          reportes: reportesData.length || 0
        }));
        
        // Actualizar el centro del mapa basado en los reportes
        if (reportesData.length > 0) {
          const validReportes = reportesData.filter((r: any) => r.latitud && r.longitud);
          if (validReportes.length > 0) {
            const latitudes = validReportes.map((r: any) => r.latitud);
            const longitudes = validReportes.map((r: any) => r.longitud);
            
            const centerLat = latitudes.reduce((a: number, b: number) => a + b) / latitudes.length;
            const centerLng = longitudes.reduce((a: number, b: number) => a + b) / longitudes.length;
            
            const latDelta = Math.max(...latitudes) - Math.min(...latitudes);
            const lngDelta = Math.max(...longitudes) - Math.min(...longitudes);
            const maxDelta = Math.max(latDelta, lngDelta);
            
            let zoomDelta = 0.01;
            if (maxDelta > 0.01) {
              zoomDelta = maxDelta * 1.5;
            }
            
            setMapRegion({
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: zoomDelta,
              longitudeDelta: zoomDelta,
            });
          }
        }
      }
      
      setLoading(false);
    } catch (e) {
      setError('Error de conexión o backend: ' + e);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const screenWidth = Dimensions.get('window').width;
  const minCardWidth = 110;
  const maxCardsPerRow = Math.floor(screenWidth / minCardWidth) || 1;
  const cardWidth = (screenWidth - 32 - (maxCardsPerRow - 1) * 8) / maxCardsPerRow;

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

  const getAsistenciaColor = (porcentaje: number) => {
    if (porcentaje >= 80) return '#4CAF50';
    if (porcentaje >= 60) return '#FF9800';
    return '#F44336';
  };

  const getAsistenciaIcon = (porcentaje: number) => {
    if (porcentaje >= 80) return 'trending-up';
    if (porcentaje >= 60) return 'analytics';
    return 'trending-down';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button mode="contained" onPress={loadDashboardData} style={styles.retryButton}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con título */}
      <View style={styles.header}>
        <MaterialIcons name="dashboard" size={28} color="#2196F3" />
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      {/* Estadísticas Globales Mejoradas */}
      <Surface style={styles.card} elevation={4}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="analytics" size={24} color="#2196F3" />
          <Text style={styles.cardTitle}>Estadísticas Globales</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#E3F2FD' }]}>
            <FontAwesome5 name="users" size={20} color="#2196F3" />
            <Text style={styles.statNumber}>{globalStats.personas}</Text>
            <Text style={styles.statLabel}>Personas</Text>
          </View>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#E8F5E8' }]}>
            <FontAwesome5 name="calendar-alt" size={20} color="#4CAF50" />
            <Text style={styles.statNumber}>{globalStats.eventos}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#FFF3E0' }]}>
            <FontAwesome5 name="user-tie" size={20} color="#FF9800" />
            <Text style={styles.statNumber}>{globalStats.lideres}</Text>
            <Text style={styles.statLabel}>Líderes</Text>
          </View>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#F3E5F5' }]}>
            <FontAwesome5 name="map-marker-alt" size={20} color="#9C27B0" />
            <Text style={styles.statNumber}>{globalStats.secciones}</Text>
            <Text style={styles.statLabel}>Secciones</Text>
          </View>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#FFF8E1' }]}>
            <MaterialIcons name="report" size={20} color="#FFC107" />
            <Text style={styles.statNumber}>{globalStats.reportes}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </View>
          <View style={[styles.statCard, { width: cardWidth, backgroundColor: '#E0F2F1' }]}>
            <MaterialIcons name="local-shipping" size={20} color="#009688" />
            <Text style={styles.statNumber}>{globalStats.movilizaciones}</Text>
            <Text style={styles.statLabel}>Movilizaciones</Text>
          </View>
        </View>
      </Surface>

      {/* Mapa de Reportes Ciudadanos */}
      {reportesData && reportesData.length > 0 && (
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="map" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Mapa de Reportes Ciudadanos</Text>
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
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          </View>

          {/* Resumen de Reportes */}
          <View style={styles.reportesSummary}>
            <Text style={styles.summaryTitle}>Resumen de Reportes</Text>
            <View style={styles.reportesStats}>
              {['pendiente', 'en_revision', 'en_progreso', 'resuelto', 'rechazado'].map(estado => {
                const count = reportesData.filter((r: any) => r.estado === estado).length;
                return (
                  <View key={estado} style={styles.reporteStat}>
                    <MaterialIcons 
                      name={getReporteIcon(estado)} 
                      size={16} 
                      color={getReporteColor(estado)} 
                    />
                    <Text style={[styles.reporteCount, { color: getReporteColor(estado) }]}>
                      {count}
                    </Text>
                    <Text style={styles.reporteLabel}>{estado.replace('_', ' ')}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Surface>
      )}

      {/* Reporte de Movilización por Vehículos Mejorado */}
      {movilizacionData && (
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="local-shipping" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Movilización por Vehículos</Text>
            <Button 
              mode="text" 
              onPress={loadDashboardData}
              icon="refresh"
              compact
            >
              Actualizar
            </Button>
          </View>
          
          {/* Resumen Global de Movilización Mejorado */}
          {movilizacionData.resumen_global && (
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryItem, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="directions-car" size={20} color="#2196F3" />
                <Text style={styles.summaryValue}>{movilizacionData.resumen_global.total_vehiculos}</Text>
                <Text style={styles.summaryLabel}>Vehículos</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: '#E8F5E8' }]}>
                <MaterialIcons name="assignment" size={20} color="#4CAF50" />
                <Text style={styles.summaryValue}>{movilizacionData.resumen_global.total_asignaciones}</Text>
                <Text style={styles.summaryLabel}>Asignaciones</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: '#FFF3E0' }]}>
                <MaterialIcons name="people" size={20} color="#FF9800" />
                <Text style={styles.summaryValue}>{movilizacionData.resumen_global.total_asistencias}</Text>
                <Text style={styles.summaryLabel}>Asistencias</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: '#F3E5F5' }]}>
                <MaterialIcons name="trending-up" size={20} color="#9C27B0" />
                <Text style={styles.summaryValue}>{movilizacionData.resumen_global.promedio_asistencia}%</Text>
                <Text style={styles.summaryLabel}>Promedio</Text>
              </View>
            </View>
          )}

          {/* Top Vehículos Mejorado */}
          {movilizacionData?.top_vehiculos && movilizacionData.top_vehiculos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Vehículos por Rendimiento</Text>
              {movilizacionData.top_vehiculos.map((vehiculo: any, index: number) => (
                <Card key={vehiculo.id} style={[styles.vehiculoCard, { borderLeftWidth: 4, borderLeftColor: getAsistenciaColor(vehiculo.porcentaje_asistencia) }]}>
                  <Card.Content>
                    <View style={styles.vehiculoHeader}>
                      <View style={styles.vehiculoInfo}>
                        <MaterialIcons name="directions-car" size={20} color="#2196F3" />
                        <Text style={styles.vehiculoNombre}>{vehiculo.tipo}</Text>
                        <Chip mode="outlined" compact style={styles.rankChip}>
                          #{index + 1}
                        </Chip>
                      </View>
                      <View style={styles.vehiculoStats}>
                        <MaterialIcons 
                          name={getAsistenciaIcon(vehiculo.porcentaje_asistencia)} 
                          size={24} 
                          color={getAsistenciaColor(vehiculo.porcentaje_asistencia)} 
                        />
                        <Text style={[styles.porcentajeAsistencia, { color: getAsistenciaColor(vehiculo.porcentaje_asistencia) }]}>
                          {vehiculo.porcentaje_asistencia}%
                        </Text>
                      </View>
                    </View>
                    
                    {vehiculo.placas && (
                      <Text style={styles.vehiculoPlacas}>Placas: {vehiculo.placas}</Text>
                    )}
                    
                    <View style={styles.vehiculoDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Asignados:</Text>
                        <Text style={styles.detailValue}>{vehiculo.total_asignados}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Asistencias:</Text>
                        <Text style={styles.detailValue}>{vehiculo.total_asistencias}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Movilizados:</Text>
                        <Text style={styles.detailValue}>{vehiculo.movilizados}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Capacidad:</Text>
                        <Text style={styles.detailValue}>{vehiculo.capacidad}</Text>
                      </View>
                    </View>

                    {/* Barra de progreso mejorada */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${vehiculo.porcentaje_asistencia}%`,
                              backgroundColor: getAsistenciaColor(vehiculo.porcentaje_asistencia)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{vehiculo.porcentaje_asistencia}% de asistencia</Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </Surface>
      )}

      {/* Reporte de Asistencias Mejorado */}
      {asistenciasData && (
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="analytics" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Reporte de Asistencias</Text>
            <Button 
              mode="text" 
              onPress={loadDashboardData}
              icon="refresh"
              compact
            >
              Actualizar
            </Button>
          </View>
          
          {/* Resumen Global Mejorado */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryItem, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="assignment" size={20} color="#2196F3" />
              <Text style={styles.summaryValue}>{asistenciasData.resumen_global.total_asignados}</Text>
              <Text style={styles.summaryLabel}>Asignados</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#E8F5E8' }]}>
              <MaterialIcons name="people" size={20} color="#4CAF50" />
              <Text style={styles.summaryValue}>{asistenciasData.resumen_global.total_asistencias}</Text>
              <Text style={styles.summaryLabel}>Asistencias</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="trending-up" size={20} color="#FF9800" />
              <Text style={styles.summaryValue}>{asistenciasData.resumen_global.promedio_asistencia}%</Text>
              <Text style={styles.summaryLabel}>Promedio</Text>
            </View>
          </View>

          {/* Lista de Eventos Mejorada */}
          {!asistenciasData?.eventos || asistenciasData.eventos.length === 0 ? (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="event-busy" size={48} color="#ccc" />
              <Text style={styles.noData}>No hay eventos activos con asistencias</Text>
            </View>
          ) : (
            asistenciasData.eventos.map((evento: any, index: number) => (
              <Card key={evento.id} style={[styles.eventoCard, { borderLeftWidth: 4, borderLeftColor: getAsistenciaColor(evento.porcentaje_asistencia) }]}>
                <Card.Content>
                  <View style={styles.eventoHeader}>
                    <View style={styles.eventoInfo}>
                      <Text style={styles.eventoNombre}>{evento.nombre}</Text>
                      <Text style={styles.eventoFecha}>{formatDate(evento.fecha)}</Text>
                      <Chip mode="outlined" compact style={styles.eventoChip}>
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
                  
                  <View style={styles.eventoDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Asignados:</Text>
                      <Text style={styles.detailValue}>{evento.total_asignados}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Presentes:</Text>
                      <Text style={styles.detailValue}>{evento.total_asistencias}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Movilizados:</Text>
                      <Text style={styles.detailValue}>{evento.movilizados} ({evento.porcentaje_movilizacion}%)</Text>
                    </View>
                  </View>

                  {/* Barra de progreso visual mejorada */}
                  <View style={styles.progressContainer}>
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
                    <Text style={styles.progressText}>{evento.porcentaje_asistencia}% de asistencia</Text>
                  </View>

                  {/* Últimas asistencias mejoradas */}
                  {evento?.ultimas_asistencias && evento.ultimas_asistencias.length > 0 && (
                    <View style={styles.ultimasAsistencias}>
                      <Text style={styles.ultimasTitle}>Últimas asistencias:</Text>
                      {evento.ultimas_asistencias.map((asistencia: any, idx: number) => (
                        <View key={idx} style={styles.ultimaAsistencia}>
                          <MaterialIcons 
                            name={asistencia.movilizado ? "directions-car" : "person"} 
                            size={16} 
                            color={asistencia.movilizado ? "#4CAF50" : "#FF9800"} 
                          />
                          <Text style={styles.ultimaHora}>
                            {asistencia.hora_checkin ? formatDate(asistencia.hora_checkin) : 'Sin hora'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </Surface>
      )}

      {/* Rankings Mejorados */}
      <Surface style={styles.card} elevation={4}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="leaderboard" size={24} color="#2196F3" />
          <Text style={styles.cardTitle}>Rankings</Text>
        </View>
        <View style={styles.rankingsContainer}>
          <View style={styles.rankingSection}>
            <Text style={styles.rankingTitle}>Top Secciones</Text>
            {topSecciones.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.rankingItem}>
                <View style={[styles.rankingNumber, { backgroundColor: index < 3 ? '#FFD700' : '#E0E0E0' }]}>
                  <Text style={[styles.rankingNumberText, { color: index < 3 ? '#000' : '#666' }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.rankingText}>{item.seccion}</Text>
                <Text style={styles.rankingValue}>{item.total}</Text>
              </View>
            ))}
          </View>
          <Divider style={styles.divider} />
          <View style={styles.rankingSection}>
            <Text style={styles.rankingTitle}>Top Líderes</Text>
            {topLideres.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.rankingItem}>
                <View style={[styles.rankingNumber, { backgroundColor: index < 3 ? '#FFD700' : '#E0E0E0' }]}>
                  <Text style={[styles.rankingNumberText, { color: index < 3 ? '#000' : '#666' }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.rankingText}>{item.nombre}</Text>
                <Text style={styles.rankingValue}>{item.total}</Text>
              </View>
            ))}
          </View>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 200,
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
  reportesSummary: {
    marginTop: 10,
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
    fontSize: 16,
  },
  reportesStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reporteStat: {
    alignItems: 'center',
  },
  reporteCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  reporteLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    width: '100%',
  },
  summaryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 70,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 4,
  },
  section: {
    width: '100%',
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
    fontSize: 16,
  },
  vehiculoCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  vehiculoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehiculoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehiculoNombre: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  rankChip: {
    marginLeft: 8,
  },
  vehiculoStats: {
    alignItems: 'center',
  },
  vehiculoPlacas: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  vehiculoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  eventoCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  eventoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoNombre: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 16,
  },
  eventoFecha: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  eventoChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  eventoStats: {
    alignItems: 'center',
  },
  porcentajeAsistencia: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  ultimasAsistencias: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ultimasTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    fontSize: 14,
  },
  ultimaAsistencia: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ultimaHora: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
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
  rankingsContainer: {
    width: '100%',
  },
  rankingSection: {
    marginBottom: 15,
  },
  rankingTitle: {
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
    fontSize: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  rankingNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankingNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankingText: {
    flex: 1,
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  rankingValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
    fontSize: 14,
  },
  divider: {
    marginVertical: 15,
    backgroundColor: '#e0e0e0',
  },
}); 