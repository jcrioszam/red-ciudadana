import axios from "axios";

// CONFIGURACIÓN ULTRA SEGURA: SIEMPRE HTTPS EN PRODUCCIÓN
let baseURL;
if (process.env.NODE_ENV === 'production') {
  // FORZAR HTTPS ABSOLUTAMENTE - NUNCA HTTP en producción
  const envURL = process.env.REACT_APP_API_URL;
  console.log('🔍 REACT_APP_API_URL del environment:', envURL);
  
  // Usar Railway HTTPS como default
  baseURL = 'https://red-ciudadana-production.up.railway.app';
  
  // Si hay variable de entorno, asegurar que sea HTTPS
  if (envURL) {
    if (envURL.startsWith('http://')) {
      baseURL = envURL.replace('http://', 'https://');
      console.warn('🔒 VARIABLE DE ENTORNO TENÍA HTTP - FORZANDO HTTPS:', baseURL);
    } else if (envURL.startsWith('https://')) {
      baseURL = envURL;
      console.log('✅ Variable de entorno ya tiene HTTPS:', baseURL);
    } else {
      console.warn('⚠️ Variable de entorno inválida, usando Railway HTTPS');
    }
  }
  
  console.log('🔐 FORZANDO HTTPS FINAL en producción:', baseURL);
} else {
  // En desarrollo, usar localhost
  baseURL = 'http://localhost:8000';
}

console.log(`API usando baseURL: ${baseURL}`);

const api = axios.create({
  baseURL: baseURL,
  timeout: 120000, // 2 minutos para cold start muy lento
});

// Interceptor para manejar errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - El servidor tardó demasiado en responder');
    }
    return Promise.reject(error);
  }
);

export default api; 