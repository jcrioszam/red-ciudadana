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

// Interceptor REQUEST para debug
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API REQUEST:', config.method?.toUpperCase(), config.url, 'BASE:', config.baseURL);
    // FORZAR HTTPS si detectamos HTTP
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
      console.warn('🔒 INTERCEPTOR: FORZANDO HTTPS en baseURL:', config.baseURL);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor RESPONSE para debug y forzar HTTPS
api.interceptors.response.use(
  (response) => {
    console.log('✅ API RESPONSE:', response.config.method?.toUpperCase(), response.config.url, 'STATUS:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API ERROR:', error.config?.method?.toUpperCase(), error.config?.url, 'ERROR:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - El servidor tardó demasiado en responder');
    }
    return Promise.reject(error);
  }
);

// NUCLEAR OPTION: Clear cache headers
api.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
api.defaults.headers.common['Pragma'] = 'no-cache';
api.defaults.headers.common['Expires'] = '0';

export default api; 