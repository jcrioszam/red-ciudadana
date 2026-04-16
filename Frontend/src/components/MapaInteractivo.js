import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix iconos Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ─── Capas de mapa ────────────────────────────────────────────────────────────
const TILE_LAYERS = {
  calles:   { label: 'Calles',   url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: '© CARTO © OpenStreetMap' },
  satelite: { label: 'Satélite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
  hibrido:  { label: 'Híbrido',  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
  claro:    { label: 'Claro',    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© CARTO © OpenStreetMap' },
  osm:      { label: 'OSM',      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = {
  pendiente:   { lbl: 'Pendiente',   color: '#f59e0b' },
  en_revision: { lbl: 'En Revisión', color: '#3b82f6' },
  en_progreso: { lbl: 'En Progreso', color: '#8b5cf6' },
  resuelto:    { lbl: 'Resuelto',    color: '#10b981' },
  rechazado:   { lbl: 'Rechazado',   color: '#ef4444' },
};

const TIPOS = {
  bache:                     { emoji: '🕳️', color: '#ef4444', label: 'Bache' },
  basura:                    { emoji: '🗑️', color: '#8b5cf6', label: 'Basura' },
  drenaje:                   { emoji: '🌊', color: '#0ea5e9', label: 'Drenaje' },
  agua:                      { emoji: '💧', color: '#10b981', label: 'Agua' },
  luminaria:                 { emoji: '💡', color: '#f59e0b', label: 'Luminaria' },
  seguridad:                 { emoji: '🚨', color: '#ef4444', label: 'Seguridad' },
  baches_banqueta_invadida:  { emoji: '🔧', color: '#f59e0b', label: 'Baches/Banqueta' },
  basura_alumbrado:          { emoji: '🗑️', color: '#8b5cf6', label: 'Basura/Alumbrado' },
  agua_potable_drenaje:      { emoji: '💧', color: '#0ea5e9', label: 'Agua/Drenaje' },
  policia_accidentes_delitos:{ emoji: '🚔', color: '#ef4444', label: 'Seguridad' },
  tala_arboles_ecologia:     { emoji: '🌳', color: '#16a34a', label: 'Ecología' },
  transporte_urbano_rutas:   { emoji: '🚌', color: '#0ea5e9', label: 'Transporte' },
  transito_vialidad:         { emoji: '🚦', color: '#ea580c', label: 'Tránsito' },
  obras_publicas_navojoa:    { emoji: '🏠', color: '#dc2626', label: 'Obras Públicas' },
  otro:                      { emoji: '⚠️', color: '#6b7280', label: 'Otro' },
  otro_queja_sugerencia:     { emoji: '❓', color: '#6b7280', label: 'Otro/Queja' },
};

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

// ─── Pin icon (igual a AlertaCiudadanaMapa) ───────────────────────────────────
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
          <img src="${fotoUrl}" width="42" height="42" style="width:100%;height:100%;object-fit:cover;display:block;"
            onerror="this.parentNode.innerHTML='<div style=\\'width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;\\'>${t.emoji}</div>'"/>
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

// Icono verde para ubicación seleccionada
const makeSelIcon = () => L.divIcon({
  html: `<div style="width:32px;height:32px;background:#10b981;border-radius:50% 50% 50% 2px;transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,.9);box-shadow:0 3px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);display:inline-block;font-size:14px">📍</span></div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34],
});

// ─── Subcomponentes ───────────────────────────────────────────────────────────
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => { if (typeof onLocationSelect === 'function') onLocationSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

const MapReady = ({ onReady }) => {
  const map = useMap();
  useEffect(() => { if (map && onReady) onReady(map); }, [map, onReady]);
  return null;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const MapaInteractivo = ({
  onLocationSelect,
  selectedLocation,
  reportes = [],
  modo = 'seleccion',
  center = [29.0729, -110.9559],
  zoom = 13,
}) => {
  const [map, setMap] = useState(null);
  const [tipoMapa, setTipoMapa] = useState('calles');
  const [gpsPos, setGpsPos] = useState(null);
  const layer = TILE_LAYERS[tipoMapa];

  useEffect(() => {
    if (map && selectedLocation?.lat && selectedLocation?.lng)
      map.setView([selectedLocation.lat, selectedLocation.lng], 16);
  }, [selectedLocation, map]);

  useEffect(() => {
    if (!map || modo !== 'visualizacion' || reportes.length === 0) return;
    const valid = reportes.filter(r => r.latitud && r.longitud);
    if (valid.length === 0) return;
    setTimeout(() => map.fitBounds(L.latLngBounds(valid.map(r => [r.latitud, r.longitud])), { padding: [40, 40] }), 300);
  }, [reportes, map, modo]);

  const irAMiUbicacion = useCallback(() => {
    if (!navigator.geolocation) { alert('Geolocalización no soportada.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setGpsPos(pos);
        if (typeof onLocationSelect === 'function') onLocationSelect(pos.lat, pos.lng);
        if (map) map.setView([pos.lat, pos.lng], 16);
      },
      (err) => {
        const msgs = { 1: 'Permiso denegado.', 2: 'Ubicación no disponible.', 3: 'Tiempo agotado.' };
        alert(msgs[err.code] || 'No se pudo obtener tu ubicación.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [map, onLocationSelect]);

  const ajustarVista = useCallback(() => {
    if (!map || reportes.length === 0) return;
    const valid = reportes.filter(r => r.latitud && r.longitud);
    if (valid.length === 0) return;
    map.fitBounds(L.latLngBounds(valid.map(r => [r.latitud, r.longitud])), { padding: [40, 40] });
  }, [map, reportes]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 380, position: 'relative' }}>

      {/* ── Selector tipo mapa ── */}
      <div style={{
        position: 'absolute', bottom: 32, left: 10, zIndex: 1000,
        display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220,
        background: 'rgba(255,255,255,.96)', borderRadius: 10, padding: '5px 7px',
        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
      }}>
        {Object.entries(TILE_LAYERS).map(([key, val]) => (
          <button key={key} onClick={() => setTipoMapa(key)} style={{
            padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: tipoMapa === key ? 700 : 400,
            background: tipoMapa === key ? '#2563eb' : '#f3f4f6',
            color: tipoMapa === key ? 'white' : '#374151', transition: 'all .15s',
          }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* ── Botones flotantes derecha ── */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={irAMiUbicacion} title="Mi ubicación (GPS)" style={btnStyle('#10b981')}>
          📍 GPS
        </button>
        {modo === 'visualizacion' && reportes.length > 0 && (
          <button onClick={ajustarVista} title="Ver todos los reportes" style={btnStyle('#2563eb')}>
            🎯 Todos
          </button>
        )}
      </div>

      {/* ── Mapa ── */}
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <MapReady onReady={setMap} />
        <MapClickHandler onLocationSelect={onLocationSelect} />

        <TileLayer key={tipoMapa} url={layer.url} attribution={layer.attribution} maxZoom={19} />
        {tipoMapa === 'hibrido' && layer.labelUrl && (
          <TileLayer url={layer.labelUrl} attribution="" maxZoom={19} opacity={0.85} />
        )}

        {/* Marcador GPS (mi ubicación) */}
        {gpsPos && (
          <>
            <Circle center={[gpsPos.lat, gpsPos.lng]} radius={80}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.12, weight: 1.5, dashArray: '4 3' }} />
            <Marker position={[gpsPos.lat, gpsPos.lng]} icon={L.divIcon({
              html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(37,99,235,.35),0 2px 8px rgba(0,0,0,.3);"></div>`,
              className: '', iconSize: [18, 18], iconAnchor: [9, 9],
            })} zIndexOffset={1000}>
              <Popup><div style={{ fontSize: '.82rem', fontWeight: 600 }}>📍 Mi ubicación</div></Popup>
            </Marker>
          </>
        )}

        {/* Marcador de ubicación seleccionada (modo selección) */}
        {selectedLocation?.lat && selectedLocation?.lng && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={makeSelIcon()}>
            <Popup>
              <div style={{ fontSize: 12, fontWeight: 600 }}>📍 Ubicación seleccionada</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de reportes */}
        {modo === 'visualizacion' && reportes.map(reporte => {
          const fotoUrl = reporte.fotos?.[0]?.url || reporte.foto_url || null;
          const t = tipoInfo(reporte.tipo);
          const est = estadoInfo(reporte.estado);
          const folio = reporte.folio || `RC-${reporte.id}`;

          return (
            <Marker
              key={reporte.id}
              position={[reporte.latitud, reporte.longitud]}
              icon={makePinIcon(reporte.tipo, reporte.estado, fotoUrl)}
            >
              <Popup maxWidth={260} minWidth={210}>
                {/* Foto o banner emoji */}
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt=""
                    style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block', margin: '-8px -8px 0', width: 'calc(100% + 16px)' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{
                  display: fotoUrl ? 'none' : 'flex',
                  width: 'calc(100% + 16px)', height: 64,
                  background: t.color + '18', borderRadius: '8px 8px 0 0',
                  alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
                  margin: '-8px -8px 0',
                }}>
                  {t.emoji}
                </div>

                <div style={{ paddingTop: 9 }}>
                  {/* Tipo + Estado */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: t.color }}>
                      {t.emoji} {t.label}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '.68rem', fontWeight: 700, background: est.color + '22', color: est.color }}>
                      {est.lbl}
                    </span>
                  </div>

                  {/* Descripción */}
                  <p style={{ fontSize: '.81rem', color: '#4a5168', margin: '3px 0 6px', lineHeight: 1.4 }}>
                    {(reporte.descripcion || 'Sin descripción').slice(0, 90)}
                  </p>

                  {/* Folio + Fecha */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#8b93a5' }}>
                    <span style={{ fontFamily: 'monospace' }}>{folio}</span>
                    <span>{timeAgo(reporte.fecha_creacion)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Coordenadas seleccionadas */}
      {selectedLocation?.lat && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
          background: 'rgba(255,255,255,.92)', padding: '6px 10px',
          borderRadius: 8, fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }}>
          📍 {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
};

const btnStyle = (bg) => ({
  background: bg, color: 'white', border: 'none', borderRadius: 8,
  padding: '7px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  boxShadow: '0 2px 6px rgba(0,0,0,.2)', whiteSpace: 'nowrap',
});

export default MapaInteractivo;
