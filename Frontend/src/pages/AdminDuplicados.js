import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiSearch,
  FiUser, FiActivity,
} from 'react-icons/fi';
import api from '../api';

const TIPO_LABEL = {
  clave_elector: { label: 'Clave Elector', color: '#dc2626', bg: '#fee2e2' },
  curp: { label: 'CURP', color: '#dc2626', bg: '#fee2e2' },
  nombre_seccion: { label: 'Nombre + Sección', color: '#d97706', bg: '#fef3c7' },
  nombre_municipio_colonia: { label: 'Nombre + Colonia', color: '#d97706', bg: '#fef3c7' },
};

export default function AdminDuplicados() {
  const qc = useQueryClient();
  const [estado, setEstado] = useState('pendiente');
  const [modalDup, setModalDup] = useState(null);  // item del duplicado
  const [ganadora, setGanadora] = useState(null);  // id de persona a conservar
  const [notas, setNotas] = useState('');

  const { data: stats } = useQuery('dup-stats', () =>
    api.get('/duplicados/stats').then(r => r.data), { staleTime: 30000 });

  const { data, isLoading, refetch } = useQuery(
    ['duplicados', estado],
    () => api.get(`/duplicados/?estado=${estado}&limit=100`).then(r => r.data),
    { staleTime: 0 }
  );

  const mutEscanear = useMutation(
    () => api.post('/duplicados/escanear'),
    { onSuccess: () => { qc.invalidateQueries('duplicados'); qc.invalidateQueries('dup-stats'); } }
  );

  const mutResolver = useMutation(
    ({ id, decision, id_persona_ganadora, notas }) =>
      api.put(`/duplicados/${id}/resolver?decision=${decision}${id_persona_ganadora ? `&id_persona_ganadora=${id_persona_ganadora}` : ''}${notas ? `&notas=${encodeURIComponent(notas)}` : ''}`),
    {
      onSuccess: () => {
        qc.invalidateQueries('duplicados');
        qc.invalidateQueries('dup-stats');
        setModalDup(null);
        setGanadora(null);
        setNotas('');
      },
    }
  );

  const items = data?.items || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Duplicados</h1>
          <p className="text-gray-500 text-sm mt-1">Revisión y resolución de personas probablemente duplicadas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">
            <FiRefreshCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => mutEscanear.mutate()}
            disabled={mutEscanear.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            <FiSearch size={14} /> {mutEscanear.isLoading ? 'Escaneando…' : 'Escanear todo'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'Pendientes', val: stats?.pendientes ?? '—', color: '#d97706', bg: '#fffbeb', icon: <FiAlertTriangle /> },
          { label: 'Confirmados dup.', val: stats?.confirmados ?? '—', color: '#dc2626', bg: '#fef2f2', icon: <FiX /> },
          { label: 'Descartados', val: stats?.descartados ?? '—', color: '#16a34a', bg: '#f0fdf4', icon: <FiCheck /> },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${s.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.color, fontSize: '.8rem', fontWeight: 600, marginBottom: 6 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filtro de estado */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['pendiente', 'Pendientes'], ['mismo', 'Confirmados'], ['diferente', 'Descartados']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setEstado(val)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
              background: estado === val ? '#2563eb' : '#f3f4f6',
              color: estado === val ? 'white' : '#374151',
              border: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-blue-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {estado === 'pendiente' ? 'No hay duplicados pendientes de revisión' : 'No hay registros en este estado'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const tipo = TIPO_LABEL[item.tipo_coincidencia] || { label: item.tipo_coincidencia, color: '#6b7280', bg: '#f3f4f6' };
            return (
              <div key={item.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                {/* Header */}
                <div style={{ padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: tipo.color, background: tipo.bg, padding: '3px 10px', borderRadius: 20 }}>
                    {tipo.label}
                  </span>
                  <span style={{ fontSize: '.78rem', color: '#6b7280' }}>
                    Similitud: <strong style={{ color: '#111' }}>{item.similitud}%</strong>
                  </span>
                  <span style={{ fontSize: '.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                    Detectado: {new Date(item.fecha_deteccion).toLocaleDateString('es-MX')}
                  </span>
                </div>

                {/* Comparación */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', padding: '16px 20px', gap: 16, alignItems: 'start' }}>
                  <PersonaCard p={item.persona_1} num={1} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 24 }}>
                    <FiActivity size={18} color="#d97706" />
                  </div>
                  <PersonaCard p={item.persona_2} num={2} />
                </div>

                {/* Acciones (solo si pendiente) */}
                {item.estado === 'pendiente' && (
                  <div style={{ padding: '10px 20px 16px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => mutResolver.mutate({ id: item.id, decision: 'diferente' })}
                      style={{ padding: '7px 18px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 9, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <FiCheck style={{ display: 'inline', marginRight: 4 }} /> Son personas distintas
                    </button>
                    <button
                      onClick={() => { setModalDup(item); setGanadora(null); setNotas(''); }}
                      style={{ padding: '7px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 9, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      <FiX style={{ display: 'inline', marginRight: 4 }} /> Es duplicado — elegir cuál conservar
                    </button>
                  </div>
                )}

                {/* Estado resuelto */}
                {item.estado !== 'pendiente' && (
                  <div style={{ padding: '8px 20px 14px' }}>
                    <span style={{ fontSize: '.75rem', color: item.estado === 'mismo' ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {item.estado === 'mismo' ? 'Confirmado como duplicado' : 'Descartado — son personas diferentes'}
                    </span>
                    {item.notas && <span style={{ fontSize: '.75rem', color: '#9ca3af', marginLeft: 12 }}>"{item.notas}"</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Elegir persona a conservar */}
      {modalDup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0 }}>¿Cuál persona conservar?</h3>
              <button onClick={() => setModalDup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><FiX size={18} /></button>
            </div>
            <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 16 }}>
              La persona que <strong>NO</strong> elijas quedará desactivada del sistema. Esta acción se puede deshacer desde la base de datos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[modalDup.persona_1, modalDup.persona_2].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setGanadora(p.id)}
                  style={{
                    border: `2px solid ${ganadora === p.id ? '#2563eb' : '#e5e7eb'}`,
                    background: ganadora === p.id ? '#eff6ff' : 'white',
                    borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {ganadora === p.id && <FiCheck size={14} color="#2563eb" style={{ flexShrink: 0 }} />}
                    <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>{p.nombre}</span>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                    {p.clave_elector && <div>Elector: {p.clave_elector}</div>}
                    {p.curp && <div>CURP: {p.curp}</div>}
                    {p.seccion_electoral && <div>Sección: {p.seccion_electoral}</div>}
                    {p.municipio && <div>Municipio: {p.municipio}</div>}
                    {p.fecha_registro && <div>Registrada: {new Date(p.fecha_registro).toLocaleDateString('es-MX')}</div>}
                  </div>
                </div>
              ))}
            </div>
            <label className="block mb-4">
              <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#374151' }}>Notas (opcional)</span>
              <input
                type="text"
                value={notas}
                onChange={e => setNotas(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Motivo de la resolución…"
              />
            </label>
            <button
              onClick={() => mutResolver.mutate({ id: modalDup.id, decision: 'mismo', id_persona_ganadora: ganadora, notas })}
              disabled={!ganadora || mutResolver.isLoading}
              style={{
                width: '100%', padding: '10px', background: ganadora ? '#dc2626' : '#e5e7eb',
                color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem',
                cursor: ganadora ? 'pointer' : 'not-allowed',
              }}
            >
              {mutResolver.isLoading ? 'Procesando…' : 'Confirmar y eliminar duplicado'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaCard({ p, num }) {
  if (!p) return <div />;
  return (
    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: num === 1 ? '#dbeafe' : '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: num === 1 ? '#2563eb' : '#db2777', flexShrink: 0 }}>
          <FiUser size={13} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#111827' }}>{p.nombre}</span>
      </div>
      <div style={{ fontSize: '.75rem', color: '#6b7280', lineHeight: 1.8 }}>
        {p.clave_elector && <div><span style={{ color: '#9ca3af' }}>Elector:</span> {p.clave_elector}</div>}
        {p.curp && <div><span style={{ color: '#9ca3af' }}>CURP:</span> {p.curp}</div>}
        {p.telefono && <div><span style={{ color: '#9ca3af' }}>Tel:</span> {p.telefono}</div>}
        {p.seccion_electoral && <div><span style={{ color: '#9ca3af' }}>Sección:</span> {p.seccion_electoral}</div>}
        {p.municipio && <div><span style={{ color: '#9ca3af' }}>Municipio:</span> {p.municipio}</div>}
        {p.colonia && <div><span style={{ color: '#9ca3af' }}>Colonia:</span> {p.colonia}</div>}
        {p.edad && <div><span style={{ color: '#9ca3af' }}>Edad:</span> {p.edad} · {p.sexo}</div>}
        {p.fecha_registro && <div><span style={{ color: '#9ca3af' }}>Registrada:</span> {new Date(p.fecha_registro).toLocaleDateString('es-MX')}</div>}
      </div>
    </div>
  );
}
