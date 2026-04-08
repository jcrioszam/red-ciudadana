import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const NuevoReporte = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('otros');
  const [prioridad, setPrioridad] = useState('normal');
  const [direccion, setDireccion] = useState('');
  const [coordinates, setCoordinates] = useState({
    latitud: 0,
    longitud: 0,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso para acceder a la ubicación');
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCoordinates({ latitud: latitude, longitud: longitude });
      
      Alert.alert('✅ Ubicación Obtenida', 'Tu ubicación actual ha sido capturada');
      
    } catch (error) {
      console.error('❌ Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return titulo.trim() && descripcion.trim();
    }
    return true;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>📋 Información del Reporte</Text>
            <Text style={styles.stepSubtitle}>Describe el problema que has identificado</Text>
            
            {/* Tipo de reporte */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>🎯 Tipo de Problema</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'baches', label: '🛣️ Baches' },
                  { value: 'iluminacion', label: '💡 Iluminación' },
                  { value: 'salud', label: '🏥 Salud' },
                  { value: 'seguridad', label: '👮 Seguridad' },
                  { value: 'agua', label: '💧 Agua' },
                  { value: 'basura', label: '🗑️ Basura' },
                  { value: 'otros', label: '📋 Otros' }
                ].map((tipoOption) => (
                  <TouchableOpacity
                    key={tipoOption.value}
                    style={[
                      styles.chip,
                      tipo === tipoOption.value && styles.chipSelected
                    ]}
                    onPress={() => setTipo(tipoOption.value)}
                  >
                    <Text style={[
                      styles.chipText,
                      tipo === tipoOption.value && styles.chipTextSelected
                    ]}>
                      {tipoOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>📝 Título del Reporte *</Text>
              <TextInput
                style={styles.input}
                placeholder="Describe brevemente el problema"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={200}
              />
              <Text style={styles.charCount}>{titulo.length}/200</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>📄 Descripción Detallada *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe el problema en detalle..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{descripcion.length}/500</Text>
            </View>

            {/* Prioridad */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>⚡ Nivel de Urgencia</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'baja', label: '🟢 Baja' },
                  { value: 'normal', label: '🟡 Normal' },
                  { value: 'alta', label: '🟠 Alta' },
                  { value: 'urgente', label: '🔴 Urgente' }
                ].map((prioridadOption) => (
                  <TouchableOpacity
                    key={prioridadOption.value}
                    style={[
                      styles.chip,
                      prioridad === prioridadOption.value && styles.chipSelected
                    ]}
                    onPress={() => setPrioridad(prioridadOption.value)}
                  >
                    <Text style={[
                      styles.chipText,
                      prioridad === prioridadOption.value && styles.chipTextSelected
                    ]}>
                      {prioridadOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>📍 Ubicación del Problema</Text>
            <Text style={styles.stepSubtitle}>Ayúdanos a ubicar exactamente dónde está el problema</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>📍 Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Calle Principal #123, Colonia Centro"
                value={direccion}
                onChangeText={setDireccion}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>📍 Mi Ubicación Actual</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Latitud: {coordinates.latitud.toFixed(6)}, Longitud: {coordinates.longitud.toFixed(6)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.locationButton, isLoadingLocation && styles.locationButtonDisabled]}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                <Text style={styles.locationButtonText}>
                  {isLoadingLocation ? '📍 Obteniendo...' : '📍 Obtener Mi Ubicación'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Usa el botón de ubicación para obtener automáticamente tu posición actual
              </Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>✅ Confirmar y Enviar</Text>
            <Text style={styles.stepSubtitle}>Revisa la información antes de enviar tu reporte</Text>
            
            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>🎯 Tipo:</Text>
                <Text style={styles.confirmationValue}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </View>
              
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>📝 Título:</Text>
                <Text style={styles.confirmationValue}>{titulo}</Text>
              </View>
              
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>📄 Descripción:</Text>
                <Text style={styles.confirmationValue}>{descripcion}</Text>
              </View>
              
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>⚡ Urgencia:</Text>
                <Text style={styles.confirmationValue}>
                  {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                </Text>
              </View>
              
              {direccion && (
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>📍 Dirección:</Text>
                  <Text style={styles.confirmationValue}>{direccion}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✅ Tu reporte será revisado por las autoridades correspondientes
              </Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Paso desconocido: {currentStep}</Text>
          </View>
        );
    }
  };

  const handleSubmitReporte = () => {
    Alert.alert(
      '✅ Reporte Enviado Exitosamente', 
      'Tu reporte ha sido enviado y será revisado por las autoridades correspondientes.',
      [
        { 
          text: 'Continuar', 
          onPress: () => {
            setTitulo('');
            setDescripcion('');
            setTipo('otros');
            setPrioridad('normal');
            setDireccion('');
            setCoordinates({ latitud: 0, longitud: 0 });
            setCurrentStep(1);
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Nuevo Reporte</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Paso {currentStep} de 3</Text>
        </View>
        
        {renderStep()}
      </View>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.button}
            onPress={handlePrev}
          >
            <Text style={styles.buttonText}>← Anterior</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 3 ? (
          <TouchableOpacity 
            style={[styles.button, !canProceed() && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[styles.buttonText, !canProceed() && styles.buttonTextDisabled]}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, !canProceed() && styles.buttonDisabled]}
            onPress={handleSubmitReporte}
            disabled={!canProceed()}
          >
            <Text style={[styles.buttonText, !canProceed() && styles.buttonTextDisabled]}>
              ✅ Enviar Reporte
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#1976d2',
  },
  chipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chipTextSelected: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 5,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 10,
  },
  locationInfo: {
    marginTop: 10,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  locationButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  confirmationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmationValue: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#666',
  },
});

export default NuevoReporte; 