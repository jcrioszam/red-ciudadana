import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🔧 Fix para iconos de Leaflet (requerido para que funcionen correctamente)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 📍 Componente para manejar clics en el mapa
const ManejadorClicMapa = ({ onLocationSelect, setPosition }) => {
  useMapEvents({
    click(e) {
      console.log('📍 Ubicación seleccionada:', e.latlng);
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// 🗺️ Componente principal del mapa
const MapaInteractivo = ({ 
  onLocationSelect, 
  reportes = [], 
  initialPosition = null,
  centerLocation = [19.4326, -99.1332], // CDMX como centro por defecto
  showReportes = true,
  height = '400px',
  selectionMode = true 
}) => {
  const [position, setPosition] = useState(initialPosition);

  // 🎨 Crear icono personalizado para reportes existentes
  const reporteIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // 🎨 Crear icono personalizado para nueva ubicación seleccionada
  const selectionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div style={{ width: '100%', height: height }}>
      <MapContainer 
        center={centerLocation} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* 📍 Manejador de clics para seleccionar ubicación */}
        {selectionMode && (
          <ManejadorClicMapa 
            onLocationSelect={onLocationSelect} 
            setPosition={setPosition} 
          />
        )}
        
        {/* 🟢 Marcador de nueva ubicación seleccionada */}
        {position && (
          <Marker position={position} icon={selectionIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>📍 Nueva Ubicación</strong><br />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Lat: {position.lat.toFixed(6)}<br />
                  Lng: {position.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* 🔴 Marcadores de reportes existentes */}
        {showReportes && reportes.map((reporte, index) => {
          // Solo mostrar reportes que tengan coordenadas válidas
          if (!reporte.latitud || !reporte.longitud || 
              reporte.latitud === 0 || reporte.longitud === 0) {
            return null;
          }
          
          return (
            <Marker 
              key={reporte.id || index} 
              position={[reporte.latitud, reporte.longitud]}
              icon={reporteIcon}
            >
              <Popup>
                <div style={{ maxWidth: '200px' }}>
                  <strong style={{ color: '#dc2626' }}>
                    {reporte.tipo || 'Reporte'}
                  </strong>
                  {reporte.titulo && (
                    <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '13px' }}>
                      {reporte.titulo}
                    </div>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#4b5563' }}>
                    {reporte.descripcion || 'Sin descripción'}
                  </div>
                  {reporte.direccion && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                      📍 {reporte.direccion}
                    </div>
                  )}
                  {reporte.fecha_creacion && (
                    <div style={{ marginTop: '5px', fontSize: '10px', color: '#9ca3af' }}>
                      📅 {new Date(reporte.fecha_creacion).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* 💡 Instrucciones para el usuario */}
      {selectionMode && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0c4a6e'
        }}>
          💡 <strong>Instrucciones:</strong> Haz clic en el mapa para seleccionar la ubicación del reporte
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;
