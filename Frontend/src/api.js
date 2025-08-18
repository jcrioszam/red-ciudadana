import axios from "axios";

// CONFIGURACIÓN FLEXIBLE: Detectar automáticamente la mejor opción
let baseURL;
if (process.env.NODE_ENV === 'production') {
  // Usar Railway por defecto, fallback a Render si es necesario
  baseURL = process.env.REACT_APP_API_URL || 'https://red-ciudadana-backend-production.up.railway.app';
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