import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  FiDollarSign, FiUsers, FiCheckCircle, FiClock, FiSettings,
  FiChevronDown, FiChevronUp, FiX, FiCheck, FiRefreshCw,
} from 'react-icons/fi';
import api from '../api';

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function AdminIncentivos() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);       // id_usuario expandido
  const [modalCorte, setModalCorte] = useState(null);   // { id_usuario, nombre }
  const [modalPago, setModalPago] = useState(null);     // { corte_id }
  const [modalConfig, setModalConfig] = useState(false);
  const [notasCorte, setNotasCorte] = useState('');
  const [notasPago, setNotasPago] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [detalleCorte, setDetalleCorte] = useState(null); // { corte, personas }

  const { data: config } = useQuery('incentivo-config', () =>
    api.get('/incentivos/configuracion').then(r => r.data), { staleTime: 60000 });

  const { data: resumen = [], isLoading, refetch } = useQuery('incentivo-resumen', () =>
    api.get('/incentivos/resumen').then(r => r.data), { staleTime: 30000 });

  const { data: cortes = [], refetch: refetchCortes } = useQuery(
    ['incentivo-cortes', expanded],
    () => api.get(`/incentivos/cortes/${expanded}`).then(r => r.data),
    { enabled: !!expanded, staleTime: 0 }
  );

  const mutConfig = useMutation(
    ({ monto, desc }) => api.post(`/incentivos/configuracion?monto_por_persona=${monto}&descripcion=${encodeURIComponent(desc || '')}`),
    {
      onSuccess: () => { qc.invalidateQueries('incentivo-config'); setModalConfig(false); },
    }
  );

  const mutCorte = useMutation(
    ({ id_usuario, notas }) => api.post(`/incentivos/cortes/${id_usuario}?notas=${encodeURIComponent(notas || '')}`),
    {
      onSuccess: () => {
        qc.invalidateQueries('incentivo-resumen');
        refetchCortes();
        setModalCorte(null);
        setNotasCorte('');
      },
    }
  );

  const mutPagar = useMutation(
    ({ corte_id, notas }) => api.put(`/incentivos/cortes/${corte_id}/pagar?notas=${encodeURIComponent(notas || '')}`),
    {
      onSuccess: () => {
        refetchCortes();
        qc.invalidateQueries('incentivo-resumen');
        setModalPago(null);
        setNotasPago('');
      },
    }
  );

  const abrirDetalle = async (corte_id) => {
    const { data } = await api.get(`/incentivos/cortes/${corte_id}/detalle`);
    setDetalleCorte(data);
  };

  const totalGeneral = resumen.reduce((s, r) => s + (r.deuda_actual + r.total_por_pagar), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Incentivos</h1>
          <p className="text-gray-500 text-sm mt-1">Control de pagos por registros de personas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">
            <FiRefreshCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => { setNuevoMonto(config?.monto_por_persona || ''); setNuevaDesc(config?.descripcion || ''); setModalConfig(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <FiSettings size={14} /> Configurar Monto
          </button>
        </div>
      </div>

      {/* Banner config actual */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: 14, padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#93c5fd', marginBottom: 4 }}>Monto actual por persona registrada</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>{fmt(config?.monto_por_persona)}</div>
          {config?.descripcion && <div style={{ fontSize: '.82rem', color: '#bfdbfe', marginTop: 6 }}>{config.descripcion}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.75rem', color: '#93c5fd', marginBottom: 4 }}>Total adeudado (global)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24' }}>{fmt(totalGeneral)}</div>
        </div>
      </div>

      {/* Tabla de registradores */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-blue-600" /></div>
      ) : resumen.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No hay registradores con personas asignadas</div>
      ) : (
        <div className="space-y-3">
          {resumen.map((r) => (
            <div key={r.id_usuario} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              {/* Fila principal */}
              <div
                onClick={() => setExpanded(expanded === r.id_usuario ? null : r.id_usuario)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
              >
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {r.nombre.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{r.nombre}</div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{r.username} · {r.rol.replace(/_/g, ' ')}</div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '.82rem' }}>
                  <Stat icon={<FiUsers size={13} />} label="Total" val={r.total_personas} color="#2563eb" />
                  <Stat icon={<FiClock size={13} />} label="Sin corte" val={r.pendientes_sin_corte} color="#f59e0b" />
                  <Stat icon={<FiCheckCircle size={13} />} label="Pagado" val={fmt(r.total_pagado)} color="#10b981" />
                  <Stat icon={<FiDollarSign size={13} />} label="Por pagar" val={fmt(r.total_por_pagar + r.deuda_actual)} color="#ef4444" />
                </div>

                {/* Acción rápida */}
                <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                  {r.pendientes_sin_corte > 0 && (
                    <button
                      onClick={() => { setModalCorte({ id_usuario: r.id_usuario, nombre: r.nombre, pendientes: r.pendientes_sin_corte, monto: r.monto_por_persona }); }}
                      style={{ padding: '6px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Generar corte
                    </button>
                  )}
                  {expanded === r.id_usuario ? <FiChevronUp color="#9ca3af" /> : <FiChevronDown color="#9ca3af" />}
                </div>
              </div>

              {/* Historial de cortes expandido */}
              {expanded === r.id_usuario && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 20px 16px', background: '#fafafa' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Historial de cortes</div>
                  {cortes.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '.82rem' }}>Sin cortes generados aún</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cortes.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#111827' }}>
                              Corte #{c.id} — {new Date(c.fecha_corte).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 2 }}>
                              {c.total_personas} personas · {fmt(c.monto_por_persona)}/persona
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: c.pagado ? '#10b981' : '#ef4444' }}>
                            {fmt(c.monto_total)}
                          </div>
                          <span style={{
                            fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: c.pagado ? '#dcfce7' : '#fef3c7',
                            color: c.pagado ? '#16a34a' : '#b45309',
                          }}>
                            {c.pagado ? `Pagado ${new Date(c.fecha_pago).toLocaleDateString('es-MX')}` : 'Pendiente'}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => abrirDetalle(c.id)} style={{ fontSize: '.75rem', padding: '4px 10px', background: '#f3f4f6', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                              Ver detalle
                            </button>
                            {!c.pagado && (
                              <button
                                onClick={() => setModalPago({ corte_id: c.id, monto: c.monto_total, nombre: r.nombre })}
                                style={{ fontSize: '.75rem', padding: '4px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700 }}
                              >
                                Marcar pagado
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Configurar monto */}
      {modalConfig && (
        <Modal titulo="Configurar monto por persona" onClose={() => setModalConfig(false)}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Monto por persona registrada ($)</span>
              <input
                type="number" min="0" step="0.01"
                value={nuevoMonto}
                onChange={e => setNuevoMonto(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. 50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Descripción (opcional)</span>
              <input
                type="text"
                value={nuevaDesc}
                onChange={e => setNuevaDesc(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Incentivo campaña 2026"
              />
            </label>
            <button
              onClick={() => mutConfig.mutate({ monto: nuevoMonto, desc: nuevaDesc })}
              disabled={!nuevoMonto || mutConfig.isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutConfig.isLoading ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Generar corte */}
      {modalCorte && (
        <Modal titulo={`Generar corte — ${modalCorte.nombre}`} onClose={() => setModalCorte(null)}>
          <div className="space-y-4">
            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #bae6fd' }}>
              <div className="text-sm text-gray-600">Personas pendientes de pago</div>
              <div className="text-3xl font-bold text-blue-700 mt-1">{modalCorte.pendientes}</div>
              <div className="text-sm text-gray-500 mt-1">× {fmt(modalCorte.monto)} = <span className="font-bold text-gray-800">{fmt(modalCorte.pendientes * modalCorte.monto)}</span></div>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notas (opcional)</span>
              <textarea
                value={notasCorte}
                onChange={e => setNotasCorte(e.target.value)}
                rows={2}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Semana del 14 al 20 de abril…"
              />
            </label>
            <button
              onClick={() => mutCorte.mutate({ id_usuario: modalCorte.id_usuario, notas: notasCorte })}
              disabled={mutCorte.isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutCorte.isLoading ? 'Generando…' : 'Generar corte'}
            </button>
            {mutCorte.isError && <p className="text-red-500 text-sm">{mutCorte.error?.response?.data?.detail}</p>}
          </div>
        </Modal>
      )}

      {/* Modal: Marcar pagado */}
      {modalPago && (
        <Modal titulo="Registrar pago" onClose={() => setModalPago(null)}>
          <div className="space-y-4">
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #86efac' }}>
              <div className="text-sm text-gray-600">Monto a pagar a <strong>{modalPago.nombre}</strong></div>
              <div className="text-3xl font-bold text-green-700 mt-1">{fmt(modalPago.monto)}</div>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notas de pago (opcional)</span>
              <textarea
                value={notasPago}
                onChange={e => setNotasPago(e.target.value)}
                rows={2}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <button
              onClick={() => mutPagar.mutate({ corte_id: modalPago.corte_id, notas: notasPago })}
              disabled={mutPagar.isLoading}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {mutPagar.isLoading ? 'Registrando…' : 'Confirmar pago'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Detalle de corte */}
      {detalleCorte && (
        <Modal titulo={`Detalle Corte #${detalleCorte.corte.id}`} onClose={() => setDetalleCorte(null)} wide>
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap text-sm">
              <div><span className="text-gray-500">Personas:</span> <strong>{detalleCorte.corte.total_personas}</strong></div>
              <div><span className="text-gray-500">Monto:</span> <strong>{fmt(detalleCorte.corte.monto_total)}</strong></div>
              <div><span className="text-gray-500">Estado:</span>{' '}
                <span className={detalleCorte.corte.pagado ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>
                  {detalleCorte.corte.pagado ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                  <tr>
                    {['#', 'Nombre', 'Sección', 'Municipio', 'Fecha registro'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalleCorte.personas.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '7px 12px', color: '#9ca3af' }}>{i + 1}</td>
                      <td style={{ padding: '7px 12px', fontWeight: 500 }}>{p.nombre}</td>
                      <td style={{ padding: '7px 12px' }}>{p.seccion_electoral || '—'}</td>
                      <td style={{ padding: '7px 12px' }}>{p.municipio || '—'}</td>
                      <td style={{ padding: '7px 12px', color: '#6b7280' }}>{p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-MX') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ icon, label, val, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, justifyContent: 'center', marginBottom: 2 }}>
        {icon} <span style={{ fontWeight: 700 }}>{val}</span>
      </div>
      <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>{label}</div>
    </div>
  );
}

function Modal({ titulo, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '100%', maxWidth: wide ? 700 : 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0 }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><FiX size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
