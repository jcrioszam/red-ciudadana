import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCalendar, FiFilter, FiEye, FiAlertTriangle } from 'react-icons/fi';
import MapaInteractivo from '../components/MapaInteractivo';
import api from '../api';

export default function MapaReportesPublico() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // Cargar reportes al montar el componente
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando reportes públicos...');
      const response = await api.get('/reportes-publicos');
      console.log('✅ Reportes cargados:', response.data);
      const reportesData = response.data.data || [];
      console.log('📊 Cantidad de reportes:', reportesData.length);
      
      if (reportesData.length > 0) {
        console.log('📍 Primer reporte:', {
          latitud: reportesData[0].latitud,
          longitud: reportesData[0].longitud,
          titulo: reportesData[0].titulo
        });
        
        // 🔧 NUEVO: Logging detallado del primer reporte
        console.log('🔍 ESTRUCTURA COMPLETA del primer reporte:', reportesData[0]);
        console.log('📸 ¿Tiene fotos?', reportesData[0].fotos);
        console.log('📸 ¿Tiene flag tiene_foto?', reportesData[0].tiene_foto);
        console.log('📸 Array de fotos:', reportesData[0].fotos);
        
        // 🔧 NUEVO: Verificar todos los reportes que tienen fotos
        const reportesConFotos = reportesData.filter(r => r.fotos && r.fotos.length > 0);
        console.log('📸 Reportes con fotos:', reportesConFotos.length);
        console.log('📸 Detalles de reportes con fotos:', reportesConFotos);
        
        // 🔧 NUEVO: Logging detallado de cada reporte con fotos
        reportesConFotos.forEach((reporte, index) => {
          console.log(`📸 REPORTE ${index + 1} CON FOTOS:`);
          console.log(`   ID: ${reporte.id}`);
          console.log(`   Título: ${reporte.titulo}`);
          console.log(`   Coordenadas: [${reporte.latitud}, ${reporte.longitud}]`);
          console.log(`   Fotos:`, reporte.fotos);
          console.log(`   Tiene foto: ${reporte.tiene_foto}`);
        });
      }
      
      setReportes(reportesData);
      setError(null);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      let url = '/reportes-publicos?';
      
      if (filtros.tipo) url += `tipo=${filtros.tipo}&`;
      if (filtros.estado) url += `estado=${filtros.estado}&`;
      if (filtros.fecha_inicio) url += `fecha_inicio=${filtros.fecha_inicio}&`;
      if (filtros.fecha_fin) url += `fecha_fin=${filtros.fecha_fin}&`;

      const response = await api.get(url);
      setReportes(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
      setError('Error al aplicar los filtros');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    cargarReportes();
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      'dano_via_publica': '🚧',
      'servicios_publicos': '🚰',
      'seguridad': '🚨',
      'limpieza': '🧹',
      'otro': '📋'
    };
    return iconos[tipo] || '📋';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#f59e0b',
      'en_revision': '#3b82f6',
      'en_progreso': '#8b5cf6',
      'resuelto': '#10b981',
      'rechazado': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado'
    };
    return textos[estado] || estado;
  };

  const getTipoTexto = (tipo) => {
    const textos = {
      'dano_via_publica': 'Daño Vía Pública',
      'servicios_publicos': 'Servicios Públicos',
      'seguridad': 'Seguridad',
      'limpieza': 'Limpieza',
      'otro': 'Otro'
    };
    return textos[tipo] || tipo;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular el centro del mapa basado en los reportes
  const calcularCentroMapa = () => {
    console.log('🔍 Calculando centro del mapa...');
    console.log('📊 Total de reportes:', reportes.length);
    
    if (reportes.length === 0) {
      console.log('📍 No hay reportes, usando Sonora por defecto');
      return [29.0729, -110.9559]; // Sonora por defecto (Hermosillo)
    }
    
    const totalLat = reportes.reduce((sum, reporte) => sum + reporte.latitud, 0);
    const totalLng = reportes.reduce((sum, reporte) => sum + reporte.longitud, 0);
    
    const centroLat = totalLat / reportes.length;
    const centroLng = totalLng / reportes.length;
    
    console.log('📍 Centro calculado:', [centroLat, centroLng]);
    console.log('📊 Reportes disponibles:', reportes.map(r => `[${r.latitud}, ${r.longitud}]`));
    
    return [centroLat, centroLng];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            marginRight: '15px'
          }}
        >
          <FiArrowLeft />
        </button>
        <h1 style={{ color: '#2563eb', margin: 0 }}>
          🗺️ Mapa de Reportes Ciudadanos
        </h1>
      </div>

      {/* Filtros */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3 style={{ color: '#374151', margin: 0 }}>
            <FiFilter style={{ marginRight: '8px' }} />
            Filtros
          </h3>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
          </button>
        </div>

        {mostrarFiltros && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="dano_via_publica">🚧 Daño Vía Pública</option>
              <option value="servicios_publicos">🚰 Servicios Públicos</option>
              <option value="seguridad">🚨 Seguridad</option>
              <option value="limpieza">🧹 Limpieza</option>
              <option value="otro">📋 Otro</option>
            </select>

            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="en_revision">🔍 En Revisión</option>
              <option value="en_progreso">⚡ En Progreso</option>
              <option value="resuelto">✅ Resuelto</option>
              <option value="rechazado">❌ Rechazado</option>
            </select>

            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Fecha inicio"
            />

            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Fecha fin"
            />
          </div>
        )}

        {mostrarFiltros && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={aplicarFiltros}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔍 Aplicar Filtros
            </button>
            <button
              onClick={limpiarFiltros}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🗑️ Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
            {reportes.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Reportes</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {reportes.filter(r => r.estado === 'resuelto').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Resueltos</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {reportes.filter(r => r.estado === 'pendiente').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Pendientes</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {reportes.filter(r => r.estado === 'en_progreso').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>En Progreso</div>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>
          📍 Ubicación de los Reportes
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
            <p>Cargando mapa...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
                         <MapaInteractivo
               modo="visualizacion"
               reportes={reportes}
               onReporteClick={setReporteSeleccionado}
               center={calcularCentroMapa()}
               zoom={reportes.length > 0 ? 12 : 8}
             />
             {console.log('🗺️ Mapa renderizado con:', {
               center: calcularCentroMapa(),
               zoom: reportes.length > 0 ? 12 : 10,
               reportesCount: reportes.length
             })}
          </div>
        )}
      </div>

      {/* Lista de reportes */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>
          📋 Lista de Reportes ({reportes.length})
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
            <p>Cargando reportes...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
            <p>{error}</p>
          </div>
        ) : reportes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <p>No hay reportes para mostrar</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '15px'
          }}>
            {reportes.map((reporte) => (
              <div
                key={reporte.id}
                onClick={() => setReporteSeleccionado(reporte)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: reporteSeleccionado?.id === reporte.id ? '#f0f9ff' : 'white'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px', marginRight: '10px' }}>
                    {getTipoIcon(reporte.tipo)}
                  </span>
                  <div>
                    <h4 style={{ color: '#374151', margin: '0 0 5px 0', fontSize: '16px' }}>
                      {reporte.titulo}
                    </h4>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'white',
                      backgroundColor: getEstadoColor(reporte.estado)
                    }}>
                      {getEstadoTexto(reporte.estado)}
                    </div>
                  </div>
                </div>
                
                <p style={{ 
                  color: '#6b7280', 
                  margin: '10px 0', 
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {reporte.descripcion.length > 100 
                    ? `${reporte.descripcion.substring(0, 100)}...` 
                    : reporte.descripcion
                  }
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiMapPin />
                    {reporte.tipo ? getTipoTexto(reporte.tipo) : 'Sin tipo'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiCalendar />
                    {formatearFecha(reporte.fecha_creacion)}
                  </div>
                  {/* 🔧 NUEVO: Indicador de foto */}
                  {reporte.tiene_foto && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      color: '#10b981',
                      fontWeight: 'bold'
                    }}>
                      📸 Con foto
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de reporte seleccionado */}
      {reporteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setReporteSeleccionado(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '32px', marginRight: '15px' }}>
                  {getTipoIcon(reporteSeleccionado.tipo)}
                </span>
                <div>
                  <h2 style={{ color: '#374151', margin: '0 0 5px 0' }}>
                    {reporteSeleccionado.titulo}
                  </h2>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'white',
                    backgroundColor: getEstadoColor(reporteSeleccionado.estado)
                  }}>
                    {getEstadoTexto(reporteSeleccionado.estado)}
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ color: '#374151', margin: '0 0 8px 0' }}>Descripción:</h4>
                <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                  {reporteSeleccionado.descripcion}
                </p>
              </div>
              
              {/* 🔧 NUEVO: Sección de fotos */}
              {reporteSeleccionado.fotos && reporteSeleccionado.fotos.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#374151', margin: '0 0 12px 0' }}>
                    📸 Fotos del Reporte ({reporteSeleccionado.fotos.length})
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '15px'
                  }}>
                    {reporteSeleccionado.fotos.map((foto, index) => (
                      <div key={foto.id} style={{ textAlign: 'center' }}>
                        <img
                          src={foto.url}
                          alt={`Foto ${index + 1} del reporte`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                          onClick={() => {
                            // 🔧 NUEVO: Abrir foto en modal grande
                            window.open(foto.url, '_blank');
                          }}
                          title="Haz clic para ver en tamaño completo"
                        />
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#6b7280', 
                          margin: '5px 0 0 0',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}>
                          {foto.nombre_archivo}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div>
                  <strong style={{ color: '#374151' }}>Tipo:</strong>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                    {getTipoTexto(reporteSeleccionado.tipo)}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>Prioridad:</strong>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                    {reporteSeleccionado.prioridad || 'Normal'}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>Fecha:</strong>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                    {formatearFecha(reporteSeleccionado.fecha_creacion)}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>Ubicación:</strong>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                    {reporteSeleccionado.latitud?.toFixed(6)}, {reporteSeleccionado.longitud?.toFixed(6)}
                  </p>
                </div>
              </div>
              
              {reporteSeleccionado.direccion && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#374151' }}>Dirección:</strong>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>
                    {reporteSeleccionado.direccion}
                  </p>
                </div>
              )}
              
              {reporteSeleccionado.observaciones_admin && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ color: '#374151', margin: '0 0 8px 0' }}>Observaciones:</h4>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    {reporteSeleccionado.observaciones_admin}
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setReporteSeleccionado(null)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
