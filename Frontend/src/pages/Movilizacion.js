import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api';
import { FiPlus, FiUsers, FiEdit, FiTrash2, FiX, FiTruck, FiCheck } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

const FORM_VEHICULO_EMPTY = { tipo: '', capacidad: '', placas: '', descripcion: '', id_movilizador: '' };

const Movilizacion = () => {
  const qc = useQueryClient();
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [vehiculoEdit, setVehiculoEdit] = useState(null);
  const [vehiculoForm, setVehiculoForm] = useState(FORM_VEHICULO_EMPTY);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [vehiculoSel, setVehiculoSel] = useState(null);
  const [personasSel, setPersonasSel] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');

  /* ── Queries ── */
  const { data: eventos = [] } = useQuery('eventos', () => api.get('/eventos/').then(r => r.data));
  // Personas del padrón (para asignar a vehículos)
  const { data: personas = [] } = useQuery('personas', () => api.get('/personas/').then(r => r.data));
  // Usuarios del sistema (para elegir responsable del vehículo)
  const { data: usuarios = [] } = useQuery('usuariosActivos', () =>
    api.get('/users/?activo=true').then(r => r.data)
  );
  const { data: vehiculos = [] } = useQuery(
    ['vehiculos', selectedEvento?.id],
    () => api.get('/vehiculos/').then(r => r.data),
    { enabled: !!selectedEvento }
  );
  const { data: asignaciones = [] } = useQuery(
    ['asignaciones', selectedEvento?.id],
    () => api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`).then(r => r.data),
    { enabled: !!selectedEvento }
  );

  /* ── Mutaciones vehículo ── */
  const saveVehiculo = useMutation(
    (form) => vehiculoEdit
      ? api.put(`/vehiculos/${vehiculoEdit.id}`, form).then(r => r.data)
      : api.post('/vehiculos/', form).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['vehiculos', selectedEvento?.id]);
        toast.success(vehiculoEdit ? 'Vehículo actualizado' : 'Vehículo creado');
        setShowVehiculoModal(false);
        setVehiculoEdit(null);
        setVehiculoForm(FORM_VEHICULO_EMPTY);
      },
      onError: err => toast.error(err?.response?.data?.detail || 'Error al guardar'),
    }
  );

  const deleteVehiculo = useMutation(
    id => api.delete(`/vehiculos/${id}`).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['vehiculos', selectedEvento?.id]);
        toast.success('Vehículo eliminado');
      },
      onError: err => toast.error(err?.response?.data?.detail || 'Error al eliminar'),
    }
  );

  /* ── Mutación asignación masiva ── */
  const asignarMasivo = useMutation(
    body => api.post('/movilizaciones/masivo', body).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['asignaciones', selectedEvento?.id]);
        toast.success('Personas asignadas correctamente');
        setPersonasSel([]);
      },
      onError: err => toast.error(err?.response?.data?.detail || 'Error al asignar'),
    }
  );

  const quitarPersona = useMutation(
    id => api.delete(`/movilizaciones/${id}`).then(r => r.data),
    {
      onSuccess: () => qc.invalidateQueries(['asignaciones', selectedEvento?.id]),
      onError: err => toast.error(err?.response?.data?.detail || 'Error'),
    }
  );

  /* ── Helpers ── */
  const ocupacion = (vid) => asignaciones.filter(a => a.id_vehiculo === vid).length;
  const asigsPorVehiculo = (vid) => asignaciones.filter(a => a.id_vehiculo === vid);
  const asignadasIds = asignaciones.map(a => a.id_persona);
  const personasDisponibles = vehiculoSel
    ? personas.filter(p => !asignadasIds.includes(p.id))
    : [];
  const personasFiltradas = personasDisponibles.filter(p =>
    (!filtroNombre  || (p.nombre || '').toLowerCase().includes(filtroNombre.toLowerCase())) &&
    (!filtroSeccion || (p.seccion_electoral || '').includes(filtroSeccion))
  );
  const getNombreUsuario = id => {
    const u = usuarios.find(x => x.id === id);
    return u ? u.nombre : `ID ${id}`;
  };

  const openVehiculoModal = (v = null) => {
    setVehiculoEdit(v);
    setVehiculoForm(v ? {
      tipo: v.tipo, capacidad: v.capacidad, placas: v.placas || '',
      descripcion: v.descripcion || '', id_movilizador: v.id_movilizador,
    } : FORM_VEHICULO_EMPTY);
    setShowVehiculoModal(true);
  };

  const openAsignar = (v) => {
    setVehiculoSel(v);
    setPersonasSel([]);
    setFiltroNombre('');
    setFiltroSeccion('');
    setShowAsignarModal(true);
  };

  const togglePersona = (id) => {
    setPersonasSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const capacidadDisponible = vehiculoSel
    ? vehiculoSel.capacidad - ocupacion(vehiculoSel.id)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Movilización</h1>
        <p className="text-secondary-600">Gestiona vehículos y asignación de personas por evento</p>
      </div>

      {/* Selector de evento */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f5', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Selecciona un evento</label>
        <select
          className="input-field"
          style={{ maxWidth: 420 }}
          value={selectedEvento?.id || ''}
          onChange={e => {
            const ev = eventos.find(x => x.id === parseInt(e.target.value));
            setSelectedEvento(ev || null);
          }}
        >
          <option value="">— Selecciona un evento —</option>
          {eventos.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} · {new Date(ev.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {/* Contenido cuando hay evento seleccionado */}
      {selectedEvento && (
        <>
          {/* Stats rápidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Vehículos', n: vehiculos.length, color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Asignados', n: asignaciones.length, color: '#10b981', bg: '#ecfdf5' },
              { label: 'Disponibles', n: personas.length - asignaciones.length, color: '#8b5cf6', bg: '#f5f3ff' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiTruck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '.74rem', color: '#8b93a5', fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.1 }}>{s.n}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de vehículos */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f5', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>Vehículos del evento</h2>
              <button
                onClick={() => openVehiculoModal()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: '.85rem', cursor: 'pointer' }}
              >
                <FiPlus size={14} /> Agregar vehículo
              </button>
            </div>

            {vehiculos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <FiTruck size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: .4 }} />
                No hay vehículos. Agrega el primero.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vehiculos.map(v => {
                  const ocup = ocupacion(v.id);
                  const pct  = Math.round((ocup / v.capacidad) * 100);
                  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={v.id} style={{ border: '1px solid #e4e7ed', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Icon */}
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiTruck size={18} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>{v.tipo}</span>
                            {v.placas && <span style={{ fontSize: '.75rem', color: '#6b7280', background: '#f3f4f6', padding: '1px 8px', borderRadius: 20 }}>{v.placas}</span>}
                          </div>
                          <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: 6 }}>
                            Responsable: <strong>{getNombreUsuario(v.id_movilizador)}</strong>
                            {v.descripcion && <span> · {v.descripcion}</span>}
                          </div>
                          {/* Barra capacidad */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f0f0f5', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width .3s' }} />
                            </div>
                            <span style={{ fontSize: '.75rem', fontWeight: 700, color: barColor, minWidth: 56 }}>
                              {ocup}/{v.capacidad}
                            </span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => openAsignar(v)}
                            title="Ver / Asignar personas"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '.8rem', cursor: 'pointer' }}
                          >
                            <FiUsers size={14} /> Personas
                          </button>
                          <button
                            onClick={() => openVehiculoModal(v)}
                            title="Editar"
                            style={{ width: 34, height: 34, background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => { if (window.confirm('¿Eliminar este vehículo?')) deleteVehiculo.mutate(v.id); }}
                            title="Eliminar"
                            style={{ width: 34, height: 34, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal vehículo */}
      {showVehiculoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>{vehiculoEdit ? 'Editar vehículo' : 'Nuevo vehículo'}</h3>
              <button onClick={() => setShowVehiculoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><FiX size={18} /></button>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveVehiculo.mutate({ ...vehiculoForm, id_movilizador: parseInt(vehiculoForm.id_movilizador), capacidad: parseInt(vehiculoForm.capacidad) }); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tipo de vehículo *</label>
                <input type="text" className="input-field" value={vehiculoForm.tipo} onChange={e => setVehiculoForm(f => ({ ...f, tipo: e.target.value }))} required placeholder="Ej: Autobús, Camioneta, Auto" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Capacidad *</label>
                  <input type="number" min={1} className="input-field" value={vehiculoForm.capacidad} onChange={e => setVehiculoForm(f => ({ ...f, capacidad: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Placas</label>
                  <input type="text" className="input-field" value={vehiculoForm.placas} onChange={e => setVehiculoForm(f => ({ ...f, placas: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Responsable *</label>
                <select
                  className="input-field"
                  value={vehiculoForm.id_movilizador}
                  onChange={e => setVehiculoForm(f => ({ ...f, id_movilizador: e.target.value }))}
                  required
                >
                  <option value="">— Selecciona responsable —</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.rol?.replace(/_/g, ' ')})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Descripción</label>
                <textarea className="input-field" rows={2} value={vehiculoForm.descripcion} onChange={e => setVehiculoForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
                <button type="button" onClick={() => setShowVehiculoModal(false)} style={{ flex: 1, padding: 10, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saveVehiculo.isLoading} style={{ flex: 1, padding: 10, background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>
                  {saveVehiculo.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal asignar personas */}
      {showAsignarModal && vehiculoSel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f0f0f5' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>
                  {vehiculoSel.tipo} {vehiculoSel.placas && `(${vehiculoSel.placas})`}
                </div>
                <div style={{ fontSize: '.8rem', color: '#6b7280', marginTop: 2 }}>
                  Capacidad: {ocupacion(vehiculoSel.id)}/{vehiculoSel.capacidad} · Disponible: {capacidadDisponible}
                </div>
              </div>
              <button onClick={() => setShowAsignarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><FiX size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>

              {/* Columna izquierda: asignados */}
              <div style={{ borderRight: '1px solid #f0f0f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f5', fontWeight: 700, fontSize: '.88rem', color: '#374151' }}>
                  Asignados ({ocupacion(vehiculoSel.id)})
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                  {asigsPorVehiculo(vehiculoSel.id).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24, fontSize: '.85rem' }}>Sin asignados aún</div>
                  ) : (
                    asigsPorVehiculo(vehiculoSel.id).map(asig => {
                      const p = personas.find(x => x.id === asig.id_persona);
                      return p ? (
                        <div key={asig.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderBottom: '1px solid #f8fafc' }}>
                          {/* Mini QR */}
                          <QRCodeCanvas
                            value={JSON.stringify({ evento_id: selectedEvento.id, persona_id: p.id, asignacion_id: asig.id })}
                            size={40}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                            <div style={{ fontSize: '.73rem', color: '#9ca3af' }}>{p.telefono || ''}</div>
                          </div>
                          <button
                            onClick={() => { if (window.confirm('¿Quitar a esta persona?')) quitarPersona.mutate(asig.id); }}
                            style={{ width: 28, height: 28, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <FiX size={13} />
                          </button>
                        </div>
                      ) : null;
                    })
                  )}
                </div>
              </div>

              {/* Columna derecha: disponibles */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f5' }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#374151', marginBottom: 8 }}>
                    Disponibles ({personasFiltradas.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Buscar nombre..."
                      value={filtroNombre}
                      onChange={e => setFiltroNombre(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '.8rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Sección"
                      value={filtroSeccion}
                      onChange={e => setFiltroSeccion(e.target.value)}
                      className="input-field"
                      style={{ width: 90, padding: '6px 10px', fontSize: '.8rem' }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                  {personasFiltradas.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24, fontSize: '.85rem' }}>No hay personas disponibles</div>
                  ) : (
                    personasFiltradas.map(p => {
                      const sel = personasSel.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePersona(p.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
                            borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                            background: sel ? '#eff6ff' : 'transparent',
                            borderRadius: sel ? 8 : 0,
                            transition: 'background .1s',
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? '#3b82f6' : '#d1d5db'}`,
                            background: sel ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {sel && <FiCheck size={12} color="white" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                            <div style={{ fontSize: '.73rem', color: '#9ca3af' }}>
                              {[p.telefono, p.seccion_electoral && `Secc. ${p.seccion_electoral}`, p.colonia].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botón asignar */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f5' }}>
                  <button
                    disabled={personasSel.length === 0 || personasSel.length > capacidadDisponible || asignarMasivo.isLoading}
                    onClick={() => asignarMasivo.mutate({ id_evento: selectedEvento.id, id_vehiculo: vehiculoSel.id, ids_persona: personasSel })}
                    style={{
                      width: '100%', padding: '10px', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
                      background: personasSel.length === 0 || personasSel.length > capacidadDisponible ? '#d1d5db' : '#2563eb',
                      color: personasSel.length === 0 || personasSel.length > capacidadDisponible ? '#9ca3af' : 'white',
                    }}
                  >
                    {asignarMasivo.isLoading ? 'Asignando...' : `Asignar ${personasSel.length > 0 ? `(${personasSel.length})` : ''} seleccionados`}
                  </button>
                  {personasSel.length > capacidadDisponible && (
                    <div style={{ fontSize: '.75rem', color: '#ef4444', textAlign: 'center', marginTop: 4 }}>
                      Seleccionaste más personas que la capacidad disponible ({capacidadDisponible})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movilizacion;
