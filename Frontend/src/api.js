import axios from "axios";

// SOLUCIÓN DEFINITIVA: Siempre usar proxy para evitar CORS
let baseURL;
if (process.env.NODE_ENV === 'production') {
  // En producción, usar proxy reverso (evita CORS completamente)
  baseURL = '/api';
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