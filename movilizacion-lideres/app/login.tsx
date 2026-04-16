import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../src/theme';

export default function LoginScreen() {
  const { login, token } = useAuth();
  const router = useRouter();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (token) router.replace('/(tabs)/' as any);
  }, [token]);

  const handleLogin = async () => {
    if (!identificador.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await login(identificador.trim(), password);
      if (!result?.success) {
        setError('Usuario o contraseña incorrectos');
      }
    } catch {
      setError('Error de conexión. Verifica tu red.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => router.replace('/welcome' as any);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header decorativo */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Bienvenido</Text>
          <Text style={styles.headerSub}>Inicia sesión con tu cuenta</Text>
        </View>
      </View>

      {/* Formulario */}
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          {/* Campo usuario */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Usuario o Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario"
                placeholderTextColor={COLORS.textMuted}
                value={identificador}
                onChangeText={setIdentificador}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Campo contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Botón login */}
          <TouchableOpacity
            style={[styles.btnLogin, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Iniciar Sesión</Text>
            }
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>o</Text>
            <View style={styles.sepLine} />
          </View>

          {/* Volver como ciudadano */}
          <TouchableOpacity style={styles.btnPublic} onPress={goBack} activeOpacity={0.8}>
            <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            <Text style={styles.btnPublicText}>Continuar como ciudadano</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.navyMid,
    paddingTop: 50, paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -50,
  },
  headerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: { alignItems: 'center' },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, ...SHADOW.md,
  },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: FONTS.base, color: 'rgba(255,255,255,0.65)' },

  form: { flex: 1 },
  formContent: { padding: 24, paddingTop: 28 },
  formTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: 24 },

  fieldGroup: { marginBottom: 18 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 52, ...SHADOW.sm,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: FONTS.base, color: COLORS.text },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, color: COLORS.error, fontSize: FONTS.sm, fontWeight: '500' },

  btnLogin: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, ...SHADOW.md,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },

  separator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  sepLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  sepText: { fontSize: FONTS.sm, color: COLORS.textMuted },

  btnPublic: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    height: 50, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  btnPublicText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.primary },
});
