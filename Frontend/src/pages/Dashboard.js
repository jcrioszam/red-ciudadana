import React from 'react';
import { useQuery } from 'react-query';
import { 
  FiUsers, 
  FiUserCheck, 
  FiCalendar, 
  FiMapPin,
  FiTrendingUp,
  FiActivity,
  FiUser,
  FiBarChart,
  FiPlus,
  FiGitBranch,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiTruck
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EstructuraJerarquica from '../components/EstructuraJerarquica';
import DashboardCiudadano from './DashboardCiudadano';

const Dashboard = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Obtener configuración de permisos del usuario actual
  const { data: configuracionPerfil } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        const response = await api.get('/perfiles/mi-configuracion');
        return response.data;
      } catch (error) {
        console.error('Error al obtener configuración del perfil:', error);
        return null;
      }
    },
    {
      enabled: !!user?.rol,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  // Obtener configuración del dashboard para el rol del usuario
  const { data: configuracionDashboard } = useQuery(
    ['configuracion-dashboard-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        const response = await api.get('/perfiles/configuracion-dashboard');
        console.log('🔍 Configuración completa del dashboard:', response.data);
        console.log('🔍 Rol del usuario:', user.rol);
        console.log('🔍 Configuración del rol:', response.data[user.rol]);
        return response.data; // Devolver toda la configuración
      } catch (error) {
        console.error('Error al obtener configuración del dashboard:', error);
        return {};
      }
    },
    {
      enabled: !!user?.rol,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  // Obtener datos de reportes usando React Query
  const { data: reportePersonas, isLoading: loadingPersonas, refetch: refetchPersonas } = useQuery('reportePersonas', async () => {
    const response = await api.get('/reportes/personas');
    return response.data;
  });

  const { data: reporteEventos, isLoading: loadingEventos, refetch: refetchEventos } = useQuery('reporteEventos', async () => {
    const response = await api.get('/reportes/eventos?historicos=false');
    return response.data;
  });

  const { data: reporteEventosHistoricos, isLoading: loadingEventosHistoricos, refetch: refetchEventosHistoricos } = useQuery('reporteEventosHistoricos', async () => {
    const response = await api.get('/reportes/eventos-historicos');
    return response.data;
  });

  const { data: asistenciasTiempoReal, isLoading: loadingAsistencias, refetch: refetchAsistencias } = useQuery('asistenciasTiempoReal', async () => {
    const response = await api.get('/reportes/asistencias-tiempo-real');
    return response.data;
  });

  const { data: movilizacionVehiculos, isLoading: loadingMovilizacion, refetch: refetchMovilizacion } = useQuery('movilizacionVehiculos', async () => {
    const response = await api.get('/reportes/movilizacion-vehiculos');
    return response.data;
  });

  const { data: usuarios, isLoading: loadingUsuarios } = useQuery('usuarios', async () => {
    const response = await api.get('/users/');
    return response.data;
  });

  // Calcular estadísticas
  const stats = {
    totalPersonas: reportePersonas?.total_personas || 0,
    totalEventos: reporteEventos?.total_eventos || 0,
    seccionesCubiertas: reportePersonas ? Object.keys(reportePersonas.personas_por_seccion).length : 0,
    lideresActivos: usuarios ? usuarios.filter(u => u.activo && u.rol.includes('lider')).length : 0,
  };

  const isLoading = loadingPersonas || loadingEventos || loadingEventosHistoricos || loadingUsuarios || loadingAsistencias || loadingMovilizacion;

  // Función para refrescar todos los datos
  const handleRefresh = () => {
    refetchPersonas();
    refetchEventos();
    refetchEventosHistoricos();
    refetchAsistencias();
    refetchMovilizacion();
  };

  // Función para obtener color según porcentaje de asistencia
  const getAsistenciaColor = (porcentaje) => {
    if (porcentaje >= 80) return 'text-green-600';
    if (porcentaje >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Función para obtener icono según porcentaje de asistencia
  const getAsistenciaIcon = (porcentaje) => {
    if (porcentaje >= 80) return <FiTrendingUp className="text-green-600" />;
    if (porcentaje >= 60) return <FiActivity className="text-yellow-600" />;
    return <FiTrendingUp className="text-red-600 transform rotate-180" />;
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

  // Función para verificar si el usuario puede ver una sección específica
  const puedeVerSeccion = (seccion) => {
    if (!configuracionPerfil?.configuracion?.opciones_web) return false;
    
    const opcionesPermitidas = configuracionPerfil.configuracion.opciones_web;
    
    // Mapeo de secciones a permisos requeridos
    const mapeoSecciones = {
      'usuarios': 'usuarios',
      'personas': 'personas',
      'eventos': 'eventos',
      'eventos-historicos': 'eventos-historicos',
      'movilizacion': 'movilizacion',
      'reportes': 'reportes',
      'estructura-red': 'estructura-red',
      'checkin': 'checkin',
      'seguimiento': 'seguimiento'
    };
    
    const permisoRequerido = mapeoSecciones[seccion];
    const tienePermiso = permisoRequerido ? opcionesPermitidas.includes(permisoRequerido) : false;
    
    // Verificar también si el widget está habilitado en la configuración del dashboard PARA EL ROL ESPECÍFICO
    const configuracionRol = configuracionDashboard?.[user?.rol];
    const widgetsHabilitados = configuracionRol?.widgets || [];
    
    console.log(`🔍 Verificando sección '${seccion}' para rol '${user?.rol}':`);
    console.log(`  - Permisos del perfil:`, opcionesPermitidas);
    console.log(`  - Permiso requerido: ${permisoRequerido}`);
    console.log(`  - Tiene permiso: ${tienePermiso}`);
    console.log(`  - Configuración del rol:`, configuracionRol);
    console.log(`  - Widgets habilitados:`, widgetsHabilitados);
    
    const mapeoWidgets = {
      'usuarios': 'lideres-activos',
      'personas': 'total-personas',
      'eventos': 'total-eventos',
      'eventos-historicos': 'eventos-historicos',
      'movilizacion': 'movilizacion-vehiculos',
      'estructura-red': 'estructura-red',
      'seguimiento': 'asistencias-tiempo-real'
    };
    
    const widgetRequerido = mapeoWidgets[seccion];
    const widgetHabilitado = widgetRequerido ? widgetsHabilitados.includes(widgetRequerido) : true;
    
    console.log(`  - Widget requerido: ${widgetRequerido}`);
    console.log(`  - Widget habilitado: ${widgetHabilitado}`);
    console.log(`  - Resultado final: ${tienePermiso && widgetHabilitado}`);
    
    return tienePermiso && widgetHabilitado;
  };

  // Si el usuario es ciudadano, mostrar el dashboard específico
  console.log('Dashboard - User role:', user?.rol);
  console.log('Dashboard - User object:', user);
  
  if (user?.rol === 'ciudadano') {
    console.log('Dashboard - Rendering DashboardCiudadano');
    return <DashboardCiudadano />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-secondary-600">
            Aquí tienes un resumen de la actividad reciente
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center space-x-2"
        >
          <FiRefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Estadísticas - Solo mostrar si tiene permisos */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Personas - Solo si puede ver personas */}
          {puedeVerSeccion('personas') && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <FiUser className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Personas</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalPersonas}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-secondary-500">Registradas en el sistema</span>
              </div>
            </div>
          )}
          
          {/* Total Eventos - Solo si puede ver eventos */}
          {puedeVerSeccion('eventos') && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <FiBarChart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Eventos</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalEventos}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-secondary-500">Eventos organizados</span>
              </div>
            </div>
          )}
          
          {/* Líderes Activos - Solo si puede ver usuarios */}
          {puedeVerSeccion('usuarios') && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <FiUserCheck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Líderes Activos</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.lideresActivos}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-secondary-500">Líderes en actividad</span>
              </div>
            </div>
          )}
          
          {/* Secciones Cubiertas - Solo si puede ver estructura-red */}
          {puedeVerSeccion('estructura-red') && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <FiMapPin className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Secciones Cubiertas</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.seccionesCubiertas}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-secondary-500">Secciones electorales</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte de Movilización por Vehículos - Solo si puede ver movilización */}
      {!isLoading && movilizacionVehiculos && puedeVerSeccion('movilizacion') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiTruck className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Reporte de Movilización por Vehículos</h2>
            </div>
            <button
              onClick={refetchMovilizacion}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Resumen Global de Movilización */}
          {movilizacionVehiculos.resumen_global && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Vehículos</div>
                <div className="text-2xl font-bold text-blue-900">{movilizacionVehiculos.resumen_global.total_vehiculos}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Total Asignaciones</div>
                <div className="text-2xl font-bold text-green-900">{movilizacionVehiculos.resumen_global.total_asignaciones}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Total Asistencias</div>
                <div className="text-2xl font-bold text-purple-900">{movilizacionVehiculos.resumen_global.total_asistencias}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Promedio Asistencia</div>
                <div className="text-2xl font-bold text-orange-900">{movilizacionVehiculos.resumen_global.promedio_asistencia}%</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-600 font-medium">Promedio Movilización</div>
                <div className="text-2xl font-bold text-red-900">{movilizacionVehiculos.resumen_global.promedio_movilizacion}%</div>
              </div>
            </div>
          )}

          {/* Top Vehículos */}
          {movilizacionVehiculos.top_vehiculos && movilizacionVehiculos.top_vehiculos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Vehículos por Rendimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movilizacionVehiculos.top_vehiculos.map((vehiculo, index) => (
                  <div key={vehiculo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center space-x-2">
                         <FiTruck className="h-5 w-5 text-blue-600" />
                         <span className="font-semibold text-secondary-900">{vehiculo.tipo}</span>
                       </div>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    {vehiculo.placas && (
                      <p className="text-sm text-gray-600 mb-2">Placas: {vehiculo.placas}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Asignados:</span>
                        <span className="font-semibold ml-1">{vehiculo.total_asignados}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Asistencias:</span>
                        <span className="font-semibold ml-1">{vehiculo.total_asistencias}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Movilizados:</span>
                        <span className="font-semibold ml-1">{vehiculo.movilizados}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacidad:</span>
                        <span className="font-semibold ml-1">{vehiculo.capacidad}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Asistencia</span>
                        <span>{vehiculo.porcentaje_asistencia}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            vehiculo.porcentaje_asistencia >= 80 ? 'bg-green-500' :
                            vehiculo.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${vehiculo.porcentaje_asistencia}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista Completa de Vehículos */}
          {movilizacionVehiculos.estadisticas_vehiculos && movilizacionVehiculos.estadisticas_vehiculos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Estadísticas por Vehículo</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencias</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movilizados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Asistencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Movilización</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movilizacionVehiculos.estadisticas_vehiculos.map((vehiculo) => (
                      <tr key={vehiculo.id} className="hover:bg-gray-50">
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                             <FiTruck className="h-4 w-4 text-blue-600 mr-2" />
                             <div>
                               <div className="text-sm font-medium text-gray-900">{vehiculo.tipo}</div>
                               {vehiculo.descripcion && (
                                 <div className="text-sm text-gray-500">{vehiculo.descripcion}</div>
                               )}
                             </div>
                           </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehiculo.placas || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehiculo.total_asignados}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehiculo.total_asistencias}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehiculo.movilizados}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getAsistenciaColor(vehiculo.porcentaje_asistencia)}`}>
                            {vehiculo.porcentaje_asistencia}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">
                            {vehiculo.porcentaje_movilizacion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte de Asistencias en Tiempo Real - Solo si puede ver seguimiento */}
      {!isLoading && asistenciasTiempoReal && puedeVerSeccion('seguimiento') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiActivity className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Reporte de Asistencias en Tiempo Real</h2>
            </div>
            <button
              onClick={refetchAsistencias}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Resumen Global */}
          {asistenciasTiempoReal.resumen_global && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Asignados</div>
                <div className="text-2xl font-bold text-blue-900">{asistenciasTiempoReal.resumen_global.total_asignados}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Total Asistencias</div>
                <div className="text-2xl font-bold text-green-900">{asistenciasTiempoReal.resumen_global.total_asistencias}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Promedio Asistencia</div>
                <div className="text-2xl font-bold text-purple-900">{asistenciasTiempoReal.resumen_global.promedio_asistencia}%</div>
              </div>
            </div>
          )}

          {/* Lista de Eventos */}
          {asistenciasTiempoReal.eventos && asistenciasTiempoReal.eventos.length > 0 ? (
            <div className="space-y-4">
              {asistenciasTiempoReal.eventos.map((evento) => (
                <div key={evento.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900">{evento.nombre}</h3>
                      <p className="text-sm text-secondary-600">{formatDate(evento.fecha)}</p>
                      <p className="text-xs text-blue-600 font-medium">{evento.tipo}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAsistenciaIcon(evento.porcentaje_asistencia)}
                      <span className={`text-lg font-bold ${getAsistenciaColor(evento.porcentaje_asistencia)}`}>
                        {evento.porcentaje_asistencia}%
                      </span>
                    </div>
                  </div>

                  {/* Estadísticas del evento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Asignados</div>
                      <div className="text-lg font-bold text-secondary-900">{evento.total_asignados}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Presentes</div>
                      <div className="text-lg font-bold text-green-600">{evento.total_asistencias}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Movilizados</div>
                      <div className="text-lg font-bold text-blue-600">{evento.movilizados} ({evento.porcentaje_movilizacion}%)</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-secondary-600 mb-1">
                      <span>Progreso de asistencia</span>
                      <span>{evento.porcentaje_asistencia}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          evento.porcentaje_asistencia >= 80 ? 'bg-green-500' :
                          evento.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${evento.porcentaje_asistencia}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Últimas asistencias */}
                  {evento.ultimas_asistencias && evento.ultimas_asistencias.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-2">Últimas asistencias:</h4>
                      <div className="space-y-1">
                        {evento.ultimas_asistencias.map((asistencia, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            {asistencia.movilizado ? (
                              <FiCheckCircle className="text-green-600 h-4 w-4" />
                            ) : (
                              <FiUser className="text-blue-600 h-4 w-4" />
                            )}
                            <span className="text-secondary-600">
                              {asistencia.hora_checkin ? formatDate(asistencia.hora_checkin) : 'Sin hora registrada'}
                            </span>
                            {asistencia.movilizado && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Movilizado</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay eventos activos con asistencias registradas</p>
            </div>
          )}
        </div>
      )}



      {/* Reporte de Eventos Históricos - Solo si puede ver eventos-historicos */}
      {!isLoading && reporteEventosHistoricos && puedeVerSeccion('eventos-historicos') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiCalendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Reporte de Eventos Históricos</h2>
            </div>
            <button
              onClick={refetchEventosHistoricos}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Actualizar</span>
            </button>
          </div>

                     {/* Resumen Global */}
           {reporteEventosHistoricos.resumen && (
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                 <div className="text-sm text-blue-600 font-medium">Total Eventos</div>
                 <div className="text-2xl font-bold text-blue-900">{reporteEventosHistoricos.total_eventos}</div>
               </div>
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="text-sm text-green-600 font-medium">Total Asignados</div>
                 <div className="text-2xl font-bold text-green-900">{reporteEventosHistoricos.resumen.total_asignados}</div>
               </div>
               <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                 <div className="text-sm text-purple-600 font-medium">Total Asistencias</div>
                 <div className="text-2xl font-bold text-purple-900">{reporteEventosHistoricos.resumen.total_asistencias}</div>
               </div>
               <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                 <div className="text-sm text-orange-600 font-medium">Promedio Asistencia</div>
                 <div className="text-2xl font-bold text-orange-900">{reporteEventosHistoricos.resumen.promedio_asistencia}%</div>
               </div>
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="text-sm text-red-600 font-medium">Promedio Movilización</div>
                 <div className="text-2xl font-bold text-red-900">{reporteEventosHistoricos.resumen.promedio_movilizacion}%</div>
               </div>
             </div>
           )}

           {/* Lista de Eventos */}
           {reporteEventosHistoricos.eventos_detallados && reporteEventosHistoricos.eventos_detallados.length > 0 ? (
                         <div className="space-y-4">
               {reporteEventosHistoricos.eventos_detallados.map((evento) => (
                <div key={evento.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900">{evento.nombre}</h3>
                      <p className="text-sm text-secondary-600">{formatDate(evento.fecha)}</p>
                      <p className="text-xs text-blue-600 font-medium">{evento.tipo}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAsistenciaIcon(evento.porcentaje_asistencia)}
                      <span className={`text-lg font-bold ${getAsistenciaColor(evento.porcentaje_asistencia)}`}>
                        {evento.porcentaje_asistencia}%
                      </span>
                    </div>
                  </div>

                  {/* Estadísticas del evento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Asignados</div>
                      <div className="text-lg font-bold text-secondary-900">{evento.total_asignados}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Presentes</div>
                      <div className="text-lg font-bold text-green-600">{evento.asistencias_confirmadas}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-secondary-600">Movilizados</div>
                      <div className="text-lg font-bold text-blue-600">{evento.movilizados} ({evento.porcentaje_movilizacion}%)</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-secondary-600 mb-1">
                      <span>Progreso de asistencia</span>
                      <span>{evento.porcentaje_asistencia}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          evento.porcentaje_asistencia >= 80 ? 'bg-green-500' :
                          evento.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${evento.porcentaje_asistencia}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Últimas asistencias */}
                  {evento.ultimas_asistencias && evento.ultimas_asistencias.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-2">Últimas asistencias:</h4>
                      <div className="space-y-1">
                        {evento.ultimas_asistencias.map((asistencia, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            {asistencia.movilizado ? (
                              <FiCheckCircle className="text-green-600 h-4 w-4" />
                            ) : (
                              <FiUser className="text-blue-600 h-4 w-4" />
                            )}
                            <span className="text-secondary-600">
                              {asistencia.hora_checkin ? formatDate(asistencia.hora_checkin) : 'Sin hora registrada'}
                            </span>
                            {asistencia.movilizado && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Movilizado</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay eventos históricos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Rankings - Solo si puede ver personas */}
      {!isLoading && reportePersonas && puedeVerSeccion('personas') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Secciones Electorales</h3>
            {reportePersonas.personas_por_seccion && Object.keys(reportePersonas.personas_por_seccion).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(reportePersonas.personas_por_seccion)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([seccion, total]) => (
                    <div key={seccion} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="font-medium">{seccion}</span>
                      <span className="text-blue-600 font-bold">{total} personas</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay secciones con personas registradas</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Líderes por Personas</h3>
            {reportePersonas.personas_por_lider && Object.keys(reportePersonas.personas_por_lider).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(reportePersonas.personas_por_lider)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([nombre, total]) => (
                    <div key={nombre} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="font-medium">{nombre}</span>
                      <span className="text-green-600 font-bold">{total} personas</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay líderes con personas registradas</p>
            )}
          </div>
        </div>
      )}

      {/* Estructura Jerárquica - Solo si puede ver estructura-red */}
      {!isLoading && puedeVerSeccion('estructura-red') && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Estructura de la Red</h3>
          <EstructuraJerarquica />
        </div>
      )}
    </div>
  );
};

export default Dashboard; 