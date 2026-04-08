import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDynamicTabs } from '../../hooks/useDynamicTabs';
import { usePermissionsContext } from '../../src/contexts/PermissionsContext';
import { api } from '../../src/api';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ personas: 0, eventos: 0, asistencias: 0 });
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refetch: refetchPermissions } = useDynamicTabs(user?.rol);
  const { triggerRefresh } = usePermissionsContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [personasData, eventosData, asistenciasData, noticiasData] = await Promise.all([
        api.get('/reportes/personas').catch(() => null),
        api.get('/reportes/eventos?historicos=false').catch(() => null),
        api.get('/reportes/asistencias-tiempo-real').catch(() => null),
        api.get('/noticias').catch(() => null),
      ]);
      setStats({
        personas: personasData?.total_personas || 0,
        eventos: eventosData?.total_eventos || 0,
        asistencias: asistenciasData?.total_asistencias || 0,
      });
      if (Array.isArray(noticiasData)) {
        setNoticias(noticiasData.slice(0, 3));
      }
    } catch {
      // stats remain 0
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3949ab" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* Tarjeta de usuario */}
      <Surface style={styles.userCard} elevation={3}>
        <View style={styles.userCardRow}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userCardName}>{user?.nombre || 'Usuario'}</Text>
            <Text style={styles.userCardRole}>{user?.rol || 'Rol'}</Text>
            <Text style={styles.userCardDate}>{today}</Text>
          </View>
        </View>
        <View style={styles.userCardButtonsRow}>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <FontAwesome5 name="user-cog" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.profileButtonText}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <FontAwesome5 name="sign-out-alt" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Resumen rápido — fila plana */}
      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Resumen Rápido</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="users" size={20} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.personas.toLocaleString('es-MX')}</Text>
            <Text style={styles.statLabel}>Personas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome5 name="calendar-alt" size={20} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.eventos.toLocaleString('es-MX')}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome5 name="check-circle" size={20} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.asistencias.toLocaleString('es-MX')}</Text>
            <Text style={styles.statLabel}>Asistencias</Text>
          </View>
        </View>
      </Surface>

      {/* Accesos rápidos */}
      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Accesos Rápidos</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/register')}>
            <View style={[styles.iconContainer, { backgroundColor: '#3949ab' }]}>
              <FontAwesome5 name="user-plus" size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Registrar{'\n'}Persona</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/reassign')}>
            <View style={[styles.iconContainer, { backgroundColor: '#7b1fa2' }]}>
              <FontAwesome5 name="exchange-alt" size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Reasignar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/pase-lista')}>
            <View style={[styles.iconContainer, { backgroundColor: '#00796b' }]}>
              <FontAwesome5 name="check-square" size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Pase de{'\n'}Lista</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.instructionText}>
          Usa la barra de navegación inferior para todas las funciones de tu perfil.
        </Text>
      </Surface>

      {/* Últimas noticias */}
      {noticias.length > 0 && (
        <Surface style={styles.card} elevation={2}>
          <Text style={styles.cardTitle}>Últimas Noticias</Text>
          {noticias.map((n: any, i: number) => (
            <View key={n.id || i} style={[styles.noticiaItem, i < noticias.length - 1 && styles.noticiaItemBorder]}>
              <FontAwesome5 name="newspaper" size={14} color="#3949ab" style={{ marginTop: 2, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticiaTitulo} numberOfLines={2}>{n.titulo}</Text>
                <Text style={styles.noticiaFecha}>
                  {n.fecha_publicacion ? new Date(n.fecha_publicacion).toLocaleDateString('es-MX') : ''}
                </Text>
              </View>
            </View>
          ))}
        </Surface>
      )}

      {/* Administración */}
      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Administración</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={async () => {
            await refetchPermissions();
            loadData();
            triggerRefresh();
          }}
        >
          <FontAwesome5 name="sync-alt" size={14} color="#fff" />
          <Text style={styles.refreshButtonText}>Actualizar Permisos</Text>
        </TouchableOpacity>
        <Text style={styles.instructionText}>
          Presiona si cambiaste permisos en la web y quieres aplicarlos en la app.
        </Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f8',
    padding: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 14,
  },
  // User card
  userCard: {
    backgroundColor: '#1a237e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userCardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  userCardRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'capitalize',
    marginTop: 1,
  },
  userCardDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
    textTransform: 'capitalize',
  },
  userCardButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#e8eaf6',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  // Quick actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  quickActionButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    color: '#3949ab',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 15,
  },
  instructionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Noticias
  noticiaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  noticiaItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noticiaTitulo: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },
  noticiaFecha: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 3,
  },
  // Refresh button
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
