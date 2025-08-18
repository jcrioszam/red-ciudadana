import axios from "axios";

// SOLUCIÓN HÍBRIDA: Intentar proxy, fallback a backend directo
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://red-ciudadana-backend.onrender.com' // Usar backend directo (funciona para login)
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