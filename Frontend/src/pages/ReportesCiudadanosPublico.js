import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapaInteractivo from '../components/MapaInteractivo';
import api from '../api';
import { obtenerTituloPorValor } from '../constants/reportTypes';

// 🎯 FLUJO DE LÍNEA DE TIEMPO PARA REPORTES CIUDADANOS PÚBLICOS
const ReportesCiudadanosPublico = () => {
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
  
  // 🆕 NUEVO: Estado para confirmación de ubicación GPS
  const [gpsLocation, setGpsLocation] = useState(null);
  
  // 📸 Estado para funcionalidad de cámara
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // 🆕 NUEVO: Estado para tipos de reporte desde API
  const [tiposReporte, setTiposReporte] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // 🆕 NUEVO: Cargar tipos de reporte desde la API
  const cargarTiposReporte = async () => {
    try {
      setLoadingTipos(true);
      const response = await api.get('/tipos-reporte/');
      
      // 🔧 TRANSFORMAR datos del backend al formato del frontend
      const tiposTransformados = response.data.data.map(tipo => ({
        value: tipo.valor,
        title: tipo.nombre,
        icon: tipo.icono,
        desc: tipo.descripcion,
        categoria: tipo.categoria
      }));
      
      setTiposReporte(tiposTransformados);
      console.log('✅ Tipos de reporte cargados y transformados:', tiposTransformados);
    } catch (error) {
      console.error('❌ Error al cargar tipos de reporte:', error);
      // Fallback a tipos estáticos si falla la API
      setTiposReporte([
        { value: 'tala_arboles_ecologia', icon: '🌳', title: 'Tala de árboles/Ecología', desc: 'Problemas ambientales, tala de árboles, etc.' },
        { value: 'basura_alumbrado', icon: '🗑️', title: 'Basura/Alumbrado', desc: 'Recolección de basura, alumbrado público, etc.' },
        { value: 'transporte_urbano_rutas', icon: '🚌', title: 'Transporte urbano/Rutas', desc: 'Problemas con transporte público, rutas, etc.' },
        { value: 'agua_potable_drenaje', icon: '💧', title: 'Agua potable/Drenaje', desc: 'Problemas con agua potable, drenaje, etc.' },
        { value: 'policia_accidentes_delitos', icon: '🚔', title: 'Policía/Accidentes/Delitos', desc: 'Reportes de seguridad, accidentes, delitos, etc.' },
        { value: 'otro_queja_sugerencia', icon: '❓', title: 'Otro/Queja/Sugerencia', desc: 'Otros problemas, quejas o sugerencias' },
        { value: 'baches_banqueta_invadida', icon: '🔧', title: 'Baches/Banqueta invadida', desc: 'Baches en calles, banquetas invadidas, etc.' },
        { value: 'transito_vialidad', icon: '🚦', title: 'Tránsito/Vialidad', desc: 'Problemas de tránsito, semáforos, vialidad, etc.' },
        { value: 'obras_publicas_navojoa', icon: '🏠', title: 'Obras Públicas en Navojoa', desc: 'Problemas con obras públicas municipales' }
      ]);
    } finally {
      setLoadingTipos(false);
    }
  };

  // 🔧 FUNCIÓN: Generar título automático basado en tipo
  const generarTitulo = (tipo) => {
    return obtenerTituloPorValor(tipo) || 'Reporte Ciudadano';
  };

  // 🔧 FUNCIÓN: Convertir archivo a Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // 🆕 NUEVO: Cargar tipos de reporte al montar el componente
  useEffect(() => {
    cargarTiposReporte();
  }, []);

  // 🗺️ Función para obtener ubicación GPS actual
  const getCurrentLocation = () => {
    setLoading(true);
    setMensaje('🔄 Obteniendo su ubicación GPS...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // 🆕 NUEVO: Guardar ubicación GPS y ir a confirmación
          setGpsLocation({ lat: latitude, lng: longitude });
          setSelectedLocation({ lat: latitude, lng: longitude });
          setLoading(false);
          setMensaje('');
          setCurrentStep(2.6); // Ir al paso de confirmación GPS
        },
        (error) => {
          console.error('Error GPS:', error);
          setLoading(false);
          setMensaje('❌ Error al obtener ubicación GPS. Use el mapa para seleccionar manualmente.');
          setTimeout(() => {
            setMensaje('');
            setCurrentStep(2.5);
          }, 2000);
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

  // 🆕 NUEVA FUNCIÓN: Confirmar ubicación GPS
  const confirmGpsLocation = () => {
    if (gpsLocation) {
      setFormData(prev => ({
        ...prev,
        latitud: gpsLocation.lat,
        longitud: gpsLocation.lng,
      }));
      setCurrentStep(3); // Ir a paso de foto
    }
  };

  // 🆕 NUEVA FUNCIÓN: Ajustar ubicación GPS
  const adjustGpsLocation = () => {
    setCurrentStep(2.5); // Volver al paso de selección de ubicación
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

    // Validar que tengamos ubicación
    if (!formData.latitud || !formData.longitud) {
      setMensaje('❌ Por favor seleccione una ubicación en el mapa o use GPS');
      return;
    }

    console.log('📋 DATOS COMPLETOS PARA BACKEND:', {
      titulo: generarTitulo(formData.tipo),
      descripcion: formData.descripcion.trim(),
      tipo: formData.tipo,
      latitud: formData.latitud,
      longitud: formData.longitud,
      direccion: formData.direccion || '',
      prioridad: formData.prioridad,
      es_publico: true,
      foto: formData.foto ? 'Archivo adjunto' : 'Sin foto'
    });

    setLoading(true);
    setMensaje('🔄 Enviando reporte...');

    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      submitData.append('titulo', generarTitulo(formData.tipo));
      submitData.append('descripcion', formData.descripcion.trim());
      submitData.append('tipo', formData.tipo);
      submitData.append('latitud', formData.latitud);
      submitData.append('longitud', formData.longitud);
      submitData.append('direccion', formData.direccion || '');
      submitData.append('prioridad', formData.prioridad);
      submitData.append('es_publico', 'true');
      
      // Agregar foto si existe
      if (formData.foto) {
        submitData.append('foto', formData.foto);
      }

      console.log('📤 Enviando FormData al backend...');

      // Enviar reporte público
      const response = await api.post('/reportes-ciudadanos/publico', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Respuesta del backend:', response);

      if (response.status === 200 || response.status === 201) {
        setLoading(false);
        setMensaje('✅ Reporte enviado exitosamente');
        setShowSuccess(true);
        setCurrentStep(5); // Paso de agradecimiento
        
        // Reset after 3 seconds and redirect to map
        setTimeout(() => {
          navigate('/mapa-reportes-publico');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error al crear reporte:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setLoading(false);
      
      // Mensaje de error más específico
      if (error.response?.status === 500) {
        setMensaje('❌ Error del servidor. Por favor, intente más tarde o contacte al administrador.');
      } else if (error.response?.status === 400) {
        setMensaje('❌ Datos inválidos. Verifique la información ingresada.');
      } else {
        setMensaje('❌ Error al crear el reporte. Intenta nuevamente.');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 📸 Funciones para funcionalidad de cámara
  const startCamera = async () => {
    // En dispositivos móviles, usar input file con capture
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Crear input file temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Usar cámara trasera
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setFormData(prev => ({ ...prev, foto: file }));
          setMensaje('✅ Foto capturada exitosamente');
          setTimeout(() => {
            setMensaje('');
            setCurrentStep(4); // Ir al resumen
          }, 2000);
        }
      };
      
      input.click();
    } else {
      // En desktop, usar cámara web
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // Usar cámara trasera si está disponible
        });
        setCameraStream(stream);
        setShowCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Usa la opción de subir archivo.');
      }
    }
  };

  const openFileSelector = () => {
    // Crear input file para seleccionar archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({ ...prev, foto: file }));
        setMensaje('✅ Archivo seleccionado exitosamente');
        setTimeout(() => {
          setMensaje('');
          setCurrentStep(4); // Ir al resumen
        }, 2000);
      }
    };
    
    input.click();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0);
      
      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Crear un archivo File desde el blob
          const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFormData(prev => ({ ...prev, foto: file }));
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // 🎯 FLUJO CON MAPA Y FOTO - 6 PASOS TOTAL
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderTipoReporte();
      case 2: return renderDescripcion();
      case 2.5: return renderUbicacion(); // 🆕 NUEVO: Paso de ubicación (mapa/GPS)
      case 2.6: return renderLocationConfirmation(); // 🆕 NUEVO: Paso de confirmación GPS
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
        {loadingTipos ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>
            <div>🔄 Cargando tipos de reporte...</div>
          </div>
        ) : (
          tiposReporte.map((tipo) => (
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
        ))
        )}
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

  // 🆕 NUEVO PASO: Confirmación de ubicación GPS
  const renderLocationConfirmation = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '10px' }}>
        📍 Confirma tu ubicación detectada
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Hemos detectado tu ubicación actual. ¿Es correcta o quieres ajustarla?
      </p>

      {/* 🗺️ Mapa con ubicación GPS */}
      <div style={{ marginTop: '20px' }}>
        <MapaInteractivo
          onLocationSelect={handleLocationSelect}
          selectedLocation={gpsLocation}
          modo="seleccion"
          center={gpsLocation ? [gpsLocation.lat, gpsLocation.lng] : [19.4326, -99.1332]}
          zoom={16}
        />
      </div>

      {/* 📍 Información de ubicación GPS */}
      {gpsLocation && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '20px auto 0'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>
            📍 Ubicación GPS detectada
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Latitud:</strong> {gpsLocation.lat.toFixed(6)}
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Longitud:</strong> {gpsLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* 🔘 Botones de acción */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center', 
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={confirmGpsLocation}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ✅ Sí, es correcta - Continuar
        </button>

        <button
          onClick={adjustGpsLocation}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔧 Ajustar ubicación
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
  const renderFoto = () => {

    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#374151', marginBottom: '10px' }}>
          📸 Foto del problema (opcional)
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Toma una foto con tu cámara o sube una imagen existente.
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Opciones de foto */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={startCamera}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📷 Tomar Foto
            </button>

            <button
              onClick={openFileSelector}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📁 Seleccionar Archivo
            </button>
          </div>

          {/* Cámara activa */}
          {showCamera && (
            <div style={{ 
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#374151', marginBottom: '15px' }}>
                📷 Cámara Activa
              </h3>
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              />
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={takePhoto}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  📸 Capturar
                </button>
                
                <button
                  onClick={stopCamera}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Foto seleccionada */}
          {formData.foto && (
            <div style={{ 
              marginTop: '20px', 
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              border: '2px solid #10b981'
            }}>
              <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
                ✅ Foto Seleccionada
              </h3>
              
              <img
                src={URL.createObjectURL(formData.foto)}
                alt="Reporte"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px',
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  border: '2px solid #10b981'
                }}
              />
              
              <div style={{ marginBottom: '15px' }}>
                <p style={{ color: '#374151', margin: '5px 0' }}>
                  <strong>Nombre:</strong> {formData.foto.name}
                </p>
                <p style={{ color: '#374151', margin: '5px 0' }}>
                  <strong>Tamaño:</strong> {(formData.foto.size / 1024).toFixed(1)} KB
                </p>
              </div>
              
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
                🗑️ Eliminar Foto
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
  };

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
            {formData.tipo && (
              <>
                {obtenerTituloPorValor(formData.tipo)}
                <span style={{ marginLeft: '8px' }}>
                  {tiposReporte.find(t => t.value === formData.tipo)?.icon || '📋'}
                </span>
              </>
            )}
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
      
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '20px' }}>
        Redirigiendo al mapa de reportes en unos segundos...
      </p>
      
      {/* 🚀 BOTONES DE NAVEGACIÓN MANUAL */}
      <div style={{ 
        marginTop: '30px',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
                          onClick={() => navigate('/mapa-reportes-publico')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          🗺️ Ir al Mapa de Reportes
        </button>
        
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          📝 Crear Otro Reporte
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
      {/* 📊 Header con progreso */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px', textAlign: 'center' }}>
          📋 Reportes Ciudadanos Públicos
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

      {/* 🔙 Botón para volver al inicio */}
      {currentStep === 1 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/')}
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
            ← Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportesCiudadanosPublico;
