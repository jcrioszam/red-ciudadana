import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const PUBLIC_TABS: { name: string; title: string; icon: IoniconName; iconActive: IoniconName }[] = [
  { name: 'index',         title: 'Inicio',      icon: 'home-outline',        iconActive: 'home' },
  { name: 'noticias',      title: 'Noticias',    icon: 'newspaper-outline',   iconActive: 'newspaper' },
  { name: 'nuevo-reporte', title: 'Reportar',    icon: 'add-circle-outline',  iconActive: 'add-circle' },
  { name: 'mis-reportes',  title: 'Mis Reportes',icon: 'search-outline',      iconActive: 'search' },
];

function TabBar({ state, navigation }: any) {
  const router = useRouter();
  const { exitPublicMode } = useAuth() as any;
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    await exitPublicMode();
    router.replace('/login' as any);
  };

  return (
    <View style={[styles.barWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, i: number) => {
          const tab = PUBLIC_TABS.find(t => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={focused ? 22 : 20}
                  color={focused ? COLORS.primary : COLORS.textMuted}
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Botón Ingresar */}
        <TouchableOpacity style={styles.tabItem} onPress={handleLogin} activeOpacity={0.7}>
          <View style={styles.loginBtn}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
          </View>
          <Text style={styles.loginLabel}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PublicLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="noticias" />
      <Tabs.Screen name="nuevo-reporte" />
      <Tabs.Screen name="mis-reportes" />
      <Tabs.Screen name="mapa-reportes" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.md,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 3,
  },
  iconWrap: {
    width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  iconWrapActive: {
    backgroundColor: '#eff6ff',
  },
  tabLabel: {
    fontSize: 10, color: COLORS.textMuted, fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary, fontWeight: '700',
  },
  loginBtn: {
    width: 36, height: 32, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  loginLabel: {
    fontSize: 10, color: COLORS.primary, fontWeight: '700',
  },
});
