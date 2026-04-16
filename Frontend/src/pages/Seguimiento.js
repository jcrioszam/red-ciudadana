import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FiRefreshCw, FiMapPin, FiTruck, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROL_COLOR = {
  admin:           '#f59e0b',
  presidente:      '#8b5cf6',
  lider_estatal:   '#ef4444',
  lider_regional:  '#3b82f6',
  lider_zona:      '#10b981',
  lider_municipal: '#06b6d4',
  default:         '#6b7280',
};

const makeVehicleIcon = (color) => L.divIcon({
  html: `<div style="
    width:34px;height:34px;background:${color};
    border:2.5px solid white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:15px;">🚗</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

function timeAgo(ts) {
  const d = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (d < 1) return 'Ahora';
  if (d < 60) return `Hace ${d} min`;
  if (d < 1440) return `Hace ${Math.floor(d / 60)}h`;
  return new Date(ts).toLocaleDateString('es-MX');
}

const ALLOWED = ['admin', 'presidente', 'lider_estatal', 'lider_regional', 'lider_municipal'];

export default function Seguimiento() {
  const { user } = useAuth();
  const [selectedEvento, setSelectedEvento] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  /* ── Eventos activos ── */
  const { data: eventos = [] } = useQuery('eventosActivos', () =>
    api.get('/eventos/?activos=true').then(r => r.data)
  );

  /* ── Ubicaciones ── */
  const { data: ubicData, isLoading, isError, refetch, dataUpdatedAt } = useQuery(
    ['ubicaciones', selectedEvento],
    () => api.get(`/ubicacion/vehiculos${selectedEvento ? `?evento_id=${selectedEvento}` : ''}`).then(r => r.data),
    {
      enabled: !!selectedEvento,
      refetchInterval: autoRefresh ? 30000 : false,
    }
  );

  const vehicles = ubicData?.ubicaciones || [];

  /* ── Auto-seleccionar primer evento ── */
  useEffect(() => {
    if (eventos.length > 0 && !selectedEvento) setSelectedEvento(String(eventos[0].id));
  }, [eventos]);

  if (!ALLOWED.includes(user?.rol)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12, color: '#ef4444' }}>
        <FiAlertCircle size={40} />
        <p style={{ fontWeight: 600 }}>No tienes permisos para acceder al seguimiento en tiempo real</p>
      </div>
    );
  }

  const eventoSel = eventos.find(e => String(e.id) === String(selectedEvento));
  const center = vehicles.length > 0
    ? [vehicles[0].latitud, vehicles[0].longitud]
    : [19.4326, -99.1332];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Seguimiento en Tiempo Real</h1>
          <p className="text-secondary-600">Monitorea la ubicación de vehículos durante movilizaciones</p>
        </div>

        {/* Última actualización */}
        {dataUpdatedAt > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: '#6b7280', background: 'white', padding: '6px 12px', borderRadius: 20, border: '1px solid #e4e7ed' }}>
            <FiClock size={12} />
            Actualizado: {new Date(dataUpdatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Selector evento */}
        <div style={{ flex: '1 1 260px' }}>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
            <FiCalendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Evento
          </label>
          <select
            className="input-field"
            value={selectedEvento}
            onChange={e => setSelectedEvento(e.target.value)}
          >
            <option value="">— Selecciona un evento —</option>
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </select>
        </div>

        {/* Actualizar manual */}
        <button
          onClick={() => refetch()}
          disabled={!selectedEvento || isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: '#2563eb', color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: '.85rem', cursor: 'pointer',
            opacity: !selectedEvento ? 0.5 : 1,
          }}
        >
          <FiRefreshCw size={14} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
          Actualizar
        </button>

        {/* Toggle auto-refresh */}
        <button
          onClick={() => setAutoRefresh(v => !v)}
          disabled={!selectedEvento}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: autoRefresh ? '#ecfdf5' : '#f3f4f6',
            color: autoRefresh ? '#16a34a' : '#6b7280',
            border: `1.5px solid ${autoRefresh ? '#86efac' : '#e4e7ed'}`,
            borderRadius: 10, fontWeight: 600, fontSize: '.85rem', cursor: 'pointer',
            opacity: !selectedEvento ? 0.5 : 1,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: autoRefresh ? '#16a34a' : '#9ca3af' }} />
          {autoRefresh ? 'Auto (30s)' : 'Auto off'}
        </button>
      </div>

      {/* Stats */}
      {selectedEvento && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Vehículos activos', n: vehicles.length,                          color: '#3b82f6', bg: '#eff6ff', Icon: FiTruck },
            { label: 'En movimiento',     n: vehicles.filter(v => v.velocidad > 0).length, color: '#10b981', bg: '#ecfdf5', Icon: FiMapPin },
            { label: 'Evento',            n: eventoSel?.nombre || '—',                  color: '#8b5cf6', bg: '#f5f3ff', Icon: FiCalendar },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.Icon size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.73rem', color: '#8b93a5', fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: typeof s.n === 'number' ? '1.4rem' : '.9rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.n}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiAlertCircle size={16} /> Error al cargar ubicaciones. Verifica la conexión e intenta de nuevo.
        </div>
      )}

      {/* Mapa */}
      {selectedEvento && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e4e7ed', boxShadow: '0 2px 8px rgba(0,0,0,.06)', height: 460 }}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            key={selectedEvento}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicles.map((v, i) => (
              <Marker
                key={i}
                position={[v.latitud, v.longitud]}
                icon={makeVehicleIcon(ROL_COLOR[v.rol] || ROL_COLOR.default)}
              >
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 6, color: '#1a1f2e' }}>
                      {v.nombre}{v.vehiculo_placas ? ` · ${v.vehiculo_placas}` : ''}
                    </div>
                    <div style={{ fontSize: '.8rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span>Rol: <strong style={{ textTransform: 'capitalize' }}>{v.rol?.replace(/_/g, ' ')}</strong></span>
                      {v.velocidad != null && <span>Velocidad: <strong>{v.velocidad.toFixed(1)} km/h</strong></span>}
                      {v.bateria   != null && <span>Batería: <strong>{v.bateria}%</strong></span>}
                      {v.direccion && <span>Dir: {v.direccion}</span>}
                      {v.total_personas != null && (
                        <span>Personas: <strong>{v.total_personas}{v.vehiculo_capacidad ? `/${v.vehiculo_capacidad}` : ''}</strong></span>
                      )}
                      <span style={{ color: '#9ca3af', marginTop: 4 }}>{timeAgo(v.timestamp)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Lista vehículos */}
      {selectedEvento && vehicles.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f5', fontWeight: 700, fontSize: '.9rem', color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiTruck size={15} /> Vehículos en seguimiento ({vehicles.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, padding: 16 }}>
            {vehicles.map((v, i) => {
              const color = ROL_COLOR[v.rol] || ROL_COLOR.default;
              return (
                <div key={i} style={{ border: '1px solid #f0f0f5', borderRadius: 12, padding: '12px 14px', borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#1a1f2e' }}>{v.nombre}</div>
                      {v.vehiculo_placas && (
                        <div style={{ fontSize: '.73rem', color: '#9ca3af' }}>{v.vehiculo_tipo} · {v.vehiculo_placas}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: '.68rem', fontWeight: 700, color, background: color + '22', padding: '2px 8px', borderRadius: 20 }}>
                        {v.rol?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.68rem', color: '#9ca3af' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        {timeAgo(v.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '.78rem', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FiMapPin size={11} color="#9ca3af" />
                      {v.latitud.toFixed(5)}, {v.longitud.toFixed(5)}
                    </div>
                    {v.velocidad != null && (
                      <div>Velocidad: <strong>{v.velocidad.toFixed(1)} km/h</strong></div>
                    )}
                    {v.bateria != null && (
                      <div>Batería: <strong>{v.bateria}%</strong></div>
                    )}
                    {v.total_personas != null && (
                      <div>Personas: <strong>{v.total_personas}{v.vehiculo_capacidad ? `/${v.vehiculo_capacidad}` : ''}</strong></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedEvento && !isLoading && vehicles.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: 'white', borderRadius: 14, border: '1px solid #f0f0f5' }}>
          <FiTruck size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: .3 }} />
          <p style={{ fontWeight: 600 }}>No hay vehículos en seguimiento para este evento</p>
          <p style={{ fontSize: '.83rem', marginTop: 4 }}>Los vehículos aparecerán aquí cuando compartan su ubicación</p>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
