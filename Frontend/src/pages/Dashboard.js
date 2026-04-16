import { useQuery } from 'react-query';
import {
  FiUsers, FiUserCheck, FiCalendar, FiTrendingUp, FiActivity,
  FiBarChart, FiRefreshCw, FiTruck, FiCheckCircle, FiGitBranch,
  FiPlus, FiFileText, FiAlertTriangle, FiClock, FiUser, FiStar,
  FiArrowRight, FiMapPin, FiCheck
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import EstructuraJerarquica from '../components/EstructuraJerarquica';
import DashboardCiudadano from './DashboardCiudadano';

// ── Tarjeta de métrica ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: '1px solid #f0f0f5',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      borderLeft: `4px solid ${accent}`
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: 22, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
        </p>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#aaa' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Botón de acción rápida ────────────────────────────────────────────────────
function QuickAction({ icon, label, to, color }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px',
        background: color + '12',
        border: `1px solid ${color}30`,
        borderRadius: 10, cursor: 'pointer',
        color, fontWeight: 600, fontSize: 13,
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = color + '22'}
      onMouseLeave={e => e.currentTarget.style.background = color + '12'}
    >
      {icon}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // usado en QuickAction vía prop `to`

  const { data: configuracionPerfil } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        const r = await api.get('/perfiles/mi-configuracion');
        return r.data;
      } catch { return null; }
    },
    { enabled: !!user?.rol, staleTime: 5 * 60 * 1000 }
  );

  const { data: configuracionDashboard, refetch: refetchDashboard } = useQuery(
    ['mi-configuracion-dashboard', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        const r = await api.get('/perfiles/mi-configuracion-dashboard');
        return r.data;
      } catch { return { widgets: [] }; }
    },
    { enabled: !!user?.rol, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true }
  );

  const { data: statsReportes } = useQuery('statsReportesDash', async () => {
    try { const r = await api.get('/reportes-ciudadanos/estadisticas-mapa'); return r.data; } catch { return null; }
  }, { staleTime: 60000 });

  const { data: reportePersonas, isLoading: lP, refetch: rP } = useQuery('reportePersonas', async () => {
    const r = await api.get('/reportes/personas'); return r.data;
  });
  const { data: reporteEventos, isLoading: lE, refetch: rE } = useQuery('reporteEventos', async () => {
    const r = await api.get('/reportes/eventos?historicos=false'); return r.data;
  });
  const { data: reporteEventosHistoricos, isLoading: lEH, refetch: rEH } = useQuery('reporteEventosHistoricos', async () => {
    const r = await api.get('/reportes/eventos-historicos'); return r.data;
  });
  const { data: asistenciasTiempoReal, isLoading: lA, refetch: rA } = useQuery('asistenciasTiempoReal', async () => {
    const r = await api.get('/reportes/asistencias-tiempo-real'); return r.data;
  });
  const { data: movilizacionVehiculos, isLoading: lM, refetch: rM } = useQuery('movilizacionVehiculos', async () => {
    const r = await api.get('/reportes/metricas-movilizacion/'); return r.data;
  });
  const { data: usuarios, isLoading: lU } = useQuery('usuarios', async () => {
    const r = await api.get('/users/'); return r.data;
  });

  // Mis vehículos asignados (para movilizadores)
  const { data: misVehiculos = [] } = useQuery(
    ['misVehiculos', user?.id],
    async () => {
      try { const r = await api.get('/movilizaciones/mis-vehiculos'); return r.data; }
      catch { return []; }
    },
    { enabled: !!user?.id, staleTime: 30000 }
  );

  const stats = {
    totalPersonas: reportePersonas?.total_personas || 0,
    totalEventos: reporteEventos?.total_eventos || 0,
    seccionesCubiertas: reportePersonas ? Object.keys(reportePersonas.personas_por_seccion).length : 0,
    lideresActivos: usuarios ? usuarios.filter(u => u.activo && u.rol.includes('lider')).length : 0,
  };

  const isLoading = lP || lE || lEH || lU || lA || lM;

  const handleRefresh = () => { rP(); rE(); rEH(); rA(); rM(); refetchDashboard(); };

  const getAsistenciaColor = (p) => p >= 80 ? 'text-green-600' : p >= 60 ? 'text-yellow-600' : 'text-red-600';
  const getAsistenciaIcon = (p) => p >= 80
    ? <FiTrendingUp className="text-green-600" />
    : p >= 60
    ? <FiActivity className="text-yellow-600" />
    : <FiTrendingUp className="text-red-600 transform rotate-180" />;

  const formatDate = (s) => new Date(s).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const puedeVerSeccion = (seccion) => {
    if (user?.rol === 'admin') return true;
    if (!configuracionPerfil?.configuracion?.opciones_web) return false;
    const opts = configuracionPerfil.configuracion.opciones_web;
    const mapPerm = {
      'usuarios': 'usuarios', 'personas': 'personas', 'eventos': 'eventos',
      'eventos-historicos': 'eventos-historicos', 'movilizacion': 'movilizacion',
      'reportes': 'reportes', 'estructura-red': 'estructura-red',
      'checkin': 'checkin', 'seguimiento': 'seguimiento'
    };
    const permiso = mapPerm[seccion];
    if (!permiso || !opts.includes(permiso)) return false;
    const widgets = configuracionDashboard?.widgets || [];
    const mapWidget = {
      'usuarios': 'lideres-activos', 'personas': 'total-personas',
      'eventos': 'total-eventos', 'eventos-historicos': 'eventos-historicos',
      'movilizacion': 'movilizacion-vehiculos', 'estructura-red': 'estructura-red',
      'seguimiento': 'asistencias-tiempo-real'
    };
    const w = mapWidget[seccion];
    return w ? widgets.includes(w) : true;
  };

  if (user?.rol === 'ciudadano') return <DashboardCiudadano />;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-secondary-600 text-sm">Resumen de actividad — {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary flex items-center space-x-2">
          <FiRefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Acciones Rápidas */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {puedeVerSeccion('personas') && (
          <QuickAction icon={<FiPlus size={15} />} label="Nueva Persona" to="/personas" color="#2563eb" />
        )}
        {puedeVerSeccion('eventos') && (
          <QuickAction icon={<FiCalendar size={15} />} label="Nuevo Evento" to="/eventos" color="#16a34a" />
        )}
        {puedeVerSeccion('reportes') && (
          <QuickAction icon={<FiBarChart size={15} />} label="Ver Reportes" to="/reportes" color="#7c3aed" />
        )}
        {puedeVerSeccion('usuarios') && (
          <QuickAction icon={<FiUsers size={15} />} label="Gestionar Usuarios" to="/usuarios" color="#ea580c" />
        )}
        <QuickAction icon={<FiFileText size={15} />} label="Noticias" to="/noticias" color="#0891b2" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Cards de estadísticas */}
      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {puedeVerSeccion('personas') && (
            <StatCard icon={<FiUserCheck />} label="Total Personas" value={stats.totalPersonas}
              accent="#2563eb" sub="Registradas en el sistema" />
          )}
          {puedeVerSeccion('eventos') && (
            <StatCard icon={<FiCalendar />} label="Eventos Activos" value={stats.totalEventos}
              accent="#16a34a" sub="Eventos organizados" />
          )}
          {puedeVerSeccion('usuarios') && (
            <StatCard icon={<FiUsers />} label="Líderes Activos" value={stats.lideresActivos}
              accent="#7c3aed" sub="Líderes en actividad" />
          )}
          {puedeVerSeccion('estructura-red') && (
            <StatCard icon={<FiGitBranch />} label="Secciones Cubiertas" value={stats.seccionesCubiertas}
              accent="#ea580c" sub="Secciones electorales" />
          )}
        </div>
      )}

      {/* Estadísticas Alerta Ciudadana */}
      {statsReportes && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0c4a6e 100%)',
          borderRadius: 16, padding: '24px 28px', color: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#38bdf8', marginBottom: 4 }}>Plataforma ciudadana activa</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>
                Alerta <span style={{ color: '#38bdf8' }}>Ciudadana</span>
              </div>
              <div style={{ fontSize: '.8rem', color: '#94a3b8', marginTop: 3 }}>Reportes ciudadanos en tiempo real</div>
            </div>
            <button onClick={() => navigate('/alerta-ciudadana')} style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ver mapa →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total',       n: statsReportes.resumen?.total ?? 0,       color: '#e2e8f0', Icon: FiAlertTriangle },
              { label: 'Pendientes',  n: statsReportes.resumen?.pendientes ?? 0,  color: '#fbbf24', Icon: FiClock },
              { label: 'En Progreso', n: statsReportes.resumen?.en_progreso ?? 0, color: '#a78bfa', Icon: FiActivity },
              { label: 'Resueltos',   n: statsReportes.resumen?.resueltos ?? 0,   color: '#34d399', Icon: FiCheckCircle },
            ].map(({ label, n, color, Icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mis Movilizaciones (solo si soy movilizador con vehículos asignados) ── */}
      {misVehiculos.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiStar size={17} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>Mis Movilizaciones Asignadas</div>
                <div style={{ fontSize: '.78rem', color: '#6b7280' }}>Vehículos bajo tu responsabilidad</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {misVehiculos.map((mv, i) => {
              const pct = mv.porcentaje || 0;
              const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#3b82f6';
              const estadoBadge = mv.en_curso
                ? { label: 'En curso', color: '#16a34a', bg: '#dcfce7' }
                : mv.proximo
                ? { label: 'Próximo', color: '#2563eb', bg: '#dbeafe' }
                : { label: 'Hoy', color: '#7c3aed', bg: '#ede9fe' };

              return (
                <div key={i} style={{ border: '1px solid #e4e7ed', borderRadius: 14, overflow: 'hidden', borderTop: `3px solid ${barColor}` }}>
                  {/* Header tarjeta */}
                  <div style={{ padding: '12px 14px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <FiTruck size={14} color="#3b82f6" />
                        <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a1f2e' }}>
                          {mv.vehiculo_tipo}
                          {mv.vehiculo_placas && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '.8rem' }}> ({mv.vehiculo_placas})</span>}
                        </span>
                      </div>
                      <div style={{ fontSize: '.8rem', color: '#374151', fontWeight: 600 }}>{mv.evento_nombre}</div>
                      <div style={{ fontSize: '.73rem', color: '#9ca3af', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span><FiClock size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {new Date(mv.evento_fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {mv.evento_lugar && (
                          <span><FiMapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{mv.evento_lugar}</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: estadoBadge.color, background: estadoBadge.bg, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {estadoBadge.label}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.82rem' }}>
                      <span style={{ color: '#6b7280' }}>
                        <FiUsers size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {mv.presentes}/{mv.total_personas} presentes
                      </span>
                      <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f0f0f5', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => navigate('/checkin')}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px', background: '#2563eb', color: 'white',
                          border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                        }}
                      >
                        <FiCheck size={13} /> Ir a Check-in
                      </button>
                      <button
                        onClick={() => navigate('/movilizacion')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '8px 12px', background: '#f3f4f6', color: '#374151',
                          border: 'none', borderRadius: 9, fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                        }}
                      >
                        <FiArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rankings */}
      {!isLoading && reportePersonas && puedeVerSeccion('personas') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Secciones Electorales</h3>
            {Object.keys(reportePersonas.personas_por_seccion || {}).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(reportePersonas.personas_por_seccion)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([seccion, total], i) => (
                    <div key={seccion} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 8,
                      background: i % 2 === 0 ? '#f8f9ff' : 'transparent'
                    }}>
                      <span className="font-medium text-sm">{seccion}</span>
                      <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 13 }}>{total.toLocaleString('es-MX')} personas</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">Sin datos aún</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Líderes por Personas</h3>
            {Object.keys(reportePersonas.personas_por_lider || {}).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(reportePersonas.personas_por_lider)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([nombre, total], i) => (
                    <div key={nombre} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 8,
                      background: i % 2 === 0 ? '#f8f9ff' : 'transparent'
                    }}>
                      <span className="font-medium text-sm">{nombre}</span>
                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>{total.toLocaleString('es-MX')} personas</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">Sin datos aún</p>
            )}
          </div>
        </div>
      )}

      {/* Movilización por vehículos */}
      {!isLoading && movilizacionVehiculos && puedeVerSeccion('movilizacion') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiTruck className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Reporte de Movilización por Vehículos</h2>
            </div>
            <button onClick={rM} className="btn-secondary text-sm flex items-center space-x-1">
              <FiRefreshCw className="h-3 w-3" /><span>Actualizar</span>
            </button>
          </div>

          {movilizacionVehiculos.resumen_global && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total Vehículos', val: movilizacionVehiculos.resumen_global.total_vehiculos, color: 'blue' },
                { label: 'Total Asignaciones', val: movilizacionVehiculos.resumen_global.total_asignaciones, color: 'green' },
                { label: 'Total Asistencias', val: movilizacionVehiculos.resumen_global.total_asistencias, color: 'purple' },
                { label: 'Promedio Asistencia', val: movilizacionVehiculos.resumen_global.promedio_asistencia + '%', color: 'orange' },
                { label: 'Promedio Movilización', val: movilizacionVehiculos.resumen_global.promedio_movilizacion + '%', color: 'red' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
                  <div className={`text-sm text-${color}-600 font-medium`}>{label}</div>
                  <div className={`text-2xl font-bold text-${color}-900`}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {movilizacionVehiculos.top_vehiculos?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Vehículos por Rendimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movilizacionVehiculos.top_vehiculos.map((v, i) => (
                  <div key={v.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FiTruck className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-secondary-900">{v.tipo}</span>
                      </div>
                      <span className="text-sm text-gray-500">#{i + 1}</span>
                    </div>
                    {v.placas && <p className="text-sm text-gray-600 mb-2">Placas: {v.placas}</p>}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-gray-600">Asignados:</span><span className="font-semibold ml-1">{v.total_asignados}</span></div>
                      <div><span className="text-gray-600">Asistencias:</span><span className="font-semibold ml-1">{v.total_asistencias}</span></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Asistencia</span><span>{v.porcentaje_asistencia}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${v.porcentaje_asistencia >= 80 ? 'bg-green-500' : v.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${v.porcentaje_asistencia}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Asistencias en tiempo real */}
      {!isLoading && asistenciasTiempoReal && puedeVerSeccion('seguimiento') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiActivity className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Asistencias en Tiempo Real</h2>
            </div>
            <button onClick={rA} className="btn-secondary text-sm flex items-center space-x-1">
              <FiRefreshCw className="h-3 w-3" /><span>Actualizar</span>
            </button>
          </div>

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

          {asistenciasTiempoReal.eventos?.length > 0 ? (
            <div className="space-y-4">
              {asistenciasTiempoReal.eventos.map(ev => (
                <div key={ev.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-secondary-900">{ev.nombre}</h3>
                      <p className="text-xs text-secondary-500">{formatDate(ev.fecha)} · <span className="text-blue-600">{ev.tipo}</span></p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAsistenciaIcon(ev.porcentaje_asistencia)}
                      <span className={`text-lg font-bold ${getAsistenciaColor(ev.porcentaje_asistencia)}`}>{ev.porcentaje_asistencia}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-3">
                    <div><p className="text-xs text-gray-500">Asignados</p><p className="font-bold">{ev.total_asignados}</p></div>
                    <div><p className="text-xs text-gray-500">Presentes</p><p className="font-bold text-green-600">{ev.total_asistencias}</p></div>
                    <div><p className="text-xs text-gray-500">Movilizados</p><p className="font-bold text-blue-600">{ev.movilizados} ({ev.porcentaje_movilizacion}%)</p></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${ev.porcentaje_asistencia >= 80 ? 'bg-green-500' : ev.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${ev.porcentaje_asistencia}%` }} />
                  </div>
                  {ev.ultimas_asistencias?.length > 0 && (
                    <div className="border-t mt-3 pt-3">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Últimas asistencias:</h4>
                      <div className="space-y-1">
                        {ev.ultimas_asistencias.map((a, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-gray-500">
                            {a.movilizado ? <FiCheckCircle className="text-green-500 h-3 w-3" /> : <FiUser className="text-blue-500 h-3 w-3" />}
                            <span>{a.hora_checkin ? formatDate(a.hora_checkin) : 'Sin hora'}</span>
                            {a.movilizado && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">Movilizado</span>}
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
              <FiCalendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay eventos activos con asistencias registradas</p>
            </div>
          )}
        </div>
      )}

      {/* Eventos históricos */}
      {!isLoading && reporteEventosHistoricos && puedeVerSeccion('eventos-historicos') && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiCalendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-secondary-900">Reporte de Eventos Históricos</h2>
            </div>
            <button onClick={rEH} className="btn-secondary text-sm flex items-center space-x-1">
              <FiRefreshCw className="h-3 w-3" /><span>Actualizar</span>
            </button>
          </div>

          {reporteEventosHistoricos.resumen && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total Eventos', val: reporteEventosHistoricos.total_eventos, color: 'blue' },
                { label: 'Total Asignados', val: reporteEventosHistoricos.resumen.total_asignados, color: 'green' },
                { label: 'Total Asistencias', val: reporteEventosHistoricos.resumen.total_asistencias, color: 'purple' },
                { label: 'Prom. Asistencia', val: reporteEventosHistoricos.resumen.promedio_asistencia + '%', color: 'orange' },
                { label: 'Prom. Movilización', val: reporteEventosHistoricos.resumen.promedio_movilizacion + '%', color: 'red' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3`}>
                  <div className={`text-xs text-${color}-600 font-medium`}>{label}</div>
                  <div className={`text-xl font-bold text-${color}-900`}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {reporteEventosHistoricos.eventos_detallados?.length > 0 ? (
            <div className="space-y-3">
              {reporteEventosHistoricos.eventos_detallados.map(ev => (
                <div key={ev.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-secondary-900">{ev.nombre}</h3>
                      <p className="text-xs text-gray-400">{formatDate(ev.fecha)} · {ev.tipo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAsistenciaIcon(ev.porcentaje_asistencia)}
                      <span className={`font-bold ${getAsistenciaColor(ev.porcentaje_asistencia)}`}>{ev.porcentaje_asistencia}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs mb-2">
                    <div><p className="text-gray-400">Asignados</p><p className="font-bold text-sm">{ev.total_asignados}</p></div>
                    <div><p className="text-gray-400">Presentes</p><p className="font-bold text-sm text-green-600">{ev.asistencias_confirmadas}</p></div>
                    <div><p className="text-gray-400">Movilizados</p><p className="font-bold text-sm text-blue-600">{ev.movilizados} ({ev.porcentaje_movilizacion}%)</p></div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${ev.porcentaje_asistencia >= 80 ? 'bg-green-500' : ev.porcentaje_asistencia >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${ev.porcentaje_asistencia}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay eventos históricos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Estructura jerárquica */}
      {!isLoading && puedeVerSeccion('estructura-red') && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <FiGitBranch className="text-blue-600" /> Estructura de la Red
          </h3>
          <EstructuraJerarquica />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
