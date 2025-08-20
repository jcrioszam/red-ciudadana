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
    // 🔧 REMOVER CAMPOS NUEVOS QUE CAUSAN ERROR 500
    // titulo: '',
    descripcion: '',
    // ubicacion: '',
    // latitud: '',
    // longitud: '',
    // direccion: '',
    // foto: null
  });
  
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
      // 🔧 REVERTIR A FORMATO ANTERIOR QUE FUNCIONABA
      const reporteSimple = {
        descripcion: data.descripcion,
        tipo: data.tipo,
        // Remover campos nuevos que causan error 500
        // titulo: data.titulo,
        // latitud: data.latitud,
        // longitud: data.longitud,
        // direccion: data.direccion,
        // foto_url: data.foto_url,
        prioridad: 'normal'
      };
      
      console.log('📋 DATOS SIMPLIFICADOS para backend:', reporteSimple);
      
      const response = await api.post('/reportes-ciudadanos/', reporteSimple);
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
          // 🔧 SOLO CAMPOS BÁSICOS QUE FUNCIONABAN
          descripcion: ''
        });
      }, 3000);
    },
    onError: (error) => {
      console.error('❌ ERROR AL CREAR REPORTE:', error);
      setLoading(false);
      setMensaje(`❌ Error: ${error.message}`);
    },
  });

    // 🏷️ Función para generar título automático basado en el tipo
  const generarTitulo = (tipo) => {
    const titulos = {
      'Alumbrado': 'Reporte de Problema de Alumbrado Público',
      'Baches': 'Reporte de Baches en la Vía',
      'Basura': 'Reporte de Gestión de Basura',
      'Agua': 'Reporte de Problema de Agua',
      'Seguridad': 'Reporte de Problema de Seguridad',
      'Tráfico': 'Reporte de Problema de Tráfico'
    };
    return titulos[tipo] || `Reporte de ${tipo}`;
  };

  // 🌍 Funciones de geolocalización
  const getCurrentLocation = () => {
    setMensaje('🔄 Obteniendo ubicación...');
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitud: position.coords.latitude.toString(),
            longitud: position.coords.longitude.toString(),
            ubicacion: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          }));
          setMensaje('✅ Ubicación obtenida correctamente');
          setLoading(false);
          setTimeout(() => {
            setMensaje('');
            setCurrentStep(3); // Ir a paso de foto
          }, 1000);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '🚫 Acceso a ubicación denegado. Use "Escribir dirección manualmente".';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '📍 Ubicación no disponible. Use "Escribir dirección manualmente".';
              break;
            case error.TIMEOUT:
              errorMessage = '⏰ Tiempo agotado. Use "Escribir dirección manualmente".';
              break;
            default:
              errorMessage = '❌ Error de ubicación. Use "Escribir dirección manualmente".';
              break;
          }
          
          setMensaje(errorMessage);
          
          // Auto-redirect a entrada manual después de 3 segundos
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
      setMensaje('❌ Geolocalización no soportada en este navegador.');
      setTimeout(() => {
        setMensaje('');
        setCurrentStep(2.5);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🚀 SUBMIT INICIADO - Datos del formulario:', formData);

    // Validar que tengamos los datos mínimos
    if (!formData.tipo || !formData.descripcion.trim()) {
      setMensaje('❌ Por favor complete tipo de reporte y descripción');
      return;
    }

    // 🔧 PREPARAR DATOS SIMPLES PARA EL BACKEND - SOLO LO QUE FUNCIONABA
    const reporteData = {
      descripcion: formData.descripcion.trim(),
      tipo: formData.tipo,
      prioridad: 'normal' // Valor por defecto
    };

    console.log('📋 DATOS SIMPLIFICADOS PARA BACKEND:', reporteData);

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

  // 🎯 FLUJO SIMPLIFICADO - SOLO LO QUE FUNCIONABA ANTES
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderTipoReporte();
      case 2: return renderDescripcion();
      case 3: return renderResumen();
      case 4: return renderAgradecimiento();
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
          onClick={() => setCurrentStep(3)}
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

  // 📋 PASO 3: Resumen del reporte
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
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
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
        {currentStep <= 3 && (
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
                width: `${(currentStep / 3) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}
        {currentStep <= 3 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Paso {currentStep} de 3
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {reportes.map((reporte, index) => (
              <div
                key={reporte.id || index}
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: '5px' }}>
                  {reporte.tipo || 'Sin tipo'}
                </div>
                <div style={{ color: '#4b5563', marginBottom: '10px', fontSize: '14px' }}>
                  📍 {reporte.ubicacion || 'Sin ubicación'}
                </div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
                  {reporte.descripcion || 'Sin descripción'}
                </div>
                {reporte.fecha_creacion && (
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    📅 {new Date(reporte.fecha_creacion).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default ReportesCiudadanos; 
