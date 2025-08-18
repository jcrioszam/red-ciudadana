import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Surface, Text, Button, HelperText, ActivityIndicator, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function ReassignScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [lideres, setLideres] = useState<Array<{ id: number, nombre: string }>>([]);
  const [selectedLider, setSelectedLider] = useState<number | null>(null);
  const [personas, setPersonas] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [newLider, setNewLider] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchLider, setSearchLider] = useState('');
  const [searchPersona, setSearchPersona] = useState('');

  useEffect(() => {
    // Cargar líderes al abrir la pantalla
    if (token) {
      setLoading(true);
      fetch('http://192.168.1.24:8000/users/?rol=lider', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setLideres(Array.isArray(data) ? data : []);
          console.log('Líderes cargados:', data);
          setLoading(false);
        })
        .catch(() => {
          setLideres([]);
          setLoading(false);
        });
    }
  }, [token]);

  // Cargar personas solo del líder seleccionado
  useEffect(() => {
    if (token && selectedLider) {
      setLoading(true);
      fetch(`http://192.168.1.24:8000/personas/buscar/?id_lider_responsable=${selectedLider}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setPersonas(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setPersonas([]);
          setLoading(false);
        });
    }
  }, [token, selectedLider, success]);

  const handleReassign = async () => {
    if (!selectedPerson || !newLider) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    const { lider_responsable, ...rest } = selectedPerson;
    const body = { ...rest, id_lider_responsable: Number(newLider) };
    try {
      const res = await fetch(`http://192.168.1.24:8000/personas/${selectedPerson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSuccess(true);
        setSelectedPerson(null);
        setNewLider(null);
        setLoading(false);
      } else {
        const errorText = await res.text();
        setError('Error al reasignar: ' + errorText);
        setLoading(false);
      }
    } catch (e) {
      setError('Error de red');
      setLoading(false);
    }
  };

  // Filtrar líderes por nombre
  const filteredLideres = lideres.filter(l => l.nombre.toLowerCase().includes(searchLider.toLowerCase()));
  // Filtrar personas por nombre o clave_elector
  const filteredPersonas = personas.filter(p =>
    p.nombre.toLowerCase().includes(searchPersona.toLowerCase()) ||
    (p.clave_elector && p.clave_elector.toLowerCase().includes(searchPersona.toLowerCase()))
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
      <Surface style={styles.card} elevation={4}>
        <Text style={styles.title}>Redireccionar persona</Text>
        {loading && <ActivityIndicator animating size="large" style={{ marginVertical: 16 }} />}
        {error && !loading ? (
          <HelperText type="error" visible={true}>{error}</HelperText>
        ) : null}
        {/* Paso 1: Seleccionar líder */}
        {!selectedLider && !selectedPerson && (
          <>
            <List.Item
              title="Volver al menú"
              left={props => <List.Icon {...props} icon="arrow-left" color="#fff" />}
              style={styles.liderItem}
              titleStyle={{ color: '#fff', fontWeight: 'bold' }}
              onPress={() => router.back()}
            />
            <TextInput
              placeholder="Buscar líder por nombre"
              value={searchLider}
              onChangeText={setSearchLider}
              style={styles.input}
            />
            {filteredLideres.map(l => (
              <List.Item
                key={l.id}
                title={l.nombre}
                left={props => <List.Icon {...props} icon="account" color="#fff" />}
                style={styles.liderItem}
                titleStyle={{ color: '#fff', fontWeight: 'bold' }}
                onPress={() => setSelectedLider(l.id)}
              />
            ))}
          </>
        )}
        {/* Paso 2: Seleccionar persona del líder */}
        {selectedLider && !selectedPerson && !loading && (
          <>
            <List.Item
              title="Volver a líderes"
              left={props => <List.Icon {...props} icon="arrow-left" color="#fff" />}
              style={styles.liderItem}
              titleStyle={{ color: '#fff', fontWeight: 'bold' }}
              onPress={() => setSelectedLider(null)}
            />
            <TextInput
              placeholder="Buscar persona por nombre o clave de elector"
              value={searchPersona}
              onChangeText={setSearchPersona}
              style={styles.input}
            />
            {filteredPersonas.map(p => (
              <List.Item
                key={p.id}
                title={`${p.nombre} (${p.clave_elector || '-'})`}
                left={props => <List.Icon {...props} icon="account" color="#fff" />}
                style={styles.liderItem}
                titleStyle={{ color: '#fff', fontWeight: 'bold' }}
                onPress={() => setSelectedPerson(p)}
              />
            ))}
          </>
        )}
        {/* Paso 3: Reasignar persona */}
        {selectedPerson && (
          <>
            <List.Item
              title="Volver a personas"
              left={props => <List.Icon {...props} icon="arrow-left" color="#fff" />}
              style={styles.liderItem}
              titleStyle={{ color: '#fff', fontWeight: 'bold' }}
              onPress={() => setSelectedPerson(null)}
            />
            <Text style={{ marginBottom: 8 }}>Persona: <Text style={{ fontWeight: 'bold' }}>{selectedPerson.nombre}</Text></Text>
            <Text style={{ marginBottom: 8 }}>Líder actual: {selectedPerson.lider_responsable?.nombre || selectedPerson.id_lider_responsable}</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Nuevo líder</Text>
            <Picker
              selectedValue={newLider}
              onValueChange={itemValue => setNewLider(itemValue)}
              style={{ backgroundColor: '#f5f7fa', borderRadius: 8, marginBottom: 12, width: 220 }}
            >
              {lideres.map(l => (
                <Picker.Item key={l.id} label={l.nombre} value={l.id.toString()} />
              ))}
            </Picker>
            <Button mode="contained" onPress={handleReassign} loading={loading} style={styles.menuButton}>
              Confirmar reasignación
            </Button>
            <Button onPress={() => setSelectedPerson(null)} style={styles.menuButton}>Cancelar</Button>
          </>
        )}
        {success ? <HelperText type="info" visible={true}>¡Persona reasignada!</HelperText> : null}
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
    marginVertical: 6,
    borderRadius: 8,
    width: 260,
    alignSelf: 'center',
    elevation: 2,
  },
}); 