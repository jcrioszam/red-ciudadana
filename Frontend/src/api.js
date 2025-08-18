import axios from "axios";

// Volver al proxy reverso que funcionaba, pero con configuración mejorada
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api' // Volver a usar proxy reverso
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: baseURL,
  timeout: 90000, // 90 segundos para permitir cold start de Render
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