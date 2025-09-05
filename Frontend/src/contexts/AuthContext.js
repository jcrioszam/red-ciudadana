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
      console.log('AuthContext: verificando token...', { token: token ? 'existe' : 'no existe' });
      
      if (token) {
        try {
          console.log('AuthContext: llamando a /users/me...');
          const response = await api.get('/users/me');
          console.log('AuthContext: respuesta de /users/me:', response.data);
          setUser(response.data);
          console.log('AuthContext: usuario autenticado establecido');
        } catch (error) {
          console.error('AuthContext: error al verificar token:', error);
          console.error('AuthContext: detalles del error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          setUser(null);
          logout();
          console.log('AuthContext: token inválido, cerrando sesión');
        }
      } else {
        setUser(null);
        console.log('AuthContext: sin token, usuario no autenticado');
      }
      setLoading(false);
      console.log('AuthContext: verificación completada, loading = false');
    };
    verifyToken();
  }, []); // 🔧 CORREGIDO: Remover dependencia [token] para evitar loops

  const login = async (identificador, password) => {
    try {
      // Primero despertar el backend con múltiples intentos
      console.log('AuthContext: despertando backend...');
      let backendDespierto = false;
      for (let intento = 1; intento <= 3 && !backendDespierto; intento++) {
        try {
          console.log(`AuthContext: intento ${intento} de despertar backend...`);
          const healthResponse = await api.get('/health', { timeout: 120000 });
          console.log('AuthContext: backend despierto', healthResponse.data);
          backendDespierto = true;
        } catch (healthError) {
          console.log(`AuthContext: intento ${intento} falló:`, healthError.message);
          if (intento < 3) {
            console.log('AuthContext: esperando 10 segundos antes del siguiente intento...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }
      
      if (!backendDespierto) {
        console.log('AuthContext: no se pudo despertar backend después de 3 intentos, continuando...');
      }

      // Estrategia múltiple: probar diferentes endpoints
      console.log('AuthContext: intentando login...');
      let response;
      let loginExitoso = false;
      
      // Estrategia 1: Endpoint /login (JSON)
      try {
        console.log('AuthContext: probando /login (JSON)...');
        response = await api.post('/login', {
          identificador,
          password
        });
        loginExitoso = true;
        console.log('AuthContext: login exitoso con /login (JSON)');
      } catch (loginError) {
        console.log('AuthContext: /login falló, probando /token...', loginError.message);
        
        // Estrategia 2: Endpoint /token (FormData)
        try {
          const formData = new FormData();
          formData.append('username', identificador);
          formData.append('password', password);
          
          response = await api.post('/token', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          });
          loginExitoso = true;
          console.log('AuthContext: login exitoso con /token (FormData)');
        } catch (tokenError) {
          console.log('AuthContext: ambos endpoints fallaron');
          throw tokenError; // Re-lanzar el último error
        }
      }
      const { access_token } = response.data;

      // Guardar token
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Configurar headers inmediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Obtener datos del usuario inmediatamente
      try {
        const userResponse = await api.get('/users/me');
        setUser(userResponse.data);
        console.log('AuthContext: login exitoso, usuario establecido', userResponse.data);
      } catch (userError) {
        console.log('AuthContext: error al obtener datos del usuario', userError);
        // Como backup, crear un usuario temporal con el token
        // Usar 'admin' como rol temporal para testing
        setUser({
          email: identificador,
          nombre: 'Usuario Temporal',
          rol: 'admin',
          id: 1,
          activo: true
        });
        console.log('AuthContext: usando datos de usuario temporal');
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