import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_CONFIG } from '../../src/config';
import { COLORS, FONTS, RADIUS, SHADOW, TIPO_REPORTE } from '../../src/theme';

const BASE = SERVER_CONFIG.BASE_URL;

interface Noticia { id: number; titulo: string; contenido: string; fecha_publicacion: string; imagen_url?: string; }
interface StatsReporte { resumen?: { total: number; pendientes: number; resueltos: number } }

export default function PublicHome() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [stats, setStats] = useState<StatsReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [nRes, sRes] = await Promise.all([
        fetch(`${BASE}/noticias/?limit=5`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${BASE}/reportes-ciudadanos/estadisticas-mapa`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setNoticias(Array.isArray(nRes) ? nRes : []);
      setStats(sRes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const statCards = [
    { label: 'Total Reportes', val: stats?.resumen?.total ?? 0, icon: 'megaphone', color: COLORS.primary },
    { label: 'Pendientes', val: stats?.resumen?.pendientes ?? 0, icon: 'time', color: COLORS.warning },
    { label: 'Resueltos', val: stats?.resumen?.resueltos ?? 0, icon: 'checkmark-circle', color: COLORS.success },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCircle} />
        <View>
          <Text style={styles.headerSub}>Bienvenido a</Text>
          <Text style={styles.headerTitle}>LideraRed Ciudadano</Text>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/(public)/nuevo-reporte' as any)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.reportBtnText}>Reportar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Stats */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reportes ciudadanos</Text>
            <View style={styles.statsRow}>
              {statCards.map(s => (
                <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                  </View>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué necesitas?</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'Hacer un reporte', icon: 'megaphone-outline', color: COLORS.primary, route: '/(public)/nuevo-reporte' },
              { label: 'Ver noticias', icon: 'newspaper-outline', color: '#7c3aed', route: '/(public)/noticias' },
              { label: 'Seguir mi reporte', icon: 'search-outline', color: COLORS.success, route: '/(public)/mis-reportes' },
              { label: 'Mapa de reportes', icon: 'map-outline', color: COLORS.warning, route: '/(public)/mapa-reportes' },
            ].map(a => (
              <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route as any)} activeOpacity={0.8}>
                <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                  <Ionicons name={a.icon as any} size={26} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Noticias recientes */}
        {noticias.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimas Noticias</Text>
              <TouchableOpacity onPress={() => router.push('/(public)/noticias' as any)}>
                <Text style={styles.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            {noticias.slice(0, 3).map(n => (
              <View key={n.id} style={styles.noticiaCard}>
                <View style={styles.noticiaContent}>
                  <Text style={styles.noticiaTitle} numberOfLines={2}>{n.titulo}</Text>
                  <Text style={styles.noticiaBody} numberOfLines={2}>{n.contenido?.replace(/<[^>]+>/g, '')}</Text>
                  <Text style={styles.noticiaDate}>
                    {new Date(n.fecha_publicacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                {n.imagen_url && (
                  <Image source={{ uri: `${BASE}${n.imagen_url}` }} style={styles.noticiaImg} />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.navyMid,
    paddingTop: 52, paddingBottom: 24, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  headerTitle: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  reportBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sm },

  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  seeAll: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: 14, alignItems: 'center', borderTopWidth: 3,
    ...SHADOW.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statVal: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center', gap: 10, ...SHADOW.sm,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

  noticiaCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 10, flexDirection: 'row',
    gap: 12, ...SHADOW.sm,
  },
  noticiaContent: { flex: 1 },
  noticiaTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  noticiaBody: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 6 },
  noticiaDate: { fontSize: FONTS.xs, color: COLORS.textMuted },
  noticiaImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.bg },
});
