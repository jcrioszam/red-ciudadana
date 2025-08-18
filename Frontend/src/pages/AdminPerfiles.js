import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FiUsers, FiSettings, FiCheck, FiX, FiEye, FiEyeOff, FiSave, FiRefreshCw,
  FiMonitor, FiSmartphone, FiShield, FiUserCheck, FiBarChart3
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const AdminPerfiles = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRol, setSelectedRol] = useState('admin');
  const [configuracionActual, setConfiguracionActual] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Obtener roles disponibles
  const { data: rolesData, isLoading: loadingRoles } = useQuery('roles', async () => {
    const response = await api.get('/perfiles/roles');
    return response.data;
  });

  // Obtener opciones de menú
  const { data: opcionesData, isLoading: loadingOpciones } = useQuery('opciones-menu', async () => {
    const response = await api.get('/perfiles/opciones-menu');
    return response.data;
  });

  // Obtener configuración del rol seleccionado
  const { data: configuracionData, isLoading: loadingConfiguracion, refetch: refetchConfiguracion } = useQuery(
    ['configuracion-perfil', selectedRol],
    async () => {
      const response = await api.get(`/perfiles/configuracion/${selectedRol}`);
      return response.data;
    },
    {
      enabled: !!selectedRol,
      onSuccess: (data) => {
        setConfiguracionActual(data.configuracion);
      }
    }
  );

  // Obtener estadísticas de usuarios por rol
  const { data: estadisticasData, isLoading: loadingEstadisticas } = useQuery('usuarios-por-rol', async () => {
    const response = await api.get('/perfiles/usuarios-por-rol');
    return response.data;
  });

  // Mutación para actualizar configuración
  const updateConfiguracionMutation = useMutation(
    async ({ rol, configuracion }) => {
      console.log('Enviando configuración:', { rol, configuracion });
      const response = await api.put(`/perfiles/configuracion/${rol}`, configuracion);
      return response.data;
    },
    {
      onSuccess: () => {
        console.log('Configuración actualizada exitosamente');
        queryClient.invalidateQueries(['configuracion-perfil', selectedRol]);
        setIsEditing(false);
      },
      onError: (error) => {
        console.error('Error al actualizar configuración:', error);
        alert(`Error al guardar: ${error.response?.data?.detail || error.message}`);
      }
    }
  );

  const handleToggleOpcion = (tipo, opcionId) => {
    if (!isEditing) return;
    
    const nuevasOpciones = configuracionActual[tipo] || [];
    const opcionIndex = nuevasOpciones.indexOf(opcionId);
    
    if (opcionIndex > -1) {
      // Remover opción
      nuevasOpciones.splice(opcionIndex, 1);
    } else {
      // Agregar opción
      nuevasOpciones.push(opcionId);
    }
    
    setConfiguracionActual({
      ...configuracionActual,
      [tipo]: nuevasOpciones
    });
  };

  const handleSave = () => {
    console.log('Botón guardar presionado');
    console.log('Rol seleccionado:', selectedRol);
    console.log('Configuración actual:', configuracionActual);
    updateConfiguracionMutation.mutate({
      rol: selectedRol,
      configuracion: configuracionActual
    });
  };

  const handleCancel = () => {
    setConfiguracionActual(configuracionData.configuracion);
    setIsEditing(false);
  };

  const getRolNombre = (rolId) => {
    const rol = rolesData?.roles?.find(r => r.id === rolId);
    return rol?.nombre || rolId;
  };

  const getOpcionNombre = (tipo, opcionId) => {
    const opciones = opcionesData?.[tipo] || [];
    const opcion = opciones.find(o => o.id === opcionId);
    return opcion?.nombre || opcionId;
  };

  const getOpcionDescripcion = (tipo, opcionId) => {
    const opciones = opcionesData?.[tipo] || [];
    const opcion = opciones.find(o => o.id === opcionId);
    return opcion?.descripcion || '';
  };

  if (loadingRoles || loadingOpciones) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración de perfiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Perfiles</h1>
              <p className="text-gray-600 mt-2">Gestiona permisos y opciones de menú por rol</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => refetchConfiguracion()}
                className="btn-secondary flex items-center space-x-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas de usuarios por rol */}
        {estadisticasData && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {estadisticasData.estadisticas.map((stat) => (
              <div key={stat.rol} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <FiUsers className="h-6 w-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">{getRolNombre(stat.rol)}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.cantidad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selector de rol */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Rol</h3>
              <div className="space-y-2">
                {rolesData?.roles?.map((rol) => (
                  <button
                    key={rol.id}
                    onClick={() => setSelectedRol(rol.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRol === rol.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{rol.nombre}</div>
                    <div className="text-sm text-gray-600">{rol.descripcion}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuración de permisos */}
          <div className="lg:col-span-3">
            {loadingConfiguracion ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Configuración para: {getRolNombre(selectedRol)}
                    </h3>
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={updateConfiguracionMutation.isLoading}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <FiSave className="h-4 w-4" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <FiX className="h-4 w-4" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <FiSettings className="h-4 w-4" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Opciones Web */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <FiMonitor className="h-5 w-5 text-blue-600" />
                        <h4 className="text-lg font-medium text-gray-900">Opciones Web</h4>
                      </div>
                      <div className="space-y-2">
                        {opcionesData?.opciones_web?.map((opcion) => {
                          const isEnabled = configuracionActual?.opciones_web?.includes(opcion.id);
                          return (
                            <div
                              key={opcion.id}
                              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                isEnabled
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              } ${isEditing ? 'hover:border-gray-300' : ''}`}
                              onClick={() => handleToggleOpcion('opciones_web', opcion.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {isEnabled ? (
                                    <FiCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <FiX className="h-4 w-4 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{opcion.nombre}</div>
                                    <div className="text-sm text-gray-600">{opcion.descripcion}</div>
                                  </div>
                                </div>
                                {isEditing && (
                                  <div className="text-sm text-gray-500">
                                    {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Opciones App */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <FiSmartphone className="h-5 w-5 text-green-600" />
                        <h4 className="text-lg font-medium text-gray-900">Opciones App Móvil</h4>
                      </div>
                      <div className="space-y-2">
                        {opcionesData?.opciones_app?.map((opcion) => {
                          const isEnabled = configuracionActual?.opciones_app?.includes(opcion.id);
                          return (
                            <div
                              key={opcion.id}
                              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                isEnabled
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              } ${isEditing ? 'hover:border-gray-300' : ''}`}
                              onClick={() => handleToggleOpcion('opciones_app', opcion.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {isEnabled ? (
                                    <FiCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <FiX className="h-4 w-4 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{opcion.nombre}</div>
                                    <div className="text-sm text-gray-600">{opcion.descripcion}</div>
                                  </div>
                                </div>
                                {isEditing && (
                                  <div className="text-sm text-gray-500">
                                    {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Resumen de configuración</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Opciones Web habilitadas:</span>
                        <span className="ml-2 font-medium">
                          {configuracionActual?.opciones_web?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Opciones App habilitadas:</span>
                        <span className="ml-2 font-medium">
                          {configuracionActual?.opciones_app?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPerfiles; 