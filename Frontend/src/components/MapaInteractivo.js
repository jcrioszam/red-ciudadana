import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🔧 FIX: Configurar iconos de Leaflet para React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Componente para manejar clicks en el mapa
const MapClickHandler = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const MapaInteractivo = ({ 
  onLocationSelect, 
  selectedLocation, 
  reportes = [], 
  modo = 'seleccion', // 'seleccion' o 'visualizacion'
  center = [19.4326, -99.1332], // México City por defecto
  zoom = 13 
}) => {
  const [map, setMap] = useState(null);
  const mapRef = useRef();

  // 🔧 Función para calcular el centro y zoom óptimo basado en los reportes
  const calcularCentroYZoomOptimo = (reportes) => {
    if (!reportes || reportes.length === 0) {
      return { center: center, zoom: zoom };
    }

    // Calcular límites (bounds) de todos los reportes
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    reportes.forEach(reporte => {
      if (reporte.latitud && reporte.longitud) {
        minLat = Math.min(minLat, reporte.latitud);
        maxLat = Math.max(maxLat, reporte.latitud);
        minLng = Math.min(minLng, reporte.longitud);
        maxLng = Math.max(maxLng, reporte.longitud);
      }
    });

    // Si no hay coordenadas válidas, usar valores por defecto
    if (minLat === Infinity) {
      return { center: center, zoom: zoom };
    }

    // Calcular el centro
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calcular la extensión geográfica
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Calcular densidad de reportes (reportes por unidad de área aproximada)
    const area = latDiff * lngDiff;
    const densidad = reportes.length / Math.max(area, 0.0001); // Evitar división por cero

    // Calcular zoom óptimo basado en extensión y densidad
    let optimalZoom;
    
    if (maxDiff > 10) {
      optimalZoom = 8; // Zoom muy lejano para reportes muy dispersos
    } else if (maxDiff > 5) {
      optimalZoom = 10;
    } else if (maxDiff > 1) {
      optimalZoom = 12;
    } else if (maxDiff > 0.1) {
      optimalZoom = 14;
    } else if (maxDiff > 0.01) {
      optimalZoom = 16;
    } else {
      optimalZoom = 18; // Zoom muy cercano para reportes muy concentrados
    }

    // Ajustar zoom basado en densidad
    if (densidad > 1000) {
      optimalZoom = Math.min(optimalZoom + 2, 18); // Zoom más cercano para alta densidad
    } else if (densidad > 100) {
      optimalZoom = Math.min(optimalZoom + 1, 18);
    } else if (densidad < 10) {
      optimalZoom = Math.max(optimalZoom - 1, 8); // Zoom más lejano para baja densidad
    }

    // Agregar padding para mejor visualización
    const padding = Math.max(0.05, Math.min(0.2, 1 / reportes.length)); // Padding adaptativo
    const paddedMinLat = minLat - (latDiff * padding);
    const paddedMaxLat = maxLat + (latDiff * padding);
    const paddedMinLng = minLng - (lngDiff * padding);
    const paddedMaxLng = maxLng + (lngDiff * padding);

    return {
      center: [centerLat, centerLng],
      zoom: optimalZoom,
      bounds: [
        [paddedMinLat, paddedMinLng],
        [paddedMaxLat, paddedMaxLng]
      ],
      densidad: densidad,
      totalReportes: reportes.length
    };
  };

  // 🔧 Función para encontrar el área con mayor concentración de reportes
  const encontrarAreaConMasReportes = (reportes) => {
    if (!reportes || reportes.length === 0) return null;

    // Dividir el área en una cuadrícula y contar reportes en cada celda
    const gridSize = 10; // 10x10 cuadrícula
    const grid = {};
    
    reportes.forEach(reporte => {
      if (reporte.latitud && reporte.longitud) {
        // Crear coordenadas de cuadrícula (redondear a 2 decimales para agrupar)
        const gridLat = Math.round(reporte.latitud * 100) / 100;
        const gridLng = Math.round(reporte.longitud * 100) / 100;
        const key = `${gridLat},${gridLng}`;
        
        if (!grid[key]) {
          grid[key] = {
            lat: reporte.latitud,
            lng: reporte.longitud,
            count: 0,
            reportes: []
          };
        }
        grid[key].count++;
        grid[key].reportes.push(reporte);
      }
    });

    // Encontrar la celda con más reportes
    let maxCount = 0;
    let bestCell = null;
    
    Object.values(grid).forEach(cell => {
      if (cell.count > maxCount) {
        maxCount = cell.count;
        bestCell = cell;
      }
    });

    if (bestCell) {
      return {
        center: [bestCell.lat, bestCell.lng],
        zoom: 16, // Zoom cercano para ver el área con más reportes
        count: bestCell.count,
        reportes: bestCell.reportes
      };
    }

    return null;
  };

  // 🔧 Función para obtener coordenadas del usuario
  const getCurrentLocation = () => {
    console.log('🔍 Iniciando geolocalización...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Ubicación obtenida:', { latitude, longitude });
          
          // Verificar que onLocationSelect sea una función antes de llamarla
          if (typeof onLocationSelect === 'function') {
            onLocationSelect(latitude, longitude);
          } else {
            console.log('⚠️ onLocationSelect no es una función, saltando...');
          }
          
          // Centrar mapa en ubicación del usuario
          const mapInstance = getMapInstance();
          if (mapInstance) {
            console.log('🗺️ Centrando mapa en ubicación del usuario...');
            mapInstance.setView([latitude, longitude], 15);
          } else {
            console.log('⚠️ Mapa no disponible aún');
          }
        },
        (error) => {
          console.error('❌ Error de geolocalización:', error);
          
          // Mensajes de error más específicos
          let errorMessage = '❌ No se pudo obtener tu ubicación. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permiso denegado. Por favor, permite el acceso a la ubicación.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Tiempo de espera agotado. Intenta de nuevo.';
              break;
            default:
              errorMessage += 'Error desconocido. Selecciona manualmente en el mapa.';
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Aumentar timeout a 15 segundos
          maximumAge: 300000
        }
      );
    } else {
      console.error('❌ Geolocalización no soportada');
      alert('❌ Geolocalización no soportada en este navegador.');
    }
  };

  // 🔧 Función para centrar mapa en ubicación seleccionada
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng && mapInstance) {
      mapInstance.setView([selectedLocation.lat, selectedLocation.lng], 16);
    }
  }, [selectedLocation, map]);

  // 🔧 Efecto para ajustar automáticamente el mapa cuando cambien los reportes
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (mapInstance && modo === 'visualizacion' && reportes.length > 0) {
      const { center: optimalCenter, zoom: optimalZoom, bounds } = calcularCentroYZoomOptimo(reportes);
      
      if (bounds) {
        // Usar fitBounds para ajustar el mapa a todos los reportes
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      } else {
        // Fallback a setView si no hay bounds
        mapInstance.setView(optimalCenter, optimalZoom);
      }
    }
  }, [reportes, map, modo]);

  // 🔧 Efecto para ajustar automáticamente el mapa cuando se carga por primera vez
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (mapInstance && modo === 'visualizacion' && reportes.length > 0) {
      // Pequeño delay para asegurar que el mapa esté completamente cargado
      const timer = setTimeout(() => {
        const { center: optimalCenter, zoom: optimalZoom, bounds } = calcularCentroYZoomOptimo(reportes);
        
        if (bounds) {
          mapInstance.fitBounds(bounds, { padding: [20, 20] });
        } else {
          mapInstance.setView(optimalCenter, optimalZoom);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [map, modo]); // Solo se ejecuta cuando cambia el mapa o el modo

  // 🔧 Efecto para verificar cuando el mapa esté listo
  useEffect(() => {
    if (map) {
      console.log('🗺️ Mapa inicializado correctamente');
      console.log('📊 Estado actual:', { modo, reportesCount: reportes.length });
    }
  }, [map, modo, reportes.length]);

  // 🔧 Efecto para establecer el mapa cuando se cree la referencia
  useEffect(() => {
    if (mapRef.current && mapRef.current._map) {
      console.log('🗺️ Mapa detectado a través de ref');
      setMap(mapRef.current._map);
    }
  }, [mapRef.current]);

  // 🔧 Función para obtener la instancia del mapa
  const getMapInstance = () => {
    if (map) return map;
    if (mapRef.current && mapRef.current._map) return mapRef.current._map;
    return null;
  };

  return (
    <div className="mapa-container" style={{ width: '100%', height: '400px', position: 'relative' }}>
      {/* 🗺️ Botón de GPS */}
      <button
        onClick={getCurrentLocation}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        title="Usar mi ubicación actual (GPS)"
      >
        📍 GPS
      </button>

      {/* 🗺️ Botón para ajustar vista a todos los reportes */}
      {modo === 'visualizacion' && reportes.length > 0 && (
        <button
          onClick={() => {
            console.log('🎯 Botón "Ajustar Vista" clickeado');
            const mapInstance = getMapInstance();
            console.log('🗺️ Estado del mapa:', { 
              map: !!mapInstance, 
              modo, 
              reportesCount: reportes.length,
              mapRef: !!mapRef.current,
              mapRefMap: !!(mapRef.current && mapRef.current._map)
            });
            
            if (mapInstance) {
              const { bounds } = calcularCentroYZoomOptimo(reportes);
              console.log('📊 Bounds calculados:', bounds);
              
              if (bounds) {
                console.log('🗺️ Ajustando mapa a bounds...');
                mapInstance.fitBounds(bounds, { padding: [20, 20] });
              } else {
                console.log('⚠️ No se pudieron calcular bounds');
              }
            } else {
              console.log('❌ Mapa no disponible');
              alert('⚠️ El mapa aún no está listo. Espera un momento y vuelve a intentar.');
            }
          }}
          style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title="Ajustar vista a todos los reportes"
        >
          🎯 Ajustar Vista
        </button>
      )}

      {/* 🗺️ Botón para ir al área con más reportes */}
      {modo === 'visualizacion' && reportes.length > 0 && (
        <button
          onClick={() => {
            console.log('🔥 Botón "Zona Caliente" clickeado');
            const mapInstance = getMapInstance();
            console.log('🗺️ Estado del mapa:', { 
              map: !!mapInstance, 
              modo, 
              reportesCount: reportes.length,
              mapRef: !!mapRef.current,
              mapRefMap: !!(mapRef.current && mapRef.current._map)
            });
            
            if (mapInstance) {
              const areaConMasReportes = encontrarAreaConMasReportes(reportes);
              console.log('📍 Área con más reportes encontrada:', areaConMasReportes);
              
              if (areaConMasReportes) {
                console.log('🗺️ Navegando al área con más reportes...');
                mapInstance.setView(areaConMasReportes.center, areaConMasReportes.zoom);
                // Mostrar información sobre el área
                alert(`📍 Área con más reportes:\n${areaConMasReportes.count} reportes en esta zona`);
              } else {
                console.log('⚠️ No se pudo encontrar área con más reportes');
                alert('⚠️ No se pudo determinar el área con más reportes.');
              }
            } else {
              console.log('❌ Mapa no disponible');
              alert('⚠️ El mapa aún no está listo. Espera un momento y vuelve a intentar.');
            }
          }}
          style={{
            position: 'absolute',
            top: '90px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: '#8b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title="Ir al área con más reportes"
        >
          🔥 Zona Caliente
        </button>
      )}

      {/* 🗺️ Mapa interactivo */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        onCreated={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* 🔧 Manejador de clicks */}
        <MapClickHandler onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />

        {/* 📍 Marcador de ubicación seleccionada */}
        {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={new L.Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiMxMGI5ODEiLz4KPHBhdGggZD0iTTEyIDhDMTMuNjYgOCAxNSA5LjM0IDE1IDExQzE1IDEyLjY2IDEzLjY2IDE0IDEyIDE0QzEwLjM0IDE0IDkgMTIuNjYgOSAxMUM5IDkuMzQgMTAuMzQgOCAxMiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })}
          >
            <Popup>
              📍 <strong>Ubicación seleccionada</strong><br />
              Lat: {selectedLocation.lat.toFixed(6)}<br />
              Lng: {selectedLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* 🏷️ Marcadores de reportes existentes (modo visualización) */}
        {modo === 'visualizacion' && reportes.map((reporte) => (
          <Marker
            key={reporte.id}
            position={[reporte.latitud, reporte.longitud]}
            icon={new L.Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiNmNTkzMDMiLz4KPHBhdGggZD0iTTEyIDhDMTMuNjYgOCAxNSA5LjM0IDE1IDExQzE1IDEyLjY2IDEzLjY2IDE0IDEyIDE0QzEwLjM0IDE0IDkgMTIuNjYgOSAxMUM5IDkuMzQgMTAuMzQgOCAxMiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              popupAnchor: [0, -24]
            })}
          >
            <Popup style={{ minWidth: '250px' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
                  🏷️ {reporte.titulo}
                </h4>
                
                {/* 📷 Imagen del reporte */}
                {reporte.foto_url && reporte.foto_url.trim() !== '' ? (
                  <div style={{ marginBottom: '10px' }}>
                    <img 
                      src={reporte.foto_url} 
                      alt="Foto del reporte"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', color: '#6b7280', fontSize: '12px' }}>
                      📷 Imagen no disponible
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '20px',
                    backgroundColor: '#f3f4f6',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '5px' }}>
                      📷
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Sin foto
                    </div>
                  </div>
                )}
                
                <div style={{ textAlign: 'left', fontSize: '13px' }}>
                  <p style={{ margin: '5px 0' }}>
                    �� <strong>Descripción:</strong><br />
                    {reporte.descripcion}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    🏷️ <strong>Tipo:</strong> {reporte.tipo}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    📅 <strong>Fecha:</strong> {new Date(reporte.fecha_creacion).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    📍 <strong>Ubicación:</strong><br />
                    Lat: {reporte.latitud.toFixed(6)}<br />
                    Lng: {reporte.longitud.toFixed(6)}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 📍 Información de ubicación seleccionada */}
      {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          📍 <strong>Ubicación:</strong><br />
          Lat: {selectedLocation.lat.toFixed(6)}<br />
          Lng: {selectedLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;
