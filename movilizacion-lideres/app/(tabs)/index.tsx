import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface StatCard { label: string; val: number | string; icon: IoniconName; color: string }

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  presidente: 'Presidente',
  lider_estatal: 'Líder Estatal',
  lider_regional: 'Líder Regional',
  lider_municipal: 'Líder Municipal',
  lider_zona: 'Líder de Zona',
  capturista: 'Capturista',
  movilizador: 'Movilizador',
  ciudadano: 'Ciudadano',
};

export default function PrivateHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [personas, setPersonas] = useState(0);
  const [eventos, setEventos] = useState(0);
  const [asistencias, setAsistencias] = useState(0);
  const [misMovilizaciones, setMisMovilizaciones] = useState<any[]>([]);
  const [noticias, setNoticias] = useState<any[]>([]);

  const load = async () => {
    try {
      const [pRes, eRes, aRes, mvRes, nRes] = await Promise.allSettled([
        api.get('/reportes/personas'),
        api.get('/reportes/eventos?historicos=false'),
        api.get('/reportes/asistencias-tiempo-real'),
        api.get('/movilizaciones/mis-vehiculos'),
        api.get('/noticias/?limit=3'),
      ]);
      if (pRes.status === 'fulfilled') setPersonas((pRes.value as any)?.total_personas ?? 0);
      if (eRes.status === 'fulfilled') setEventos((eRes.value as any)?.total_eventos ?? 0);
      if (aRes.status === 'fulfilled') setAsistencias((aRes.value as any)?.total_asistencias ?? 0);
      if (mvRes.status === 'fulfilled') setMisMovilizaciones(Array.isArray(mvRes.value) ? mvRes.value as any[] : []);
      if (nRes.status === 'fulfilled') setNoticias(Array.isArray(nRes.value) ? (nRes.value as any[]).slice(0, 2) : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const stats: StatCard[] = [
    { label: 'Personas', val: personas, icon: 'people', color: COLORS.primary },
    { label: 'Eventos', val: eventos, icon: 'calendar', color: '#7c3aed' },
    { label: 'Asistencias', val: asistencias, icon: 'checkmark-circle', color: COLORS.success },
  ];

  const quickActions = [
    { label: 'Registrar', icon: 'person-add-outline' as IoniconName, route: '/register', color: '#f97316', perm: 'register' },
    { label: 'Check-in', icon: 'checkbox-outline' as IoniconName, route: '/pase-lista', color: COLORS.success, perm: 'pase-lista' },
    { label: 'Noticias', icon: 'newspaper-outline' as IoniconName, route: '/noticias', color: '#0ea5e9', perm: 'noticias' },
    { label: 'Reportes', icon: 'megaphone-outline' as IoniconName, route: '/reportes-ciudadanos', color: '#ef4444', perm: 'reportes_ciudadanos' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerTop}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{(user?.nombre || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola, {user?.nombre?.split(' ')[0]}</Text>
            <Text style={styles.role}>{ROL_LABEL[user?.rol ?? ''] ?? user?.rol}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/noticias' as any)}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>{today}</Text>

        {/* Stats dentro del header */}
        {!loading && (
          <View style={styles.statsRow}>
            {stats.map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statVal}>{typeof s.val === 'number' ? s.val.toLocaleString('es-MX') : s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {/* Acciones rápidas */}
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(a => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                  <Ionicons name={a.icon} size={26} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mis movilizaciones asignadas */}
          {misMovilizaciones.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Mis Movilizaciones</Text>
              {misMovilizaciones.map((mv, i) => {
                const pct = mv.porcentaje ?? 0;
                const barColor = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.primary;
                const badge = mv.en_curso
                  ? { label: 'En curso', color: COLORS.success, bg: COLORS.successLight }
                  : { label: 'Próximo', color: COLORS.primary, bg: '#dbeafe' };
                return (
                  <View key={i} style={styles.movCard}>
                    <View style={styles.movTop}>
                      <View style={styles.movLeft}>
                        <View style={styles.movIcon}>
                          <Ionicons name="car" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                          <Text style={styles.movVehiculo}>{mv.vehiculo_tipo}{mv.vehiculo_placas ? ` (${mv.vehiculo_placas})` : ''}</Text>
                          <Text style={styles.movEvento}>{mv.evento_nombre}</Text>
                        </View>
                      </View>
                      <View style={[styles.movBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.movBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    {/* Progreso */}
                    <View style={styles.movProgress}>
                      <Text style={styles.movProgressLabel}>
                        {mv.presentes}/{mv.total_personas} presentes · {pct}%
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressBar, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                    <TouchableOpacity style={styles.movBtn} onPress={() => router.push('/pase-lista' as any)} activeOpacity={0.85}>
                      <Ionicons name="checkbox-outline" size={15} color="#fff" />
                      <Text style={styles.movBtnText}>Ir a Check-in</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}

          {/* Noticias recientes */}
          {noticias.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Noticias</Text>
                <TouchableOpacity onPress={() => router.push('/noticias' as any)}>
                  <Text style={styles.seeAll}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              {noticias.map((n: any) => (
                <View key={n.id} style={styles.noticiaCard}>
                  <Text style={styles.noticiaTitle} numberOfLines={2}>{n.titulo}</Text>
                  <Text style={styles.noticiaDate}>
                    {new Date(n.fecha_publicacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: COLORS.navyMid,
    paddingTop: 52, paddingHorizontal: 20,
    paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40,
  },
  headerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 30,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: FONTS.lg },
  greeting: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  role: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.65)', textTransform: 'capitalize' },
  notifBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  dateText: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.55)', marginBottom: 16, textTransform: 'capitalize' },

  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg, padding: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: RADIUS.xl,
    padding: 16, alignItems: 'center', gap: 10, ...SHADOW.sm,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text },

  movCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 16,
    marginBottom: 12, ...SHADOW.sm,
  },
  movTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  movLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  movIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  movVehiculo: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  movEvento: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  movBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  movBadgeText: { fontSize: FONTS.xs, fontWeight: '700' },
  movProgress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  movProgressLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  progressBg: { height: 6, backgroundColor: COLORS.bg, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
  movBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 9, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  movBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },

  noticiaCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', ...SHADOW.sm,
  },
  noticiaTitle: { flex: 1, fontSize: FONTS.base, fontWeight: '600', color: COLORS.text, marginRight: 10 },
  noticiaDate: { fontSize: FONTS.xs, color: COLORS.textMuted },
});
