import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_CONFIG } from './config';

const BASE_URL = SERVER_CONFIG.BASE_URL;
const isDev = SERVER_CONFIG.DEBUG;

// Función para obtener token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    if (isDev) console.error('Error getting token:', error);
    return null;
  }
};

// Función para limpiar datos de sesión
const clearSession = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    if (isDev) console.error('Error clearing session:', error);
  }
};

// Función para hacer peticiones HTTP
const apiRequest = async (endpoint, options = {}, customToken = null) => {
  try {
    const token = customToken || await getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Si es FormData, no establecer Content-Type para que el navegador lo establezca automáticamente
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Manejar errores de autenticación
    if (response.status === 401) {
      await clearSession();

      // Para endpoints de ubicación, no lanzar error para evitar interrumpir el seguimiento
      if (endpoint.includes('/ubicacion/')) {
        return null;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      if (isDev) console.error(`HTTP error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (isDev) console.error('API request error:', error);
    throw error;
  }
};

// Función especial para el endpoint de token (form-urlencoded)
const tokenRequest = async (username, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (isDev) console.error(`Token error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (isDev) console.error('Token request error:', error);
    throw error;
  }
};

// API object con métodos similares a axios
const api = {
  get: (endpoint, customToken = null) => apiRequest(endpoint, { method: 'GET' }, customToken),
  post: (endpoint, data, options = {}) => {
    const requestOptions = {
      method: 'POST',
      ...options
    };

    // Si data es FormData, usarlo directamente, sino convertirlo a JSON
    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data !== undefined) {
      requestOptions.body = JSON.stringify(data);
    }

    return apiRequest(endpoint, requestOptions);
  },
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  token: tokenRequest, // Método especial para autenticación

  // Métodos para ubicación en tiempo real
  ubicacion: {
    actualizar: (ubicacionData) => apiRequest('/ubicacion/actualizar', {
      method: 'POST',
      body: JSON.stringify(ubicacionData)
    }),
    obtenerVehiculos: () => apiRequest('/ubicacion/vehiculos', { method: 'GET' }),
    obtenerMiUbicacion: () => apiRequest('/ubicacion/mi-ubicacion', { method: 'GET' })
  }
};

export { api };
