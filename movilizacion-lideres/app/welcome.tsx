import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../src/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { enterPublicMode } = useAuth() as any;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const enterPublic = async () => {
    await enterPublicMode();
  };

  const enterPrivate = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Fondo con gradiente simulado */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Círculos decorativos */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo + Nombre */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="people" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>LideraRed</Text>
          <Text style={styles.appTagline}>Conectando comunidades</Text>
        </View>

        {/* Cards de modo */}
        <View style={styles.cardsSection}>
          <Text style={styles.chooseLabel}>¿Cómo deseas continuar?</Text>

          {/* Modo ciudadano */}
          <TouchableOpacity style={styles.cardPublic} onPress={enterPublic} activeOpacity={0.85}>
            <View style={styles.cardIcon}>
              <Ionicons name="people-outline" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Soy Ciudadano</Text>
              <Text style={styles.cardDesc}>Reporta problemas, lee noticias y sigue tus reportes sin registro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Modo privado */}
          <TouchableOpacity style={styles.cardPrivate} onPress={enterPrivate} activeOpacity={0.85}>
            <View style={[styles.cardIcon, styles.cardIconDark]}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: '#fff' }]}>Miembro Red</Text>
              <Text style={[styles.cardDesc, { color: 'rgba(255,255,255,0.75)' }]}>Accede con tu cuenta a las herramientas de gestión</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Red Ciudadana · Sistema de Gestión</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.55,
    backgroundColor: COLORS.navyMid,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: height * 0.48,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  circle: {
    position: 'absolute', borderRadius: 999, opacity: 0.07,
    backgroundColor: COLORS.primaryLight,
  },
  circle1: { width: 280, height: 280, top: -60, right: -80 },
  circle2: { width: 160, height: 160, top: 80, left: -40 },
  circle3: { width: 120, height: 120, bottom: 120, right: 20 },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 32 },

  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW.lg,
  },
  appName: { fontSize: FONTS.xxxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  appTagline: { fontSize: FONTS.md, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  cardsSection: { flex: 1 },
  chooseLabel: {
    fontSize: FONTS.sm, color: COLORS.textSecondary,
    fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 14, textAlign: 'center',
  },

  cardPublic: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: RADIUS.xl,
    padding: 18, marginBottom: 14, ...SHADOW.md,
  },
  cardPrivate: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: 18, marginBottom: 14, ...SHADOW.md,
  },
  cardIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  cardDesc: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 18 },

  footer: { textAlign: 'center', fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 8 },
});
