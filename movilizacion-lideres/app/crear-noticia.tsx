import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Surface, Title, TextInput, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { api } from '../src/api';

export default function CrearNoticiaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [tipo, setTipo] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleCrearNoticia = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      Alert.alert('Error', 'El título y contenido son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await api.post('/noticias/', {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        imagen_url: imagenUrl.trim() || null,
        tipo: tipo
      });

      Alert.alert(
        'Éxito', 
        'Noticia creada exitosamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error al crear noticia:', error);
      Alert.alert('Error', 'No se pudo crear la noticia');
    } finally {
      setLoading(false);
    }
  };

  const getTipoInfo = (tipoSeleccionado: string) => {
    const tipos = {
      'general': {
        icon: 'newspaper',
        color: '#2196F3',
        descripcion: 'Noticias generales de la organización'
      },
      'importante': {
        icon: 'exclamation-triangle',
        color: '#F44336',
        descripcion: 'Anuncios importantes y urgentes'
      },
      'evento': {
        icon: 'calendar-alt',
        color: '#4CAF50',
        descripcion: 'Información sobre eventos próximos'
      },
      'aviso': {
        icon: 'bullhorn',
        color: '#FF9800',
        descripcion: 'Avisos y recordatorios'
      }
    };
    return tipos[tipoSeleccionado as keyof typeof tipos] || tipos.general;
  };

  const tipoInfo = getTipoInfo(tipo);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome5 name="edit" size={48} color="#1a237e" style={styles.headerIcon} />
          <Title style={styles.title}>Crear Noticia</Title>
          <Text style={styles.subtitle}>Comparte información con tu equipo</Text>
        </View>

        <Surface style={styles.formCard} elevation={3}>
          {/* Tipo de noticia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Noticia</Text>
            <View style={styles.tiposContainer}>
              {['general', 'importante', 'evento', 'aviso'].map((tipoOption) => (
                <Chip
                  key={tipoOption}
                  selected={tipo === tipoOption}
                  onPress={() => setTipo(tipoOption)}
                  style={[
                    styles.tipoChip,
                    tipo === tipoOption && { backgroundColor: tipoInfo.color }
                  ]}
                  textStyle={[
                    styles.tipoChipText,
                    tipo === tipoOption && { color: 'white' }
                  ]}
                >
                  <FontAwesome5 
                    name={getTipoInfo(tipoOption).icon} 
                    size={12} 
                    color={tipo === tipoOption ? 'white' : tipoInfo.color} 
                  />
                  {' '}{tipoOption.toUpperCase()}
                </Chip>
              ))}
            </View>
            <Text style={styles.tipoDescripcion}>{tipoInfo.descripcion}</Text>
          </View>

          {/* Título */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Título *</Text>
            <TextInput
              mode="outlined"
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Escribe un título atractivo"
              style={styles.input}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{titulo.length}/200</Text>
          </View>

          {/* Contenido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contenido *</Text>
            <TextInput
              mode="outlined"
              value={contenido}
              onChangeText={setContenido}
              placeholder="Escribe el contenido de la noticia..."
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />
            <Text style={styles.characterCount}>{contenido.length} caracteres</Text>
          </View>

          {/* URL de imagen (opcional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>URL de Imagen (Opcional)</Text>
            <TextInput
              mode="outlined"
              value={imagenUrl}
              onChangeText={setImagenUrl}
              placeholder="https://ejemplo.com/imagen.jpg"
              style={styles.input}
            />
            <Text style={styles.helpText}>
              Puedes agregar una imagen desde una URL pública
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleCrearNoticia}
              style={styles.createButton}
              loading={loading}
              disabled={loading || !titulo.trim() || !contenido.trim()}
            >
              Publicar Noticia
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formCard: {
    margin: 15,
    padding: 20,
    backgroundColor: 'white',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tipoChip: {
    marginBottom: 5,
  },
  tipoChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tipoDescripcion: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    marginBottom: 5,
  },
  textArea: {
    marginBottom: 5,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  createButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#1a237e',
  },
}); 