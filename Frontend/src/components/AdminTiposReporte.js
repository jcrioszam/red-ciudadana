import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminTiposReporte = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Cargar todos los tipos de reporte
  const cargarTipos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tipos-reporte/');
      setTipos(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar tipos:', err);
      setError('Error al cargar los tipos de reporte');
    } finally {
      setLoading(false);
    }
  };

  // Activar/desactivar tipo de reporte
  const toggleTipo = async (valor, activoActual) => {
    try {
      const nuevoEstado = !activoActual;
      const response = await api.put(`/admin/tipos-reporte/${valor}/activar?activo=${nuevoEstado}`);
      
      setMensaje(response.data.message);
      setTipos(prev => prev.map(tipo => 
        tipo.valor === valor ? { ...tipo, activo: nuevoEstado } : tipo
      ));
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al cambiar el estado del tipo de reporte');
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div>🔄 Cargando tipos de reporte...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
        <div>❌ {error}</div>
        <button 
          onClick={cargarTipos}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#374151', marginBottom: '20px' }}>
        🎛️ Administrar Tipos de Reporte
      </h2>
      
      {mensaje && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '6px',
          color: '#065f46',
          marginBottom: '20px'
        }}>
          ✅ {mensaje}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {tipos.map((tipo) => (
          <div
            key={tipo.valor}
            style={{
              border: `2px solid ${tipo.activo ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: tipo.activo ? '#f0fdf4' : '#fef2f2',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '2rem', marginRight: '12px' }}>{tipo.icono}</span>
              <div>
                <h3 style={{ 
                  margin: '0', 
                  color: tipo.activo ? '#065f46' : '#991b1b',
                  fontSize: '18px'
                }}>
                  {tipo.nombre}
                </h3>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  backgroundColor: tipo.activo ? '#10b981' : '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  {tipo.categoria}
                </span>
              </div>
            </div>

            <p style={{ 
              color: tipo.activo ? '#374151' : '#6b7280',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {tipo.descripcion}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                color: tipo.activo ? '#10b981' : '#ef4444',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {tipo.activo ? '🟢 ACTIVO' : '🔴 INACTIVO'}
              </span>

              <button
                onClick={() => toggleTipo(tipo.valor, tipo.activo)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tipo.activo ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {tipo.activo ? '❌ Desactivar' : '✅ Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong>💡 Información:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Los tipos <strong>activos</strong> aparecen en el formulario de reportes</li>
          <li>Los tipos <strong>inactivos</strong> no están disponibles para los usuarios</li>
          <li>Los cambios se aplican inmediatamente</li>
          <li>Los reportes existentes no se ven afectados por estos cambios</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTiposReporte;
