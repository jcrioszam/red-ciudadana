// Script para probar la conexión de la API desde el frontend
const axios = require('axios');

async function testApiConnection() {
  console.log('🧪 PROBANDO CONEXIÓN DE API DESDE FRONTEND');
  console.log('=' * 50);
  
  // Probar diferentes URLs
  const urls = [
    'http://localhost:8000',
    'https://red-ciudadana-production.up.railway.app'
  ];
  
  for (const url of urls) {
    console.log(`\n🔍 Probando: ${url}`);
    
    try {
      // Probar endpoint de health
      const healthResponse = await axios.get(`${url}/health`, { timeout: 10000 });
      console.log(`✅ Health check: ${healthResponse.status} - ${healthResponse.data.status}`);
      
      // Probar endpoint de reportes públicos
      const reportesResponse = await axios.get(`${url}/reportes-publicos`, { timeout: 10000 });
      console.log(`✅ Reportes públicos: ${reportesResponse.status} - ${reportesResponse.data.length} reportes`);
      
      if (reportesResponse.data.length > 0) {
        console.log('📋 Primeros reportes:');
        reportesResponse.data.slice(0, 3).forEach((reporte, i) => {
          console.log(`  ${i+1}. ${reporte.titulo} - ${reporte.estado}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
    }
  }
}

testApiConnection().catch(console.error);
