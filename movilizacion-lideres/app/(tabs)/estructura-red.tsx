import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

// Tipos

type NodoJerarquico = {
  id: number;
  nombre: string;
  rol: string;
  total_personas: number;
  total_subordinados: number;
  subordinados: NodoJerarquico[];
};

type EstructuraJerarquica = {
  lider_general: NodoJerarquico;
  total_personas_red: number;
  total_lideres_red: number;
  niveles_jerarquia: number;
};

// Colores por rol (puedes personalizar)
const ROL_COLORS: Record<string, string> = {
  Presidente: '#e57373',
  'Líder Estatal': '#42a5f5',
  'Líder de Zona': '#ffa726',
  'Líder Municipal': '#ab47bc',
  default: '#90caf9',
};

function getColorByRol(rol: string) {
  return ROL_COLORS[rol] || ROL_COLORS.default;
}

// Agrupa los nodos por nivel
function agruparPorNivel(raiz: NodoJerarquico): NodoJerarquico[][] {
  const niveles: NodoJerarquico[][] = [];
  function recorrer(nodo: NodoJerarquico, nivel: number) {
    if (!niveles[nivel]) niveles[nivel] = [];
    niveles[nivel].push(nodo);
    nodo.subordinados.forEach(sub => recorrer(sub, nivel + 1));
  }
  recorrer(raiz, 0);
  return niveles;
}

function NodoCard({ nodo }: { nodo: NodoJerarquico }) {
  return (
    <View style={[styles.cardNode, { backgroundColor: getColorByRol(nodo.rol) }]}> 
      <MaterialIcons name="person" size={28} color="#fff" style={{ marginBottom: 4 }} />
      <Text style={styles.nodeName}>{nodo.nombre}</Text>
      <Text style={styles.nodeRol}>{nodo.rol}</Text>
      <Text style={styles.nodeStat}>Personas: {nodo.total_personas}</Text>
      <Text style={styles.nodeStat}>Subordinados: {nodo.total_subordinados}</Text>
    </View>
  );
}

export default function EstructuraRedScreen() {
  const { token } = useAuth();
  const [estructura, setEstructura] = useState<EstructuraJerarquica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEstructura = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://192.168.2.150:8000/reportes/estructura-jerarquica', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setError('Error al obtener la estructura de la red');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setEstructura(data);
      } catch (e) {
        setError('Error de conexión');
      }
      setLoading(false);
    };
    if (token) fetchEstructura();
  }, [token]);

  let niveles: NodoJerarquico[][] = [];
  if (estructura) {
    niveles = agruparPorNivel(estructura.lider_general);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.outer}>
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.title}>Estructura Jerárquica de la Red</Text>
          {loading && <ActivityIndicator animating size="large" style={{ marginTop: 20 }} />}
          {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
          {estructura && niveles.map((nivel, idx) => (
            <View key={idx} style={styles.levelRow}>
              {nivel.map(nodo => <NodoCard key={nodo.id} nodo={nodo} />)}
            </View>
          ))}
        </Surface>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  card: {
    width: '100%',
    maxWidth: 900,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
    color: '#1a237e',
    alignSelf: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardNode: {
    minWidth: 140,
    maxWidth: 180,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  nodeName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  nodeRol: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  nodeStat: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
}); 