import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery, useQueryClient } from 'react-query';
import { FiRefreshCw, FiPlus, FiClock, FiCheckCircle, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TIPOS = {
  tala_arboles_ecologia:    { emoji: '🌳', color: '#16a34a', label: 'Tala/Ecología' },
  basura_alumbrado:         { emoji: '🗑️', color: '#8b5cf6', label: 'Basura/Alumbrado' },
  transporte_urbano_rutas:  { emoji: '🚌', color: '#0ea5e9', label: 'Transporte' },
  agua_potable_drenaje:     { emoji: '💧', color: '#10b981', label: 'Agua/Drenaje' },
  policia_accidentes_delitos:{ emoji: '🚔', color: '#ef4444', label: 'Seguridad' },
  otro_queja_sugerencia:    { emoji: '❓', color: '#6b7280', label: 'Otro/Queja' },
  baches_banqueta_invadida: { emoji: '🔧', color: '#f59e0b', label: 'Baches/Banqueta' },
  transito_vialidad:        { emoji: '🚦', color: '#ea580c', label: 'Tránsito' },
  obras_publicas_navojoa:   { emoji: '🏠', color: '#dc2626', label: 'Obras Públicas' },
};

const ESTADOS = {
  pendiente:   { lbl: 'Pendiente',   color: '#f59e0b' },
  en_revision: { lbl: 'En Revisión', color: '#3b82f6' },
  en_progreso: { lbl: 'En Progreso', color: '#8b5cf6' },
  resuelto:    { lbl: 'Resuelto',    color: '#10b981' },
  rechazado:   { lbl: 'Rechazado',   color: '#ef4444' },
};

const TIPOS_FORM = [
  { valor: 'baches_banqueta_invadida',  emoji: '🔧', label: 'Baches/Banqueta' },
  { valor: 'basura_alumbrado',          emoji: '🗑️', label: 'Basura/Alumbrado' },
  { valor: 'agua_potable_drenaje',      emoji: '💧', label: 'Agua/Drenaje' },
  { valor: 'policia_accidentes_delitos',emoji: '🚔', label: 'Seguridad' },
  { valor: 'tala_arboles_ecologia',     emoji: '🌳', label: 'Ecología' },
  { valor: 'transporte_urbano_rutas',   emoji: '🚌', label: 'Transporte' },
  { valor: 'transito_vialidad',         emoji: '🚦', label: 'Tránsito' },
  { valor: 'obras_publicas_navojoa',    emoji: '🏠', label: 'Obras Públicas' },
  { valor: 'otro_queja_sugerencia',     emoji: '❓', label: 'Otro/Queja' },
];

function tipoInfo(tipo) { return TIPOS[tipo] || { emoji: '⚠️', color: '#6b7280', label: tipo || 'Otro' }; }
function estadoInfo(estado) { return ESTADOS[estado] || { lbl: estado || 'Desconocido', color: '#6b7280' }; }

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

function makePinIcon(tipo, estado, fotoUrl) {
  const t = tipoInfo(tipo);
  const pinColor = estadoInfo(estado).color;
  const solved = estado === 'resuelto';

  if (fotoUrl) {
    const badgeBg = solved ? '#10b981' : pinColor;
    const badgeContent = solved ? '✓' : t.emoji;
    return L.divIcon({
      html: `<div style="position:relative;width:46px;height:54px;">
        <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:3px solid ${pinColor};box-shadow:0 3px 14px rgba(0,0,0,.35);background:${pinColor}22;">
          <img src="${fotoUrl}" width="42" height="42" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.innerHTML='<div style=\\'width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;\\'>${t.emoji}</div>'"/>
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid ${pinColor};"></div>
        <div style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:${badgeBg};border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:700;">${badgeContent}</div>
      </div>`,
      className: '', iconSize: [46, 54], iconAnchor: [23, 54], popupAnchor: [0, -56],
    });
  }

  const inner = solved
    ? `<span style="font-size:13px;font-weight:700;color:white">✓</span>`
    : `<span style="transform:rotate(45deg);display:inline-block;font-size:12px">${t.emoji}</span>`;
  return L.divIcon({
    html: `<div style="width:32px;height:32px;background:${pinColor};border-radius:50% 50% 50% 2px;transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,.9);box-shadow:0 3px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;">${inner}</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
  });
}

function MapFitBounds({ reportes }) {
  const map = useMap();
  useEffect(() => {
    const pts = reportes.filter(r => r.latitud && r.longitud).map(r => [r.latitud, r.longitud]);
    if (pts.length > 0) {
      try { map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 }); } catch {}
    }
  }, [reportes.length]); // eslint-disable-line
  return null;
}

const DashboardCiudadano = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerNuevo, setDrawerNuevo] = useState(false);
  const [form, setForm] = useState({ tipo: '', descripcion: '', latitud: '', longitud: '', colonia: '', foto: null });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);
  const fotoRef = useRef(null);
  const [gpsPos, setGpsPos] = useState(null);

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setGpsPos({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const { data: reportes = [], isLoading, refetch } = useQuery(
    'miReportesD',
    async () => { const r = await api.get('/reportes-ciudadanos/'); return r.data; },
    { staleTime: 0 }
  );

  const stats = {
    total:      reportes.length,
    pendiente:  reportes.filter(r => r.estado === 'pendiente').length,
    enProgreso: reportes.filter(r => ['en_revision', 'en_progreso'].includes(r.estado)).length,
    resuelto:   reportes.filter(r => r.estado === 'resuelto').length,
  };

  const abrirNuevo = () => {
    setForm({
      tipo: '', descripcion: '',
      latitud: gpsPos?.lat?.toFixed(6) || '',
      longitud: gpsPos?.lng?.toFixed(6) || '',
      colonia: '', foto: null,
    });
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
      queryClient.invalidateQueries('miReportesD');
      refetch();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.detail || err.message), 'err');
    } finally {
      setEnviando(false);
    }
  };

  const reportesConCoords = reportes.filter(r => r.latitud && r.longitud && r.latitud !== 0);
  const mapCenter = gpsPos ? [gpsPos.lat, gpsPos.lng] : [29.0729, -110.9559];

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1f2e', margin: 0 }}>
            Bienvenido, {user?.nombre}
          </h1>
          <p style={{ fontSize: '.83rem', color: '#8b93a5', margin: '2px 0 0' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => refetch()} title="Actualizar" style={{ padding: '8px 12px', background: 'white', border: '1.5px solid #e4e7ed', borderRadius: 10, cursor: 'pointer', fontSize: '1rem', color: '#4a5168' }}>
            <FiRefreshCw size={16} />
          </button>
          <button onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '.88rem', fontWeight: 700 }}>
            <FiPlus size={15} /> Nuevo Reporte
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total',      n: stats.total,      color: '#2563eb', bg: '#eff6ff', Icon: FiAlertTriangle },
          { label: 'Pendientes', n: stats.pendiente,  color: '#f59e0b', bg: '#fffbeb', Icon: FiClock },
          { label: 'En Proceso', n: stats.enProgreso, color: '#8b5cf6', bg: '#f5f3ff', Icon: FiActivity },
          { label: 'Resueltos',  n: stats.resuelto,   color: '#10b981', bg: '#ecfdf5', Icon: FiCheckCircle },
        ].map(({ label, n, color, bg, Icon }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: '#8b93a5', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.1 }}>{n}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mapa ── */}
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f0f0f5' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, color: '#1a1f2e', fontSize: '.95rem' }}>📍 Mis Reportes en el Mapa</div>
          <span style={{ fontSize: '.76rem', color: '#8b93a5', background: '#f7f8fa', padding: '3px 10px', borderRadius: 20 }}>
            {reportesConCoords.length} con ubicación
          </span>
        </div>
        <div style={{ height: 380, position: 'relative' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b93a5', fontSize: '.9rem' }}>
              Cargando...
            </div>
          ) : (
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl>
              {reportesConCoords.length > 0 && <MapFitBounds reportes={reportesConCoords} />}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="© OpenStreetMap © CARTO"
                subdomains="abcd" maxZoom={19}
              />
              {/* Marcador de mi ubicación */}
              {gpsPos && (
                <>
                  <Circle
                    center={[gpsPos.lat, gpsPos.lng]}
                    radius={80}
                    pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.12, weight: 1.5, dashArray: '4 3' }}
                  />
                  <Marker
                    position={[gpsPos.lat, gpsPos.lng]}
                    icon={L.divIcon({
                      html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(37,99,235,.35),0 2px 8px rgba(0,0,0,.3);"></div>`,
                      className: '', iconSize: [18, 18], iconAnchor: [9, 9],
                    })}
                    zIndexOffset={1000}
                  >
                    <Popup><div style={{ fontSize: '.82rem', fontWeight: 600 }}>📍 Mi ubicación</div></Popup>
                  </Marker>
                </>
              )}

              {reportesConCoords.map(r => (
                <Marker
                  key={r.id}
                  position={[r.latitud, r.longitud]}
                  icon={makePinIcon(r.tipo, r.estado, r.foto_url)}
                >
                  <Popup maxWidth={250} minWidth={210}>
                    {r.foto_url
                      ? <img src={r.foto_url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                      : <div style={{ width: '100%', height: 60, background: tipoInfo(r.tipo).color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', borderRadius: '8px 8px 0 0' }}>{tipoInfo(r.tipo).emoji}</div>
                    }
                    <div style={{ padding: '9px 12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: '.72rem', fontWeight: 700, color: tipoInfo(r.tipo).color, textTransform: 'uppercase' }}>{tipoInfo(r.tipo).emoji} {tipoInfo(r.tipo).label}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '.68rem', fontWeight: 700, background: estadoInfo(r.estado).color + '22', color: estadoInfo(r.estado).color }}>{estadoInfo(r.estado).lbl}</span>
                      </div>
                      <p style={{ fontSize: '.81rem', color: '#4a5168', margin: '0 0 6px', lineHeight: 1.4 }}>{(r.descripcion || 'Sin descripción').slice(0, 80)}</p>
                      {r.folio && <div style={{ fontSize: '.68rem', fontFamily: 'monospace', color: '#aaa' }}>{r.folio}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* ── Lista reportes recientes ── */}
      {!isLoading && reportes.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f0f0f5', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, color: '#1a1f2e', fontSize: '.95rem' }}>Mis Reportes Recientes</div>
            <button onClick={() => navigate('/reportes-ciudadanos')} style={{ fontSize: '.78rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Ver todos →
            </button>
          </div>
          {reportes.slice(0, 6).map((r, i) => {
            const t = tipoInfo(r.tipo);
            const est = estadoInfo(r.estado);
            return (
              <div
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < Math.min(reportes.length, 6) - 1 ? '1px solid #f7f8fa' : 'none' }}
              >
                {r.foto_url ? (
                  <img src={r.foto_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid #f0f0f5' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{t.emoji}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1a1f2e', marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontSize: '.77rem', color: '#8b93a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion || 'Sin descripción'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: '.69rem', fontWeight: 700, color: est.color, background: est.color + '18', padding: '2px 8px', borderRadius: 8 }}>{est.lbl}</span>
                  <span style={{ fontSize: '.68rem', color: '#aaa' }}>{timeAgo(r.fecha_creacion)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && reportes.length === 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '40px 20px', textAlign: 'center', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 6 }}>Sin reportes aún</div>
          <div style={{ fontSize: '.85rem', color: '#8b93a5', marginBottom: 20 }}>Sé el primero en reportar un problema en tu comunidad.</div>
          <button onClick={abrirNuevo} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.88rem', fontWeight: 700, cursor: 'pointer' }}>
            ＋ Crear primer reporte
          </button>
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
                  <button
                    type="button"
                    title="Usar mi ubicación GPS"
                    onClick={() => {
                      if (gpsPos) {
                        setForm(f => ({ ...f, latitud: gpsPos.lat.toFixed(6), longitud: gpsPos.lng.toFixed(6) }));
                        showToast('📍 Ubicación GPS aplicada', 'ok');
                      } else {
                        navigator.geolocation?.getCurrentPosition(
                          ({ coords }) => {
                            setGpsPos({ lat: coords.latitude, lng: coords.longitude });
                            setForm(f => ({ ...f, latitud: coords.latitude.toFixed(6), longitud: coords.longitude.toFixed(6) }));
                            showToast('📍 Ubicación GPS aplicada', 'ok');
                          },
                          () => showToast('GPS no disponible', 'err')
                        );
                      }
                    }}
                    style={{ padding: '9px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 9, fontSize: '.9rem', cursor: 'pointer' }}
                  >📍</button>
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
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, foto: null })); setFotoPreview(null); if (fotoRef.current) fotoRef.current.value = ''; }}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.5)', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '.8rem' }}
                  >✕</button>
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

            <button
              type="submit"
              disabled={enviando}
              style={{ width: '100%', padding: '13px', background: enviando ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.95rem', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer' }}
            >
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

export default DashboardCiudadano;
