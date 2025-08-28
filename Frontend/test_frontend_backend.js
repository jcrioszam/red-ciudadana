// Script de prueba para verificar la conectividad del frontend con el backend
const axios = require('axios');

const BACKEND_URL = 'https://red-ciudadana-production.up.railway.app';

async function testFrontendBackendConnection() {
  console.log('🔍 Probando conectividad del frontend con el backend...');
  console.log(`URL del backend: ${BACKEND_URL}`);
  
  try {
    // Test 1: Endpoint de salud
    console.log('\n1️⃣ Probando endpoint /health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, { 
      timeout: 30000,
      headers: {
        'Origin': 'https://red-ciudadana.vercel.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ /health exitoso:', healthResponse.data);
    
    // Test 2: Endpoint público
    console.log('\n2️⃣ Probando endpoint /test-public...');
    const publicResponse = await axios.get(`${BACKEND_URL}/test-public`, { 
      timeout: 30000,
      headers: {
        'Origin': 'https://red-ciudadana.vercel.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ /test-public exitoso:', publicResponse.data);
    
    // Test 3: Endpoint CORS
    console.log('\n3️⃣ Probando endpoint /cors-test...');
    const corsResponse = await axios.get(`${BACKEND_URL}/cors-test`, { 
      timeout: 30000,
      headers: {
        'Origin': 'https://red-ciudadana.vercel.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ /cors-test exitoso:', corsResponse.data);
    
    // Test 4: Endpoint de configuración (requiere autenticación)
    console.log('\n4️⃣ Probando endpoint /perfiles/mi-configuracion (sin auth)...');
    try {
      const configResponse = await axios.get(`${BACKEND_URL}/perfiles/mi-configuracion`, { 
        timeout: 30000,
        headers: {
          'Origin': 'https://red-ciudadana.vercel.app',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log('❌ /perfiles/mi-configuracion debería requerir autenticación');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /perfiles/mi-configuracion correctamente protegido (401 Unauthorized)');
      } else {
        console.log('❌ Error inesperado en /perfiles/mi-configuracion:', error.message);
      }
    }
    
    // Test 5: Verificar headers CORS
    console.log('\n5️⃣ Verificando headers CORS...');
    const corsHeadersResponse = await axios.options(`${BACKEND_URL}/health`, {
      timeout: 30000,
      headers: {
        'Origin': 'https://red-ciudadana.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Headers de respuesta CORS:');
    Object.keys(corsHeadersResponse.headers).forEach(key => {
      if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('cors')) {
        console.log(`  ${key}: ${corsHeadersResponse.headers[key]}`);
      }
    });
    
    console.log('\n🎉 Todas las pruebas básicas completadas exitosamente!');
    console.log('El backend está funcionando correctamente y es accesible desde el frontend.');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - El servidor tardó demasiado en responder');
    } else if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
      console.error('Headers de respuesta:', error.response.headers);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    }
  }
}

// Ejecutar las pruebas
testFrontendBackendConnection();

