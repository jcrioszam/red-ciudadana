import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_CONFIG } from '../../src/config';
import { COLORS, FONTS, RADIUS, SHADOW, TIPO_REPORTE } from '../../src/theme';

const BASE = SERVER_CONFIG.BASE_URL;

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return `${BASE}${raw}`;
  try { const { pathname } = new URL(raw); return `${BASE}${pathname}`; }
  catch { return null; }
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendiente:    { label: 'Pendiente',    color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline' },
  en_revision:  { label: 'En Revisión',  color: '#3b82f6', bg: '#dbeafe', icon: 'eye-outline' },
  en_progreso:  { label: 'En Progreso',  color: '#8b5cf6', bg: '#ede9fe', icon: 'construct-outline' },
  resuelto:     { label: 'Resuelto',     color: '#10b981', bg: '#d1fae5', icon: 'checkmark-circle-outline' },
  rechazado:    { label: 'Rechazado',    color: '#ef4444', bg: '#fee2e2', icon: 'close-circle-outline' },
};

export default function MisReportes() {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState('');

  const buscar = async () => {
    const q = busqueda.trim();
    if (!q) { setError('Ingresa un folio o número de reporte'); return; }
    setError('');
    setLoading(true);
    setBuscado(false);
    try {
      const id = Number(q.replace(/^RC-/i, '').trim());
      if (isNaN(id) || id <= 0) { setError('Ingresa el número de reporte (ej: 42 o RC-42)'); return; }
      const res = await fetch(`${BASE}/reportes-publicos?limit=500`);
      if (!res.ok) throw new Error();
      const todos = await res.json();
      const arr: any[] = Array.isArray(todos) ? todos : [];
      const encontrado = arr.find(r => r.id === id);
      setReportes(encontrado ? [encontrado] : []);
      setBuscado(true);
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="search" size={22} color="#fff" />
          <View>
            <Text style={styles.headerTitle}>Seguimiento de Reportes</Text>
            <Text style={styles.headerSub}>Consulta el estado de tus reportes</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Buscador */}
          <View style={styles.searchCard}>
            <Text style={styles.searchTitle}>Buscar reporte</Text>
            <Text style={styles.searchSub}>Ingresa el número de reporte que recibiste (ej: 42 o RC-42)</Text>
            <View style={styles.searchRow}>
              <View style={styles.inputBox}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Folio o número de reporte"
                  placeholderTextColor={COLORS.textMuted}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  returnKeyType="search"
                  onSubmitEditing={buscar}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.btnBuscar} onPress={buscar} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Resultados */}
          {buscado && reportes.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No encontrado</Text>
              <Text style={styles.emptyText}>No se encontró ningún reporte con ese folio</Text>
            </View>
          )}

          {reportes.map(r => {
            const est = ESTADO_CONFIG[r.estado] ?? ESTADO_CONFIG.pendiente;
            const tipo = TIPO_REPORTE[r.tipo];
            const fotoUrl = normalizeUrl(r.fotos?.[0]?.url ?? r.foto_url ?? null);
            return (
              <View key={r.id} style={styles.reporteCard}>
                {/* Foto */}
                {fotoUrl && (
                  <Image
                    source={{ uri: fotoUrl }}
                    style={styles.reporteFoto}
                    resizeMode="cover"
                  />
                )}
                {/* Contenido con padding */}
                <View style={styles.reporteBody}>
                {/* Top */}
                <View style={styles.reporteTop}>
                  <View style={[styles.tipoBadge, { backgroundColor: (tipo?.color ?? '#64748b') + '18' }]}>
                    <Ionicons name={(tipo?.icon ?? 'ellipsis-horizontal') as any} size={13} color={tipo?.color ?? '#64748b'} />
                    <Text style={[styles.tipoText, { color: tipo?.color ?? '#64748b' }]}>{tipo?.label ?? r.tipo}</Text>
                  </View>
                  <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                    <Ionicons name={est.icon as any} size={12} color={est.color} />
                    <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                  </View>
                </View>

                {/* Folio */}
                {r.folio && (
                  <View style={styles.folioRow}>
                    <Text style={styles.folioLabel}>Folio:</Text>
                    <Text style={styles.folioVal}>{r.folio}</Text>
                  </View>
                )}

                <Text style={styles.reporteTitulo}>{r.titulo}</Text>
                <Text style={styles.reporteDesc} numberOfLines={3}>{r.descripcion}</Text>

                {/* Timeline */}
                <View style={styles.timeline}>
                  <TimelineItem icon="calendar-outline" label="Registrado" date={fmtDate(r.fecha_creacion)} />
                  {r.fecha_actualizacion && r.fecha_actualizacion !== r.fecha_creacion && (
                    <TimelineItem icon="refresh-outline" label="Actualizado" date={fmtDate(r.fecha_actualizacion)} />
                  )}
                  {r.fecha_resolucion && (
                    <TimelineItem icon="checkmark-circle-outline" label="Resuelto" date={fmtDate(r.fecha_resolucion)} color={COLORS.success} />
                  )}
                </View>

                {/* Observaciones del admin */}
                {r.observaciones_admin && (
                  <View style={styles.obsBox}>
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.obsText}>{r.observaciones_admin}</Text>
                  </View>
                )}
                </View>{/* /reporteBody */}
              </View>
            );
          })}

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Si no recuerdas tu folio, envía un correo a contacto@redciudadana.mx con tu nombre y dirección del reporte.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function TimelineItem({ icon, label, date, color }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <Ionicons name={icon} size={13} color={color ?? COLORS.textMuted} />
      <Text style={{ fontSize: FONTS.xs, color: color ?? COLORS.textMuted }}>
        <Text style={{ fontWeight: '600' }}>{label}: </Text>{date}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.navyMid, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 24, gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.65)' },

  content: { padding: 20, gap: 14 },

  searchCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 20, ...SHADOW.md,
  },
  searchTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  searchSub: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 48,
  },
  input: { flex: 1, fontSize: FONTS.base, color: COLORS.text },
  btnBuscar: {
    width: 48, height: 48, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.sm,
    padding: 10, marginTop: 10,
  },
  errorText: { fontSize: FONTS.sm, color: COLORS.error },

  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center' },

  reporteCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm,
  },
  reporteFoto: {
    width: '100%', height: 180, backgroundColor: COLORS.bg,
  },
  reporteBody: { padding: 18 },
  reporteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tipoText: { fontSize: FONTS.xs, fontWeight: '700' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  estadoText: { fontSize: FONTS.xs, fontWeight: '700' },

  folioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  folioLabel: { fontSize: FONTS.xs, color: COLORS.textMuted },
  folioVal: { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },

  reporteTitulo: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  reporteDesc: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 },

  timeline: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 10, marginBottom: 8 },

  obsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#eff6ff', borderRadius: RADIUS.sm, padding: 10,
  },
  obsText: { flex: 1, fontSize: FONTS.sm, color: COLORS.primary },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg, padding: 14,
  },
  infoText: { flex: 1, fontSize: FONTS.sm, color: COLORS.navyMid, lineHeight: 18 },
});
