import axios from "axios";

// 🚨 SOLUCIÓN DEFINITIVA: SIEMPRE HTTPS PARA RAILWAY
let baseURL;
if (process.env.NODE_ENV === 'production') {
  console.log('🔍 REACT_APP_API_URL del environment:', process.env.REACT_APP_API_URL);
  
  // HARDCODED: Railway SIEMPRE con HTTPS - NO depender de variables
  baseURL = 'https://red-ciudadana-production.up.railway.app';
  
  console.log('🔐 HTTPS HARDCODED para Railway:', baseURL);
} else {
  // En desarrollo, usar localhost
  baseURL = 'http://localhost:8000';
}

console.log(`API usando baseURL: ${baseURL}`);

const api = axios.create({
  baseURL: baseURL,
  timeout: 120000, // 2 minutos para cold start muy lento
});

// Interceptor REQUEST para debug y FORZAR HTTPS AGRESIVAMENTE
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API REQUEST:', config.method?.toUpperCase(), config.url, 'BASE:', config.baseURL);
    
    // 🚨 FORZAR HTTPS AGRESIVAMENTE en TODAS las URLs
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
      console.warn('🔒 INTERCEPTOR: FORZANDO HTTPS en baseURL:', config.baseURL);
    }
    
    // Forzar HTTPS en URL relativa también
    if (config.url && config.url.includes('http://')) {
      config.url = config.url.replace('http://', 'https://');
      console.warn('🔒 INTERCEPTOR: FORZANDO HTTPS en URL:', config.url);
    }
    
    // Verificar Railway URL específicamente
    if (config.baseURL && config.baseURL.includes('railway.app') && !config.baseURL.startsWith('https://')) {
      config.baseURL = 'https://red-ciudadana-production.up.railway.app';
      console.warn('🚨 INTERCEPTOR: FORZANDO Railway HTTPS:', config.baseURL);
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