import React, { useState, useEffect } from 'react';
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
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      console.log('🗺️ Click en mapa:', { lat, lng });
      if (typeof onLocationSelect === 'function') {
        onLocationSelect(lat, lng);
      }
    },
  });
  return null;
};

const MapaInteractivoSimple = ({ 
  onLocationSelect, 
  selectedLocation, 
  reportes = [], 
  modo = 'seleccion' 
}) => {
  const [mapReady, setMapReady] = useState(false);

  // Función para obtener ubicación actual
  const getCurrentLocation = () => {
    console.log('📍 Obteniendo ubicación actual...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Ubicación obtenida:', { latitude, longitude });
          if (typeof onLocationSelect === 'function') {
            onLocationSelect(latitude, longitude);
          }
        },
        (error) => {
          console.error('❌ Error al obtener ubicación:', error);
          alert('No se pudo obtener tu ubicación. Por favor, selecciona manualmente en el mapa.');
        }
      );
    } else {
      console.error('❌ Geolocalización no soportada');
      alert('Tu navegador no soporta geolocalización. Por favor, selecciona manualmente en el mapa.');
    }
  };

  // Efecto para marcar el mapa como listo
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
      console.log('🗺️ Mapa marcado como listo');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      position: 'relative',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
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

      {/* 🗺️ Mapa */}
      <MapContainer
        center={[27.0706, -109.4437]} // Navojoa, Sonora
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        whenReady={() => {
          console.log('🗺️ Mapa listo');
          setMapReady(true);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Manejar clicks en el mapa */}
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {/* Marcador de ubicación seleccionada */}
        {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <h4>📍 Ubicación Seleccionada</h4>
                <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de reportes */}
        {modo === 'visualizacion' && reportes.map((reporte) => (
          <Marker 
            key={reporte.id} 
            position={[reporte.latitud, reporte.longitud]}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <h4>🏷️ {reporte.titulo}</h4>
                <p>{reporte.descripcion}</p>
                <p><strong>Tipo:</strong> {reporte.tipo}</p>
                <p><strong>Fecha:</strong> {new Date(reporte.fecha_creacion).toLocaleDateString()}</p>
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

      {/* Estado del mapa */}
      {!mapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          🗺️ Cargando mapa...
        </div>
      )}
    </div>
  );
};

export default MapaInteractivoSimple;
