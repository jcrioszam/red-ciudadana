import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_CONFIG } from '../../src/config';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../src/theme';

const BASE = SERVER_CONFIG.BASE_URL;

interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  imagen_url?: string;
  categoria?: string;
}

export default function PublicNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await fetch(`${BASE}/noticias/?limit=50`).then(r => r.json()).catch(() => []);
      setNoticias(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const stripHtml = (html: string) => html?.replace(/<[^>]+>/g, '') ?? '';
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="newspaper" size={24} color="#fff" />
        <Text style={styles.headerTitle}>Noticias</Text>
        <Text style={styles.headerSub}>{noticias.length} publicaciones</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.list}
      >
        {noticias.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No hay noticias disponibles</Text>
          </View>
        ) : noticias.map((n, i) => {
          const isOpen = expanded === n.id;
          const isFirst = i === 0;
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, isFirst && styles.cardFeatured]}
              onPress={() => setExpanded(isOpen ? null : n.id)}
              activeOpacity={0.85}
            >
              {/* Imagen */}
              {n.imagen_url && (
                <Image
                  source={{ uri: `${BASE}${n.imagen_url}` }}
                  style={[styles.img, isFirst && styles.imgFeatured]}
                />
              )}
              {!n.imagen_url && isFirst && (
                <View style={[styles.imgPlaceholder, styles.imgFeatured]}>
                  <Ionicons name="newspaper-outline" size={40} color={COLORS.textMuted} />
                </View>
              )}

              <View style={styles.cardBody}>
                {isFirst && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>Destacado</Text>
                  </View>
                )}
                <Text style={[styles.title, isFirst && styles.titleFeatured]} numberOfLines={isOpen ? undefined : 2}>
                  {n.titulo}
                </Text>
                <Text style={styles.date}>
                  <Ionicons name="calendar-outline" size={11} /> {fmtDate(n.fecha_publicacion)}
                </Text>
                <Text style={styles.body} numberOfLines={isOpen ? undefined : 3}>
                  {stripHtml(n.contenido)}
                </Text>
                {!isOpen && (
                  <TouchableOpacity onPress={() => setExpanded(n.id)} style={styles.readMore}>
                    <Text style={styles.readMoreText}>Leer más</Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                {isOpen && (
                  <TouchableOpacity onPress={() => setExpanded(null)} style={styles.readMore}>
                    <Text style={styles.readMoreText}>Cerrar</Text>
                    <Ionicons name="chevron-up" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.navyMid, paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    gap: 4,
  },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.6)' },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm,
  },
  cardFeatured: { ...SHADOW.md },
  img: { width: '100%', height: 140, backgroundColor: COLORS.bg },
  imgFeatured: { height: 200 },
  imgPlaceholder: {
    width: '100%', height: 140, backgroundColor: COLORS.bgLight,
    alignItems: 'center', justifyContent: 'center',
  },

  cardBody: { padding: 16 },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight + '25',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 8,
  },
  featuredText: { fontSize: FONTS.xs, color: COLORS.primary, fontWeight: '700' },
  title: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 4, lineHeight: 22 },
  titleFeatured: { fontSize: FONTS.lg },
  date: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 8 },
  body: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 20 },
  readMore: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, alignSelf: 'flex-start',
  },
  readMoreText: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textMuted },
});
