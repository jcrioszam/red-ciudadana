import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@changey/react-leaflet-markercluster/dist/styles.min.css';
import api from '../api';

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPOS = {
  bache:                  { emoji: '🕳️', color: '#ef4444', label: 'Bache' },
  basura:                 { emoji: '🗑️', color: '#8b5cf6', label: 'Basura' },
  drenaje:                { emoji: '🌊', color: '#0ea5e9', label: 'Drenaje' },
  agua:                   { emoji: '💧', color: '#10b981', label: 'Agua' },
  luminaria:              { emoji: '💡', color: '#f59e0b', label: 'Luminaria' },
  baches_banqueta_invadida: { emoji: '🔧', color: '#ef4444', label: 'Baches/Banqueta' },
  basura_alumbrado:       { emoji: '🗑️', color: '#8b5cf6', label: 'Basura/Alumbrado' },
  agua_potable_drenaje:   { emoji: '💧', color: '#0ea5e9', label: 'Agua/Drenaje' },
  seguridad:              { emoji: '🚨', color: '#ef4444', label: 'Seguridad' },
  transito_vialidad:      { emoji: '🚦', color: '#f59e0b', label: 'Tránsito' },
  otro:                   { emoji: '⚠️', color: '#6b7280', label: 'Otro' },
};

const ESTADOS = {
  pendiente:   { lbl: 'Pendiente',   color: '#f59e0b' },
  en_revision: { lbl: 'En Revisión', color: '#3b82f6' },
  en_progreso: { lbl: 'En Progreso', color: '#8b5cf6' },
  resuelto:    { lbl: 'Resuelto',    color: '#10b981' },
  rechazado:   { lbl: 'Rechazado',   color: '#ef4444' },
};

const SUBTIPOS = {
  bache:     ['Grieta', 'Hoyo profundo', 'Bache en cruce', 'Hundimiento'],
  basura:    ['Basura en vía', 'Contenedor lleno', 'Escombros'],
  drenaje:   ['Tapón', 'Desbordamiento', 'Olor', 'Fuga'],
  agua:      ['Fuga de agua', 'Sin suministro', 'Agua contaminada'],
  luminaria: ['Foco apagado', 'Poste caído', 'Cable expuesto'],
  otro:      ['Banqueta dañada', 'Señalética', 'Árbol peligroso', 'Otro'],
};

