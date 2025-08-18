import axios from "axios";

// SOLUCIÓN REAL: El proxy de Render es inestable, usar directo
let baseURL;
if (process.env.NODE_ENV === 'production') {
  // En producción, conectar directamente al backend (más estable)
  baseURL = 'https://red-ciudadana-backend.onrender.com';
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