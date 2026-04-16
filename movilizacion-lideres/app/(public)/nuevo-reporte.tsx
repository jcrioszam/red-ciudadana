import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SERVER_CONFIG } from '../../src/config';
import { COLORS, FONTS, RADIUS, SHADOW, TIPO_REPORTE } from '../../src/theme';

const BASE = SERVER_CONFIG.BASE_URL;
const TIPOS = Object.entries(TIPO_REPORTE).map(([key, val]) => ({ key, ...val }));

const PRIORIDADES = [
  { key: 'normal',  label: 'Normal',  color: COLORS.textSecondary },
  { key: 'alta',    label: 'Alta',    color: COLORS.warning },
  { key: 'urgente', label: 'Urgente', color: COLORS.error },
];

// Centro de México como fallback
const DEFAULT_REGION = { latitude: 20.5888, longitude: -100.3899, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function NuevoReporte() {
  const mapRef = useRef<MapView>(null);
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('normal');
  const [contacto, setContacto] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [initialRegion, setInitialRegion] = useState<typeof DEFAULT_REGION | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [sending, setSending] = useState(false);
  const [folio, setFolio] = useState<string | null>(null);

  // Obtener ubicación ANTES de renderizar el mapa — evita parpadeo
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') { setInitialRegion(DEFAULT_REGION); setLoadingGeo(false); return; }
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      })
      .then(loc => {
        if (!loc) return;
        const { latitude, longitude } = loc.coords;
        setCoords({ lat: latitude, lng: longitude });
        setInitialRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      })
      .catch(() => setInitialRegion(DEFAULT_REGION))
      .finally(() => setLoadingGeo(false));
  }, []);

  // Re-centrar manualmente (botón GPS)
  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 400);
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    }
  };

  const onMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ lat: latitude, lng: longitude });
  };

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ lat: latitude, lng: longitude });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const enviar = async () => {
    if (!tipo)             { Alert.alert('Falta la categoría', 'Selecciona una categoría.'); return; }
    if (!titulo.trim())    { Alert.alert('Falta el título', 'Escribe un título.'); return; }
    if (!descripcion.trim()){ Alert.alert('Falta la descripción', 'Describe el problema.'); return; }
    if (!coords)           { Alert.alert('Falta la ubicación', 'Presiona "Mi ubicación" o toca el mapa.'); return; }

    setSending(true);
    try {
      const form = new FormData();
      form.append('tipo', tipo);
      form.append('titulo', titulo.trim());
      form.append('descripcion', descripcion.trim());
      form.append('prioridad', prioridad);
      form.append('latitud', String(coords.lat));
      form.append('longitud', String(coords.lng));
      form.append('es_publico', 'true');
      if (imagen) {
        form.append('foto', {
          uri: imagen,
          type: 'image/jpeg',
          name: 'reporte.jpg',
        } as any);
      }

      const res = await fetch(`${BASE}/reporte-publico`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`);
      setFolio(String(data.id));
    } catch (err: any) {
      Alert.alert('Error al enviar', err?.message || 'No se pudo conectar al servidor.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setTipo(''); setTitulo(''); setDescripcion('');
    setPrioridad('normal'); setContacto('');
    setImagen(null); setCoords(null); setFolio(null);
    setRegion(DEFAULT_REGION);
  };

  if (folio) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>¡Reporte enviado!</Text>
        <Text style={styles.successSub}>Tu reporte fue registrado exitosamente</Text>
        <View style={styles.folioBox}>
          <Text style={styles.folioLabel}>Número de folio</Text>
          <Text style={styles.folioVal}>{folio}</Text>
          <Text style={styles.folioHint}>Guarda este número para dar seguimiento</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={reset}>
          <Text style={styles.btnText}>Enviar otro reporte</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tipoSeleccionado = TIPOS.find(t => t.key === tipo);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="megaphone" size={22} color="#fff" />
          <View>
            <Text style={styles.headerTitle}>Nuevo Reporte</Text>
            <Text style={styles.headerSub}>Reporta un problema en tu comunidad</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tipo */}
          <Text style={styles.label}>Categoría *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTipo(t.key)}
                  style={[styles.tipoPill, tipo === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon as any} size={14} color={tipo === t.key ? '#fff' : t.color} />
                  <Text style={[styles.tipoText, tipo === t.key && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Título */}
          <Field label="Título *" placeholder="Ej. Bache peligroso en calle principal" value={titulo} onChange={setTitulo} />

          {/* Descripción */}
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el problema con detalles: tamaño, peligro, tiempo que lleva..."
            placeholderTextColor={COLORS.textMuted}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Prioridad */}
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.prioRow}>
            {PRIORIDADES.map(p => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPrioridad(p.key)}
                style={[styles.prioPill, prioridad === p.key && { backgroundColor: p.color, borderColor: p.color }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.prioText, prioridad === p.key && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── MAPA DE UBICACIÓN ── */}
          <Text style={styles.label}>Ubicación *</Text>

          {/* Botón GPS */}
          <TouchableOpacity
            style={[styles.locBtn, coords && styles.locBtnDone]}
            onPress={getLocation}
            activeOpacity={0.8}
          >
            {loadingGeo
              ? <ActivityIndicator size="small" color={coords ? COLORS.success : COLORS.primary} />
              : <Ionicons name={coords ? 'location' : 'locate-outline'} size={18} color={coords ? COLORS.success : COLORS.primary} />
            }
            <Text style={[styles.locText, coords && { color: COLORS.success }]}>
              {coords ? 'Ubicación detectada — ajusta el marcador si es necesario' : 'Usar mi ubicación actual'}
            </Text>
          </TouchableOpacity>

          {/* Mapa */}
          <View style={styles.mapContainer}>
            {loadingGeo || !initialRegion ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.mapLoadingText}>Obteniendo ubicación...</Text>
              </View>
            ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              mapType="none"
              initialRegion={initialRegion}
              onPress={onMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              {coords && (
                <Marker
                  coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                  pinColor={tipoSeleccionado?.color ?? COLORS.primary}
                  title="Ubicación del reporte"
                  description="Arrastra para ajustar"
                />
              )}
            </MapView>
            )}

            {/* Hint superpuesto */}
            <View style={styles.mapHint}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.mapHintText}>
                {coords ? 'Arrastra el marcador para ajustar · O toca otro punto' : 'Toca el mapa para colocar el marcador'}
              </Text>
            </View>
          </View>

          {/* Foto */}
          <Text style={styles.label}>Foto (opcional)</Text>
          {imagen ? (
            <View style={styles.imgPreview}>
              <Image source={{ uri: imagen }} style={styles.img} contentFit="cover" />
              <TouchableOpacity style={styles.removeImg} onPress={() => setImagen(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                <Text style={styles.photoText}>Tomar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                <Text style={styles.photoText}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Email de contacto */}
          <Field
            label="Email de contacto (opcional)"
            placeholder="Para recibir actualizaciones"
            value={contacto}
            onChange={setContacto}
            keyboardType="email-address"
          />

          {/* Enviar */}
          <TouchableOpacity
            style={[styles.btnPrimary, sending && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.btnText}>Enviar Reporte</Text>
                </>
            }
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, placeholder, value, onChange, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  successContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  successSub: { fontSize: FONTS.base, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  folioBox: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 24,
    alignItems: 'center', width: '100%', marginVertical: 24, ...SHADOW.md,
  },
  folioLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 6 },
  folioVal: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  folioHint: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },

  header: {
    backgroundColor: COLORS.navyMid, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 24, gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.65)' },

  form: { padding: 20, paddingTop: 24 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },

  tipoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#fff', borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  tipoText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text },

  input: {
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 48,
    fontSize: FONTS.base, color: COLORS.text,
    marginBottom: 16, ...SHADOW.sm,
  },
  textArea: { height: 100, paddingTop: 12 },

  prioRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prioPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  prioText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text },

  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary,
    padding: 14, marginBottom: 10, ...SHADOW.sm,
  },
  locBtnDone: { borderColor: COLORS.success },
  locText: { flex: 1, fontSize: FONTS.base, color: COLORS.primary, fontWeight: '600' },

  mapContainer: {
    borderRadius: RADIUS.xl, overflow: 'hidden',
    marginBottom: 16, ...SHADOW.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  map: { height: 220 },
  mapLoading: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.bg },
  mapLoadingText: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  mapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)', padding: 8,
    paddingHorizontal: 12,
  },
  mapHintText: { fontSize: FONTS.xs, color: COLORS.textSecondary, flex: 1 },

  imgPreview: { position: 'relative', marginBottom: 16 },
  img: { width: '100%', height: 160, borderRadius: RADIUS.lg },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary, padding: 12, ...SHADOW.sm,
  },
  photoText: { fontSize: FONTS.base, color: COLORS.primary, fontWeight: '600' },

  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 8, ...SHADOW.md,
  },
  btnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
});
