import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { FiCalendar, FiRefreshCw, FiCheckCircle, FiXCircle, FiUser, FiMapPin, FiClock } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const EventosHistoricos = () => {
  const { logout } = useAuth();
  const [selectedEvento, setSelectedEvento] = useState(null);

  // Obtener datos de eventos históricos
  const { data: reporteEventosHistoricos, isLoading, error, refetch } = useQuery('reporteEventosHistoricos', async () => {
    try {
      const response = await api.get('/reportes/eventos-historicos');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
      }
      throw error;
    }
  });

  // Obtener lista de eventos históricos
  const { data: eventosHistoricos } = useQuery('eventosHistoricos', async () => {
    const response = await api.get('/eventos/?activos=false');
    return response.data;
  });



  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAsistenciaColor = (porcentaje) => {
    if (porcentaje >= 80) return 'text-green-600';
    if (porcentaje >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAsistenciaIcon = (porcentaje) => {
    if (porcentaje >= 80) return <FiCheckCircle className="h-5 w-5 text-green-600" />;
    if (porcentaje >= 60) return <FiUser className="h-5 w-5 text-yellow-600" />;
    return <FiXCircle className="h-5 w-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando eventos históricos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Error al cargar eventos históricos</h3>
            <p>{error.message}</p>
            <button 
              onClick={refetch}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Eventos Históricos</h1>
              <p className="text-gray-600 mt-2">Reportes y estadísticas de eventos pasados</p>
            </div>
            <button
              onClick={refetch}
              className="btn-primary flex items-center space-x-2"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>



        {/* Resumen Global */}
        {reporteEventosHistoricos?.resumen && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <FiCalendar className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{reporteEventosHistoricos.total_eventos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <FiUser className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Asignados</p>
                  <p className="text-2xl font-bold text-gray-900">{reporteEventosHistoricos.resumen.total_asignados}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <FiCheckCircle className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Asistencias</p>
                  <p className="text-2xl font-bold text-gray-900">{reporteEventosHistoricos.resumen.total_asistencias}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <FiClock className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Promedio Asistencia</p>
                  <p className="text-2xl font-bold text-gray-900">{reporteEventosHistoricos.resumen.promedio_asistencia}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <FiMapPin className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Promedio Movilización</p>
                  <p className="text-2xl font-bold text-gray-900">{reporteEventosHistoricos.resumen.promedio_movilizacion}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos de estadísticas */}
        {reporteEventosHistoricos?.eventos_por_tipo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(reporteEventosHistoricos.eventos_por_tipo)
                  .sort(([,a], [,b]) => b - a)
                  .map(([tipo, cantidad]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <span className="text-gray-700">{tipo}</span>
                      <span className="font-semibold text-blue-600">{cantidad} eventos</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Mes</h3>
              <div className="space-y-3">
                {Object.entries(reporteEventosHistoricos.eventos_por_mes)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([mes, cantidad]) => (
                    <div key={mes} className="flex items-center justify-between">
                      <span className="text-gray-700">{mes}</span>
                      <span className="font-semibold text-green-600">{cantidad} eventos</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Eventos Históricos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Eventos Históricos Detallados</h3>
          </div>
          
          {reporteEventosHistoricos?.eventos_detallados && reporteEventosHistoricos.eventos_detallados.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {reporteEventosHistoricos.eventos_detallados.map((evento) => (
                <div key={evento.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-semibold text-gray-900">{evento.nombre}</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {evento.tipo}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">
                        <FiCalendar className="inline h-4 w-4 mr-1" />
                        {formatDate(evento.fecha)}
                      </p>
                      {evento.lugar && (
                        <p className="text-gray-600">
                          <FiMapPin className="inline h-4 w-4 mr-1" />
                          {evento.lugar}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getAsistenciaIcon(evento.porcentaje_asistencia)}
                      <span className={`text-xl font-bold ${getAsistenciaColor(evento.porcentaje_asistencia)}`}>
                        {evento.porcentaje_asistencia}%
                      </span>
                    </div>
                  </div>

                  {/* Estadísticas del evento */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Asignados</div>
                      <div className="text-lg font-bold text-gray-900">{evento.total_asignados}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Presentes</div>
                      <div className="text-lg font-bold text-green-700">{evento.asistencias_confirmadas}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Movilizados</div>
                      <div className="text-lg font-bold text-blue-700">{evento.movilizados}</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Movilización</div>
                      <div className="text-lg font-bold text-purple-700">{evento.porcentaje_movilizacion}%</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso de asistencia</span>
                      <span>{evento.porcentaje_asistencia}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          evento.porcentaje_asistencia >= 80 ? 'bg-green-500' :
                          evento.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${evento.porcentaje_asistencia}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos históricos</h3>
              <p className="text-gray-500">Los eventos aparecerán aquí una vez que hayan pasado más de 24 horas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventosHistoricos; 