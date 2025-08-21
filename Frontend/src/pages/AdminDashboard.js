import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiSave, FiRefreshCw, FiEye, FiEyeOff, FiSettings } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [configuraciones, setConfiguraciones] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState({});

  // Obtener todas las configuraciones de perfiles
  const { data: perfiles, isLoading } = useQuery('perfiles', async () => {
    try {
      // Usar el endpoint que sí existe para obtener roles
      const response = await api.get('/perfiles/roles');
      console.log('🔍 Respuesta de /perfiles/roles:', response.data);
      
      // Validar que sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Si es un objeto, extraer el array de roles
        const rolesArray = Object.values(response.data);
        console.log('🔍 Roles extraídos:', rolesArray);
        return rolesArray;
      } else {
        console.error('❌ Formato inesperado de /perfiles/roles:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener perfiles:', error);
      return [];
    }
  });

  // Obtener configuración del dashboard para cada rol
  const { data: configuracionesDashboard } = useQuery('configuraciones-dashboard', async () => {
    try {
      const response = await api.get('/perfiles/configuracion-dashboard');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuraciones del dashboard:', error);
      return {};
    }
  });

  // Widgets disponibles para el dashboard
  const widgetsDisponibles = [
    { id: 'total-personas', nombre: 'Total Personas', descripcion: 'Contador de personas registradas', permiso: 'personas' },
    { id: 'total-eventos', nombre: 'Total Eventos', descripcion: 'Contador de eventos organizados', permiso: 'eventos' },
    { id: 'lideres-activos', nombre: 'Líderes Activos', descripcion: 'Contador de líderes en actividad', permiso: 'usuarios' },
    { id: 'secciones-cubiertas', nombre: 'Secciones Cubiertas', descripcion: 'Contador de secciones electorales', permiso: 'estructura-red' },
    { id: 'movilizacion-vehiculos', nombre: 'Movilización por Vehículos', descripcion: 'Reporte de movilización y asignaciones', permiso: 'movilizacion' },
    { id: 'asistencias-tiempo-real', nombre: 'Asistencias en Tiempo Real', descripcion: 'Reporte de asistencias activas', permiso: 'seguimiento' },
    { id: 'eventos-historicos', nombre: 'Eventos Históricos', descripcion: 'Reporte de eventos pasados', permiso: 'eventos-historicos' },
    { id: 'top-secciones', nombre: 'Top Secciones Electorales', descripcion: 'Ranking de secciones por personas', permiso: 'personas' },
    { id: 'top-lideres', nombre: 'Top Líderes por Personas', descripcion: 'Ranking de líderes por personas', permiso: 'personas' },
    { id: 'estructura-red', nombre: 'Estructura de la Red', descripcion: 'Diagrama jerárquico de la organización', permiso: 'estructura-red' }
  ];

  // Inicializar configuraciones
  useEffect(() => {
    if (perfiles && configuracionesDashboard) {
      const configs = {};
      perfiles.forEach(perfil => {
        configs[perfil.rol] = {
          widgets: configuracionesDashboard[perfil.rol]?.widgets || [],
          opciones_web: perfil.opciones_web || []
        };
      });
      setConfiguraciones(configs);
      setCambiosPendientes({});
    }
  }, [perfiles, configuracionesDashboard]);

  // Función para obtener opciones web de un rol específico
  const obtenerOpcionesWeb = async (rol) => {
    try {
      const response = await api.get(`/perfiles/configuracion/${rol}`);
      return response.data?.configuracion?.opciones_web || [];
    } catch (error) {
      console.error(`Error al obtener opciones web para ${rol}:`, error);
      return [];
    }
  };

  // Función para cargar opciones web de todos los roles
  const cargarOpcionesWeb = async () => {
    if (perfiles && configuracionesDashboard) {
      const configs = {};
      for (const perfil of perfiles) {
        const opcionesWeb = await obtenerOpcionesWeb(perfil.rol);
        configs[perfil.rol] = {
          widgets: configuracionesDashboard[perfil.rol]?.widgets || [],
          opciones_web: opcionesWeb
        };
      }
      setConfiguraciones(configs);
      setCambiosPendientes({});
    }
  };

  // Cargar opciones web cuando cambien los perfiles
  useEffect(() => {
    cargarOpcionesWeb();
  }, [perfiles, configuracionesDashboard]);

  // Función para verificar si un widget puede ser mostrado según los permisos del rol
  const puedeMostrarWidget = (widget, opcionesWeb) => {
    return opcionesWeb.includes(widget.permiso);
  };

  // Función para alternar un widget
  const alternarWidget = (rol, widgetId) => {
    setCambiosPendientes(prev => ({
      ...prev,
      [rol]: {
        ...prev[rol],
        widgets: prev[rol]?.widgets || configuraciones[rol]?.widgets || [],
        [widgetId]: !(prev[rol]?.widgets || configuraciones[rol]?.widgets || []).includes(widgetId)
      }
    }));
  };

  // Función para guardar cambios
  const guardarCambios = async () => {
    try {
      // Aquí se implementaría la lógica para guardar en el backend
      console.log('Guardando cambios:', cambiosPendientes);
      
      // Actualizar estado local
      setConfiguraciones(prev => {
        const nuevo = { ...prev };
        Object.keys(cambiosPendientes).forEach(rol => {
          if (cambiosPendientes[rol].widgets) {
            nuevo[rol] = { ...nuevo[rol], widgets: cambiosPendientes[rol].widgets };
          }
        });
        return nuevo;
      });
      
      setCambiosPendientes({});
      
      // Refrescar datos
      queryClient.invalidateQueries('configuraciones-dashboard');
      
    } catch (error) {
      console.error('Error al guardar cambios:', error);
    }
  };

  // Función para resetear a configuración por defecto
  const resetearConfiguracion = (rol) => {
    setCambiosPendientes(prev => ({
      ...prev,
      [rol]: {
        widgets: widgetsDisponibles
          .filter(widget => puedeMostrarWidget(widget, configuraciones[rol]?.opciones_web || []))
          .map(widget => widget.id)
      }
    }));
  };

  // Verificar que el usuario sea admin - DESPUÉS de todos los hooks
  if (user?.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiSettings className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Administración del Dashboard
          </h1>
          <p className="text-secondary-600">
            Configura qué widgets puede ver cada rol en su dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => queryClient.invalidateQueries('configuraciones-dashboard')}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={guardarCambios}
            disabled={Object.keys(cambiosPendientes).length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Configuraciones por Rol */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.isArray(perfiles) && perfiles.length > 0 ? (
          perfiles.map(perfil => (
            <div key={perfil.rol} className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 capitalize">
                    {perfil.rol?.replace('_', ' ') || 'Sin rol'}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {perfil.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <button
                  onClick={() => resetearConfiguracion(perfil.rol)}
                  className="btn-secondary text-sm"
                >
                  Resetear
                </button>
              </div>

              {/* Widgets disponibles */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-secondary-700">Widgets del Dashboard:</h4>
                {widgetsDisponibles.map(widget => {
                  const puedeMostrar = puedeMostrarWidget(widget, perfil.opciones_web || []);
                  const estaHabilitado = (cambiosPendientes[perfil.rol]?.widgets || configuraciones[perfil.rol]?.widgets || []).includes(widget.id);
                  
                  return (
                    <div key={widget.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{widget.nombre}</span>
                          {!puedeMostrar && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Sin permiso
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{widget.descripcion}</p>
                      </div>
                      
                      {puedeMostrar ? (
                        <button
                          onClick={() => alternarWidget(perfil.rol, widget.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            estaHabilitado 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={estaHabilitado ? 'Deshabilitar widget' : 'Habilitar widget'}
                        >
                          {estaHabilitado ? <FiEye className="h-4 w-4" /> : <FiEyeOff className="h-4 w-4" />}
                        </button>
                      ) : (
                        <div className="p-2 text-gray-400">
                          <FiEyeOff className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumen */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Widgets habilitados:</span>
                  <span className="font-medium text-blue-600">
                    {(cambiosPendientes[perfil.rol]?.widgets || configuraciones[perfil.rol]?.widgets || []).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total disponibles:</span>
                  <span className="font-medium text-gray-600">
                    {widgetsDisponibles.filter(w => puedeMostrarWidget(w, perfil.opciones_web || [])).length}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <div className="text-gray-500">
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span>Cargando perfiles...</span>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">No se pudieron cargar los perfiles</p>
                  <p className="text-sm">Verifica la consola para más detalles</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn-primary mt-3"
                  >
                    Recargar página
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FiSettings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Información sobre la configuración</h4>
            <p className="text-sm text-blue-700 mt-1">
              Los widgets solo se pueden habilitar si el rol tiene los permisos necesarios. 
              Para agregar más widgets, primero asigna los permisos correspondientes en "Administración de Perfiles".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
