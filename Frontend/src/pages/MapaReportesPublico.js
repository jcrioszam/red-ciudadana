import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiFilter,
  FiX, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import MapaInteractivo from '../components/MapaInteractivo';
import api from '../api';

const TIPOS = [
  { value: 'dano_via_publica', label: '🚧 Daño Vía Pública' },
  { value: 'servicios_publicos', label: '🚰 Servicios Públicos' },
  { value: 'seguridad', label: '🚨 Seguridad' },
  { value: 'limpieza', label: '🧹 Limpieza' },
  { value: 'otro', label: '📋 Otro' },
];

const ESTADOS = [
  { value: 'pendiente',   label: '⏳ Pendiente',   color: 'bg-amber-100 text-amber-800' },
  { value: 'en_revision', label: '🔍 En Revisión', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_progreso', label: '⚡ En Progreso', color: 'bg-purple-100 text-purple-800' },
  { value: 'resuelto',    label: '✅ Resuelto',    color: 'bg-green-100 text-green-800' },
  { value: 'rechazado',   label: '❌ Rechazado',   color: 'bg-red-100 text-red-800' },
];

const estadoInfo = (estado) =>
  ESTADOS.find(e => e.value === estado) || { label: estado, color: 'bg-gray-100 text-gray-700' };

const tipoLabel = (tipo) =>
  TIPOS.find(t => t.value === tipo)?.label || tipo || '📋 Otro';

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function MapaReportesPublico() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', fecha_inicio: '', fecha_fin: '' });
  const [panelFiltros, setPanelFiltros] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargar = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const { data } = await api.get(`/reportes-publicos${q ? '?' + q : ''}`);
      setReportes(data || []);
    } catch {
      setError('No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aplicar = () => { cargar(filtros); setPanelFiltros(false); };
  const limpiar = () => {
    const vacio = { tipo: '', estado: '', fecha_inicio: '', fecha_fin: '' };
    setFiltros(vacio);
    cargar(vacio);
    setPanelFiltros(false);
  };

  const conteo = (estado) => reportes.filter(r => r.estado === estado).length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <FiMapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h1 className="text-lg font-bold text-gray-900 truncate">Mapa de Reportes</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => cargar(filtros)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Actualizar">
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPanelFiltros(!panelFiltros)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              panelFiltros ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <FiFilter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {Object.values(filtros).some(Boolean) && (
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* ── PANEL FILTROS ───────────────────────────────── */}
      {panelFiltros && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <select value={filtros.tipo}
                onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos los tipos</option>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <select value={filtros.estado}
                onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos los estados</option>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>

              <input type="date" value={filtros.fecha_inicio}
                onChange={e => setFiltros(p => ({ ...p, fecha_inicio: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <input type="date" value={filtros.fecha_fin}
                onChange={e => setFiltros(p => ({ ...p, fecha_fin: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex gap-2">
              <button onClick={aplicar}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Aplicar
              </button>
              <button onClick={limpiar}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS RÁPIDAS ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: reportes.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pendientes', count: conteo('pendiente'), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'En Progreso', count: conteo('en_progreso'), color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Resueltos', count: conteo('resuelto'), color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── MAPA ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 500 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3" />
                <p className="text-sm">Cargando mapa...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <div className="text-center">
                <FiAlertCircle className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <MapaInteractivo
              modo="visualizacion"
              reportes={reportes}
              onReporteClick={setSeleccionado}
            />
          )}
        </div>
      </div>

      {/* ── LISTA DE REPORTES ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-base font-bold text-gray-700 mb-3">
          Reportes ({reportes.length})
        </h2>

        {reportes.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-400">
            <FiMapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No hay reportes con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportes.map(r => {
              const est = estadoInfo(r.estado);
              return (
                <button key={r.id} onClick={() => setSeleccionado(r)}
                  className="text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900 line-clamp-2 flex-1">{r.titulo}</span>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${est.color}`}>
                      {est.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.descripcion}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{tipoLabel(r.tipo)}</span>
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />{fmtFecha(r.fecha_creacion)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE ─────────────────────────────────── */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSeleccionado(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Foto */}
            {seleccionado.fotos?.[0]?.url && (
              <img src={seleccionado.fotos[0].url} alt="foto"
                className="w-full h-48 object-cover rounded-t-2xl" />
            )}

            <div className="p-5">
              {/* Título + cerrar */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{seleccionado.titulo}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{tipoLabel(seleccionado.tipo)}</p>
                </div>
                <button onClick={() => setSeleccionado(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Estado */}
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${estadoInfo(seleccionado.estado).color}`}>
                {estadoInfo(seleccionado.estado).label}
              </span>

              {/* Descripción */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{seleccionado.descripcion}</p>

              {/* Galería adicional */}
              {seleccionado.fotos?.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {seleccionado.fotos.slice(1).map((f, i) => (
                    <img key={i} src={f.url} alt={`foto ${i + 2}`}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => window.open(f.url, '_blank')} />
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div>
                  <p className="font-semibold text-gray-700 mb-0.5">Fecha</p>
                  <p className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />{fmtFecha(seleccionado.fecha_creacion)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-0.5">Ubicación</p>
                  <p className="flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    {seleccionado.latitud?.toFixed(4)}, {seleccionado.longitud?.toFixed(4)}
                  </p>
                </div>
                {seleccionado.direccion && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-700 mb-0.5">Dirección</p>
                    <p>{seleccionado.direccion}</p>
                  </div>
                )}
                {seleccionado.observaciones_admin && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-700 mb-0.5">Observaciones</p>
                    <p className="bg-gray-50 rounded-lg p-2">{seleccionado.observaciones_admin}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
