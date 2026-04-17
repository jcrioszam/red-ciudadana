import axios from "axios";

const isDev = process.env.NODE_ENV !== 'production';

const baseURL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_URL || 'https://red-ciudadana.onrender.com')
  : `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL,
  timeout: 120000, // 2 minutos para cold start de Railway
});

// Interceptor REQUEST: añade token y fuerza HTTPS en producción
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!isDev && config.baseURL?.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor RESPONSE: solo registra errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isDev) {
      console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.message);
    }
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - El servidor tardó demasiado en responder');
    }
    return Promise.reject(error);
  }
);

// Deshabilitar caché
api.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
api.defaults.headers.common['Pragma'] = 'no-cache';
api.defaults.headers.common['Expires'] = '0';

export default api;
