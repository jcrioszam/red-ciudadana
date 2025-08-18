import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, HelperText, Surface } from 'react-native-paper';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function LoginScreen() {
  const { login, token } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace('/'); // Redirige a la página principal tras login
    }
  }, [token]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    console.log('Valor de identificador antes de login:', identificador);
    if (!identificador || !password) {
      setError('Completa todos los campos');
      setLoading(false);
      return;
    }
    try {
      const success = await login(identificador, password);
      setLoading(false);
      if (!success) {
        setError('Usuario o contraseña incorrectos, o error de conexión.');
      }
    } catch (e) {
      setLoading(false);
      setError('Error de red o del servidor. Intenta de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.outer, { backgroundColor: '#fff' }]}>
        <Surface style={[styles.card, { backgroundColor: '#fff' }]} elevation={4}>
          {/* Logo institucional (opcional) */}
          {/* <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" /> */}
          <Text style={[styles.title, { color: '#111' }]}>Red Ciudadana</Text>
          <Text style={[styles.subtitle, { color: '#333' }]}>Acceso institucional</Text>
          <TextInput
            label="Correo electrónico o teléfono"
            value={identificador}
            onChangeText={setIdentificador}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            style={[styles.input, { color: '#111', backgroundColor: '#f5f7fa' }]}
            left={<TextInput.Icon icon="email" />}
            theme={{ colors: { text: '#111', background: '#f5f7fa' } }}
            mode="outlined"
          />
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { color: '#111', backgroundColor: '#f5f7fa' }]}
            left={<TextInput.Icon icon="lock" />}
            theme={{ colors: { text: '#111', background: '#f5f7fa' } }}
            mode="outlined"
          />
          {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          >
            Iniciar sesión
          </Button>
          <Text style={[styles.footer, { color: '#888' }]}>© {new Date().getFullYear()} Red Ciudadana</Text>
        </Surface>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3e6f3',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1a237e',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 22,
    color: '#3949ab',
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 14,
    width: 260,
    backgroundColor: '#f5f7fa',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    width: 180,
    alignSelf: 'center',
    backgroundColor: '#3949ab',
  },
  footer: {
    marginTop: 32,
    textAlign: 'center',
    color: '#9fa8da',
    fontSize: 13,
  },
});
