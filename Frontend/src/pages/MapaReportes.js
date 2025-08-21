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

  // 🆕 NUEVAS FUNCIONES: Cálculo de estadísticas detalladas
  
  // 📊 Contar reportes por tipo
  const tiposReportes = reportes.reduce((acc, reporte) => {
    const tipo = reporte.tipo || 'sin_tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  // 🔍 Identificar reportes similares (mismo tipo y descripción similar)
  const reportesSimilares = Object.entries(tiposReportes)
    .filter(([tipo, count]) => count > 1)
    .map(([tipo, count]) => {
      const reportesDelTipo = reportes.filter(r => r.tipo === tipo);
      const descripciones = reportesDelTipo.map(r => r.descripcion || '').filter(d => d.length > 0);
      
      // Encontrar descripción más común
      const descripcionComun = descripciones.length > 0 
        ? descripciones.sort((a, b) => 
            descripciones.filter(d => d === a).length - 
            descripciones.filter(d => d === b).length
          ).pop()
        : 'Sin descripción';
      
      const conUbicacion = reportesDelTipo.filter(r => r.latitud && r.longitud && r.latitud !== 0 && r.longitud !== 0).length;
      const sinUbicacion = count - conUbicacion;
      
      return {
        tipo,
        count,
        descripcion: descripcionComun,
        conUbicacion,
        sinUbicacion
      };
    })
    .sort((a, b) => b.count - a.count);

  // 📅 Estadísticas por período de tiempo
  const ahora = new Date();
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const estadisticasPorFecha = [
    {
      periodo: 'Últimos 7 días',
      count: reportes.filter(r => new Date(r.fecha_creacion) > hace7Dias).length
    },
    {
      periodo: 'Últimos 30 días',
      count: reportes.filter(r => new Date(r.fecha_creacion) > hace30Dias).length
    },
    {
      periodo: 'Este mes',
      count: reportes.filter(r => {
        const fecha = new Date(r.fecha_creacion);
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      }).length
    }
  ];

  // 📷 Contar reportes con y sin fotos
  const reportesConFoto = reportes.filter(r => r.foto_url && r.foto_url.trim() !== '').length;
  const reportesSinFoto = reportes.length - reportesConFoto;

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
        padding: '20px',
        marginBottom: '20px'
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

      {/* 🆕 NUEVO: Estadísticas detalladas de reportes */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '20px', fontSize: '18px' }}>
          📊 Estadísticas Detalladas de Reportes
        </h3>
        
        {/* 📈 Estadísticas por tipo */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#4b5563', marginBottom: '15px', fontSize: '16px' }}>
            🏷️ Reportes por Tipo
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {Object.entries(tiposReportes).map(([tipo, count]) => (
              <div key={tipo} style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                  {tipo.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔍 Reportes similares */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#4b5563', marginBottom: '15px', fontSize: '16px' }}>
            🔍 Análisis de Reportes Similares
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {reportesSimilares.map((grupo, index) => (
              <div key={index} style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔗</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1' }}>
                    Grupo de {grupo.count} reportes similares
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
                  <strong>Tipo:</strong> {grupo.tipo}<br />
                  <strong>Descripción similar:</strong> {grupo.descripcion}<br />
                  <strong>Ubicaciones:</strong> {grupo.conUbicacion} con coordenadas, {grupo.sinUbicacion} sin coordenadas
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📅 Estadísticas por fecha */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#4b5563', marginBottom: '15px', fontSize: '16px' }}>
            📅 Reportes por Período
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            {estadisticasPorFecha.map((stat, index) => (
              <div key={index} style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                  {stat.count}
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  {stat.periodo}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📷 Estadísticas de fotos */}
        <div>
          <h4 style={{ color: '#4b5563', marginBottom: '15px', fontSize: '16px' }}>
            📷 Reportes con Fotos
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>
                {reportesConFoto}
              </div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                Con Foto
              </div>
            </div>
            <div style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6b7280' }}>
                {reportesSinFoto}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Sin Foto
              </div>
            </div>
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
