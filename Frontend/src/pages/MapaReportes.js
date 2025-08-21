import React from 'react';
import { useQuery } from 'react-query';
import MapaInteractivo from '../components/MapaInteractivo';
import api from '../api';

// 🗺️ PÁGINA DE MAPA DE REPORTES CIUDADANOS
const MapaReportes = () => {
  // 📊 Cargar reportes desde el backend
  const { data: reportes = [], isLoading, error } = useQuery(
    'reportes-ciudadanos-mapa',
    async () => {
      console.log('🗺️ Cargando reportes para el mapa...');
      const response = await api.get('/reportes-ciudadanos/');
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      retry: 2
    }
  );

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <div style={{ color: '#6b7280', fontSize: '18px' }}>
          Cargando mapa de reportes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>
          Error al cargar reportes
        </h2>
        <p style={{ color: '#7f1d1d' }}>
          {error.message || 'No se pudieron cargar los reportes para el mapa'}
        </p>
      </div>
    );
  }

  // 📊 Filtrar reportes que tienen coordenadas válidas
  const reportesConUbicacion = reportes.filter(reporte => 
    reporte.latitud && reporte.longitud && 
    reporte.latitud !== 0 && reporte.longitud !== 0
  );

  const reportesSinUbicacion = reportes.length - reportesConUbicacion.length;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 📋 Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '10px', textAlign: 'center' }}>
          🗺️ Mapa de Reportes Ciudadanos
        </h1>
        <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '20px' }}>
          Visualización geográfica de todos los reportes registrados
        </p>

        {/* 📊 Estadísticas */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '15px 20px',
            textAlign: 'center',
            minWidth: '140px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
              {reportes.length}
            </div>
            <div style={{ fontSize: '12px', color: '#15803d' }}>
              Total de Reportes
            </div>
          </div>

          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '15px 20px',
            textAlign: 'center',
            minWidth: '140px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
              {reportesConUbicacion.length}
            </div>
            <div style={{ fontSize: '12px', color: '#2563eb' }}>
              Con Ubicación
            </div>
          </div>

          {reportesSinUbicacion > 0 && (
            <div style={{
              backgroundColor: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              padding: '15px 20px',
              textAlign: 'center',
              minWidth: '140px'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c53030' }}>
                {reportesSinUbicacion}
              </div>
              <div style={{ fontSize: '12px', color: '#e53e3e' }}>
                Sin Ubicación
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Mapa principal */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        marginBottom: '30px'
      }}>
        {reportesConUbicacion.length > 0 ? (
          <MapaInteractivo 
            reportes={reportesConUbicacion}
            modo="visualizacion"
            center={
              reportesConUbicacion.length > 0 
                ? [reportesConUbicacion[0].latitud, reportesConUbicacion[0].longitud]
                : [19.4326, -99.1332] // CDMX por defecto
            }
            zoom={13}
          />
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
            <h3 style={{ color: '#374151', marginBottom: '10px' }}>
              No hay reportes con ubicación para mostrar
            </h3>
            <p>
              Los reportes aparecerán en el mapa cuando incluyan coordenadas válidas
            </p>
          </div>
        )}
      </div>

      {/* 📊 Leyenda */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px', fontSize: '16px' }}>
          📋 Leyenda del Mapa
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#dc2626',
              borderRadius: '50%'
            }}></div>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              Reportes Ciudadanos
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            • Haz clic en cualquier marcador para ver detalles del reporte
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            • Usa la rueda del mouse para hacer zoom
          </div>
        </div>
      </div>

      {/* 📝 Nota sobre reportes sin ubicación */}
      {reportesSinUbicacion > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <div style={{ color: '#92400e', fontSize: '14px' }}>
            📍 <strong>Nota:</strong> {reportesSinUbicacion} reporte{reportesSinUbicacion > 1 ? 's' : ''} 
            {reportesSinUbicacion > 1 ? ' no aparecen' : ' no aparece'} en el mapa porque 
            {reportesSinUbicacion > 1 ? ' no tienen' : ' no tiene'} coordenadas de ubicación válidas.
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaReportes;
