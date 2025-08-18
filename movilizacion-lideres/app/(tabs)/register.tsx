import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { Surface, Text, Button, TextInput, HelperText, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [idLider, setIdLider] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [address, setAddress] = useState('');
  const [claveElector, setClaveElector] = useState('');
  const [curp, setCurp] = useState('');
  const [numEmision, setNumEmision] = useState('');
  const [seccion, setSeccion] = useState('');
  const [distrito, setDistrito] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [colonia, setColonia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Obtener el id del usuario autenticado al abrir la pantalla
    const fetchUserId = async () => {
      if (token) {
        try {
          const res = await fetch('http://192.168.1.24:8000/users/me/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIdLider(data.id?.toString() ?? null);
          }
        } catch {
          setIdLider(null);
        }
      }
    };
    fetchUserId();
  }, [token]);

  const handleGetLocation = async () => {
    setError('');
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLatitud(location.coords.latitude.toString());
      setLongitud(location.coords.longitude.toString());
      setLoading(false);
    } catch (e) {
      setError('No se pudo obtener la ubicación');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    setSuccess(false);
    if (!name || !aceptaPolitica) {
      setError('Nombre y aceptación de política son obligatorios');
      setLoading(false);
      return;
    }
    if (!idLider) {
      setError('No se pudo obtener el usuario responsable. Intenta cerrar sesión y volver a entrar.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://192.168.1.24:8000/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: name,
          telefono: phone,
          edad: age,
          sexo: sex,
          direccion: address,
          clave_elector: claveElector,
          curp: curp,
          num_emision: numEmision,
          seccion_electoral: seccion,
          distrito: distrito,
          municipio: municipio,
          estado: estado,
          colonia: colonia,
          codigo_postal: codigoPostal,
          latitud: latitud,
          longitud: longitud,
          acepta_politica: aceptaPolitica,
          id_lider_responsable: idLider,
        }),
      });
      setLoading(false);
      if (response.ok) {
        setSuccess(true);
        setName(''); setPhone(''); setAge(''); setSex(''); setAddress('');
        setClaveElector(''); setCurp(''); setNumEmision(''); setSeccion('');
        setDistrito(''); setMunicipio(''); setEstado(''); setColonia('');
        setCodigoPostal(''); setLatitud(''); setLongitud(''); setAceptaPolitica(false);
      } else {
        const errorText = await response.text();
        setError('Error al registrar persona: ' + errorText);
      }
    } catch (e) {
      setLoading(false);
      setError('Error de red');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
      <Surface style={styles.card} elevation={4}>
        <Text style={styles.title}>Registrar persona</Text>
        <List.Item
          title="Volver al menú"
          left={props => <List.Icon {...props} icon="arrow-left" color="#fff" />}
          style={styles.liderItem}
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          onPress={() => router.back()}
        />
        <TextInput label="Nombre Completo *" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
        <TextInput label="Teléfono" value={phone} onChangeText={setPhone} style={styles.input} mode="outlined" keyboardType="phone-pad" />
        <TextInput label="Edad" value={age} onChangeText={setAge} style={styles.input} mode="outlined" keyboardType="numeric" />
        <TextInput label="Sexo" value={sex} onChangeText={setSex} style={styles.input} mode="outlined" />
        <TextInput label="Dirección" value={address} onChangeText={setAddress} style={styles.input} mode="outlined" multiline />
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Datos de Credencial de Elector</Text>
        <TextInput label="Clave de Elector" value={claveElector} onChangeText={setClaveElector} style={styles.input} mode="outlined" />
        <TextInput label="CURP" value={curp} onChangeText={setCurp} style={styles.input} mode="outlined" />
        <TextInput label="Número de Emisión" value={numEmision} onChangeText={setNumEmision} style={styles.input} mode="outlined" />
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Ubicación Electoral</Text>
        <TextInput label="Sección Electoral" value={seccion} onChangeText={setSeccion} style={styles.input} mode="outlined" />
        <TextInput label="Distrito" value={distrito} onChangeText={setDistrito} style={styles.input} mode="outlined" />
        <TextInput label="Municipio" value={municipio} onChangeText={setMunicipio} style={styles.input} mode="outlined" />
        <TextInput label="Estado" value={estado} onChangeText={setEstado} style={styles.input} mode="outlined" />
        <TextInput label="Colonia" value={colonia} onChangeText={setColonia} style={styles.input} mode="outlined" />
        <TextInput label="Código Postal" value={codigoPostal} onChangeText={setCodigoPostal} style={styles.input} mode="outlined" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TextInput label="Latitud" value={latitud} onChangeText={setLatitud} style={[styles.input, { flex: 1, marginRight: 4 }]} mode="outlined" />
          <TextInput label="Longitud" value={longitud} onChangeText={setLongitud} style={[styles.input, { flex: 1, marginLeft: 4 }]} mode="outlined" />
        </View>
        <Button mode="outlined" onPress={handleGetLocation} loading={loading} style={{ marginBottom: 8 }}>
          Obtener coordenadas automáticamente
        </Button>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Switch value={aceptaPolitica} onValueChange={setAceptaPolitica} />
          <Text style={{ marginLeft: 8 }}>Acepta la política de privacidad y el uso de datos</Text>
        </View>
        {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}
        {success ? <HelperText type="info" visible={true}>¡Persona registrada!</HelperText> : null}
        <List.Item
          title="Registrar"
          left={props => <List.Icon {...props} icon="check" color="#fff" />}
          style={styles.liderItem}
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          onPress={handleRegister}
        />
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1a237e',
  },
  menuButton: {
    marginVertical: 10,
    borderRadius: 8,
    width: 220,
    alignSelf: 'center',
    backgroundColor: '#3949ab',
  },
  input: {
    marginBottom: 10,
    width: 260,
    backgroundColor: '#f5f7fa',
  },
  liderItem: {
    backgroundColor: '#3949ab',
    marginVertical: 10,
    borderRadius: 8,
    width: 260,
    alignSelf: 'center',
    elevation: 2,
  },
}); 