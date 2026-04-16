import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiSave, FiRefreshCw, FiEye, FiEyeOff, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [configuracionActual, setConfiguracionActual] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState({});

  // Función para extraer roles de diferentes formatos de respuesta
  const extraerRoles = (data) => {
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      const valores = Object.values(data);
      if (valores.length > 0 && Array.isArray(valores[0])) return valores[0];
      const arraysEncontrados = valores.filter(v => Array.isArray(v));
      if (arraysEncontrados.length > 0) {
        return arraysEncontrados.reduce((a, b) => a.length > b.length ? a : b);
      }
      return valores;
    }

    return [];
  };

  // Obtener todos los roles disponibles
  const { data: roles, isLoading: cargandoRoles, error: errorRoles } = useQuery('roles', async () => {
    try {
      const response = await api.get('/perfiles/roles');
      return extraerRoles(response.data);
    } catch (error) {
      console.error('Error al obtener roles:', error.response?.data || error.message);
      return [];
    }
  });

  // Obtener configuración del dashboard para todos los roles
  const { data: configuracionesDashboard, isLoading: cargandoConfig } = useQuery(
    'configuraciones-dashboard',
    async () => {
      try {
        const response = await api.get('/perfiles/configuracion-dashboard');
        return response.data;
      } catch (error) {
        console.error('Error al obtener configuraciones del dashboard:', error);
        return {};
      }
    }
  );

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

  // Cargar configuración cuando se selecciona un rol
  useEffect(() => {
    if (rolSeleccionado && configuracionesDashboard) {
      const config = configuracionesDashboard[rolSeleccionado] || { widgets: [] };
      setConfiguracionActual(config);
      setCambiosPendientes({});
    }
  }, [rolSeleccionado, configuracionesDashboard]);

  // Función para alternar un widget
  const alternarWidget = (widgetId) => {
    if (!rolSeleccionado) return;
    
    setCambiosPendientes(prev => {
      const widgetsActuales = prev.widgets || configuracionActual.widgets || [];
      const nuevoWidgets = widgetsActuales.includes(widgetId)
        ? widgetsActuales.filter(id => id !== widgetId)
        : [...widgetsActuales, widgetId];
      
      return {
        ...prev,
        widgets: nuevoWidgets
      };
    });
  };

  // Función para guardar cambios
  const guardarCambios = async () => {
    if (!rolSeleccionado || Object.keys(cambiosPendientes).length === 0) return;
    
    try {
      const configuracionNueva = {
        widgets: cambiosPendientes.widgets || configuracionActual.widgets || []
      };
      
      const response = await api.put(`/perfiles/configuracion-dashboard/${rolSeleccionado}`, configuracionNueva);

      if (response.status === 200) {
        setConfiguracionActual(configuracionNueva);
        setCambiosPendientes({});
        queryClient.invalidateQueries('configuraciones-dashboard');
        alert('Configuración guardada exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error.response?.data || error.message);
      alert('Error al guardar la configuración');
    }
  };

  // Función para resetear a configuración por defecto
  const resetearConfiguracion = () => {
    if (!rolSeleccionado) return;
    
    setCambiosPendientes({
      widgets: widgetsDisponibles.map(widget => widget.id)
    });
  };

  // Verificar que el usuario sea admin
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

  if (cargandoRoles || cargandoConfig) {
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
            onClick={() => queryClient.invalidateQueries(['roles', 'configuraciones-dashboard'])}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Selección de Rol */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Seleccionar Rol
            </h3>
            
            {/* Mostrar error si existe */}
            {errorRoles && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Error al cargar roles:</strong>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {JSON.stringify(errorRoles, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Mostrar información de debugging */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800">
                <strong>Debug Info:</strong>
                <div>Roles cargados: {roles ? roles.length : 'undefined'}</div>
                <div>Tipo de datos: {roles ? typeof roles : 'undefined'}</div>
                <div>Es array: {Array.isArray(roles) ? 'Sí' : 'No'}</div>
                {roles && (
                  <div className="mt-2">
                    <strong>Contenido:</strong>
                    <pre className="mt-1 bg-blue-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(roles, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {roles && Array.isArray(roles) && roles.length > 0 ? (
                roles.map(rol => (
                  <div
                    key={rol.rol || rol.id || 'sin-rol'}
                    onClick={() => setRolSeleccionado(rol.rol || rol.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      rolSeleccionado === (rol.rol || rol.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-secondary-900 capitalize">
                      {rol.rol || rol.id || 'Sin rol'}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {rol.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {cargandoRoles ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span>Cargando roles...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium mb-2">No se pudieron cargar los roles</p>
                        <p className="text-sm mb-3">Verifica la consola para más detalles</p>
                        <button 
                          onClick={() => queryClient.invalidateQueries('roles')} 
                          className="btn-primary text-sm"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna 2: Configuración del Rol Seleccionado */}
        <div className="lg:col-span-2">
          {rolSeleccionado ? (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Configuración para: {rolSeleccionado.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Configura qué widgets puede ver este rol en su dashboard
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={resetearConfiguracion}
                    className="btn-secondary text-sm"
                  >
                    Resetear
                  </button>
                </div>
              </div>

              {/* Widgets del Dashboard */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-secondary-700">Widgets del Dashboard:</h4>
                {widgetsDisponibles.map(widget => {
                  const estaHabilitado = (cambiosPendientes.widgets || configuracionActual.widgets || []).includes(widget.id);
                  
                  return (
                    <div key={widget.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{widget.nombre}</span>
                        </div>
                        <p className="text-xs text-gray-600">{widget.descripcion}</p>
                      </div>
                      
                      <button
                        onClick={() => alternarWidget(widget.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          estaHabilitado 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={estaHabilitado ? 'Deshabilitar widget' : 'Habilitar widget'}
                      >
                        {estaHabilitado ? <FiCheck className="h-4 w-4" /> : <FiX className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Resumen */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Widgets habilitados:</span>
                  <span className="font-medium text-blue-600">
                    {(cambiosPendientes.widgets || configuracionActual.widgets || []).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total disponibles:</span>
                  <span className="font-medium text-gray-600">
                    {widgetsDisponibles.length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <FiSettings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un rol
                </h3>
                <p className="text-gray-600">
                  Selecciona un rol de la izquierda para configurar sus widgets del dashboard
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FiSettings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Información sobre la configuración</h4>
            <p className="text-sm text-blue-700 mt-1">
              Los widgets configurados aquí determinarán qué elementos puede ver cada rol en su dashboard principal. 
              Los cambios se aplican inmediatamente después de guardar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
