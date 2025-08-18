import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (storedToken && userData) {
        // Verificar que el token no haya expirado
        try {
          const response = await api.get('/users/me/', storedToken);
          // Si la petición es exitosa, el token es válido
          setToken(storedToken);
          setUser(JSON.parse(userData));
        } catch (error) {
          // Si el token expiró, limpiar la sesión
          console.log('Token expirado, limpiando sesión');
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // En caso de error, limpiar la sesión para evitar problemas
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.token(email, password);

      const { access_token, token_type } = response;
      const token = `${token_type} ${access_token}`;

      // Guardar solo el access_token sin el prefijo
      await AsyncStorage.setItem('token', access_token);
      setToken(access_token);

      // Obtener información del usuario con el token
      const userResponse = await api.get('/users/me/', access_token);
      const userData = userResponse;

      // Guardar usuario
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Error de autenticación' 
      };
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  };

  const logout = async () => {
    await clearSession();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 