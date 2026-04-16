import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, Pressable, Image,
} from 'react-native';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SERVER_CONFIG } from '../../src/config';
import { COLORS, FONTS, RADIUS, SHADOW, TIPO_REPORTE } from '../../src/theme';

const BASE = SERVER_CONFIG.BASE_URL;

/** Rebuild any photo URL to use the current BASE (fixes localhost URLs from backend). */
function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return `${BASE}${raw}`;
  try {
    const { pathname } = new URL(raw);
    return `${BASE}${pathname}`;
  } catch { return null; }
}

const DEFAULT_REGION: Region = {
  latitude: 20.5888,
  longitude: -100.3899,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TIPO_EMOJI: Record<string, string> = {
  baches: '🕳️', iluminacion: '💡', agua: '💧', seguridad: '🚨',
  salud: '🏥', basura: '🗑️', transporte: '🚌', otros: '⚠️',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pendiente:    { label: 'Pendiente',   color: '#f59e0b', icon: 'time-outline' },
  en_revision:  { label: 'En revisión', color: '#2563eb', icon: 'eye-outline' },
  en_progreso:  { label: 'En progreso', color: '#8b5cf6', icon: 'construct-outline' },
  resuelto:     { label: 'Resuelto',    color: '#10b981', icon: 'checkmark-circle-outline' },
  rechazado:    { label: 'Rechazado',   color: '#ef4444', icon: 'close-circle-outline' },
};

interface Reporte {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  estado: string;
  prioridad?: string;
  latitud?: number;
  longitud?: number;
  fecha_creacion: string;
  ciudadano_nombre?: string;
  foto_url?: string;
  fotos?: { url: string }[];
  tiene_foto?: boolean;
}

// ── Marcador individual ──────────────────────────────────────────────────────
function PinMarker({ r, onPress }: { r: Reporte; onPress: () => void }) {
  const statusColor = STATUS_CONFIG[r.estado]?.color ?? '#94a3b8';
  const fotoUrl = normalizeUrl(r.fotos?.[0]?.url ?? r.foto_url ?? null);
  const [tracked, setTracked] = useState(!!fotoUrl);

  useEffect(() => {
    if (fotoUrl) {
      const t = setTimeout(() => setTracked(false), 2500);
      return () => clearTimeout(t);
    }
  }, [fotoUrl]);

  // Sin foto → pin nativo coloreado (sin ningún custom view = cero clipping)
  if (!fotoUrl) {
    return (
      <Marker
        coordinate={{ latitude: r.latitud!, longitude: r.longitud! }}
        tracksViewChanges={false}
        pinColor={statusColor}
        onPress={onPress}
      />
    );
  }

  // Con foto → custom view
  return (
    <Marker
      coordinate={{ latitude: r.latitud!, longitude: r.longitud! }}
      tracksViewChanges={tracked}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View collapsable={false} style={styles.pinOuter}>
        <View style={[styles.pinCircle, { borderColor: statusColor, backgroundColor: '#fff' }]}>
          <Image
            source={{ uri: fotoUrl }}
            style={styles.pinImg}
            onLoad={() => setTimeout(() => setTracked(false), 200)}
            onError={() => setTracked(false)}
          />
        </View>
        <View style={[styles.pinTail, { borderTopColor: statusColor }]} />

      </View>
    </Marker>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────────────
export default function MapaReportes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Reporte | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  // Obtener ubicación ANTES de mostrar el mapa para evitar parpadeo
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') {
          return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        return null;
      })
      .then(loc => {
        setMapRegion(loc ? {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : DEFAULT_REGION);
      })
      .catch(() => setMapRegion(DEFAULT_REGION));
  }, []);

  const cargar = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroTipo) params.append('tipo', filtroTipo);
    fetch(`${BASE}/reportes-publicos?${params}`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then((data: any) => {
        const items: Reporte[] = Array.isArray(data) ? data : [];
        setReportes(items.filter(r => r.latitud && r.longitud));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtroEstado, filtroTipo]);

  const activeFilters = (filtroEstado ? 1 : 0) + (filtroTipo ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mapa de Reportes</Text>
          <Text style={styles.headerSub}>{reportes.length} reporte{reportes.length !== 1 ? 's' : ''} con ubicación</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilters > 0 && { backgroundColor: COLORS.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={18} color={activeFilters > 0 ? '#fff' : COLORS.primary} />
          {activeFilters > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilters}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={{ flex: 1 }}>
        {(!mapRegion || loading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 8, fontSize: FONTS.sm }}>
              {!mapRegion ? 'Obteniendo ubicación...' : 'Cargando reportes...'}
            </Text>
          </View>
        )}
        {mapRegion && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType="none"
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Tiles CartoDB Voyager — mapa limpio sin negocios */}
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />
          {reportes.map(r => (
            <PinMarker key={r.id} r={r} onPress={() => setDetalle(r)} />
          ))}
        </MapView>

        )}
        {/* FAB centrar */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => mapRegion && mapRef.current?.animateToRegion(mapRegion, 600)}
        >
          <Ionicons name="locate-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <TouchableOpacity
              key={key}
              style={[styles.legendChip, filtroEstado === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
              onPress={() => setFiltroEstado(prev => prev === key ? null : key)}
            >
              <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.legendText, filtroEstado === key && { color: '#fff' }]}>{cfg.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal detalle */}
      <Modal visible={!!detalle} transparent animationType="slide" onRequestClose={() => setDetalle(null)}>
        <Pressable style={styles.overlay} onPress={() => setDetalle(null)}>
          <Pressable style={styles.sheet}>
            {detalle && (() => {
              const status = STATUS_CONFIG[detalle.estado] ?? STATUS_CONFIG.pendiente;
              const tipo = TIPO_REPORTE[detalle.tipo];
              const fotoUrl = normalizeUrl(detalle.fotos?.[0]?.url ?? detalle.foto_url);
              return (
                <>
                  <View style={styles.handle} />
                  {fotoUrl && (
                    <Image source={{ uri: fotoUrl }} style={styles.detalleImg} resizeMode="cover" />
                  )}
                  <View style={styles.detalleMeta}>
                    <View style={[styles.tipoBadge, { backgroundColor: (tipo?.color ?? '#64748b') + '18' }]}>
                      <Text style={{ fontSize: 12 }}>{TIPO_EMOJI[detalle.tipo] ?? '⚠️'}</Text>
                      <Text style={[styles.tipoText, { color: tipo?.color ?? '#64748b' }]}>{tipo?.label ?? detalle.tipo}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <Ionicons name={status.icon as any} size={12} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.detalleTitle}>{detalle.titulo}</Text>
                  {detalle.descripcion ? (
                    <Text style={styles.detalleDesc} numberOfLines={4}>{detalle.descripcion}</Text>
                  ) : null}
                  <View style={styles.detalleFooter}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.detalleDate}>
                      {new Date(detalle.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setDetalle(null)}>
                    <Text style={styles.closeBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal filtros */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handle} />
            <Text style={styles.filterTitle}>Filtros</Text>
            <Text style={styles.filterLabel}>Por estado</Text>
            <View style={styles.filterRow}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, filtroEstado === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setFiltroEstado(p => p === key ? null : key)}
                >
                  <Text style={[styles.filterChipText, filtroEstado === key && { color: '#fff' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.filterLabel, { marginTop: 16 }]}>Por tipo</Text>
            <View style={styles.filterRow}>
              {Object.entries(TIPO_REPORTE).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, filtroTipo === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setFiltroTipo(p => p === key ? null : key)}
                >
                  <Text style={[styles.filterChipText, filtroTipo === key && { color: '#fff' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {activeFilters > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setFiltroEstado(null); setFiltroTipo(null); }}>
                <Ionicons name="close-circle" size={15} color={COLORS.error} />
                <Text style={{ fontSize: FONTS.sm, color: COLORS.error, fontWeight: '600' }}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10,
    ...SHADOW.sm,
  },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 1 },
  filterBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 99, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...SHADOW.md },

  legend: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 10 },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.textSecondary },

  // ── Pines ──
  pinOuter: {
    width: 64, height: 78,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pinCircle: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  pinImg: { width: 54, height: 54 },
  pinTail: {
    width: 0, height: 0,
    borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 16,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -2,
  },

  // ── Modales ──
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 32, ...SHADOW.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  detalleImg: { width: '100%', height: 160, borderRadius: RADIUS.lg, marginBottom: 14, backgroundColor: COLORS.bg },
  detalleMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tipoText: { fontSize: FONTS.xs, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.xs, fontWeight: '700' },
  detalleTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  detalleDesc: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  detalleFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  detalleDate: { fontSize: FONTS.xs, color: COLORS.textMuted },
  closeBtn: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, paddingVertical: 13, alignItems: 'center' },
  closeBtnText: { fontWeight: '700', color: COLORS.text, fontSize: FONTS.base },

  filterTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  filterLabel: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  filterChipText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'center' },
  applyBtn: { marginTop: 20, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.base },
});
