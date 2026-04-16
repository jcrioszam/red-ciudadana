import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/api';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ROL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:           { label: 'Administrador',   color: '#dc2626', bg: '#fee2e2' },
  presidente:      { label: 'Presidente',      color: '#7c3aed', bg: '#ede9fe' },
  lider_estatal:   { label: 'Líder Estatal',   color: '#2563eb', bg: '#dbeafe' },
  lider_regional:  { label: 'Líder Regional',  color: '#0891b2', bg: '#cffafe' },
  lider_municipal: { label: 'Líder Municipal', color: '#059669', bg: '#d1fae5' },
  lider_zona:      { label: 'Líder de Zona',   color: '#d97706', bg: '#fef3c7' },
  capturista:      { label: 'Capturista',      color: '#6b7280', bg: '#f3f4f6' },
  movilizador:     { label: 'Movilizador',     color: '#f97316', bg: '#fff7ed' },
  ciudadano:       { label: 'Ciudadano',       color: '#64748b', bg: '#f8fafc' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [changingPass, setChangingPass] = useState(false);
  const [passData, setPassData] = useState({ actual: '', nueva: '', confirma: '' });
  const [savingPass, setSavingPass] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const rol = ROL_CONFIG[user?.rol ?? ''] ?? { label: user?.rol ?? '', color: COLORS.primary, bg: '#eff6ff' };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('publicMode');
          logout();
        },
      },
    ]);
  };

  const savePassword = async () => {
    if (!passData.actual || !passData.nueva || !passData.confirma) {
      Alert.alert('Error', 'Completa todos los campos'); return;
    }
    if (passData.nueva !== passData.confirma) {
      Alert.alert('Error', 'La nueva contraseña no coincide'); return;
    }
    if (passData.nueva.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return;
    }
    setSavingPass(true);
    try {
      await api.put('/users/me/password', { password_actual: passData.actual, password_nueva: passData.nueva });
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setChangingPass(false);
      setPassData({ actual: '', nueva: '', confirma: '' });
    } catch {
      Alert.alert('Error', 'Contraseña actual incorrecta');
    } finally {
      setSavingPass(false);
    }
  };

  const infoRows: { icon: IoniconName; label: string; val: string }[] = [
    { icon: 'person-outline', label: 'Nombre completo', val: user?.nombre ?? '—' },
    { icon: 'at-outline', label: 'Usuario', val: user?.username ?? '—' },
    { icon: 'mail-outline', label: 'Email', val: user?.email ?? '—' },
    { icon: 'call-outline', label: 'Teléfono', val: user?.telefono ?? '—' },
    { icon: 'location-outline', label: 'Dirección', val: user?.direccion ?? '—' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCircle} />
        <View style={styles.avatarLg}>
          <Text style={styles.avatarText}>{(user?.nombre || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.nameText}>{user?.nombre}</Text>
        <View style={[styles.roleBadge, { backgroundColor: rol.bg }]}>
          <Text style={[styles.roleText, { color: rol.color }]}>{rol.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Información personal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Personal</Text>
          {infoRows.map(r => (
            <View key={r.label} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={r.icon} size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text style={styles.infoVal}>{r.val}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cambiar contraseña */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setChangingPass(!changingPass)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Cambiar Contraseña</Text>
            </View>
            <Ionicons name={changingPass ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {changingPass && (
            <View style={styles.passForm}>
              {[
                { key: 'actual', label: 'Contraseña actual', placeholder: '••••••••' },
                { key: 'nueva', label: 'Nueva contraseña', placeholder: 'Mínimo 6 caracteres' },
                { key: 'confirma', label: 'Confirmar nueva', placeholder: 'Repite la nueva contraseña' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text style={styles.passLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.passInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={(passData as any)[f.key]}
                    onChangeText={v => setPassData(p => ({ ...p, [f.key]: v }))}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.btnSave, savingPass && { opacity: 0.6 }]}
                onPress={savePassword}
                disabled={savingPass}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSaveText}>{savingPass ? 'Guardando…' : 'Guardar contraseña'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preferencias */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="notifications-outline" size={18} color={COLORS.warning} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Notificaciones</Text>
                <Text style={styles.settingSub}>Avisos de actividad</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={notifications ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/noticias' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="newspaper-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.settingLabel}>Ver Noticias</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' as any }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.8}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.errorLight }]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.settingLabel, { color: COLORS.error }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.navyMid, paddingTop: 52, paddingBottom: 28,
    alignItems: 'center', overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerCircle: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60,
  },
  avatarLg: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...SHADOW.md,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  nameText: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff', marginBottom: 8 },
  roleBadge: { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 5 },
  roleText: { fontSize: FONTS.sm, fontWeight: '700' },

  scroll: { padding: 20, gap: 14 },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 18, ...SHADOW.sm },
  cardTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  infoIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 2 },
  infoVal: { fontSize: FONTS.base, color: COLORS.text, fontWeight: '500' },

  passForm: { marginTop: 16 },
  passLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  passInput: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 46, fontSize: FONTS.base, color: COLORS.text,
  },
  btnSave: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: FONTS.base },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.text },
  settingSub: { fontSize: FONTS.xs, color: COLORS.textMuted },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  logoutRow: { borderBottomWidth: 0, marginTop: 4 },
});
