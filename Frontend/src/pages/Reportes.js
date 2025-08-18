import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiDownload, FiBarChart, FiUsers, FiCalendar, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';

const Reportes = () => {
  const [selectedReport, setSelectedReport] = useState('personas');

  // Obtener reporte de personas
  const { data: reportePersonas, isLoading: loadingPersonas } = useQuery(
    'reportePersonas',
    async () => {
      const response = await api.get('/reportes/personas');
      return response.data;
    }
  );

  // Obtener reporte de eventos
  const { data: reporteEventos, isLoading: loadingEventos } = useQuery(
    'reporteEventos',
    async () => {
      const response = await api.get('/reportes/eventos');
      return response.data;
    }
  );

  const handleExport = (type) => {
    // Implementar exportación a Excel/PDF
    toast.success(`Exportando reporte de ${type}...`);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const getTopItems = (data, limit = 5) => {
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  };

  if (loadingPersonas || loadingEventos) {
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
          <h1 className="text-2xl font-bold text-secondary-900">Reportes y Estadísticas</h1>
          <p className="text-secondary-600">Análisis de datos y métricas del sistema</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('personas')}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar Personas
          </button>
          <button
            onClick={() => handleExport('eventos')}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            Exportar Eventos
          </button>
        </div>
      </div>

      {/* Selector de reportes */}
      <div className="flex space-x-4 border-b border-secondary-200">
        <button
          onClick={() => setSelectedReport('personas')}
          className={`pb-2 px-4 font-medium ${
            selectedReport === 'personas'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
        >
          <FiUsers className="inline mr-2" />
          Reporte de Personas
        </button>
        <button
          onClick={() => setSelectedReport('eventos')}
          className={`pb-2 px-4 font-medium ${
            selectedReport === 'eventos'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
        >
          <FiCalendar className="inline mr-2" />
          Reporte de Eventos
        </button>
      </div>

      {/* Reporte de Personas */}
      {selectedReport === 'personas' && reportePersonas && (
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Personas</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {formatNumber(reportePersonas.total_personas)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <FiMapPin className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Secciones Cubiertas</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Object.keys(reportePersonas.personas_por_seccion).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <FiMapPin className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Colonias Cubiertas</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Object.keys(reportePersonas.personas_por_colonia).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Líderes Activos</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Object.keys(reportePersonas.personas_por_lider).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top secciones electorales */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Top 5 Secciones Electorales
              </h3>
              <div className="space-y-3">
                {getTopItems(reportePersonas.personas_por_seccion).map(([seccion, count]) => (
                  <div key={seccion} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-900">
                      Sección {seccion}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-secondary-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(reportePersonas.personas_por_seccion))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-secondary-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top colonias */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Top 5 Colonias
              </h3>
              <div className="space-y-3">
                {getTopItems(reportePersonas.personas_por_colonia).map(([colonia, count]) => (
                  <div key={colonia} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-900">
                      {colonia}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-secondary-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(reportePersonas.personas_por_colonia))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-secondary-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de líderes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Personas por Líder
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Líder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Personas Registradas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Porcentaje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {getTopItems(reportePersonas.personas_por_lider, 10).map(([lider, count]) => (
                    <tr key={lider}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                        {lider}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {((count / reportePersonas.total_personas) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Eventos */}
      {selectedReport === 'eventos' && reporteEventos && (
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <FiCalendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Eventos</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {formatNumber(reporteEventos.total_eventos)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Asistencias</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {formatNumber(Object.values(reporteEventos.asistencias_por_evento).reduce((a, b) => a + b, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Promedio Asistencia</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {reporteEventos.total_eventos > 0 
                      ? Math.round(Object.values(reporteEventos.asistencias_por_evento).reduce((a, b) => a + b, 0) / reporteEventos.total_eventos)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <FiBarChart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Tipos de Eventos</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Object.keys(reporteEventos.eventos_por_tipo).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eventos por tipo */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Eventos por Tipo
              </h3>
              <div className="space-y-3">
                {Object.entries(reporteEventos.eventos_por_tipo).map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-900 capitalize">
                      {tipo}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-secondary-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / reporteEventos.total_eventos) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-secondary-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eficiencia de movilización */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Eficiencia de Movilización
              </h3>
              <div className="space-y-3">
                {Object.entries(reporteEventos.eficiencia_movilizacion).slice(0, 5).map(([evento, data]) => (
                  <div key={evento} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-900 truncate max-w-32">
                      {evento}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-secondary-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${data.porcentaje}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-secondary-900 w-16 text-right">
                        {data.porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de eventos con asistencias */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Eventos y Asistencias
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Asistencias
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Movilizados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Eficiencia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {Object.entries(reporteEventos.eficiencia_movilizacion).map(([evento, data]) => (
                    <tr key={evento}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                        {evento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {data.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {data.movilizados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          data.porcentaje >= 80 ? 'bg-green-100 text-green-800' :
                          data.porcentaje >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.porcentaje.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes; 