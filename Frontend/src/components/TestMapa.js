import React, { useState } from 'react';
import MapaInteractivo from './MapaInteractivo';

const TestMapa = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (lat, lng) => {
    console.log('📍 Ubicación seleccionada:', { lat, lng });
    setSelectedLocation({ lat, lng });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Prueba del Mapa Interactivo</h2>
      <p>Haz clic en el mapa para seleccionar una ubicación:</p>
      
      <div style={{ height: '500px', border: '2px solid #ccc', borderRadius: '8px' }}>
        <MapaInteractivo
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          modo="seleccion"
          center={[27.0706, -109.4437]} // Navojoa, Sonora
          zoom={12}
        />
      </div>

      {selectedLocation && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #0ea5e9',
          borderRadius: '8px'
        }}>
          <h3>📍 Ubicación Seleccionada:</h3>
          <p><strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}</p>
          <p><strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default TestMapa;
