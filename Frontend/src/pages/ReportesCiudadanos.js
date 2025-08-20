import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// 🧹 COMPONENTE LIMPIO SIN MIXED CONTENT
const ReportesCiudadanos = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    ubicacion: '',
    latitud: '',
    longitud: ''
  });
  
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
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
    onSuccess: () => {
      setMensaje('✅ Reporte creado exitosamente');
      setFormData({
        tipo: '',
        descripcion: '',
        ubicacion: '',
        latitud: '',
        longitud: ''
      });
      // Invalidar cache para refrescar la lista
      queryClient.invalidateQueries('reportes-ciudadanos');
    },
    onError: (error) => {
      setMensaje(`❌ Error: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    
    createMutation.mutate(formData);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '30px' }}>📋 Reportes Ciudadanos</h1>
      
      {/* 🆕 FORMULARIO SIMPLE */}
      <div style={{ 
        backgroundColor: '#f8fafc', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '20px' }}>Crear Nuevo Reporte</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tipo de Reporte:
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              >
                <option value="">Seleccionar tipo</option>
                <option value="dano_via_publica">Daño Vía Pública</option>
                <option value="servicios_publicos">Servicios Públicos</option>
                <option value="seguridad">Seguridad</option>
                <option value="limpieza">Limpieza</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Ubicación:
              </label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                required
                placeholder="Dirección o referencia"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Descripción:
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              required
              placeholder="Describe detalladamente el problema"
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Latitud:
              </label>
              <input
                type="number"
                step="any"
                name="latitud"
                value={formData.latitud}
                onChange={handleChange}
                placeholder="Ej: 19.4326"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Longitud:
              </label>
              <input
                type="number"
                step="any"
                name="longitud"
                value={formData.longitud}
                onChange={handleChange}
                placeholder="Ej: -99.1332"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || createMutation.isLoading}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading || createMutation.isLoading ? '⏳ Creando...' : '📤 Crear Reporte'}
          </button>
        </form>
        
        {/* Mensaje de estado */}
        {mensaje && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            borderRadius: '4px',
            backgroundColor: mensaje.includes('✅') ? '#dcfce7' : '#fef2f2',
            color: mensaje.includes('✅') ? '#166534' : '#dc2626',
            border: `1px solid ${mensaje.includes('✅') ? '#bbf7d0' : '#fecaca'}`
          }}>
            {mensaje}
          </div>
        )}
      </div>

      {/* 📊 LISTA DE REPORTES */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
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
    </div>
  );
};

export default ReportesCiudadanos;
