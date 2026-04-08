import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiDownload, FiBarChart, FiUsers, FiCalendar, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import api from '../api';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#dc2626', '#ca8a04'];

const Reportes = () => {
  const [selectedReport, setSelectedReport] = useState('personas');

  const { data: reportePersonas, isLoading: loadingPersonas } = useQuery('reportePersonas', async () => {
    const r = await api.get('/reportes/personas');
    return r.data;
  });

  const { data: reporteEventos, isLoading: loadingEventos } = useQuery('reporteEventos', async () => {
    const r = await api.get('/reportes/eventos');
    return r.data;
  });

  // ── Exportar Personas ─────────────────────────────────────────────────────
  const handleExportPersonas = () => {
    if (!reportePersonas) return;
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().split('T')[0];

      // Hoja 1: Resumen
      const resumen = [
        { Métrica: 'Total Personas', Valor: reportePersonas.total_personas },
        { Métrica: 'Secciones Cubiertas', Valor: Object.keys(reportePersonas.personas_por_seccion).length },
        { Métrica: 'Colonias Cubiertas', Valor: Object.keys(reportePersonas.personas_por_colonia).length },
        { Métrica: 'Líderes con Personas', Valor: Object.keys(reportePersonas.personas_por_lider).length },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');

      // Hoja 2: Por Sección
      const secciones = Object.entries(reportePersonas.personas_por_seccion)
        .sort(([, a], [, b]) => b - a)
        .map(([seccion, total]) => ({ 'Sección Electoral': seccion, Total: total }));
      const wsSec = XLSX.utils.json_to_sheet(secciones);
      wsSec['!cols'] = [{ wch: 25 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsSec, 'Por Sección');

      // Hoja 3: Por Líder
      const lideres = Object.entries(reportePersonas.personas_por_lider)
        .sort(([, a], [, b]) => b - a)
        .map(([lider, total]) => ({
          Líder: lider,
          Total: total,
          'Porcentaje (%)': ((total / reportePersonas.total_personas) * 100).toFixed(1)
        }));
      const wsLid = XLSX.utils.json_to_sheet(lideres);
      wsLid['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsLid, 'Por Líder');

      // Hoja 4: Por Colonia
      const colonias = Object.entries(reportePersonas.personas_por_colonia)
        .sort(([, a], [, b]) => b - a)
        .map(([colonia, total]) => ({ Colonia: colonia, Total: total }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(colonias), 'Por Colonia');

      XLSX.writeFile(wb, `reporte_personas_${today}.xlsx`);
      toast.success('Reporte de personas exportado correctamente');
    } catch (e) {
      toast.error('Error al exportar: ' + e.message);
    }
  };

  // ── Exportar Eventos ──────────────────────────────────────────────────────
  const handleExportEventos = () => {
    if (!reporteEventos) return;
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().split('T')[0];
      const totalAsistencias = Object.values(reporteEventos.asistencias_por_evento).reduce((a, b) => a + b, 0);

      // Hoja 1: Resumen
      const resumen = [
        { Métrica: 'Total Eventos', Valor: reporteEventos.total_eventos },
        { Métrica: 'Total Asistencias', Valor: totalAsistencias },
        { Métrica: 'Tipos de Eventos', Valor: Object.keys(reporteEventos.eventos_por_tipo).length },
        {
          Métrica: 'Promedio Asistencia por Evento',
          Valor: reporteEventos.total_eventos > 0
            ? Math.round(totalAsistencias / reporteEventos.total_eventos) : 0
        },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');

      // Hoja 2: Por Tipo
      const tipos = Object.entries(reporteEventos.eventos_por_tipo)
        .sort(([, a], [, b]) => b - a)
        .map(([tipo, total]) => ({ 'Tipo de Evento': tipo, Total: total }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tipos), 'Por Tipo');

      // Hoja 3: Eficiencia por Evento
      const eficiencia = Object.entries(reporteEventos.eficiencia_movilizacion)
        .sort(([, a], [, b]) => b.porcentaje - a.porcentaje)
        .map(([evento, data]) => ({
          Evento: evento,
          'Total Asistencias': data.total,
          Movilizados: data.movilizados,
          'Eficiencia (%)': data.porcentaje.toFixed(1)
        }));
      const wsEf = XLSX.utils.json_to_sheet(eficiencia);
      wsEf['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsEf, 'Eficiencia');

      XLSX.writeFile(wb, `reporte_eventos_${today}.xlsx`);
      toast.success('Reporte de eventos exportado correctamente');
    } catch (e) {
      toast.error('Error al exportar: ' + e.message);
    }
  };

  const formatNumber = (n) => new Intl.NumberFormat('es-MX').format(n);
  const getTopItems = (data, limit = 5) =>
    Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, limit);

  if (loadingPersonas || loadingEventos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ── Datos para gráficas ───────────────────────────────────────────────────
  const topSeccionesChart = reportePersonas
    ? getTopItems(reportePersonas.personas_por_seccion, 10).map(([s, v]) => ({ name: s, Personas: v }))
    : [];

  const tiposEventoChart = reporteEventos
    ? Object.entries(reporteEventos.eventos_por_tipo).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Reportes y Estadísticas</h1>
          <p className="text-secondary-600 text-sm">Análisis de datos y métricas del sistema</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPersonas}
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={!reportePersonas}
          >
            <FiDownload size={15} />
            Exportar Personas
          </button>
          <button
            onClick={handleExportEventos}
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={!reporteEventos}
          >
            <FiDownload size={15} />
            Exportar Eventos
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-secondary-200">
        <button
          onClick={() => setSelectedReport('personas')}
          className={`pb-2 px-4 font-medium text-sm ${
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
          className={`pb-2 px-4 font-medium text-sm ${
            selectedReport === 'eventos'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-500 hover:text-secondary-700'
          }`}
        >
          <FiCalendar className="inline mr-2" />
          Reporte de Eventos
        </button>
      </div>

      {/* ── REPORTE PERSONAS ─────────────────────────────────────────────── */}
      {selectedReport === 'personas' && reportePersonas && (
        <div className="space-y-6">
          {/* Cards métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Personas', val: reportePersonas.total_personas, color: '#2563eb', icon: <FiUsers /> },
              { label: 'Secciones', val: Object.keys(reportePersonas.personas_por_seccion).length, color: '#16a34a', icon: <FiMapPin /> },
              { label: 'Colonias', val: Object.keys(reportePersonas.personas_por_colonia).length, color: '#7c3aed', icon: <FiMapPin /> },
              { label: 'Líderes', val: Object.keys(reportePersonas.personas_por_lider).length, color: '#ea580c', icon: <FiUsers /> },
            ].map(({ label, val, color, icon }) => (
              <div key={label} className="card flex items-center gap-3">
                <div style={{ background: color + '18', color, padding: 10, borderRadius: 10, fontSize: 20 }}>{icon}</div>
                <div>
                  <p className="text-xs text-secondary-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-secondary-900">{formatNumber(val)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfica de barras: personas por sección */}
          {topSeccionesChart.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <FiBarChart className="text-blue-600" /> Top 10 Secciones Electorales
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSeccionesChart} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Personas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tablas top 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-base font-semibold text-secondary-900 mb-4">Top 5 Secciones Electorales</h3>
              <div className="space-y-2">
                {getTopItems(reportePersonas.personas_por_seccion).map(([s, n]) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sección {s}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(n / Math.max(...Object.values(reportePersonas.personas_por_seccion))) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="text-base font-semibold text-secondary-900 mb-4">Top 5 Colonias</h3>
              <div className="space-y-2">
                {getTopItems(reportePersonas.personas_por_colonia).map(([c, n]) => (
                  <div key={c} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-36">{c}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(n / Math.max(...Object.values(reportePersonas.personas_por_colonia))) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla líderes */}
          <div className="card">
            <h3 className="text-base font-semibold text-secondary-900 mb-4">Personas por Líder</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Líder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registradas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porcentaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getTopItems(reportePersonas.personas_por_lider, 10).map(([lider, n]) => (
                    <tr key={lider} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{lider}</td>
                      <td className="px-4 py-3">{n}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {((n / reportePersonas.total_personas) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTE EVENTOS ──────────────────────────────────────────────── */}
      {selectedReport === 'eventos' && reporteEventos && (
        <div className="space-y-6">
          {/* Cards métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Eventos', val: reporteEventos.total_eventos, color: '#2563eb', icon: <FiCalendar /> },
              { label: 'Total Asistencias', val: Object.values(reporteEventos.asistencias_por_evento).reduce((a, b) => a + b, 0), color: '#16a34a', icon: <FiUsers /> },
              {
                label: 'Prom. Asistencia',
                val: reporteEventos.total_eventos > 0
                  ? Math.round(Object.values(reporteEventos.asistencias_por_evento).reduce((a, b) => a + b, 0) / reporteEventos.total_eventos)
                  : 0,
                color: '#7c3aed', icon: <FiTrendingUp />
              },
              { label: 'Tipos de Eventos', val: Object.keys(reporteEventos.eventos_por_tipo).length, color: '#ea580c', icon: <FiBarChart /> },
            ].map(({ label, val, color, icon }) => (
              <div key={label} className="card flex items-center gap-3">
                <div style={{ background: color + '18', color, padding: 10, borderRadius: 10, fontSize: 20 }}>{icon}</div>
                <div>
                  <p className="text-xs text-secondary-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-secondary-900">{formatNumber(val)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart tipos */}
            {tiposEventoChart.length > 0 && (
              <div className="card">
                <h3 className="text-base font-semibold text-secondary-900 mb-4">Distribución por Tipo de Evento</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={tiposEventoChart} cx="50%" cy="50%" outerRadius={90}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {tiposEventoChart.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Eficiencia top 5 */}
            <div className="card">
              <h3 className="text-base font-semibold text-secondary-900 mb-4">Eficiencia de Movilización</h3>
              <div className="space-y-2">
                {Object.entries(reporteEventos.eficiencia_movilizacion).slice(0, 5).map(([ev, data]) => (
                  <div key={ev} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-40">{ev}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${data.porcentaje}%` }} />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{data.porcentaje.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla eventos */}
          <div className="card">
            <h3 className="text-base font-semibold text-secondary-900 mb-4">Eventos y Asistencias</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asistencias</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movilizados</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(reporteEventos.eficiencia_movilizacion).map(([ev, data]) => (
                    <tr key={ev} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{ev}</td>
                      <td className="px-4 py-3">{data.total}</td>
                      <td className="px-4 py-3">{data.movilizados}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
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
