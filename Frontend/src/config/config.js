// Configuración para diferentes entornos
const config = {
  development: {
    API_URL: 'http://localhost:8000',
    APP_NAME: 'Red Ciudadana - Desarrollo'
  },
  production: {
    API_URL: 'https://red-ciudadana-backend.onrender.com',
    APP_NAME: 'Red Ciudadana'
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];
