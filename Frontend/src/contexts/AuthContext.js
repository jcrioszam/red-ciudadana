import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar api para incluir el token en las peticiones
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Interceptor para manejar errores de autenticación
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && localStorage.getItem('token')) {
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Error al verificar token:', {
            status: error.response?.status,
            message: error.message
          });
          setUser(null);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (identificador, password) => {
    try {
      // Intentar despertar el backend (cold start en Railway)
      for (let intento = 1; intento <= 3; intento++) {
        try {
          await api.get('/health', { timeout: 120000 });
          break;
        } catch {
          if (intento < 3) {
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }

      let response;

      // Estrategia 1: Endpoint /login (JSON)
      try {
        response = await api.post('/login', { identificador, password });
      } catch {
        // Estrategia 2: Endpoint /token (FormData)
        const formData = new FormData();
        formData.append('username', identificador);
        formData.append('password', password);
        response = await api.post('/token', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      }

      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      setToken(access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const userResponse = await api.get('/users/me');
      setUser(userResponse.data);

      return true;
    } catch (error) {
      console.error('Error en login:', error.response?.data || error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
