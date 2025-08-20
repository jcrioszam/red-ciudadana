import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// 🎯 FLUJO DE LÍNEA DE TIEMPO PARA REPORTES CIUDADANOS
const ReportesCiudadanos = () => {
  // 📋 Estado del flujo step-by-step
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '', // Campo requerido por backend
    descripcion: '',
    ubicacion: '',
    latitud: '',
    longitud: '',
    direccion: '', // Campo para direccion/ubicacion 
    foto: null
  });
  
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  // 🔒 HTTPS HARDCODED - NO depende de variables
  const API_BASE = 'https://red-ciudadana-production.up.railway.app';

  // ✅ FUNCIÓN SIMPLE PARA OBTENER REPORTES
  const fetchReportes = async () => {
    console.log('🚀 FETCHING reportes desde:', `${API_BASE}/reportes-ciudadanos/`);
    
      const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE}/reportes-ciudadanos/`, {
      method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ REPORTES CARGADOS:', data);
    return data;
  };

  // ✅ FUNCIÓN SIMPLE PARA CREAR REPORTE
  const createReporte = async (data) => {
    console.log('🚀 CREANDO reporte en:', `${API_BASE}/reportes-ciudadanos/`);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE}/reportes-ciudadanos/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ REPORTE CREADO:', result);
    return result;
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
          titulo: '',
          descripcion: '',
          ubicacion: '',
          latitud: '',
          longitud: '',
          direccion: '',
          foto: null
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
    
    // 🔧 PREPARAR DATOS PARA EL BACKEND
    const reporteData = {
      titulo: generarTitulo(formData.tipo), // Generar título automático
      descripcion: formData.descripcion.trim(),
      tipo: formData.tipo,
      latitud: parseFloat(formData.latitud) || 0, // Convertir a número
      longitud: parseFloat(formData.longitud) || 0, // Convertir a número
      direccion: formData.ubicacion || formData.direccion || null, // Usar ubicacion como direccion
      foto_url: null, // Por ahora sin foto
      prioridad: 'normal' // Valor por defecto
    };
    
    console.log('📋 DATOS PREPARADOS PARA BACKEND:', reporteData);
    
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

  // 🎨 Renderizar flujo paso a paso
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTipoReporte();
      case 2:
        return renderUbicacion();
      case 2.5:
        return renderUbicacionManual();
      case 3:
        return renderFoto();
      case 4:
        return renderResumen();
      case 5:
        return renderAgradecimiento();
      default:
        return renderTipoReporte();
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

  // 📍 PASO 2: Selección de ubicación
  const renderUbicacion = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📍 ¿Dónde ocurre el problema?
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Seleccione cómo quiere indicar la ubicación
      </p>
      
      <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: loading ? 0.7 : 1
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>
            {loading ? '⏳' : '📱'}
          </span>
          {loading ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual (GPS)'}
        </button>
        
        <button
          onClick={() => setCurrentStep(2.5)} // Sub-paso para entrada manual
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📝</span>
          Escribir dirección manualmente
        </button>
        
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  );

  // 📝 PASO 2.5: Entrada manual de ubicación
  const renderUbicacionManual = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📝 Escriba la dirección
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Ingrese la dirección o referencias del lugar
      </p>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <textarea
          value={formData.ubicacion}
          onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
          placeholder="Ej: Calle Principal #123, Colonia Centro, cerca del parque..."
          rows="4"
          style={{
            width: '100%',
            padding: '15px',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '16px',
            marginBottom: '20px',
            resize: 'vertical'
          }}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
            onClick={() => setCurrentStep(3)}
            disabled={!formData.ubicacion.trim()}
            style={{
              backgroundColor: formData.ubicacion.trim() ? '#2563eb' : '#9ca3af',
          color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: formData.ubicacion.trim() ? 'pointer' : 'not-allowed',
              opacity: formData.ubicacion.trim() ? 1 : 0.6
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );

  // 📸 PASO 3: Opción de foto
  const renderFoto = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📸 ¿Desea adjuntar una foto?
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Una foto ayuda a entender mejor el problema
      </p>
      
      <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button
          onClick={() => setCurrentStep(4)}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📷</span>
          Tomar/Subir foto
        </button>
        
        <button
          onClick={() => setCurrentStep(4)}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Omitir foto y continuar
        </button>
        
        <button
          onClick={() => setCurrentStep(2)}
                            style={{
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  );

  // 📋 PASO 4: Resumen y envío
  const renderResumen = () => (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '500px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📋 Resumen de su reporte
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Revise los datos antes de enviar
      </p>
      
      <div style={{ 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'left'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Tipo:</strong>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {formData.tipo.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Ubicación:</strong>
          <div style={{ color: '#6b7280', marginTop: '5px' }}>
            {formData.ubicacion || 'Sin ubicación especificada'}
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#374151' }}>Descripción: *</strong>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>
            {formData.descripcion.trim() ? '✅ Descripción completa' : '⚠️ Requerida para continuar'}
          </div>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Describe el problema detalladamente... (REQUERIDO)"
            rows="4"
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              border: formData.descripcion.trim() ? '2px solid #10b981' : '2px solid #ef4444',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.descripcion.trim() ? '#f0fdf4' : '#fef2f2'
            }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
          disabled={loading || !formData.descripcion.trim()}
          style={{
            backgroundColor: loading ? '#9ca3af' : (!formData.descripcion.trim() ? '#ef4444' : '#10b981'),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading || !formData.descripcion.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !formData.descripcion.trim() ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Enviando...' : 
           !formData.descripcion.trim() ? '❌ Complete descripción' : 
           '📤 Enviar Reporte'}
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
        
        {/* Progress bar */}
        {currentStep <= 4 && currentStep !== 2.5 && (
          <div style={{ 
            backgroundColor: '#f1f5f9', 
            borderRadius: '10px', 
            padding: '5px',
            marginBottom: '20px'
          }}>
            <div 
              style={{
                backgroundColor: '#2563eb',
                height: '8px',
                borderRadius: '8px',
                width: `${(currentStep / 4) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}
        
        {currentStep <= 4 && currentStep !== 2.5 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Paso {Math.floor(currentStep)} de 4
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
