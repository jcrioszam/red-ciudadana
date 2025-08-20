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

  // 🔧 Función para obtener coordenadas del usuario
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect(latitude, longitude);
          
          // Centrar mapa en ubicación del usuario
          if (map) {
            map.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error('❌ Error de geolocalización:', error);
          alert('❌ No se pudo obtener tu ubicación. Selecciona manualmente en el mapa.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      alert('❌ Geolocalización no soportada en este navegador.');
    }
  };

  // 🔧 Función para centrar mapa en ubicación seleccionada
  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng && map) {
      map.setView([selectedLocation.lat, selectedLocation.lng], 16);
    }
  }, [selectedLocation, map]);

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

      {/* 🗺️ Mapa interactivo */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={setMap}
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
            <Popup>
              🏷️ <strong>{reporte.titulo}</strong><br />
              📝 {reporte.descripcion}<br />
              🏷️ Tipo: {reporte.tipo}<br />
              📅 {new Date(reporte.fecha_creacion).toLocaleDateString()}<br />
              {reporte.foto_url && '📷 Con foto'}
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
