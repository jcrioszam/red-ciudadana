// Script de prueba para verificar conectividad con el backend de Railway
const axios = require('axios');

const BACKEND_URL = 'https://red-ciudadana-production.up.railway.app';

async function testBackendConnection() {
  console.log('🔍 Probando conectividad con el backend de Railway...');
  console.log(`URL: ${BACKEND_URL}`);
  
  try {
    // Test 1: Endpoint de salud
    console.log('\n1️⃣ Probando endpoint /health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 30000 });
    console.log('✅ /health exitoso:', healthResponse.data);
    
    // Test 2: Endpoint público
    console.log('\n2️⃣ Probando endpoint /test-public...');
    const publicResponse = await axios.get(`${BACKEND_URL}/test-public`, { timeout: 30000 });
    console.log('✅ /test-public exitoso:', publicResponse.data);
    
    // Test 3: Endpoint CORS
    console.log('\n3️⃣ Probando endpoint /cors-test...');
    const corsResponse = await axios.get(`${BACKEND_URL}/cors-test`, { timeout: 30000 });
    console.log('✅ /cors-test exitoso:', corsResponse.data);
    
    // Test 4: Endpoint de configuración (requiere autenticación)
    console.log('\n4️⃣ Probando endpoint /perfiles/mi-configuracion (sin auth)...');
    try {
      const configResponse = await axios.get(`${BACKEND_URL}/perfiles/mi-configuracion`, { timeout: 30000 });
      console.log('❌ /perfiles/mi-configuracion debería requerir autenticación');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /perfiles/mi-configuracion correctamente protegido (401 Unauthorized)');
      } else {
        console.log('❌ Error inesperado en /perfiles/mi-configuracion:', error.message);
      }
    }
    
    console.log('\n🎉 Todas las pruebas básicas completadas exitosamente!');
    console.log('El backend está funcionando correctamente.');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - El servidor tardó demasiado en responder');
    } else if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
  }
}

// Ejecutar las pruebas
testBackendConnection();
