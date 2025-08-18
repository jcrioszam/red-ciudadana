import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_CONFIG } from './config';

const BASE_URL = SERVER_CONFIG.BASE_URL;

// Función para obtener token
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('🔑 Token obtenido:', token ? 'SÍ' : 'NO');
    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

// Función para limpiar datos de sesión
const clearSession = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    console.log('🧹 Sesión limpiada');
  } catch (error) {
    console.error('❌ Error clearing session:', error);
  }
};

// Función para hacer peticiones HTTP
const apiRequest = async (endpoint, options = {}, customToken = null) => {
  try {
    const token = customToken || await getToken();
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log(`🔑 Token presente: ${token ? 'SÍ' : 'NO'}`);
    
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
      console.log('🔐 Authorization header agregado');
    }

    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log(`📡 URL completa: ${fullUrl}`);
    
    const response = await fetch(fullUrl, config);
    console.log(`📊 Response status: ${response.status}`);
    
    // Manejar errores de autenticación
    if (response.status === 401) {
      console.log('🚫 Error 401 - Token inválido, limpiando sesión');
      await clearSession();
      
      // Para endpoints de ubicación, no lanzar error para evitar interrumpir el seguimiento
      if (endpoint.includes('/ubicacion/')) {
        console.log('⚠️ Error 401 en ubicación - Continuando seguimiento...');
        return null;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Response data:`, data);
    return data;
  } catch (error) {
    console.error('❌ API request error:', error);
    throw error;
  }
};

// Función especial para el endpoint de token (form-urlencoded)
const tokenRequest = async (username, password) => {
  try {
    console.log('🔐 Token request para:', username);
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

    console.log(`📊 Token response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Token error ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Token obtenido exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Token request error:', error);
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
    } else {
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