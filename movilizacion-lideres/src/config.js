// Configuración del servidor
export const SERVER_CONFIG = {
  // Cambia esta IP por la IP de tu servidor
  BASE_URL: 'http://192.168.2.174:8000',
  
  // Configuración de timeout para las peticiones
  TIMEOUT: 10000, // 10 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  
  // Configuración de logging
  DEBUG: true, // Cambiar a false en producción
};

// Función para obtener la URL completa
export const getFullUrl = (endpoint) => {
  return `${SERVER_CONFIG.BASE_URL}${endpoint}`;
};

// Función para verificar conectividad
export const checkConnectivity = async () => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Error de conectividad:', error);
    return false;
  }
}; 