import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Dimensions
} from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Chip, Divider, ProgressBar } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../src/api';

const { width } = Dimensions.get('window');

const ReportesCiudadanos = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando reportes ciudadanos...');
      
      let params = '';
      
      console.log('📡 Endpoint:', `/reportes-ciudadanos${params}`);
      
      if (!api || !api.get) {
        console.error('❌ API no está disponible');
        Alert.alert('Error', 'Error de configuración de la API');
        return;
      }
      
      const response = await api.get(`/reportes-ciudadanos${params}`);
      console.log('✅ Reportes cargados:', response);
      setReportes(response || []);
    } catch (error) {
      console.error('❌ Error al cargar reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes. Verifica tu conexión.');
      setReportes([]);
    } finally {
      setLoading(false);
    }
  };

  const getTipoInfo = (tipo: string) => {
    const tipos: { [key: string]: { icon: string; color: string; label: string } } = {
      'baches': { icon: 'construct', color: '#FF5722', label: 'Baches' },
      'iluminacion': { icon: 'bulb', color: '#FFC107', label: 'Iluminación' },
      'salud': { icon: 'medical', color: '#E91E63', label: 'Salud' },
      'seguridad': { icon: 'shield', color: '#F44336', label: 'Seguridad' },
      'agua': { icon: 'water', color: '#2196F3', label: 'Agua' },
      'drenaje': { icon: 'water', color: '#795548', label: 'Drenaje' },
      'basura': { icon: 'trash', color: '#4CAF50', label: 'Basura' },
      'parques': { icon: 'leaf', color: '#8BC34A', label: 'Parques' },
      'semaforos': { icon: 'traffic-light', color: '#FF9800', label: 'Semáforos' },
      'otros': { icon: 'document', color: '#9C27B0', label: 'Otros' }
    };
    return tipos[tipo] || tipos.otros;
  };

  const getEstadoInfo = (estado: string) => {
    const estados: { [key: string]: { icon: string; color: string; label: string } } = {
      'pendiente': { icon: 'time', color: '#FF9800', label: 'Pendiente' },
      'en_revision': { icon: 'eye', color: '#2196F3', label: 'En Revisión' },
      'en_progreso': { icon: 'construct', color: '#FFC107', label: 'En Progreso' },
      'resuelto': { icon: 'checkmark-circle', color: '#4CAF50', label: 'Resuelto' },
      'rechazado': { icon: 'close-circle', color: '#F44336', label: 'Rechazado' }
    };
    return estados[estado] || estados.pendiente;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReporte = (reporte: any) => {
    const tipoInfo = getTipoInfo(reporte.tipo);
    const estadoInfo = getEstadoInfo(reporte.estado);

    return (
      <Card key={reporte.id} style={styles.reporteCard}>
        <Card.Content>
          <View style={styles.reporteHeader}>
            <View style={styles.reporteIconContainer}>
              <Ionicons 
                name={tipoInfo.icon as any} 
                size={24} 
                color={tipoInfo.color} 
              />
            </View>
            <View style={styles.reporteInfo}>
              <Title style={styles.reporteTitulo}>{reporte.titulo}</Title>
              <Paragraph style={styles.reporteFecha}>
                {formatDate(reporte.fecha_creacion)}
              </Paragraph>
            </View>
            <View style={styles.estadoContainer}>
              <Ionicons 
                name={estadoInfo.icon as any} 
                size={16} 
                color={estadoInfo.color} 
              />
              <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
                {estadoInfo.label}
              </Text>
            </View>
          </View>

          <Paragraph style={styles.reporteDescripcion}>{reporte.descripcion}</Paragraph>

          {reporte.direccion && (
            <View style={styles.ubicacionContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.ubicacionText}>{reporte.direccion}</Text>
            </View>
          )}

          {reporte.foto_url && (
            <Image 
              source={{ uri: reporte.foto_url }} 
              style={styles.reporteImage}
              resizeMode="cover"
            />
          )}

          {reporte.observaciones_admin && (
            <View style={styles.observacionesContainer}>
              <Text style={styles.observacionesTitle}>Observaciones:</Text>
              <Text style={styles.observacionesText}>{reporte.observaciones_admin}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Reportes Ciudadanos</Text>
        <Text style={styles.headerSubtitle}>Sistema de reportes comunitarios</Text>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosContainer}>
        <Chip icon="filter-list" style={styles.filtroChip}>
          <Text style={styles.filtroText}>Todos</Text>
        </Chip>
        <Chip icon="filter-list" style={styles.filtroChip}>
          <Text style={styles.filtroText}>Pendientes</Text>
        </Chip>
        <Chip icon="filter-list" style={styles.filtroChip}>
          <Text style={styles.filtroText}>En Revisión</Text>
        </Chip>
        <Chip icon="filter-list" style={styles.filtroChip}>
          <Text style={styles.filtroText}>Resueltos</Text>
        </Chip>
      </ScrollView>

      {/* Lista de reportes */}
      <ScrollView style={styles.reportesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando reportes...</Text>
          </View>
        ) : reportes.length > 0 ? (
          reportes.map(renderReporte)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay reportes</Text>
            <Text style={styles.emptySubtitle}>
              Aún no se han creado reportes ciudadanos
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  filtrosContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  filtroChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filtroText: {
    color: '#666',
    fontSize: 14,
  },
  reportesContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  reporteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reporteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reporteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reporteInfo: {
    flex: 1,
  },
  reporteTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reporteFecha: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  estadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reporteDescripcion: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  ubicacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ubicacionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  reporteImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  observacionesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  observacionesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  observacionesText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ReportesCiudadanos; 