function tipoInfo(tipo) {
  return TIPOS[tipo] || TIPOS.otro;
}
function estadoInfo(estado) {
  return ESTADOS[estado] || { lbl: estado, color: '#6b7280' };
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

// ─── Icono de pin ─────────────────────────────────────────────────────────────
function makePinIcon(tipo, estado, fotoUrl) {
  const t = tipoInfo(tipo);
  const pinColor = estadoInfo(estado).color;
  const solved = estado === 'resuelto';

  if (fotoUrl) {
    // Pin circular con foto
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

  // Sin foto: pin con emoji
  const inner = solved
    ? `<span style="font-size:13px;font-weight:700;color:white">✓</span>`
    : `<span style="transform:rotate(45deg);display:inline-block;font-size:12px">${t.emoji}</span>`;
  return L.divIcon({
    html: `<div style="width:32px;height:32px;background:${pinColor};border-radius:50% 50% 50% 2px;transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,.9);box-shadow:0 3px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;">${inner}</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
  });
}

// ─── Subcomponentes de mapa ───────────────────────────────────────────────────
function MapReady({ onReady }) {
  const map = useMap();
  useEffect(() => { if (map && onReady) onReady(map); }, [map, onReady]);
  return null;
}

function MovePinHandler({ active, onMove }) {
  useMapEvents({
    move: (e) => { if (active) onMove(e.target.getCenter()); },
    click: (e) => { if (!active) return; },
  });
  return null;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AlertaCiudadanaMapa() {
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [satelite, setSatelite] = useState(false);
  const [drawerNuevo, setDrawerNuevo] = useState(false);
  const [drawerDetalle, setDrawerDetalle] = useState(null); // reporte seleccionado
  const [historialDetalle, setHistorialDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [gpsPos, setGpsPos] = useState(null);
  const [modoPin, setModoPin] = useState(false);
  const [pinCoords, setPinCoords] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    tipo: '', subtipo: '', descripcion: '',
    lat: '', lng: '', colonia: '', calle: '', foto: null,
  });
  const [enviando, setEnviando] = useState(false);
  const fotoRef = useRef(null);
  const fotoCamRef = useRef(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // ── Toast ──
  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Cargar datos ──
  const cargar = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (filtroTipo !== 'todos') qs.set('tipo', filtroTipo);
      if (filtroEstado) qs.set('estado', filtroEstado);
      const [rMap, rStats] = await Promise.all([
        api.get(`/reportes-ciudadanos/mapa/pins${qs.toString() ? '?' + qs : ''}`),
        api.get('/reportes-ciudadanos/estadisticas-mapa'),
      ]);
      setReportes(rMap.data || []);
      setStats(rStats.data || null);
    } catch (e) { console.error(e); }
  }, [filtroTipo, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { const t = setInterval(cargar, 30000); return () => clearInterval(t); }, [cargar]);

  // ── GPS ──
  const autoUbicar = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setGpsPos(pos);
        if (map) map.flyTo([pos.lat, pos.lng], 15, { animate: true, duration: 1.5 });
        setForm(f => ({ ...f, lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6) }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [map]);

  useEffect(() => { if (map) autoUbicar(); }, [map, autoUbicar]);

  // ── Abrir form nuevo reporte ──
  const abrirNuevo = () => {
    setDrawerNuevo(true);
    setModoPin(false);
    if (gpsPos) {
      setForm(f => ({ ...f, lat: gpsPos.lat.toFixed(6), lng: gpsPos.lng.toFixed(6) }));
    } else if (map) {
      const c = map.getCenter();
      setForm(f => ({ ...f, lat: c.lat.toFixed(6), lng: c.lng.toFixed(6) }));
    }
  };

  // ── Modo mover pin ──
  const iniciarPin = () => {
    setDrawerNuevo(false);
    setModoPin(true);
    if (map) {
      const c = map.getCenter();
      setPinCoords(c);
    }
  };
  const confirmarPin = () => {
    if (pinCoords) {
      setForm(f => ({ ...f, lat: pinCoords.lat.toFixed(6), lng: pinCoords.lng.toFixed(6) }));
    }
    setModoPin(false);
    setDrawerNuevo(true);
    showToast('📍 Ubicación confirmada', 'ok');
  };

  // ── Foto ──
  const seleccionarFoto = (file) => {
    if (!file) return;
    setForm(f => ({ ...f, foto: file }));
    const rd = new FileReader();
    rd.onload = (e) => setFotoPreview(e.target.result);
    rd.readAsDataURL(file);
  };
  const limpiarFoto = () => {
    setForm(f => ({ ...f, foto: null }));
    setFotoPreview(null);
    if (fotoRef.current) fotoRef.current.value = '';
    if (fotoCamRef.current) fotoCamRef.current.value = '';
  };

  // ── Enviar reporte ──
  const enviar = async (e) => {
    e.preventDefault();
    if (!form.tipo) { showToast('Selecciona una categoría', 'err'); return; }
    if (!form.lat || !form.lng) { showToast('Ubica el problema en el mapa', 'err'); return; }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('tipo', form.tipo);
      fd.append('subtipo', form.subtipo || '');
      fd.append('descripcion', form.descripcion || '');
      fd.append('latitud', form.lat);
      fd.append('longitud', form.lng);
      fd.append('colonia', form.colonia || '');
      fd.append('calle', form.calle || '');
      fd.append('es_publico', 'true');
      if (form.foto) fd.append('foto', form.foto);

      const res = await api.post('/reportes-ciudadanos/publico', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(`✅ Reporte enviado — ${res.data?.folio || res.data?.id || ''}`, 'ok');
      setDrawerNuevo(false);
      setForm({ tipo: '', subtipo: '', descripcion: '', lat: gpsPos?.lat?.toFixed(6) || '', lng: gpsPos?.lng?.toFixed(6) || '', colonia: '', calle: '', foto: null });
      setFotoPreview(null);
      setTimeout(cargar, 1000);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.detail || err.message), 'err');
    } finally {
      setEnviando(false);
    }
  };

  // ── Ver detalle ──
  const verDetalle = async (reporte) => {
    setDrawerDetalle(reporte);
    setHistorialDetalle(null);
    setLoadingDetalle(true);
    try {
      const res = await api.get(`/reportes-ciudadanos/${reporte.id}/historial`);
      setHistorialDetalle(res.data);
    } catch { setHistorialDetalle(null); }
    finally { setLoadingDetalle(false); }
    if (map) map.flyTo([reporte.latitud, reporte.longitud], 17, { animate: true, duration: 1 });
  };

  // ── Votar ──
  const votar = async (id) => {
    try {
      const res = await api.post(`/reportes-ciudadanos/${id}/voto`);
      showToast(`▲ Voto registrado (${res.data.votos})`, 'ok');
      cargar();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ya votaste por este reporte', 'err');
    }
  };

  // ── Filtros ──
  const reportesFiltrados = reportes.filter(r => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (r.tipo || '').includes(q) || (r.descripcion || '').toLowerCase().includes(q) || (r.folio || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  const CATBAR = [
    { t: 'todos', label: 'Todos' },
    { t: 'bache', label: 'Baches', color: '#ef4444' },
    { t: 'basura', label: 'Basura', color: '#8b5cf6' },
    { t: 'agua_potable_drenaje', label: 'Agua/Drenaje', color: '#0ea5e9' },
    { t: 'luminaria', label: 'Alumbrado', color: '#f59e0b' },
    { t: 'seguridad', label: 'Seguridad', color: '#ef4444' },
    { t: 'otro', label: 'Otro', color: '#6b7280' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: "'DM Sans', system-ui, sans-serif", background: '#e8eaee', overflow: 'hidden' }}>

      {/* ── MAPA ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          center={[29.0729, -110.9559]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <MapReady onReady={setMap} />
          <MovePinHandler active={modoPin} onMove={setPinCoords} />

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

          {satelite
            ? <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" maxZoom={19} />
            : <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" subdomains="abcd" maxZoom={19} />
          }

          <MarkerClusterGroup
            maxClusterRadius={48}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            iconCreateFunction={(cluster) => {
              const n = cluster.getChildCount();
              const s = n > 100 ? 46 : n > 20 ? 38 : 30;
              return L.divIcon({
                html: `<div style="width:${s}px;height:${s}px;background:rgba(37,99,235,.9);border:2.5px solid rgba(255,255,255,.8);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${s > 38 ? 12 : 10}px;box-shadow:0 2px 10px rgba(37,99,235,.4);">${n}</div>`,
                className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
              });
            }}
          >
            {reportesFiltrados.map(r => (
              <Marker
                key={r.id}
                position={[r.latitud, r.longitud]}
                icon={makePinIcon(r.tipo, r.estado, r.foto_url)}
              >
                <Popup maxWidth={260} minWidth={210}>
                  {r.foto_url && (
                    <img
                      src={r.foto_url}
                      alt=""
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block' }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                  {!r.foto_url && (
                    <div style={{ width: '100%', height: 64, background: tipoInfo(r.tipo).color + '18', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>
                      {tipoInfo(r.tipo).emoji}
                    </div>
                  )}
                  <div style={{ padding: '9px 12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: tipoInfo(r.tipo).color }}>
                        {tipoInfo(r.tipo).emoji} {tipoInfo(r.tipo).label}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '.68rem', fontWeight: 700, background: estadoInfo(r.estado).color + '22', color: estadoInfo(r.estado).color }}>
                        {estadoInfo(r.estado).lbl}
                      </span>
                    </div>
                    <p style={{ fontSize: '.81rem', color: '#4a5168', margin: '3px 0 6px', lineHeight: 1.4 }}>{r.descripcion || r.subtipo || 'Sin descripción'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#8b93a5', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'monospace' }}>{r.folio || `RC-${r.id}`}</span>
                      <span>▲ {r.votos || 0} · {timeAgo(r.fecha_creacion)}</span>
                    </div>
                    <button onClick={() => verDetalle(r)} style={{ width: '100%', padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 7, fontSize: '.79rem', fontWeight: 600, cursor: 'pointer' }}>
                      Ver detalle completo →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* ── TOPBAR ── */}
      <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>

        {/* Botón regresar */}
        <button
          onClick={() => navigate(-1)}
          title="Regresar al inicio"
          style={{
            pointerEvents: 'all', width: 40, height: 40,
            background: 'white', border: 'none', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,.11)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', color: '#1a1f2e', flexShrink: 0,
          }}
        >
          ←
        </button>

        <div style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 14, padding: '8px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.11)' }}>
          <div style={{ width: 30, height: 30, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🚨</div>
          <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#1a1f2e' }}>Alerta Ciudadana</span>
          <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#8b93a5', background: '#f7f8fa', padding: '2px 8px', borderRadius: 20 }}>
            {stats?.resumen?.total ?? reportes.length} reportes
          </span>
        </div>

        <div style={{ pointerEvents: 'all', flex: 1, maxWidth: 280, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Buscar reportes..."
            style={{ width: '100%', padding: '10px 12px 10px 32px', background: 'white', border: 'none', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,.11)', fontSize: '.86rem', outline: 'none' }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={cargar} title="Actualizar" style={{ pointerEvents: 'all', padding: '9px 12px', background: 'white', border: 'none', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,.11)', cursor: 'pointer', fontSize: 16 }}>↻</button>
        <button onClick={abrirNuevo} style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,.11)', cursor: 'pointer', fontSize: '.84rem', fontWeight: 700 }}>
          ＋ Reportar
        </button>
      </div>

      {/* ── PANEL IZQUIERDO ── */}
      <div style={{ position: 'fixed', top: 72, left: 12, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Zoom */}
        <div style={{ background: 'white', borderRadius: 11, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => map && map.zoomIn()}
            title="Acercar"
            style={{ width: 42, height: 38, background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 700, color: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
          <button
            onClick={() => map && map.zoomOut()}
            title="Alejar"
            style={{ width: 42, height: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', fontWeight: 700, color: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >−</button>
        </div>
        {[
          { ico: '📍', tip: 'Mi ubicación', fn: () => { autoUbicar(); showToast('Buscando tu ubicación...', ''); } },
          { ico: '🛰️', tip: satelite ? 'Calles' : 'Satélite', fn: () => setSatelite(s => !s) },
          { ico: '↻', tip: 'Actualizar', fn: () => { cargar(); showToast('✓ Mapa actualizado', 'ok'); } },
        ].map(({ ico, tip, fn }) => (
          <button key={tip} onClick={fn} title={tip} style={{ width: 42, height: 42, background: 'white', border: 'none', borderRadius: 11, boxShadow: '0 1px 4px rgba(0,0,0,.08)', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ico}
          </button>
        ))}
      </div>

      {/* ── STATS BOX ── */}
      {stats && (
        <div style={{ position: 'fixed', top: 72, right: 12, background: 'white', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,.11)', padding: '10px 14px', zIndex: 500, minWidth: 155 }}>
          {[
            { color: '#1a1f2e', label: 'Total', n: stats.resumen?.total ?? 0 },
            { color: '#f59e0b', label: 'Pendientes', n: stats.resumen?.pendientes ?? 0 },
            { color: '#8b5cf6', label: 'En progreso', n: stats.resumen?.en_progreso ?? 0 },
            { color: '#10b981', label: 'Resueltos', n: stats.resumen?.resueltos ?? 0 },
          ].map(({ color, label, n }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderTop: label !== 'Total' ? '1px solid #e4e7ed' : 'none', marginTop: label !== 'Total' ? 2 : 0 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '.76rem', color: '#4a5168', flex: 1 }}>{label}</span>
              <span style={{ fontSize: '.8rem', fontWeight: 700, fontFamily: 'monospace', color: '#1a1f2e' }}>{n}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTROS ── */}
      <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', gap: 5, background: 'white', padding: 5, borderRadius: 50, boxShadow: '0 12px 40px rgba(0,0,0,.15)', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: 'calc(100vw - 24px)' }}>
        {CATBAR.map(({ t, label, color }) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', border: 'none', borderRadius: 50,
              background: filtroTipo === t ? (color || '#1a1f2e') : 'transparent',
              color: filtroTipo === t ? 'white' : '#4a5168',
              fontSize: '.79rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
          >
            {color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: filtroTipo === t ? 'rgba(255,255,255,.7)' : color, flexShrink: 0 }} />}
            {label}
          </button>
        ))}
      </div>

      {/* ── PIN CENTRAL (modo mover) ── */}
      {modoPin && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -100%) translateY(-8px)', zIndex: 700, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: '2.6rem', filter: 'drop-shadow(0 4px 10px rgba(37,99,235,.5))', animation: 'none' }}>📌</div>
          <div style={{ background: '#2563eb', color: 'white', fontSize: '.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginTop: 2 }}>
            Mueve el mapa para ubicar
          </div>
        </div>
      )}

      {/* ── MINI-BARRA (modo mover pin) ── */}
      {modoPin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 950, background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,.12)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#4a5168' }}>
              {pinCoords ? `${pinCoords.lat.toFixed(5)}, ${pinCoords.lng.toFixed(5)}` : 'Moviendo...'}
            </div>
            <div style={{ fontSize: '.72rem', color: '#8b93a5', marginTop: 1 }}>Ajusta el mapa y confirma</div>
          </div>
          <button onClick={confirmarPin} style={{ padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: '.86rem', fontWeight: 700, cursor: 'pointer' }}>
            ✓ Confirmar
          </button>
        </div>
      )}

      {/* ── OVERLAY ── */}
      {(drawerNuevo || drawerDetalle) && (
        <div onClick={() => { setDrawerNuevo(false); setDrawerDetalle(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,.3)', backdropFilter: 'blur(2px)', zIndex: 800 }} />
      )}

      {/* ── MODAL NUEVO REPORTE ── */}
      {drawerNuevo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,.22)',
            width: '100%', maxWidth: 460,
            maxHeight: '92vh', overflowY: 'auto',
            animation: 'slideUp .28s cubic-bezier(.32,.72,0,1)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f5', position: 'sticky', top: 0, background: 'white', borderRadius: '20px 20px 0 0', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1f2e' }}>Nuevo reporte</div>
                <div style={{ fontSize: '.75rem', color: '#8b93a5', marginTop: 2 }}>Categoriza y ubica el problema</div>
              </div>
              <button onClick={() => setDrawerNuevo(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f7f8fa', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5168', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '18px 22px 26px' }}>
              <form onSubmit={enviar}>
                {/* Categoría */}
                <div style={{ fontSize: '.71rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#8b93a5', marginBottom: 10 }}>Categoría del problema</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                  {Object.entries(TIPOS).slice(0, 6).map(([key, val]) => (
                    <div
                      key={key}
                      onClick={() => setForm(f => ({ ...f, tipo: key, subtipo: '' }))}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '14px 8px',
                        border: `2px solid ${form.tipo === key ? val.color : '#e8eaed'}`,
                        borderRadius: 14, cursor: 'pointer', transition: 'all .15s',
                        background: form.tipo === key ? val.color + '12' : 'white',
                        boxShadow: form.tipo === key ? `0 0 0 3px ${val.color}22` : 'none',
                      }}
                    >
                      <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{val.emoji}</span>
                      <span style={{ fontSize: '.74rem', fontWeight: 600, color: form.tipo === key ? val.color : '#4a5168', textAlign: 'center', lineHeight: 1.2 }}>{val.label}</span>
                    </div>
                  ))}
                </div>

                {/* Subtipo */}
                {form.tipo && SUBTIPOS[form.tipo] && (
                  <div style={{ marginBottom: 13 }}>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Subtipo</label>
                    <select value={form.subtipo} onChange={e => setForm(f => ({ ...f, subtipo: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e4e7ed', borderRadius: 10, fontSize: '.88rem', color: '#1a1f2e', outline: 'none', background: 'white' }}>
                      <option value="">Selecciona subtipo...</option>
                      {SUBTIPOS[form.tipo].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Descripción */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Descripción</label>
                  <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe el problema brevemente..."
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e4e7ed', borderRadius: 10, fontSize: '.88rem', color: '#1a1f2e', resize: 'none', height: 75, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Colonia / Calle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 13 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Colonia</label>
                    <input value={form.colonia} onChange={e => setForm(f => ({ ...f, colonia: e.target.value }))}
                      placeholder="Ej. Centro" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e4e7ed', borderRadius: 10, fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Calle</label>
                    <input value={form.calle} onChange={e => setForm(f => ({ ...f, calle: e.target.value }))}
                      placeholder="Ej. Av. Sonora" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e4e7ed', borderRadius: 10, fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Ubicación */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Ubicación del problema</label>
                  <div style={{ border: '1.5px solid #e4e7ed', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f5' }}>
                      <span style={{ fontSize: '.82rem', color: form.lat ? '#10b981' : '#8b93a5', fontFamily: 'monospace' }}>
                        {form.lat && form.lng
                          ? <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginRight: 6 }} />{parseFloat(form.lat).toFixed(5)},  {parseFloat(form.lng).toFixed(5)}</>
                          : '⏳ Sin ubicación'
                        }
                      </span>
                      <button type="button" onClick={autoUbicar} title="Refrescar GPS" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '.9rem', padding: 0 }}>↻</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <button type="button" onClick={() => {
                        if (gpsPos) { setForm(f => ({ ...f, lat: gpsPos.lat.toFixed(6), lng: gpsPos.lng.toFixed(6) })); showToast('📍 Usando tu ubicación GPS', 'ok'); }
                        else autoUbicar();
                      }} style={{ padding: '9px', background: 'none', border: 'none', borderRight: '1px solid #f0f0f5', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        📍 Usar mi GPS
                      </button>
                      <button type="button" onClick={iniciarPin} style={{ padding: '9px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, color: '#4a5168', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        🗺️ Mover en mapa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Foto */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Foto <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  {fotoPreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={fotoPreview} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10 }} />
                      <button type="button" onClick={limpiarFoto} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '.72rem', color: 'white', background: 'rgba(0,0,0,.45)', padding: '2px 8px', borderRadius: 6 }}>X Quitar foto</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 10px', border: '1.5px solid #e4e7ed', borderRadius: 10, cursor: 'pointer', gap: 6, background: '#fafafa' }}>
                        <span style={{ fontSize: '1.8rem' }}>📷</span>
                        <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#2563eb' }}>Tomar foto</span>
                        <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>Cámara</span>
                        <input type="file" accept="image/*" capture="environment" ref={fotoCamRef} onChange={e => seleccionarFoto(e.target.files[0])} style={{ display: 'none' }} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 10px', border: '1.5px solid #e4e7ed', borderRadius: 10, cursor: 'pointer', gap: 6, background: '#fafafa' }}>
                        <span style={{ fontSize: '1.8rem' }}>🖼️</span>
                        <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#2563eb' }}>Elegir imagen</span>
                        <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>Galería</span>
                        <input type="file" accept="image/*" ref={fotoRef} onChange={e => seleccionarFoto(e.target.files[0])} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={enviando} style={{ width: '100%', padding: '14px', background: enviando ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {enviando ? '⏳ Enviando...' : <><span>🚀</span> Enviar reporte</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER DETALLE ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: drawerDetalle ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
        width: '100%', maxWidth: 560, zIndex: 900,
        background: 'white', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -6px 32px rgba(0,0,0,.18)',
        transition: 'transform .32s cubic-bezier(.32,.72,0,1)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {drawerDetalle && (() => {
          const r = historialDetalle?.reporte || drawerDetalle;
          const acts = historialDetalle?.actualizaciones || [];
          const met = historialDetalle?.metricas;
          const t = tipoInfo(r.tipo);
          const est = estadoInfo(r.estado);
          const actCierre = acts.filter(a => a.estado_nuevo === 'resuelto').pop();
          const evCierre = actCierre?.evidencias?.[0] || null;
          const fotoAntes = r.foto_url || drawerDetalle.foto_url;

          return (
            <>
              {/* Foto principal o banner de color con emoji */}
              {fotoAntes && !evCierre ? (
                <div style={{ position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                  <img
                    src={fotoAntes}
                    alt=""
                    style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', maxHeight: '40vh' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div style={{ display: 'none', width: '100%', height: 80, background: t.color + '18', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>{t.emoji}</div>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.45) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, background: t.color, color: 'white' }}>{t.emoji} {t.label}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, background: est.color, color: 'white' }}>{est.lbl}</span>
                  </div>
                </div>
              ) : !fotoAntes && !evCierre ? (
                <div style={{ width: '100%', height: 80, background: t.color + '18', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: '2.5rem' }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: t.color, fontSize: '.95rem' }}>{t.label}</div>
                    <div style={{ fontSize: '.75rem', color: est.color, fontWeight: 600 }}>{est.lbl}</div>
                  </div>
                </div>
              ) : null}
              <div style={{ width: 36, height: 4, background: '#e4e7ed', borderRadius: 2, margin: '10px auto 0' }} />

              {/* Antes/Después */}
              {fotoAntes && evCierre && (
                <div style={{ padding: '12px 20px 0' }}>
                  <div style={{ fontSize: '.69rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#8b93a5', marginBottom: 7 }}>📸 Antes / Después</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div><img src={fotoAntes} alt="Antes" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} onError={e => e.target.style.display='none'} /><div style={{ fontSize: '.65rem', color: '#8b93a5', textAlign: 'center', marginTop: 3 }}>Antes</div></div>
                    <div><img src={evCierre.url} alt="Después" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} onError={e => e.target.style.display='none'} /><div style={{ fontSize: '.65rem', color: '#8b93a5', textAlign: 'center', marginTop: 3 }}>Después</div></div>
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 20px 30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {/* Solo mostrar badges si no aparecieron en el overlay de foto */}
                  {!(fotoAntes && !evCierre) && (
                    <>
                      <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '.7rem', fontWeight: 700, background: t.color + '18', color: t.color }}>{t.emoji} {t.label}</span>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, background: est.color + '22', color: est.color }}>{est.lbl}</span>
                    </>
                  )}
                  <button onClick={() => { setDrawerDetalle(null); setHistorialDetalle(null); }} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%', background: '#f7f8fa', border: 'none', cursor: 'pointer', fontSize: '.9rem', color: '#4a5168' }}>✕</button>
                </div>

                <div style={{ fontSize: '.8rem', fontFamily: 'monospace', color: '#8b93a5', marginBottom: 4 }}>{r.folio}</div>
                {r.descripcion && <p style={{ fontSize: '.88rem', color: '#4a5168', lineHeight: 1.5, marginBottom: 10 }}>{r.descripcion}</p>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '.75rem', color: '#8b93a5', marginBottom: 10 }}>
                  {r.colonia && <span>📍 {r.colonia}</span>}
                  {r.calle && <span>🛣 {r.calle}</span>}
                  <span>🕐 {timeAgo(r.fecha_creacion)}</span>
                  <span>▲ {r.votos || drawerDetalle.votos || 0} apoyos</span>
                </div>

                {/* Métricas */}
                {met && (
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                    {r.estado === 'resuelto' && met.dias_resolucion != null
                      ? <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 8, padding: '7px 11px', flex: 1, minWidth: 80 }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{met.dias_resolucion}d</div><div style={{ fontSize: '.65rem', color: '#8b93a5' }}>Resolución</div></div>
                      : <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '7px 11px', flex: 1, minWidth: 80 }}><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{met.dias_abierto}d</div><div style={{ fontSize: '.65rem', color: '#8b93a5' }}>Días abierto</div></div>
                    }
                    <div style={{ background: 'rgba(0,0,0,.04)', border: '1px solid #e4e7ed', borderRadius: 8, padding: '7px 11px', flex: 1, minWidth: 80 }}><div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'monospace' }}>{met.num_actualizaciones}</div><div style={{ fontSize: '.65rem', color: '#8b93a5' }}>Actualizaciones</div></div>
                  </div>
                )}

                {/* Timeline */}
                {loadingDetalle && <div style={{ textAlign: 'center', padding: '12px 0', color: '#8b93a5', fontSize: '.82rem' }}>Cargando seguimiento...</div>}
                {!loadingDetalle && acts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '.69rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#8b93a5', marginBottom: 8 }}>Seguimiento</div>
                    <div style={{ position: 'relative', paddingLeft: 20 }}>
                      <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: '#e4e7ed' }} />
                      {acts.map(a => (
                        <div key={a.id} style={{ position: 'relative', marginBottom: 10 }}>
                          <div style={{ position: 'absolute', left: -17, top: 3, width: 8, height: 8, borderRadius: '50%', background: estadoInfo(a.estado_nuevo).color }} />
                          <div style={{ fontSize: '.78rem', fontWeight: 600, color: estadoInfo(a.estado_nuevo).color }}>{estadoInfo(a.estado_nuevo).lbl}</div>
                          {a.comentario && <div style={{ fontSize: '.75rem', color: '#6b7280', margin: '2px 0 4px', lineHeight: 1.4 }}>{a.comentario}</div>}
                          {a.evidencias?.length > 0 && (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                              {a.evidencias.map(ev => (
                                <img key={ev.id} src={ev.url} alt="evidencia" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid #e4e7ed' }}
                                  onClick={() => window.open(ev.url, '_blank')}
                                  onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: '.65rem', color: '#8b93a5' }}>{timeAgo(a.creado_en)}{a.operador_nombre ? ` · ${a.operador_nombre}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => votar(drawerDetalle.id)} style={{ width: '100%', padding: '11px', background: '#f7f8fa', color: '#1a1f2e', border: '1.5px solid #e4e7ed', borderRadius: 10, fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
                  ▲ Apoyar este reporte · {drawerDetalle.votos || 0}
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'ok' ? '#10b981' : toast.type === 'err' ? '#ef4444' : '#1a1f2e',
          color: 'white', padding: '10px 18px', borderRadius: 10,
          fontSize: '.84rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
