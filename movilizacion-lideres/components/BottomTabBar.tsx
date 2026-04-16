import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  id: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
  route: string;
  permission: string;
  color: string;
}

const ALL_ITEMS: MenuItem[] = [
  { id: 'home', title: 'Inicio', icon: 'home-outline', iconActive: 'home', route: '/', permission: 'dashboard', color: '#2563eb' },
  { id: 'dashboard', title: 'Dashboard', icon: 'bar-chart-outline', iconActive: 'bar-chart', route: '/dashboard', permission: 'dashboard', color: '#7c3aed' },
  { id: 'register', title: 'Registrar', icon: 'person-add-outline', iconActive: 'person-add', route: '/register', permission: 'register', color: '#f97316' },
  { id: 'reassign', title: 'Reasignar', icon: 'shuffle-outline', iconActive: 'shuffle', route: '/reassign', permission: 'reassign', color: '#8b5cf6' },
  { id: 'pase-lista', title: 'Check-in', icon: 'checkbox-outline', iconActive: 'checkbox', route: '/pase-lista', permission: 'pase-lista', color: '#10b981' },
  { id: 'movilizacion', title: 'Movilización', icon: 'car-outline', iconActive: 'car', route: '/movilizacion', permission: 'movilizacion', color: '#ef4444' },
  { id: 'estructura-red', title: 'Estructura', icon: 'git-network-outline', iconActive: 'git-network', route: '/estructura-red', permission: 'estructura-red', color: '#64748b' },
  { id: 'eventos-historicos', title: 'Históricos', icon: 'time-outline', iconActive: 'time', route: '/eventos-historicos', permission: 'eventos-historicos', color: '#92400e' },
  { id: 'reportes', title: 'Reportes', icon: 'stats-chart-outline', iconActive: 'stats-chart', route: '/reportes', permission: 'reportes', color: '#db2777' },
  { id: 'noticias', title: 'Noticias', icon: 'newspaper-outline', iconActive: 'newspaper', route: '/noticias', permission: 'noticias', color: '#0ea5e9' },
  { id: 'reportes-ciudadanos', title: 'Rep. Ciudadanos', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/reportes-ciudadanos', permission: 'reportes_ciudadanos', color: '#f97316' },
  { id: 'seguimiento-reportes', title: 'Seguimiento', icon: 'trending-up-outline', iconActive: 'trending-up', route: '/seguimiento-reportes', permission: 'seguimiento_reportes', color: '#7c3aed' },
  { id: 'ubicacion', title: 'Ubicación', icon: 'map-outline', iconActive: 'map', route: '/ubicacion', permission: 'seguimiento', color: '#06b6d4' },
  { id: 'profile', title: 'Perfil', icon: 'person-circle-outline', iconActive: 'person-circle', route: '/profile', permission: 'perfil', color: '#2563eb' },
];

const DEFAULT_PERMS: Record<string, string[]> = {
  admin: ALL_ITEMS.map(i => i.permission),
  presidente: ALL_ITEMS.map(i => i.permission),
  lider_estatal: ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'noticias', 'reportes_ciudadanos', 'seguimiento_reportes'],
  lider_regional: ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'eventos-historicos', 'reportes', 'perfil', 'noticias', 'reportes_ciudadanos'],
  lider_municipal: ['dashboard', 'register', 'reassign', 'pase-lista', 'movilizacion', 'estructura-red', 'perfil', 'noticias', 'reportes_ciudadanos'],
  lider_zona: ['dashboard', 'register', 'pase-lista', 'movilizacion', 'perfil', 'noticias', 'reportes_ciudadanos'],
  capturista: ['dashboard', 'register', 'pase-lista', 'perfil', 'noticias'],
  movilizador: ['dashboard', 'pase-lista', 'movilizacion', 'perfil', 'noticias'],
  ciudadano: ['dashboard', 'noticias', 'perfil'],
};

// Items visibles siempre en la barra inferior (máx 4 + menú)
const PINNED_PRIORITIES = ['home', 'register', 'pase-lista', 'noticias', 'profile'];

export default function BottomTabBar() {
  const { user, logout, token } = useAuth() as any;
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [perms, setPerms] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!user?.rol || !token) return;
    api.get('/perfiles/mi-configuracion', token)
      .then((r: any) => {
        const opts = r?.configuracion?.opciones_app;
        const fallback = DEFAULT_PERMS[user.rol] ?? ['dashboard', 'perfil'];
        setPerms(Array.isArray(opts) && opts.length > 0 ? opts : fallback);
      })
      .catch(() => {
        setPerms(DEFAULT_PERMS[user?.rol] ?? ['dashboard', 'perfil']);
      });
  }, [user?.rol, token]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [menuOpen]);

  const visible = ALL_ITEMS.filter(i => perms.includes(i.permission));
  const pinned = visible.filter(i => PINNED_PRIORITIES.includes(i.id)).slice(0, 4);
  const currentRoute = '/' + segments.slice(1).join('/');

  const isActive = (route: string) => {
    if (route === '/' && (segments.length <= 1 || (segments[1] as string) === 'index')) return true;
    return currentRoute.startsWith(route) && route !== '/';
  };

  const navigate = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  return (
    <>
      {/* Overlay del menú completo */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Animated.View style={[styles.drawer, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
            <Pressable>
              {/* User info */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{(user?.nombre || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerName}>{user?.nombre}</Text>
                  <Text style={styles.drawerRole}>{user?.rol?.replace(/_/g, ' ')}</Text>
                </View>
                <TouchableOpacity onPress={() => { setMenuOpen(false); logout(); }} style={styles.logoutBtn}>
                  <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              {/* Grid de opciones */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                <View style={styles.grid}>
                  {visible.map(item => {
                    const active = isActive(item.route);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.gridItem, active && { borderColor: item.color }]}
                        onPress={() => navigate(item.route)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.gridIcon, { backgroundColor: item.color + (active ? 'ff' : '18') }]}>
                          <Ionicons name={active ? item.iconActive : item.icon} size={22} color={active ? '#fff' : item.color} />
                        </View>
                        <Text style={[styles.gridLabel, active && { color: item.color, fontWeight: '700' }]} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Barra inferior fija */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {pinned.map(item => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity key={item.id} style={styles.tabItem} onPress={() => navigate(item.route)} activeOpacity={0.7}>
              <View style={[styles.iconWrap, active && { backgroundColor: item.color + '18' }]}>
                <Ionicons name={active ? item.iconActive : item.icon} size={22} color={active ? item.color : COLORS.textMuted} />
              </View>
              <Text style={[styles.tabLabel, active && { color: item.color, fontWeight: '700' }]} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Botón menú completo */}
        <TouchableOpacity style={styles.tabItem} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <View style={[styles.iconWrap, styles.menuIconWrap, menuOpen && { backgroundColor: COLORS.primary }]}>
            <Ionicons name={menuOpen ? 'close' : 'grid'} size={20} color={menuOpen ? '#fff' : COLORS.textMuted} />
          </View>
          <Text style={styles.tabLabel}>Menú</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingHorizontal: 4,
    ...SHADOW.md,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  menuIconWrap: { borderRadius: RADIUS.md },
  tabLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  drawer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: 20,
    ...SHADOW.lg,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16,
  },
  drawerAvatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  drawerAvatarText: { color: '#fff', fontSize: FONTS.lg, fontWeight: '800' },
  drawerName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  drawerRole: { fontSize: FONTS.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.errorLight, alignItems: 'center', justifyContent: 'center',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '22%', alignItems: 'center', gap: 6, padding: 10,
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  gridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 13 },
});
