import React, { useState } from 'react';

const MapaBasico = ({ onLocationSelect, selectedLocation }) => {
  console.log('🗺️ MapaBasico renderizando con props:', { onLocationSelect: !!onLocationSelect, selectedLocation });
  
  const [coordenadas, setCoordenadas] = useState({
    lat: 27.0706,
    lng: -109.4437
  });

  const handleInputChange = (field, value) => {
    const newCoords = { ...coordenadas, [field]: parseFloat(value) };
    setCoordenadas(newCoords);
    
    if (onLocationSelect) {
      onLocationSelect(newCoords.lat, newCoords.lng);
    }
  };

  const getCurrentLocation = () => {
    console.log('📍 Obteniendo ubicación actual...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Ubicación obtenida:', { latitude, longitude });
          setCoordenadas({ lat: latitude, lng: longitude });
          
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude);
          }
        },
        (error) => {
          console.error('❌ Error al obtener ubicación:', error);
          alert('No se pudo obtener tu ubicación. Por favor, ingresa las coordenadas manualmente.');
        }
      );
    } else {
      console.error('❌ Geolocalización no soportada');
      alert('Tu navegador no soporta geolocalización. Por favor, ingresa las coordenadas manualmente.');
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '400px',
      padding: '20px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      margin: '10px 0'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#374151' }}>
        📍 Seleccionar Ubicación
      </h3>
      
      {/* Botón GPS */}
      <button
        onClick={getCurrentLocation}
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        📍 Usar mi ubicación actual (GPS)
      </button>

      {/* Inputs de coordenadas */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
          Latitud:
        </label>
        <input
          type="number"
          step="0.000001"
          value={coordenadas.lat}
          onChange={(e) => handleInputChange('lat', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          placeholder="27.0706"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
          Longitud:
        </label>
        <input
          type="number"
          step="0.000001"
          value={coordenadas.lng}
          onChange={(e) => handleInputChange('lng', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          placeholder="-109.4437"
        />
      </div>

      {/* Ubicación seleccionada */}
      {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '15px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#065f46' }}>
            ✅ Ubicación Seleccionada
          </h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#047857' }}>
            <strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}<br />
            <strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Información de ayuda */}
      <div style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid #3b82f6',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '15px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
          💡 Información
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#1e40af' }}>
          • Haz clic en "Usar mi ubicación actual" para obtener automáticamente tu ubicación<br />
          • O ingresa manualmente las coordenadas de la ubicación del problema<br />
          • Las coordenadas por defecto son de Navojoa, Sonora
        </p>
      </div>
    </div>
  );
};

export default MapaBasico;
