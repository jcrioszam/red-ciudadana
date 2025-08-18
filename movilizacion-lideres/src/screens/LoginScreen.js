import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, HelperText, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    if (!email || !password) {
      setError('Completa todos los campos');
      setLoading(false);
      return;
    }
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Logo institucional (opcional) */}
        <Image
          source={require('../../assets/logo.png')} // pon tu logo aquí o usa un logo institucional
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Red Ciudadana</Text>
        <Text style={styles.subtitle}>Iniciar sesión</Text>
        <TextInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          left={<TextInput.Icon icon="email" />}
          theme={{ colors: { text: '#222' } }}
        />
        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          theme={{ colors: { text: '#222' } }}
        />
        {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
        >
          Iniciar sesión
        </Button>
        <Text style={styles.footer}>© {new Date().getFullYear()} Red Ciudadana</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginVertical: 32,
    elevation: 2,
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#3949ab',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    borderRadius: 6,
  },
  footer: {
    marginTop: 32,
    textAlign: 'center',
    color: '#9fa8da',
    fontSize: 13,
  },
});
