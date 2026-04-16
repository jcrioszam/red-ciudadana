import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { FiRefreshCw, FiPlus, FiClock, FiCheckCircle, FiActivity, FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import api from '../api';

const TIPOS_INFO = {
  tala_arboles_ecologia:     { emoji: '🌳', color: '#16a34a', label: 'Tala/Ecología' },
  basura_alumbrado:          { emoji: '🗑️', color: '#8b5cf6', label: 'Basura/Alumbrado' },
  transporte_urbano_rutas:   { emoji: '🚌', color: '#0ea5e9', label: 'Transporte' },
  agua_potable_drenaje:      { emoji: '💧', color: '#10b981', label: 'Agua/Drenaje' },
  policia_accidentes_delitos:{ emoji: '🚔', color: '#ef4444', label: 'Seguridad' },
  otro_queja_sugerencia:     { emoji: '❓', color: '#6b7280', label: 'Otro/Queja' },
  baches_banqueta_invadida:  { emoji: '🔧', color: '#f59e0b', label: 'Baches/Banqueta' },
  transito_vialidad:         { emoji: '🚦', color: '#ea580c', label: 'Tránsito' },
  obras_publicas_navojoa:    { emoji: '🏠', color: '#dc2626', label: 'Obras Públicas' },
};

const ESTADOS_INFO = {
  pendiente:   { lbl: 'Pendiente',   color: '#f59e0b', bg: '#fffbeb' },
  en_revision: { lbl: 'En Revisión', color: '#3b82f6', bg: '#eff6ff' },
  en_progreso: { lbl: 'En Progreso', color: '#8b5cf6', bg: '#f5f3ff' },
  resuelto:    { lbl: 'Resuelto',    color: '#10b981', bg: '#ecfdf5' },
  rechazado:   { lbl: 'Rechazado',   color: '#ef4444', bg: '#fef2f2' },
};

const TIPOS_FORM = [
  { valor: 'baches_banqueta_invadida',  emoji: '🔧', label: 'Baches/Banqueta' },
  { valor: 'basura_alumbrado',          emoji: '🗑️', label: 'Basura/Alumbrado' },
  { valor: 'agua_potable_drenaje',      emoji: '💧', label: 'Agua/Drenaje' },
  { valor: 'policia_accidentes_delitos',emoji: '🚔', label: 'Seguridad' },
  { valor: 'tala_arboles_ecologia',     emoji: '🌳', label: 'Ecología' },
  { valor: 'otro_queja_sugerencia',     emoji: '❓', label: 'Otro/Queja' },
];

function tipoInfo(tipo) { return TIPOS_INFO[tipo] || { emoji: '⚠️', color: '#6b7280', label: tipo || 'Otro' }; }
function estadoInfo(estado) { return ESTADOS_INFO[estado] || { lbl: estado || 'Desconocido', color: '#6b7280', bg: '#f3f4f6' }; }
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ReportesCiudadanos = () => {
  const queryClient = useQueryClient();
  const [drawerNuevo, setDrawerNuevo] = useState(false);
  const [form, setForm] = useState({ tipo: '', descripcion: '', latitud: '', longitud: '', colonia: '', foto: null });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [gpsPos, setGpsPos] = useState(null);
  const toastRef = useRef(null);
  const fotoRef = useRef(null);

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const { data: reportes = [], isLoading, error, refetch } = useQuery(
    'reportes-ciudadanos',
    async () => { const r = await api.get('/reportes-ciudadanos/'); return r.data; },
    { staleTime: 0 }
  );

  const stats = {
    total:      reportes.length,
    pendiente:  reportes.filter(r => r.estado === 'pendiente').length,
    enProgreso: reportes.filter(r => ['en_revision', 'en_progreso'].includes(r.estado)).length,
    resuelto:   reportes.filter(r => r.estado === 'resuelto').length,
  };

  const reportesFiltrados = filtroEstado
    ? reportes.filter(r => r.estado === filtroEstado)
    : reportes;

  const abrirNuevo = () => {
    setForm({ tipo: '', descripcion: '', latitud: gpsPos?.lat?.toFixed(6) || '', longitud: gpsPos?.lng?.toFixed(6) || '', colonia: '', foto: null });
    setFotoPreview(null);
    setDrawerNuevo(true);
  };

  const seleccionarFoto = (file) => {
    if (!file) return;
    setForm(f => ({ ...f, foto: file }));
    const rd = new FileReader();
    rd.onload = e => setFotoPreview(e.target.result);
    rd.readAsDataURL(file);
  };

  const pedirGps = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setGpsPos(pos);
        setForm(f => ({ ...f, latitud: coords.latitude.toFixed(6), longitud: coords.longitude.toFixed(6) }));
        showToast('📍 Ubicación GPS aplicada', 'ok');
      },
      () => showToast('GPS no disponible', 'err'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.tipo) { showToast('Selecciona una categoría', 'err'); return; }
    if (!form.descripcion.trim()) { showToast('Describe el problema', 'err'); return; }
    setEnviando(true);
    try {
      let foto_url = null;
      if (form.foto) {
        foto_url = await new Promise((res, rej) => {
          const rd = new FileReader();
          rd.onload = ev => res(ev.target.result);
          rd.onerror = rej;
          rd.readAsDataURL(form.foto);
        });
      }
      const titulo = TIPOS_FORM.find(t => t.valor === form.tipo)?.label || form.tipo;
      await api.post('/reportes-ciudadanos/', {
        titulo,
        descripcion: form.descripcion,
        tipo: form.tipo,
        latitud: parseFloat(form.latitud) || 0,
        longitud: parseFloat(form.longitud) || 0,
        direccion: form.colonia || null,
        foto_url,
        prioridad: 'normal',
      });
      showToast('✅ Reporte enviado', 'ok');
      setDrawerNuevo(false);
      queryClient.invalidateQueries('reportes-ciudadanos');
      refetch();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.detail || err.message), 'err');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1f2e', margin: 0 }}>Reportes Ciudadanos</h1>
          <p style={{ fontSize: '.83rem', color: '#8b93a5', margin: '2px 0 0' }}>Gestiona y da seguimiento a tus reportes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => refetch()} title="Actualizar" style={{ padding: '8px 12px', background: 'white', border: '1.5px solid #e4e7ed', borderRadius: 10, cursor: 'pointer', color: '#4a5168' }}>
            <FiRefreshCw size={16} />
          </button>
          <button onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '.88rem', fontWeight: 700 }}>
            <FiPlus size={15} /> Nuevo Reporte
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total',      n: stats.total,      color: '#2563eb', bg: '#eff6ff', Icon: FiAlertTriangle },
          { label: 'Pendientes', n: stats.pendiente,  color: '#f59e0b', bg: '#fffbeb', Icon: FiClock },
          { label: 'En Proceso', n: stats.enProgreso, color: '#8b5cf6', bg: '#f5f3ff', Icon: FiActivity },
          { label: 'Resueltos',  n: stats.resuelto,   color: '#10b981', bg: '#ecfdf5', Icon: FiCheckCircle },
        ].map(({ label, n, color, bg, Icon }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '15px 16px', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '.73rem', color: '#8b93a5', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.1 }}>{n}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros de estado ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[{ v: '', lbl: 'Todos' }, ...Object.entries(ESTADOS_INFO).map(([v, e]) => ({ v, lbl: e.lbl, color: e.color }))].map(({ v, lbl, color }) => (
          <button
            key={v}
            onClick={() => setFiltroEstado(v)}
            style={{
              padding: '5px 13px', border: 'none', borderRadius: 20, fontSize: '.79rem', fontWeight: 600, cursor: 'pointer',
              background: filtroEstado === v ? (color || '#1a1f2e') : '#f7f8fa',
              color: filtroEstado === v ? 'white' : '#4a5168',
              transition: 'all .15s',
            }}
          >{lbl}</button>
        ))}
      </div>

      {/* ── Lista de reportes ── */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}

      {!isLoading && error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: '.88rem' }}>
          ❌ Error al cargar reportes: {error.message}
        </div>
      )}

      {!isLoading && !error && reportesFiltrados.length === 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '40px 20px', textAlign: 'center', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 6 }}>
            {filtroEstado ? `Sin reportes "${estadoInfo(filtroEstado).lbl}"` : 'Sin reportes aún'}
          </div>
          <div style={{ fontSize: '.85rem', color: '#8b93a5', marginBottom: 20 }}>
            {filtroEstado ? 'Prueba otro filtro' : 'Sé el primero en reportar un problema en tu comunidad.'}
          </div>
          {!filtroEstado && (
            <button onClick={abrirNuevo} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.88rem', fontWeight: 700, cursor: 'pointer' }}>
              ＋ Crear primer reporte
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && reportesFiltrados.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f0f0f5', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #f0f0f5', fontSize: '.8rem', color: '#8b93a5' }}>
            {reportesFiltrados.length} {reportesFiltrados.length === 1 ? 'reporte' : 'reportes'}
          </div>
          {reportesFiltrados.map((r, i) => {
            const t = tipoInfo(r.tipo);
            const est = estadoInfo(r.estado);
            return (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < reportesFiltrados.length - 1 ? '1px solid #f7f8fa' : 'none' }}
              >
                {r.foto_url ? (
                  <img src={r.foto_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid #f0f0f5' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{t.emoji}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: '.83rem', fontWeight: 700, color: '#1a1f2e' }}>{t.label}</span>
                    {r.folio && <span style={{ fontSize: '.68rem', color: '#aaa', fontFamily: 'monospace' }}>{r.folio}</span>}
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#8b93a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.descripcion || 'Sin descripción'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    {(r.latitud || r.longitud) && r.latitud !== 0 && (
                      <span style={{ fontSize: '.68rem', color: '#8b93a5', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FiMapPin size={10} /> Con ubicación
                      </span>
                    )}
                    <span style={{ fontSize: '.68rem', color: '#aaa' }}>{timeAgo(r.fecha_creacion)}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: '.69rem', fontWeight: 700, color: est.color, background: est.bg, padding: '3px 9px', borderRadius: 8, display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {est.lbl}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Overlay ── */}
      {drawerNuevo && (
        <div
          onClick={() => setDrawerNuevo(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,.3)', backdropFilter: 'blur(2px)', zIndex: 800 }}
        />
      )}

      {/* ── Drawer: Nuevo Reporte ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
        background: 'white', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -6px 32px rgba(0,0,0,.12)',
        transform: drawerNuevo ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .32s cubic-bezier(.32,.72,0,1)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: '#e4e7ed', borderRadius: 2, margin: '10px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px 11px', borderBottom: '1px solid #e4e7ed' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1f2e' }}>Nuevo reporte</div>
            <div style={{ fontSize: '.75rem', color: '#8b93a5', marginTop: 1 }}>Categoriza y describe el problema</div>
          </div>
          <button onClick={() => setDrawerNuevo(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f7f8fa', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5168', fontSize: '1rem' }}>✕</button>
        </div>

        <div style={{ padding: '15px 20px 30px' }}>
          <form onSubmit={enviar}>
            {/* Categoría */}
            <div style={{ fontSize: '.71rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#8b93a5', marginBottom: 9 }}>Categoría del problema</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 16 }}>
              {TIPOS_FORM.map(({ valor, emoji, label }) => (
                <div
                  key={valor}
                  onClick={() => setForm(f => ({ ...f, tipo: valor }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '11px 5px',
                    border: `2px solid ${form.tipo === valor ? tipoInfo(valor).color : '#e4e7ed'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all .16s',
                    background: form.tipo === valor ? tipoInfo(valor).color + '14' : 'white',
                  }}
                >
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{emoji}</span>
                  <span style={{ fontSize: '.73rem', fontWeight: 600, color: form.tipo === valor ? tipoInfo(valor).color : '#4a5168', textAlign: 'center' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 11 }}>
              <label style={{ display: 'block', fontSize: '.74rem', fontWeight: 600, color: '#4a5168', marginBottom: 4 }}>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Describe el problema brevemente..."
                style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.86rem', color: '#1a1f2e', resize: 'none', height: 70, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Colonia + GPS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 11 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.74rem', fontWeight: 600, color: '#4a5168', marginBottom: 4 }}>Colonia / Calle</label>
                <input
                  value={form.colonia}
                  onChange={e => setForm(f => ({ ...f, colonia: e.target.value }))}
                  placeholder="Ej. Centro"
                  style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.86rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.74rem', fontWeight: 600, color: '#4a5168', marginBottom: 4 }}>Ubicación</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ flex: 1, padding: '9px 8px', border: '1.5px solid #e4e7ed', borderRadius: 9, fontSize: '.72rem', color: form.latitud ? '#10b981' : '#8b93a5', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.latitud ? `${parseFloat(form.latitud).toFixed(4)},${parseFloat(form.longitud).toFixed(4)}` : 'Sin GPS'}
                  </div>
                  <button type="button" title="Usar mi ubicación GPS" onClick={pedirGps}
                    style={{ padding: '9px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 9, fontSize: '.9rem', cursor: 'pointer' }}>📍</button>
                </div>
              </div>
            </div>

            {/* Foto */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.74rem', fontWeight: 600, color: '#4a5168', marginBottom: 4 }}>
                Foto <span style={{ color: '#8b93a5', fontWeight: 400 }}>(opcional)</span>
              </label>
              {fotoPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={fotoPreview} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 9 }} />
                  <button type="button" onClick={() => { setForm(f => ({ ...f, foto: null })); setFotoPreview(null); if (fotoRef.current) fotoRef.current.value = ''; }}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.5)', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '.8rem' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', border: '2px dashed #e4e7ed', borderRadius: 9, cursor: 'pointer', gap: 4 }}>
                    <span style={{ fontSize: '1.6rem' }}>📸</span>
                    <span style={{ fontSize: '.73rem', fontWeight: 600, color: '#4a5168' }}>Tomar foto</span>
                    <input type="file" accept="image/*" capture="environment" onChange={e => seleccionarFoto(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', border: '2px dashed #e4e7ed', borderRadius: 9, cursor: 'pointer', gap: 4 }}>
                    <span style={{ fontSize: '1.6rem' }}>🖼️</span>
                    <span style={{ fontSize: '.73rem', fontWeight: 600, color: '#4a5168' }}>Galería</span>
                    <input type="file" accept="image/*" ref={fotoRef} onChange={e => seleccionarFoto(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>

            <button type="submit" disabled={enviando}
              style={{ width: '100%', padding: '13px', background: enviando ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.95rem', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer' }}>
              {enviando ? '⏳ Enviando...' : '📤 Enviar reporte'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'ok' ? '#10b981' : toast.type === 'err' ? '#ef4444' : '#1a1f2e', color: 'white', padding: '10px 18px', borderRadius: 10, fontSize: '.84rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ReportesCiudadanos;
