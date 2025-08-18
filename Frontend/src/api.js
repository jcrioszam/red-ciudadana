import axios from "axios";

// Detectar si estamos en desarrollo o producción
const baseURL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://red-ciudadana-backend.onrender.com' 
    : 'http://localhost:8000');

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