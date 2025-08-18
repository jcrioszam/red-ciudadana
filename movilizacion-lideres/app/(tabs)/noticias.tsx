import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { Surface, Title, Card, Button, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';

interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  fecha_publicacion: string;
  fecha_actualizacion: string;
  autor_id: number;
  autor_nombre: string;
  tipo: string;
  activo: boolean;
  likes: number;
  compartidos: number;
}

export default function NoticiasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  // Cargar noticias al montar el componente
  useEffect(() => {
    loadNoticias();
  }, [selectedTipo]);

  const loadNoticias = async () => {
    try {
      setLoading(true);
      const params = selectedTipo ? `?tipo=${selectedTipo}` : '';
      const response = await api.get(`/noticias/${params}`);
      setNoticias(response);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
      Alert.alert('Error', 'No se pudieron cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNoticias();
    setRefreshing(false);
  };

  const handleLike = async (noticiaId: number) => {
    try {
      await api.post(`/noticias/${noticiaId}/like`);
      // Recargar noticias para actualizar likes
      loadNoticias();
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleCompartir = async (noticiaId: number) => {
    try {
      await api.post(`/noticias/${noticiaId}/compartir`);
      // Recargar noticias para actualizar compartidos
      loadNoticias();
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX');
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      'general': '#2196F3',
      'importante': '#F44336',
      'evento': '#4CAF50',
      'aviso': '#FF9800'
    };
    return colors[tipo as keyof typeof colors] || colors.general;
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      'general': 'newspaper',
      'importante': 'exclamation-triangle',
      'evento': 'calendar-alt',
      'aviso': 'bullhorn'
    };
    return icons[tipo as keyof typeof icons] || 'newspaper';
  };

  const canCreateNoticias = ['admin', 'lider_estatal', 'lider_municipal', 'lider_zona'].includes(user?.rol || '');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome5 name="newspaper" size={48} color="#1a237e" style={styles.headerIcon} />
        <Title style={styles.title}>Noticias y Avisos</Title>
        <Text style={styles.subtitle}>Mantente informado de las últimas novedades</Text>
      </View>

      {/* Filtros */}
      <Surface style={styles.filtersCard} elevation={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <Chip
            selected={selectedTipo === null}
            onPress={() => setSelectedTipo(null)}
            style={[styles.filterChip, selectedTipo === null && styles.selectedFilterChip]}
            textStyle={styles.filterChipText}
          >
            Todas
          </Chip>
          <Chip
            selected={selectedTipo === 'general'}
            onPress={() => setSelectedTipo('general')}
            style={[styles.filterChip, selectedTipo === 'general' && styles.selectedFilterChip]}
            textStyle={styles.filterChipText}
          >
            General
          </Chip>
          <Chip
            selected={selectedTipo === 'importante'}
            onPress={() => setSelectedTipo('importante')}
            style={[styles.filterChip, selectedTipo === 'importante' && styles.selectedFilterChip]}
            textStyle={styles.filterChipText}
          >
            Importante
          </Chip>
          <Chip
            selected={selectedTipo === 'evento'}
            onPress={() => setSelectedTipo('evento')}
            style={[styles.filterChip, selectedTipo === 'evento' && styles.selectedFilterChip]}
            textStyle={styles.filterChipText}
          >
            Eventos
          </Chip>
          <Chip
            selected={selectedTipo === 'aviso'}
            onPress={() => setSelectedTipo('aviso')}
            style={[styles.filterChip, selectedTipo === 'aviso' && styles.selectedFilterChip]}
            textStyle={styles.filterChipText}
          >
            Avisos
          </Chip>
        </ScrollView>
      </Surface>

      {/* Lista de noticias */}
      <ScrollView 
        style={styles.noticiasContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loading} size="large" color="#1a237e" />
        ) : noticias.length > 0 ? (
          noticias.map(noticia => (
            <Card key={noticia.id} style={styles.noticiaCard} elevation={3}>
              <Card.Content>
                {/* Header de la noticia */}
                <View style={styles.noticiaHeader}>
                  <View style={styles.autorInfo}>
                    <FontAwesome5 
                      name="user-circle" 
                      size={24} 
                      color="#666" 
                      style={styles.autorIcon}
                    />
                    <View>
                      <Text style={styles.autorNombre}>{noticia.autor_nombre}</Text>
                      <Text style={styles.fechaPublicacion}>
                        {formatDate(noticia.fecha_publicacion)}
                      </Text>
                    </View>
                  </View>
                  <Chip
                    style={[styles.tipoChip, { backgroundColor: getTipoColor(noticia.tipo) }]}
                    textStyle={styles.tipoChipText}
                  >
                    <FontAwesome5 name={getTipoIcon(noticia.tipo)} size={12} color="white" />
                    {' '}{noticia.tipo.toUpperCase()}
                  </Chip>
                </View>

                {/* Contenido de la noticia */}
                <Title style={styles.noticiaTitulo}>{noticia.titulo}</Title>
                <Text style={styles.noticiaContenido}>{noticia.contenido}</Text>

                {/* Imagen si existe */}
                {noticia.imagen_url && (
                  <Image 
                    source={{ uri: noticia.imagen_url }} 
                    style={styles.noticiaImagen}
                    resizeMode="cover"
                  />
                )}

                {/* Acciones */}
                <View style={styles.accionesContainer}>
                  <TouchableOpacity 
                    style={styles.accionButton}
                    onPress={() => handleLike(noticia.id)}
                  >
                    <FontAwesome5 name="heart" size={16} color="#e91e63" />
                    <Text style={styles.accionText}>{noticia.likes}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.accionButton}
                    onPress={() => handleCompartir(noticia.id)}
                  >
                    <FontAwesome5 name="share" size={16} color="#2196f3" />
                    <Text style={styles.accionText}>{noticia.compartidos}</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="newspaper" size={64} color="#ccc" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No hay noticias</Text>
            <Text style={styles.emptySubtitle}>
              {selectedTipo 
                ? `No hay noticias de tipo "${selectedTipo}"`
                : 'Aún no se han publicado noticias'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB para crear noticia */}
      {canCreateNoticias && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => router.push('/crear-noticia')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  filtersCard: {
    margin: 10,
    padding: 10,
    backgroundColor: 'white',
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedFilterChip: {
    backgroundColor: '#1a237e',
  },
  filterChipText: {
    color: '#333',
  },
  noticiasContainer: {
    flex: 1,
    padding: 10,
  },
  loading: {
    marginTop: 50,
  },
  noticiaCard: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  noticiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  autorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autorIcon: {
    marginRight: 10,
  },
  autorNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  fechaPublicacion: {
    fontSize: 12,
    color: '#666',
  },
  tipoChip: {
    height: 24,
  },
  tipoChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noticiaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noticiaContenido: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  noticiaImagen: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  accionesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  accionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  accionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a237e',
  },
}); 