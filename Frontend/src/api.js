import axios from "axios";

// TEMPORAL: Usar backend directo mientras se arregla el proxy
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://red-ciudadana-backend.onrender.com' // Conectar directamente al backend
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 segundos para Render
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