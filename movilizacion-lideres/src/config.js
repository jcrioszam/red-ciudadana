// Configuración del servidor
// Para producción: define EXPO_PUBLIC_API_URL en tu archivo .env
// Ejemplo: EXPO_PUBLIC_API_URL=https://red-ciudadana-production.up.railway.app
export const SERVER_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.174:8000',
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  DEBUG: process.env.NODE_ENV !== 'production',
};

export const getFullUrl = (endpoint) => `${SERVER_CONFIG.BASE_URL}${endpoint}`;

export const checkConnectivity = async () => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};
