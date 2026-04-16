import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#f59e0b', bg: '#fef3c7' },
  { value: 'en_revision', label: 'En Revisión', color: '#3b82f6', bg: '#dbeafe' },
  { value: 'en_progreso', label: 'En Progreso', color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'resuelto',    label: 'Resuelto',    color: '#10b981', bg: '#d1fae5' },
  { value: 'rechazado',   label: 'Rechazado',   color: '#ef4444', bg: '#fee2e2' },
];
const TIPOS_LABEL = {
  bache: 'Bache', basura: 'Basura', drenaje: 'Drenaje', agua: 'Agua',
  luminaria: 'Alumbrado', seguridad: 'Seguridad', baches_banqueta_invadida: 'Baches/Banqueta',
  basura_alumbrado: 'Basura/Alumbrado', agua_potable_drenaje: 'Agua/Drenaje',
  transito_vialidad: 'Tránsito', otro: 'Otro',
};

function estadoBadge(e) {
  const s = ESTADOS.find(x => x.value === e) || { label: e, color: '#6b7280', bg: '#f3f4f6' };
  return <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '.7rem', fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>;
}
function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminReportesAlerta() {
  const [tab, setTab] = useState('lista'); // 'lista' | 'estadisticas'
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', search: '' });
  const [seleccionado, setSeleccionado] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [panelActualizar, setPanelActualizar] = useState(false);
  const [formAct, setFormAct] = useState({ estado_nuevo: '', comentario: '', evidencias: [] });
  const [enviandoAct, setEnviandoAct] = useState(false);
  const [stats, setStats] = useState(null);

  const LIMIT = 20;

  const cargarReportes = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('skip', ((page - 1) * LIMIT).toString());
      q.set('limit', LIMIT.toString());
      if (filtros.estado) q.set('estado', filtros.estado);
      if (filtros.tipo) q.set('tipo', filtros.tipo);
      const res = await api.get(`/reportes-ciudadanos/?${q}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.datos || [];
      setReportes(data);
      setTotal(res.data?.total || data.length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filtros]);

  const cargarStats = useCallback(async () => {
    try {
      const res = await api.get('/reportes-ciudadanos/estadisticas-mapa');
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { cargarReportes(); cargarStats(); }, [cargarReportes, cargarStats]);

  const verDetalle = async (r) => {
    setSeleccionado(r);
    setHistorial(null);
    setPanelActualizar(false);
    setFormAct({ estado_nuevo: r.estado, comentario: '', evidencias: [] });
    setLoadingHist(true);
    try {
      const res = await api.get(`/reportes-ciudadanos/${r.id}/historial`);
      setHistorial(res.data);
    } catch {} finally { setLoadingHist(false); }
  };

  const enviarActualizacion = async () => {
    if (!formAct.estado_nuevo) return;
    setEnviandoAct(true);
    try {
      const fd = new FormData();
      fd.append('estado_nuevo', formAct.estado_nuevo);
      fd.append('comentario', formAct.comentario || '');
      for (const ev of formAct.evidencias) fd.append('evidencias', ev);

      await api.post(
        `/reportes-ciudadanos/${seleccionado.id}/actualizar-con-fotos`,
        fd, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPanelActualizar(false);
      setFormAct({ estado_nuevo: '', comentario: '', evidencias: [] });
      cargarReportes();
      // refresh detalle
      const res2 = await api.get(`/reportes-ciudadanos/${seleccionado.id}/historial`);
      setHistorial(res2.data);
      setSeleccionado(prev => ({ ...prev, estado: formAct.estado_nuevo }));
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    } finally { setEnviandoAct(false); }
  };

  const reportesFiltrados = reportes.filter(r => {
    if (!filtros.search) return true;
    const q = filtros.search.toLowerCase();
    return (r.titulo || '').toLowerCase().includes(q) || (r.descripcion || '').toLowerCase().includes(q) || (r.folio || '').toLowerCase().includes(q);
  });

  // ─── Stats tab ───────────────────────────────────────────────────────────
  const renderStats = () => (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e', marginBottom: 20 }}>Estadísticas de Reportes</h2>
      {!stats ? <div style={{ color: '#8b93a5' }}>Cargando...</div> : (
        <>
          {/* Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total', n: stats.resumen?.total ?? 0, color: '#2563eb', bg: '#eff6ff' },
              { label: 'Pendientes', n: stats.resumen?.pendientes ?? 0, color: '#f59e0b', bg: '#fef3c7' },
              { label: 'En Progreso', n: stats.resumen?.en_progreso ?? 0, color: '#8b5cf6', bg: '#ede9fe' },
              { label: 'Resueltos', n: stats.resumen?.resueltos ?? 0, color: '#10b981', bg: '#d1fae5' },
              { label: 'Rechazados', n: stats.resumen?.rechazados ?? 0, color: '#ef4444', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: '1px solid white' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Por tipo */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e4e7ed', padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#1a1f2e', marginBottom: 12 }}>Por tipo de problema</div>
            {(stats.porTipo || []).map(t => (
              <div key={t.tipo} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: '.78rem', color: '#4a5168', flex: 1 }}>{TIPOS_LABEL[t.tipo] || t.tipo}</div>
                <div style={{ flex: 3, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', height: 8 }}>
                  <div style={{ height: '100%', background: '#2563eb', borderRadius: 4, width: `${Math.min(100, (t.total / (stats.resumen?.total || 1)) * 100)}%` }} />
                </div>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#1a1f2e', minWidth: 24, textAlign: 'right' }}>{t.total}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1f2e', marginBottom: 2 }}>🚨 Gestión de Reportes</h1>
          <p style={{ fontSize: '.82rem', color: '#8b93a5' }}>Administra y da seguimiento a los reportes ciudadanos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('lista')} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', background: tab === 'lista' ? '#2563eb' : '#f3f4f6', color: tab === 'lista' ? 'white' : '#4a5168' }}>
            Lista
          </button>
          <button onClick={() => setTab('estadisticas')} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', background: tab === 'estadisticas' ? '#2563eb' : '#f3f4f6', color: tab === 'estadisticas' ? 'white' : '#4a5168' }}>
            Estadísticas
          </button>
        </div>
      </div>

      {tab === 'estadisticas' ? renderStats() : (
        <div style={{ display: 'grid', gridTemplateColumns: seleccionado ? '1fr 380px' : '1fr', gap: 16 }}>
          {/* ── Lista ── */}
          <div>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input value={filtros.search} onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))}
                placeholder="Buscar por folio o descripción..."
                style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.84rem', outline: 'none' }} />
              <select value={filtros.estado} onChange={e => { setFiltros(f => ({ ...f, estado: e.target.value })); setPage(1); }}
                style={{ padding: '8px 12px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.84rem', outline: 'none' }}>
                <option value="">Todos los estados</option>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <select value={filtros.tipo} onChange={e => { setFiltros(f => ({ ...f, tipo: e.target.value })); setPage(1); }}
                style={{ padding: '8px 12px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.84rem', outline: 'none' }}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPOS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={cargarReportes} style={{ padding: '8px 14px', background: '#f3f4f6', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: '.84rem', fontWeight: 600, color: '#4a5168' }}>↻</button>
            </div>

            {/* Tabla */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e4e7ed', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: '#f7f8fa', borderBottom: '1px solid #e4e7ed' }}>
                    {['Folio', 'Tipo', 'Descripción', 'Estado', 'Prioridad', 'Fecha', '▲'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#4a5168', fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8b93a5' }}>Cargando...</td></tr>
                  ) : reportesFiltrados.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8b93a5' }}>No hay reportes</td></tr>
                  ) : reportesFiltrados.map(r => (
                    <tr key={r.id}
                      onClick={() => verDetalle(r)}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: seleccionado?.id === r.id ? '#eff6ff' : 'white', transition: 'background .12s' }}
                      onMouseEnter={e => { if (seleccionado?.id !== r.id) e.currentTarget.style.background = '#f7f8fa'; }}
                      onMouseLeave={e => { if (seleccionado?.id !== r.id) e.currentTarget.style.background = 'white'; }}
                    >
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#6b7280', fontSize: '.75rem' }}>{r.folio || `RC-${r.id}`}</td>
                      <td style={{ padding: '10px 14px', color: '#4a5168' }}>{TIPOS_LABEL[r.tipo] || r.tipo}</td>
                      <td style={{ padding: '10px 14px', color: '#1a1f2e', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion || r.titulo || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{estadoBadge(r.estado)}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280', textTransform: 'capitalize' }}>{r.prioridad || 'normal'}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '.75rem' }}>{fmtFecha(r.fecha_creacion)}</td>
                      <td style={{ padding: '10px 14px', color: '#6b7280' }}>▲ {r.votos || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {total > LIMIT && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e4e7ed', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'white', color: page === 1 ? '#9ca3af' : '#1a1f2e', fontWeight: 600, fontSize: '.82rem' }}>
                  ← Anterior
                </button>
                <span style={{ padding: '6px 12px', fontSize: '.82rem', color: '#6b7280' }}>Pág. {page} · {total} total</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                  style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e4e7ed', cursor: page * LIMIT >= total ? 'not-allowed' : 'pointer', background: 'white', color: page * LIMIT >= total ? '#9ca3af' : '#1a1f2e', fontWeight: 600, fontSize: '.82rem' }}>
                  Siguiente →
                </button>
              </div>
            )}
          </div>

          {/* ── Panel Detalle ── */}
          {seleccionado && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e4e7ed', overflow: 'hidden', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Header detalle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e4e7ed', background: '#f7f8fa' }}>
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#1a1f2e' }}>{seleccionado.folio || `RC-${seleccionado.id}`}</div>
                  <div style={{ fontSize: '.72rem', color: '#8b93a5' }}>{TIPOS_LABEL[seleccionado.tipo] || seleccionado.tipo}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {estadoBadge(seleccionado.estado)}
                  <button onClick={() => setSeleccionado(null)} style={{ width: 26, height: 26, borderRadius: '50%', background: '#e4e7ed', border: 'none', cursor: 'pointer', fontSize: '.85rem', color: '#4a5168' }}>✕</button>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                {/* Foto */}
                {seleccionado.foto_url && (
                  <img src={seleccionado.foto_url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />
                )}

                {/* Info */}
                <p style={{ fontSize: '.84rem', color: '#4a5168', lineHeight: 1.5, marginBottom: 10 }}>{seleccionado.descripcion || seleccionado.titulo}</p>
                <div style={{ fontSize: '.75rem', color: '#8b93a5', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
                  {seleccionado.direccion && <span>📍 {seleccionado.direccion}</span>}
                  {(seleccionado.colonia || seleccionado.calle) && <span>🛣 {[seleccionado.colonia, seleccionado.calle].filter(Boolean).join(', ')}</span>}
                  <span>🗓 {fmtFecha(seleccionado.fecha_creacion)}</span>
                  <span>▲ {seleccionado.votos || 0} apoyos · 👁 {seleccionado.vistas || 0} vistas</span>
                  {seleccionado.latitud && <span>🗺 {seleccionado.latitud?.toFixed(5)}, {seleccionado.longitud?.toFixed(5)}</span>}
                </div>

                {/* Botón actualizar estado */}
                {!panelActualizar ? (
                  <button onClick={() => { setPanelActualizar(true); setFormAct(f => ({ ...f, estado_nuevo: seleccionado.estado })); }}
                    style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontSize: '.84rem', fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
                    ⚡ Actualizar estado
                  </button>
                ) : (
                  <div style={{ background: '#f7f8fa', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #e4e7ed' }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#1a1f2e', marginBottom: 10 }}>Actualizar estado</div>
                    <select value={formAct.estado_nuevo} onChange={e => setFormAct(f => ({ ...f, estado_nuevo: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e4e7ed', borderRadius: 8, fontSize: '.84rem', marginBottom: 8, outline: 'none' }}>
                      {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                    <textarea value={formAct.comentario} onChange={e => setFormAct(f => ({ ...f, comentario: e.target.value }))}
                      placeholder="Comentario (opcional)..."
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e4e7ed', borderRadius: 8, fontSize: '.84rem', resize: 'none', height: 60, outline: 'none', fontFamily: 'inherit', marginBottom: 8 }} />
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: '.73rem', fontWeight: 600, color: '#4a5168', display: 'block', marginBottom: 4 }}>Evidencias (fotos)</label>
                      <input type="file" accept="image/*" multiple onChange={e => setFormAct(f => ({ ...f, evidencias: Array.from(e.target.files) }))}
                        style={{ fontSize: '.78rem', color: '#4a5168' }} />
                      {formAct.evidencias.length > 0 && <div style={{ fontSize: '.7rem', color: '#10b981', marginTop: 3 }}>✓ {formAct.evidencias.length} foto(s) seleccionada(s)</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={enviarActualizacion} disabled={enviandoAct || !formAct.estado_nuevo}
                        style={{ flex: 1, padding: '9px', background: enviandoAct ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 700, cursor: enviandoAct ? 'not-allowed' : 'pointer' }}>
                        {enviandoAct ? 'Guardando...' : '✓ Guardar'}
                      </button>
                      <button onClick={() => setPanelActualizar(false)}
                        style={{ padding: '9px 12px', background: '#f3f4f6', color: '#4a5168', border: 'none', borderRadius: 8, fontSize: '.82rem', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Historial / Timeline */}
                <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#8b93a5', marginBottom: 10 }}>Historial de seguimiento</div>
                {loadingHist ? (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: '#8b93a5', fontSize: '.8rem' }}>Cargando historial...</div>
                ) : historial?.actualizaciones?.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: 18 }}>
                    <div style={{ position: 'absolute', left: 5, top: 0, bottom: 0, width: 2, background: '#e4e7ed' }} />
                    {historial.actualizaciones.map(a => {
                      const est = ESTADOS.find(x => x.value === a.estado_nuevo) || { label: a.estado_nuevo, color: '#6b7280' };
                      return (
                        <div key={a.id} style={{ position: 'relative', marginBottom: 10, paddingLeft: 4 }}>
                          <div style={{ position: 'absolute', left: -15, top: 3, width: 8, height: 8, borderRadius: '50%', background: est.color, border: '2px solid white', boxShadow: `0 0 0 1px ${est.color}` }} />
                          <div style={{ fontSize: '.78rem', fontWeight: 600, color: est.color }}>{est.label}</div>
                          {a.comentario && <div style={{ fontSize: '.74rem', color: '#4a5168', margin: '2px 0 4px', lineHeight: 1.4 }}>{a.comentario}</div>}
                          {a.evidencias?.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '4px 0' }}>
                              {a.evidencias.map(ev => (
                                <img key={ev.id} src={ev.url} alt="ev" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid #e4e7ed' }}
                                  onClick={() => window.open(ev.url, '_blank')} onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: '.66rem', color: '#9ca3af' }}>
                            {new Date(a.creado_en).toLocaleString('es-MX')}{a.operador_nombre ? ` · ${a.operador_nombre}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '10px 0', color: '#9ca3af', fontSize: '.78rem' }}>Sin actualizaciones registradas</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
