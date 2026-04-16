import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiRefreshCw, FiCheck, FiUsers, FiTruck, FiCalendar, FiAlertCircle, FiStar } from 'react-icons/fi';

const Checkin = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [idEvento, setIdEvento]     = useState('');
  const [idVehiculo, setIdVehiculo] = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [loadingId, setLoadingId]   = useState(null);

  /* ── Queries ── */
  const { data: eventos = [] } = useQuery('eventosCheckin', () =>
    api.get('/eventos/?activos=true').then(r => r.data)
  );

  const { data: vehiculos = [] } = useQuery(
    ['vehiculosCheckin', idEvento],
    () => api.get('/vehiculos/').then(r => r.data),
    { enabled: !!idEvento }
  );

  const { data: asignaciones = [], isLoading: loadingAsig, refetch } = useQuery(
    ['asignacionesCheckin', idEvento, idVehiculo],
    () => api.get(`/movilizaciones/?evento_id=${idEvento}${idVehiculo ? `&vehiculo_id=${idVehiculo}` : ''}`).then(r => r.data),
    { enabled: !!idEvento, refetchInterval: 30000 }
  );

  // Auto-seleccionar primer evento si solo hay uno
  useEffect(() => {
    if (eventos.length === 1 && !idEvento) {
      setIdEvento(String(eventos[0].id));
    }
  }, [eventos]);

  // Auto-seleccionar el vehículo del movilizador actual (si es su responsabilidad)
  useEffect(() => {
    if (vehiculos.length > 0 && idEvento && !idVehiculo) {
      const miVehiculo = vehiculos.find(v => String(v.id_movilizador) === String(user?.id));
      if (miVehiculo) setIdVehiculo(String(miVehiculo.id));
    }
  }, [vehiculos, idEvento]);

  /* ── Check-in ── */
  const checkinMutation = useMutation(
    asig => api.post(`/movilizaciones/${asig.id}/checkin`).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['asignacionesCheckin', idEvento, idVehiculo]);
        toast.success('¡Asistencia marcada!');
        setLoadingId(null);
      },
      onError: err => {
        toast.error(err?.response?.data?.detail || 'Error al marcar asistencia');
        setLoadingId(null);
      },
    }
  );

  const handleCheckin = (asig) => {
    setLoadingId(asig.id);
    checkinMutation.mutate(asig);
  };

  /* ── Filtro y stats ── */
  const filtradas = asignaciones.filter(a => {
    if (!busqueda) return true;
    const p = a.persona || {};
    const q = busqueda.toLowerCase();
    return (
      (p.nombre        || '').toLowerCase().includes(q) ||
      (p.clave_elector || '').toLowerCase().includes(q) ||
      (p.telefono      || '').toLowerCase().includes(q) ||
      (p.curp          || '').toLowerCase().includes(q)
    );
  });

  const total     = asignaciones.length;
  const presentes = asignaciones.filter(a => a.asistio).length;
  const pct       = total > 0 ? Math.round((presentes / total) * 100) : 0;

  const eventoSel   = eventos.find(e => String(e.id) === String(idEvento));
  const vehiculoSel = vehiculos.find(v => String(v.id) === String(idVehiculo));
  const esMovilizadorDeVehiculo = vehiculoSel && String(vehiculoSel.id_movilizador) === String(user?.id);

  // Vehículos propios del movilizador actual
  const misVehiculos = vehiculos.filter(v => String(v.id_movilizador) === String(user?.id));

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 64px)', background: '#f8fafc' }}>

      {/* ── Panel lateral ── */}
      <div style={{
        width: 290, flexShrink: 0, background: 'white',
        borderRight: '1px solid #e4e7ed',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 18px', borderBottom: '1px solid #f0f0f5' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1a1f2e', marginBottom: 2 }}>Pase de Lista</h1>
          <p style={{ fontSize: '.8rem', color: '#6b7280' }}>Marca asistencia por evento y vehículo</p>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selector evento */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              <FiCalendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Evento
            </label>
            <select
              className="input-field"
              value={idEvento}
              onChange={e => { setIdEvento(e.target.value); setIdVehiculo(''); setBusqueda(''); }}
            >
              <option value="">— Selecciona —</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
            {eventoSel && (
              <div style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: 3 }}>
                {new Date(eventoSel.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                {eventoSel.lugar && ` · ${eventoSel.lugar}`}
              </div>
            )}
            {idEvento && eventos.length === 0 && (
              <div style={{ fontSize: '.73rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiAlertCircle size={11} /> No hay eventos activos hoy
              </div>
            )}
          </div>

          {/* Vehículos asignados al movilizador actual */}
          {idEvento && misVehiculos.length > 0 && (
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 12px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiStar size={11} /> Mis vehículos asignados
              </div>
              {misVehiculos.map(v => {
                const asigCount = asignaciones.filter(a => a.id_vehiculo === v.id).length;
                const presenteCount = asignaciones.filter(a => a.id_vehiculo === v.id && a.asistio).length;
                return (
                  <button
                    key={v.id}
                    onClick={() => setIdVehiculo(String(v.id))}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4,
                      background: String(idVehiculo) === String(v.id) ? '#2563eb' : 'white',
                      color: String(idVehiculo) === String(v.id) ? 'white' : '#1a1f2e',
                      border: '1px solid #dbeafe', borderRadius: 8, cursor: 'pointer',
                      fontSize: '.82rem', fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><FiTruck size={12} style={{ display: 'inline', marginRight: 5 }} />{v.tipo}{v.placas ? ` (${v.placas})` : ''}</span>
                      <span style={{ fontSize: '.7rem', opacity: .8 }}>{presenteCount}/{asigCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selector vehículo (todos) */}
          {idEvento && (
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                <FiTruck size={12} style={{ display: 'inline', marginRight: 4 }} /> Vehículo
              </label>
              <select
                className="input-field"
                value={idVehiculo}
                onChange={e => { setIdVehiculo(e.target.value); setBusqueda(''); }}
              >
                <option value="">— Todos los vehículos —</option>
                {vehiculos.map(v => {
                  const esMio = String(v.id_movilizador) === String(user?.id);
                  const count = asignaciones.filter(a => a.id_vehiculo === v.id).length;
                  return (
                    <option key={v.id} value={v.id}>
                      {esMio ? '★ ' : ''}{v.tipo}{v.placas ? ` (${v.placas})` : ''} — {count} personas
                    </option>
                  );
                })}
              </select>
              {vehiculoSel && (
                <div style={{ fontSize: '.72rem', marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: '#9ca3af' }}>Cap: {vehiculoSel.capacidad}</span>
                  {esMovilizadorDeVehiculo && (
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>★ Eres el responsable</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {idEvento && total > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#374151', marginBottom: 10 }}>
                {idVehiculo ? 'Este vehículo' : 'Evento completo'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Total',     n: total,           color: '#6b7280' },
                  { label: 'Presentes', n: presentes,       color: '#10b981' },
                  { label: 'Faltantes', n: total-presentes, color: '#ef4444' },
                  { label: 'Asistencia', n: `${pct}%`,      color: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 6, background: '#e4e7ed', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
          )}

          {/* Actualizar */}
          {idEvento && (
            <button
              onClick={() => refetch()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: '.83rem', cursor: 'pointer' }}
            >
              <FiRefreshCw size={13} style={loadingAsig ? { animation: 'spin 1s linear infinite' } : {}} />
              Actualizar
            </button>
          )}
        </div>
      </div>

      {/* ── Panel principal ── */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {!idEvento ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: '#9ca3af' }}>
            <FiCalendar size={48} style={{ opacity: .25 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Selecciona un evento para comenzar</p>
              <div style={{ fontSize: '.85rem', color: '#9ca3af', maxWidth: 360, lineHeight: 1.6 }}>
                <strong style={{ color: '#374151' }}>Flujo:</strong><br />
                1. Selecciona el evento activo<br />
                2. Elige tu vehículo (★ = el tuyo)<br />
                3. Marca la asistencia de cada persona
              </div>
            </div>
          </div>
        ) : idEvento && total === 0 && !loadingAsig ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: '#9ca3af' }}>
            <FiUsers size={48} style={{ opacity: .25 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>No hay personas asignadas</p>
              <p style={{ fontSize: '.85rem', color: '#9ca3af', maxWidth: 340, lineHeight: 1.6 }}>
                Para que aparezcan personas aquí, el administrador o líder debe ir a <strong style={{ color: '#374151' }}>Movilización</strong>, seleccionar este evento, y asignar personas a los vehículos usando el botón <strong style={{ color: '#374151' }}>"Personas"</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Buscador */}
            <div style={{ position: 'relative', maxWidth: 440 }}>
              <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Buscar nombre, clave elector, CURP, teléfono..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Tabla */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiUsers size={15} />
                  {busqueda ? `${filtradas.length} resultados` : `${total} personas${idVehiculo ? ` en ${vehiculoSel?.tipo || 'vehículo'}` : ' en el evento'}`}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.78rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{presentes} presentes</span>
                  <span style={{ color: '#9ca3af' }}>·</span>
                  <span style={{ color: '#9ca3af' }}>{total - presentes} pendientes</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f0f0f5' }}>
                      {['Estado', 'Persona', 'Clave Elector', 'Teléfono', 'Vehículo', 'Hora check-in', 'Acción'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAsig && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Cargando...</td></tr>
                    )}
                    {!loadingAsig && filtradas.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                        {busqueda ? 'Sin coincidencias con la búsqueda' : 'Sin personas'}
                      </td></tr>
                    )}
                    {filtradas.map(asig => {
                      const p = asig.persona || {};
                      const isLoading = loadingId === asig.id;
                      const v = vehiculos.find(x => x.id === asig.id_vehiculo);
                      return (
                        <tr key={asig.id} style={{ borderBottom: '1px solid #f8fafc', background: asig.asistio ? '#f0fdf4' : 'white' }}>

                          <td style={{ padding: '10px 14px' }}>
                            {asig.asistio ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.78rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>
                                <FiCheck size={11} /> Presente
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.78rem', fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20 }}>
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{p.nombre || 'Sin nombre'}</div>
                            {p.lider_responsable?.nombre && (
                              <div style={{ fontSize: '.73rem', color: '#9ca3af' }}>Líder: {p.lider_responsable.nombre}</div>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px', color: '#6b7280', fontFamily: 'monospace', fontSize: '.8rem' }}>
                            {p.clave_elector || '—'}
                          </td>

                          <td style={{ padding: '10px 14px', color: '#6b7280' }}>{p.telefono || '—'}</td>

                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {v ? (
                              <span style={{
                                fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                background: String(v.id_movilizador) === String(user?.id) ? '#eff6ff' : '#f3f4f6',
                                color: String(v.id_movilizador) === String(user?.id) ? '#2563eb' : '#6b7280',
                              }}>
                                {String(v.id_movilizador) === String(user?.id) ? '★ ' : ''}{v.tipo}{v.placas ? ` (${v.placas})` : ''}
                              </span>
                            ) : '—'}
                          </td>

                          <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {asig.hora_checkin
                              ? new Date(asig.hora_checkin).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            {!asig.asistio && (
                              <button
                                disabled={isLoading}
                                onClick={() => handleCheckin(asig)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '7px 14px', border: 'none', borderRadius: 8,
                                  background: isLoading ? '#d1d5db' : '#10b981',
                                  color: 'white', fontWeight: 700, fontSize: '.8rem',
                                  cursor: isLoading ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <FiCheck size={12} />
                                {isLoading ? 'Marcando...' : 'Marcar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default Checkin;
