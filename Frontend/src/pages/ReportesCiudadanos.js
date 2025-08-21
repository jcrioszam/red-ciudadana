import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import MapaInteractivo from '../components/MapaInteractivo';
import api from '../api'; // ✅ IMPORTAR INSTANCIA API CON EXPORT DEFAULT

// 🎯 FLUJO DE LÍNEA DE TIEMPO PARA REPORTES CIUDADANOS
const ReportesCiudadanos = () => {
  // 📋 Estado del flujo step-by-step
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo: '',
    // 🔧 CAMPOS REQUERIDOS POR EL BACKEND
    titulo: '',
    descripcion: '',
    latitud: 0, // Valor por defecto
    longitud: 0, // Valor por defecto
    // Campos opcionales
    direccion: '',
    prioridad: 'normal',
    // 🆕 NUEVO: Campo para foto
    foto: null
  });

  // 🗺️ Estado para ubicación seleccionada en mapa
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  // ✅ FUNCIÓN CONVERTIDA A API INSTANCE - HEREDA HTTPS + CORS
  const fetchReportes = async () => {
    console.log('🚀 FETCHING reportes usando API instance con interceptores');
    
    try {
      const response = await api.get('/reportes-ciudadanos/');
      console.log('✅ REPORTES CARGADOS:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ERROR AL CARGAR REPORTES:', error);
      throw error;
    }
  };

  // ✅ FUNCIÓN CONVERTIDA A API INSTANCE - HEREDA HTTPS + CORS
  const createReporte = async (data) => {
    console.log('🚀 CREANDO reporte usando API instance con interceptores');
    
    try {
      // 🔧 ENVIAR DATOS COMPLETOS - SIN SIMPLIFICACIÓN
      console.log('📋 DATOS COMPLETOS para backend:', data);
      
      const response = await api.post('/reportes-ciudadanos/', data);
      console.log('✅ REPORTE CREADO:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ERROR AL CREAR REPORTE:', error);
      throw error;
    }
  };

  // React Query para obtener reportes
  const { data: reportes = [], error, isLoading } = useQuery(
    'reportes-ciudadanos',
    fetchReportes,
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation para crear reporte
  const createMutation = useMutation(createReporte, {
    retry: 3, // 🔧 FIX: Intentar 3 veces antes de fallar
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // 🔧 FIX: Delay exponencial
    onSuccess: (data) => {
      console.log('✅ REPORTE CREADO EXITOSAMENTE:', data);
      setLoading(false);
      setMensaje('✅ Reporte enviado exitosamente');
      setShowSuccess(true);
      setCurrentStep(5); // Paso de agradecimiento
      
      // Invalidar cache para refrescar la lista
      queryClient.invalidateQueries('reportes-ciudadanos');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentStep(1);
        setMensaje('');
        setFormData({
          tipo: '',
          // 🔧 CAMPOS REQUERIDOS POR EL BACKEND
          titulo: '',
          descripcion: '',
          latitud: 0, // Valor por defecto
          longitud: 0, // Valor por defecto
          // Campos opcionales
          direccion: '',
          prioridad: 'normal',
          // 🆕 NUEVO: Campo para foto
          foto: null
        });
      }, 3000);
    },
    onError: (error, variables, context) => {
      // 🔧 FIX: Solo mostrar error después de todos los intentos fallidos
      console.error('❌ ERROR AL CREAR REPORTE (después de todos los intentos):', error);
      setLoading(false);
      setMensaje(`❌ Error: ${error.message}`);
    },
  });

    // 🏷️ Función para generar título automático basado en el tipo
  const generarTitulo = (tipo) => {
    const titulos = {
      'dano_via_publica': 'Reporte de Daño en Vía Pública',
      'servicios_publicos': 'Reporte de Servicios Públicos',
      'seguridad': 'Reporte de Seguridad',
      'limpieza': 'Reporte de Limpieza',
      'otro': 'Reporte Ciudadano'
    };
    return titulos[tipo] || `Reporte de ${tipo}`;
  };

  // 🆕 NUEVA FUNCIÓN: Convertir archivo a base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // 🌍 Funciones de geolocalización
  const getCurrentLocation = () => {
    setMensaje('🔄 Obteniendo ubicación GPS...');
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            latitud: lat,
            longitud: lng,
          }));
          
          setSelectedLocation({ lat, lng });
          setMensaje('✅ Ubicación GPS obtenida correctamente');
          setLoading(false);
          
          setTimeout(() => {
            setMensaje('');
            setCurrentStep(3); // Ir a paso de foto
          }, 2000);
        },
        (error) => {
          console.error('❌ Error de geolocalización:', error);
          setLoading(false);
          
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '🚫 Acceso a ubicación denegado. Usa el mapa para seleccionar manualmente.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '📍 Ubicación no disponible. Usa el mapa para seleccionar manualmente.';
              break;
            case error.TIMEOUT:
              errorMessage = '⏰ Tiempo agotado. Usa el mapa para seleccionar manualmente.';
              break;
            default:
              errorMessage = '❌ Error de ubicación. Usa el mapa para seleccionar manualmente.';
              break;
          }
          
          setMensaje(errorMessage);
          
          // Auto-redirect a mapa después de 3 segundos
          setTimeout(() => {
            setMensaje('');
            setCurrentStep(2.5);
          }, 3000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLoading(false);
      setMensaje('❌ Geolocalización no soportada en este navegador. Usa el mapa para seleccionar manualmente.');
      setTimeout(() => {
        setMensaje('');
        setCurrentStep(2.5);
      }, 2000);
    }
  };

  // 🗺️ Función para manejar selección de ubicación en mapa
  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitud: lat,
      longitud: lng,
    }));
    
    setSelectedLocation({ lat, lng });
    setMensaje('✅ Ubicación seleccionada en mapa');
    
    // Avanzar al siguiente paso después de 2 segundos
    setTimeout(() => {
      setMensaje('');
      setCurrentStep(3);
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 SUBMIT INICIADO - Datos del formulario:', formData);

    // Validar que tengamos los datos mínimos
    if (!formData.tipo || !formData.descripcion.trim()) {
      setMensaje('❌ Por favor complete tipo de reporte y descripción');
      return;
    }

    // 🔧 PREPARAR DATOS COMPLETOS PARA EL BACKEND - TODOS LOS CAMPOS REQUERIDOS
    const reporteData = {
      titulo: generarTitulo(formData.tipo), // ✅ REQUERIDO por backend
      descripcion: formData.descripcion.trim(), // ✅ REQUERIDO por backend
      tipo: formData.tipo, // ✅ REQUERIDO por backend
      latitud: formData.latitud, // ✅ REQUERIDO por backend (0 por defecto)
      longitud: formData.longitud, // ✅ REQUERIDO por backend (0 por defecto)
      direccion: formData.direccion || null, // ❌ OPCIONAL
      prioridad: formData.prioridad, // ❌ OPCIONAL
      // 🆕 NUEVO: Incluir foto si existe
      foto_url: formData.foto ? await convertFileToBase64(formData.foto) : null
    };

    console.log('📋 DATOS COMPLETOS PARA BACKEND:', reporteData);

    setLoading(true);
    setMensaje('🔄 Enviando reporte...');

    console.log('🔥 EJECUTANDO MUTACIÓN:', reporteData);
    createMutation.mutate(reporteData);
    // NO llamamos setLoading(false) aquí - lo maneja la mutación
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 🎯 FLUJO CON MAPA Y FOTO - 5 PASOS TOTAL
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderTipoReporte();
      case 2: return renderDescripcion();
      case 2.5: return renderUbicacion(); // 🆕 NUEVO: Paso de ubicación (mapa/GPS)
      case 3: return renderFoto(); // 🆕 NUEVO: Paso de foto
      case 4: return renderResumen();
      case 5: return renderAgradecimiento();
      default: return renderTipoReporte();
    }
  };

  // 📝 PASO 1: Selección de tipo de reporte
  const renderTipoReporte = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📝 ¿Qué tipo de reporte desea realizar?
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Seleccione la categoría que mejor describa su reporte
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {[
          { value: 'dano_via_publica', icon: '🚧', title: 'Daño Vía Pública', desc: 'Baches, señales dañadas, etc.' },
          { value: 'servicios_publicos', icon: '🚰', title: 'Servicios Públicos', desc: 'Agua, luz, drenaje' },
          { value: 'seguridad', icon: '🚨', title: 'Seguridad', desc: 'Situaciones de riesgo' },
          { value: 'limpieza', icon: '🧹', title: 'Limpieza', desc: 'Basura, espacios sucios' },
          { value: 'otro', icon: '📋', title: 'Otro', desc: 'Otros problemas ciudadanos' }
        ].map((tipo) => (
          <button
            key={tipo.value}
            onClick={() => {
              setFormData(prev => ({ ...prev, tipo: tipo.value }));
              setCurrentStep(2);
            }}
                        style={{
              backgroundColor: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{tipo.icon}</div>
            <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>
              {tipo.title}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {tipo.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // 📝 PASO 2: Descripción del reporte
  const renderDescripcion = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📝 Describe el problema
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Proporciona detalles sobre la situación que estás reportando
      </p>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el problema en detalle..."
                        style={{
            width: '100%',
            minHeight: '120px',
            padding: '15px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>

        <button
          onClick={() => setCurrentStep(2.5)}
          disabled={!formData.descripcion.trim()}
          style={{
            backgroundColor: formData.descripcion.trim() ? '#8b5cf6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: formData.descripcion.trim() ? 'pointer' : 'not-allowed',
            opacity: formData.descripcion.trim() ? 1 : 0.6
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );

  // 🗺️ PASO 2.5: Selección de ubicación (GPS o mapa)
  const renderUbicacion = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        🗺️ Selecciona la ubicación del reporte
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Usa GPS automático o selecciona manualmente en el mapa
      </p>

      {/* 🗺️ Opciones de ubicación */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading ? '🔄' : '📍'} {loading ? 'Obteniendo GPS...' : 'Usar mi ubicación (GPS)'}
        </button>

        <button
          onClick={() => setCurrentStep(3)}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🗺️ Seleccionar en mapa
        </button>
      </div>

      {/* 🗺️ Mapa interactivo */}
      <div style={{ marginTop: '20px' }}>
        <MapaInteractivo
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          modo="seleccion"
          center={[19.4326, -99.1332]} // México City
          zoom={12}
        />
      </div>

      {/* 📍 Información de ubicación seleccionada */}
      {selectedLocation && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f0fdf4',
          border: '2px solid #10b981',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '20px auto 0'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '10px' }}>
            ✅ Ubicación seleccionada
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* 🔙 Botón para regresar */}
      <button
        onClick={() => setCurrentStep(2)}
        style={{
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        🔙 Regresar
      </button>
    </div>
  );

  // 📝 PASO 3: Foto del reporte (opcional)
  const renderFoto = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📸 Foto del problema (opcional)
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Si tienes una foto que ilustre mejor la situación, puedes subirla aquí.
      </p>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData(prev => ({ ...prev, foto: e.target.files[0] }))}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        />
        {formData.foto && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <img
              src={URL.createObjectURL(formData.foto)}
              alt="Reporte"
              style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '10px' }}
            />
            <button
              onClick={() => setFormData(prev => ({ ...prev, foto: null }))}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Eliminar Foto
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setCurrentStep(2)}
          style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>

        <button
          onClick={() => setCurrentStep(4)}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
                    cursor: 'pointer',
            opacity: 1
          }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );

  // 📋 PASO 4: Resumen del reporte
  const renderResumen = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📋 Resumen de su reporte
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Revise los datos antes de enviar
      </p>

      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'left'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Tipo:</strong>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {formData.tipo === 'dano_via_publica' && '🚧 Daño Vía Pública'}
            {formData.tipo === 'servicios_publicos' && '🚰 Servicios Públicos'}
            {formData.tipo === 'seguridad' && '🚨 Seguridad'}
            {formData.tipo === 'limpieza' && '🧹 Limpieza'}
            {formData.tipo === 'otro' && '📋 Otro'}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Descripción:</strong>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {formData.descripcion}
          </div>
        </div>

        {/* 🆕 NUEVO: Mostrar estado de la foto */}
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Foto:</strong>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {formData.foto ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#10b981' }}>✅ Foto adjunta</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  ({formData.foto.name} - {(formData.foto.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <span style={{ color: '#6b7280' }}>📷 Sin foto</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
        <button
          onClick={() => setCurrentStep(3)}
          style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#10b981',
          color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Enviando...' : '📤 Enviar Reporte'}
        </button>
      </div>
    </div>
  );

  // 🎉 PASO 5: Mensaje de agradecimiento
  const renderAgradecimiento = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
      <h2 style={{ color: '#10b981', marginBottom: '15px' }}>
        ¡Gracias por su participación!
      </h2>
      <p style={{ color: '#6b7280', fontSize: '18px', lineHeight: '1.6', marginBottom: '20px' }}>
        Su reporte ha sido enviado exitosamente. <br />
        <strong>¡Gracias por su participación ciudadana y su tiempo!</strong>
      </p>
      <p style={{ color: '#9ca3af', fontSize: '14px' }}>
        Su colaboración ayuda a mejorar nuestra comunidad
      </p>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#ecfdf5',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        color: '#166534'
      }}>
        ✅ Reporte registrado correctamente
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
      {/* 📊 Header con progreso */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px', textAlign: 'center' }}>
          📋 Reportes Ciudadanos
        </h1>
        
        {/* 📊 Barra de progreso */}
        {currentStep <= 5 && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto 20px auto',
            backgroundColor: '#e2e8f0',
            borderRadius: '10px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div
                            style={{
                height: '100%',
                backgroundColor: '#8b5cf6',
                width: `${(currentStep / 5) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}
        {currentStep <= 5 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Paso {currentStep} de 5
          </p>
        )}
      </div>

      {/* 🎯 Contenido del paso actual */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderStepContent()}
      </div>
      
      {/* Mensajes de estado */}
      {mensaje && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          borderRadius: '8px',
          backgroundColor: mensaje.includes('✅') ? '#dcfce7' : '#fef2f2',
          color: mensaje.includes('✅') ? '#166534' : '#dc2626',
          border: `1px solid ${mensaje.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      {/* 📊 LISTA DE REPORTES - Solo mostrar cuando no estamos en el flujo */}
      {currentStep === 1 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginTop: '30px'
        }}>
        <h2 style={{ color: '#374151', marginBottom: '20px' }}>
          📋 Lista de Reportes ({reportes.length})
        </h2>
        
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            ⏳ Cargando reportes...
          </div>
        )}
        
        {error && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fef2f2', 
            color: '#dc2626',
            borderRadius: '4px',
            border: '1px solid #fecaca'
          }}>
            ❌ Error al cargar reportes: {error.message}
          </div>
        )}
        
        {!isLoading && !error && reportes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            📭 No hay reportes disponibles
          </div>
        )}
        
        {!isLoading && !error && reportes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Header de la tabla */}
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    🏷️ Tipo
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📝 Descripción
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📍 Ubicación
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📊 Estatus
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📅 Fecha
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e2e8f0',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📷 Foto
                  </th>
                </tr>
              </thead>
              
              {/* Cuerpo de la tabla */}
              <tbody>
                {reportes.map((reporte, index) => (
                  <tr key={reporte.id || index} style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc'
                  }}>
                    <td style={{ padding: '12px', color: '#2563eb', fontWeight: '500' }}>
                      {reporte.tipo || 'Sin tipo'}
                    </td>
                    <td style={{ padding: '12px', color: '#4b5563', maxWidth: '200px' }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '14px'
                      }}>
                        {reporte.descripcion || 'Sin descripción'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#4b5563', fontSize: '14px' }}>
                      {reporte.latitud && reporte.longitud ? (
                        <span style={{ color: '#059669' }}>✅ Con coordenadas</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>❌ Sin ubicación</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: reporte.estado === 'resuelto' ? '#dcfce7' : 
                                       reporte.estado === 'en_progreso' ? '#fef3c7' : 
                                       reporte.estado === 'pendiente' ? '#dbeafe' : '#f3f4f6',
                        color: reporte.estado === 'resuelto' ? '#166534' : 
                               reporte.estado === 'en_progreso' ? '#92400e' : 
                               reporte.estado === 'pendiente' ? '#1d4ed8' : '#6b7280'
                      }}>
                        {reporte.estado || 'pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#9ca3af', fontSize: '13px' }}>
                      {reporte.fecha_creacion ? 
                        new Date(reporte.fecha_creacion).toLocaleDateString() : 
                        'Sin fecha'
                      }
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {reporte.foto_url ? (
                        <span style={{ color: '#059669', fontSize: '14px' }}>📷</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default ReportesCiudadanos; 
