import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { api } from '../src/api';

export const usePermissions = (userRole) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    if (!userRole) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/perfiles/mi-configuracion');
      setData(response);
    } catch (err) {
      setError(err);
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Escuchar cambios en el estado de la app para refrescar permisos
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // La app vuelve a estar activa, refrescar permisos
        fetchPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [fetchPermissions]);

  return { data, loading, error, refetch: fetchPermissions };
}; 