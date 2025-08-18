import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

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
        if (error.response?.status === 401) {
          // Token expirado o inválido
          console.log('Token expirado, cerrando sesión...');
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
          const response = await api.get('/users/me/');
          setUser(response.data);
          console.log('AuthContext: usuario autenticado', response.data);
        } catch (error) {
          setUser(null);
          logout();
          console.log('AuthContext: token inválido', error);
        }
      } else {
        setUser(null);
        console.log('AuthContext: sin token');
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (identificador, password) => {
    try {
      const formData = new FormData();
      formData.append('username', identificador);
      formData.append('password', password);

      const response = await api.post('/token', formData);
      const { access_token } = response.data;

      // Guardar token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Configurar headers inmediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Obtener datos del usuario inmediatamente
      try {
        const userResponse = await api.get('/users/me/');
        setUser(userResponse.data);
        console.log('AuthContext: login exitoso, usuario establecido', userResponse.data);
      } catch (userError) {
        console.log('AuthContext: error al obtener datos del usuario', userError);
        // Aún así consideramos el login exitoso si tenemos el token
      }
      
      return true;
    } catch (error) {
      console.log('AuthContext: error en login', error);
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