import React from 'react';
import { useQuery } from 'react-query';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock, 
  FiMapPin,
  FiTrendingUp,
  FiActivity,
  FiUser,
  FiBarChart,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardCiudadano = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Obtener datos de reportes ciudadanos usando React Query
  const { data: reportesCiudadanos, isLoading: loadingReportes, refetch: refetchReportes } = useQuery('reportesCiudadanos', async () => {
    const response = await api.get('/reportes-ciudadanos/');
    return response.data;
  });

  const { data: estadisticasReportes, isLoading: loadingEstadisticas, refetch: refetchEstadisticas } = useQuery('estadisticasReportes', async () => {
    const response = await api.get('/reportes-ciudadanos/estados');
    return response.data;
  });

  // Calcular estadísticas
  const stats = {
    totalReportes: reportesCiudadanos?.length || 0,
    reportesPendientes: reportesCiudadanos?.filter(r => r.estado === 'pendiente').length || 0,
    reportesEnProceso: reportesCiudadanos?.filter(r => r.estado === 'en_proceso').length || 0,
    reportesResueltos: reportesCiudadanos?.filter(r => r.estado === 'resuelto').length || 0,
  };

  const isLoading = loadingReportes || loadingEstadisticas;

  // Función para refrescar todos los datos
  const handleRefresh = () => {
    refetchReportes();
    refetchEstadisticas();
  };

  // Función para eliminar un reporte
  const handleDeleteReporte = async (reporteId) => {
    try {
      console.log('🗑️ Intentando eliminar reporte:', reporteId);
      console.log('🔑 Token disponible:', localStorage.getItem('token') ? 'Sí' : 'No');
      
      const response = await api.delete(`/reportes-ciudadanos/${reporteId}`);
      
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.status === 200) {
        // Mostrar mensaje de éxito
        alert('Reporte eliminado exitosamente');
        // Refrescar la lista de reportes
        refetchReportes();
        refetchEstadisticas();
      }
    } catch (error) {
      console.error('❌ Error al eliminar reporte:', error);
      console.error('❌ Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        alert('No tienes permisos para eliminar este reporte');
      } else if (error.response?.status === 404) {
        alert('Reporte no encontrado');
      } else if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        alert(`Error al eliminar el reporte: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  // Función para obtener color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100';
      case 'en_proceso':
        return 'text-blue-600 bg-blue-100';
      case 'resuelto':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Función para obtener icono según estado
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <FiClock className="h-4 w-4" />;
      case 'en_proceso':
        return <FiActivity className="h-4 w-4" />;
      case 'resuelto':
        return <FiCheckCircle className="h-4 w-4" />;
      default:
        return <FiAlertTriangle className="h-4 w-4" />;
    }
  };

  // Función para obtener color según tipo de reporte
  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'bache':
        return 'bg-orange-500';
      case 'iluminacion':
        return 'bg-yellow-500';
      case 'salud':
        return 'bg-red-500';
      case 'seguridad':
        return 'bg-purple-500';
      case 'agua':
        return 'bg-blue-500';
      case 'drenaje':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener etiqueta de estado
  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'resuelto':
        return 'Resuelto';
      default:
        return 'Desconocido';
    }
  };

  // Función para obtener etiqueta de tipo
  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'bache':
        return 'Bache';
      case 'iluminacion':
        return 'Iluminación';
      case 'salud':
        return 'Salud';
      case 'seguridad':
        return 'Seguridad';
      case 'agua':
        return 'Agua';
      case 'drenaje':
        return 'Drenaje';
      default:
        return 'Otro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-secondary-600">
            Dashboard de Reportes Ciudadanos - Aquí puedes ver el estado de tus reportes
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/reportes-ciudadanos')}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Nuevo Reporte</span>
          </button>
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Estadísticas */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <FiAlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Reportes</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalReportes}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-secondary-500">Reportes creados</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Pendientes</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.reportesPendientes}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-secondary-500">En espera de revisión</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <FiActivity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">En Proceso</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.reportesEnProceso}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-secondary-500">Siendo atendidos</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Resueltos</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.reportesResueltos}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-secondary-500">Problemas solucionados</span>
            </div>
          </div>
        </div>
      )}

      {/* Reportes Recientes */}
      {!isLoading && reportesCiudadanos && reportesCiudadanos.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiBarChart className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Mis Reportes Recientes</h2>
            </div>
            <button
              onClick={() => navigate('/reportes-ciudadanos')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportesCiudadanos.slice(0, 5).map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reporte.titulo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reporte.descripcion.length > 50 
                          ? `${reporte.descripcion.substring(0, 50)}...` 
                          : reporte.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getTipoColor(reporte.tipo)}`}>
                        {getTipoLabel(reporte.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(reporte.estado)}`}>
                        {getEstadoIcon(reporte.estado)}
                        <span className="ml-1">{getEstadoLabel(reporte.estado)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(reporte.fecha_creacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/reportes-ciudadanos/${reporte.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        {reporte.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => navigate(`/reportes-ciudadanos/${reporte.id}/editar`)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
                                  handleDeleteReporte(reporte.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay reportes */}
      {!isLoading && (!reportesCiudadanos || reportesCiudadanos.length === 0) && (
        <div className="card">
          <div className="text-center py-12">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reportes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aún no has creado ningún reporte ciudadano.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/reportes-ciudadanos')}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <FiPlus className="h-4 w-4" />
                <span>Crear mi primer reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas por Estado */}
      {!isLoading && estadisticasReportes && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-secondary-900">Estadísticas por Estado</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(estadisticasReportes).map(([estado, count]) => (
              <div key={estado} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getEstadoColor(estado)}`}>
                  {getEstadoIcon(estado)}
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {getEstadoLabel(estado)}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">reportes</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCiudadano; 