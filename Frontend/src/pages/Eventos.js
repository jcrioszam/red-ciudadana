import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiClock, FiTag } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const TIPOS = {
  mitin:        { label: 'Mitin',        color: '#ef4444', bg: '#fef2f2' },
  eleccion:     { label: 'Elección',     color: '#3b82f6', bg: '#eff6ff' },
  reunion:      { label: 'Reunión',      color: '#10b981', bg: '#ecfdf5' },
  movilizacion: { label: 'Movilización', color: '#8b5cf6', bg: '#f5f3ff' },
  otro:         { label: 'Otro',         color: '#6b7280', bg: '#f3f4f6' },
};

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || 'Error desconocido';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(e => e.msg || JSON.stringify(e)).join(' | ');
  return String(detail);
}

const FORM_EMPTY = { nombre: '', descripcion: '', fecha: '', lugar: '', tipo: 'mitin', seccion_electoral: '', colonia: '' };

const Eventos = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [formData, setFormData] = useState(FORM_EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [filtro, setFiltro] = useState('todos'); // todos | activos | pasados
  const queryClient = useQueryClient();

  const { data: eventos = [], isLoading } = useQuery('eventos', async () => {
    const r = await api.get('/eventos/');
    return r.data;
  });

  const createMutation = useMutation(
    data => api.post('/eventos/', data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento creado');
        closeModal();
      },
      onError: (err) => {
        handleValidationErrors(err);
        toast.error(getErrorMessage(err));
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/eventos/${id}`, data).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento actualizado');
        closeModal();
      },
      onError: (err) => {
        handleValidationErrors(err);
        toast.error(getErrorMessage(err));
      },
    }
  );

  const deleteMutation = useMutation(
    id => api.delete(`/eventos/${id}`).then(r => r.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento desactivado');
      },
      onError: err => toast.error(getErrorMessage(err)),
    }
  );

  const handleValidationErrors = (err) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) {
      const errs = {};
      detail.forEach(e => {
        if (e.loc?.length) errs[e.loc[e.loc.length - 1]] = e.msg;
      });
      setFormErrors(errs);
    } else {
      setFormErrors({});
    }
  };

  const openCreate = () => {
    setEditingEvento(null);
    setFormData(FORM_EMPTY);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (evento) => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || '',
      fecha: evento.fecha ? format(new Date(evento.fecha), "yyyy-MM-dd'T'HH:mm") : '',
      lugar: evento.lugar || '',
      tipo: evento.tipo,
      seccion_electoral: evento.seccion_electoral || '',
      colonia: evento.colonia || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvento(null);
    setFormData(FORM_EMPTY);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, id_lider_organizador: user.id };
    if (editingEvento) {
      updateMutation.mutate({ id: editingEvento.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Desactivar este evento?')) deleteMutation.mutate(id);
  };

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const eventosFiltrados = eventos.filter(ev => {
    if (filtro === 'activos') return ev.activo && !isPast(new Date(ev.fecha));
    if (filtro === 'pasados') return !ev.activo || isPast(new Date(ev.fecha));
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const total   = eventos.length;
  const activos = eventos.filter(e => e.activo && !isPast(new Date(e.fecha))).length;
  const pasados = eventos.filter(e => !e.activo || isPast(new Date(e.fecha))).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Gestión de Eventos</h1>
          <p className="text-secondary-600">Crea y administra eventos</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center">
          <FiPlus className="mr-2" /> Nuevo Evento
        </button>
      </div>

      {/* Stats + filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'todos',   label: 'Todos',   n: total,   color: '#6b7280', bg: '#f3f4f6' },
          { key: 'activos', label: 'Próximos', n: activos, color: '#10b981', bg: '#ecfdf5' },
          { key: 'pasados', label: 'Pasados',  n: pasados, color: '#6b7280', bg: '#f3f4f6' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFiltro(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: filtro === s.key ? s.color : 'white',
              color: filtro === s.key ? 'white' : s.color,
              border: `1.5px solid ${s.color}44`,
              borderRadius: 12, padding: '10px 18px',
              fontWeight: 600, fontSize: '.88rem', cursor: 'pointer',
              boxShadow: filtro === s.key ? `0 2px 8px ${s.color}44` : '0 1px 3px rgba(0,0,0,.05)',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Lista de eventos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {eventosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', background: 'white', borderRadius: 16, border: '1px solid #f0f0f5' }}>
            No hay eventos para mostrar
          </div>
        )}
        {eventosFiltrados.map(evento => {
          const t = TIPOS[evento.tipo] || TIPOS.otro;
          const fecha = new Date(evento.fecha);
          const pasado = isPast(fecha);
          const distancia = formatDistanceToNow(fecha, { locale: es, addSuffix: true });

          return (
            <div
              key={evento.id}
              style={{
                background: 'white',
                borderRadius: 14,
                border: '1px solid #f0f0f5',
                borderLeft: `4px solid ${t.color}`,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                opacity: pasado || !evento.activo ? 0.65 : 1,
              }}
            >
              {/* Icono tipo */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: t.bg, color: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FiCalendar size={20} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1f2e' }}>{evento.nombre}</span>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700, color: t.color, background: t.bg,
                    padding: '1px 8px', borderRadius: 20,
                  }}>{t.label}</span>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700,
                    color: evento.activo && !pasado ? '#10b981' : '#9ca3af',
                    background: evento.activo && !pasado ? '#ecfdf5' : '#f3f4f6',
                    padding: '1px 8px', borderRadius: 20,
                  }}>{evento.activo && !pasado ? 'Activo' : 'Inactivo'}</span>
                </div>

                {evento.descripcion && (
                  <div style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {evento.descripcion}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '.78rem', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiClock size={12} />
                    {format(fecha, 'dd/MM/yyyy HH:mm', { locale: es })}
                    <span style={{ color: pasado ? '#9ca3af' : '#3b82f6', fontWeight: 600 }}>({distancia})</span>
                  </span>
                  {evento.lugar && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={12} /> {evento.lugar}
                    </span>
                  )}
                  {(evento.seccion_electoral || evento.colonia) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiTag size={12} />
                      {[evento.colonia, evento.seccion_electoral && `Secc. ${evento.seccion_electoral}`].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(evento)}
                  title="Editar"
                  style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FiEdit size={15} />
                </button>
                {evento.activo && (
                  <button
                    onClick={() => handleDelete(evento.id)}
                    title="Desactivar"
                    style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FiTrash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1f2e', marginBottom: 20 }}>
              {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  required
                  className="input-field"
                />
                {formErrors.nombre && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: 3 }}>{formErrors.nombre}</div>}
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  className="input-field"
                  rows={2}
                />
              </div>

              {/* Fecha + Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={e => set('fecha', e.target.value)}
                    required
                    className="input-field"
                  />
                  {formErrors.fecha && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: 3 }}>{formErrors.fecha}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tipo *</label>
                  <select value={formData.tipo} onChange={e => set('tipo', e.target.value)} className="input-field" required>
                    {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Lugar</label>
                <input type="text" value={formData.lugar} onChange={e => set('lugar', e.target.value)} className="input-field" />
              </div>

              {/* Sección + Colonia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Sección Electoral</label>
                  <input type="text" value={formData.seccion_electoral} onChange={e => set('seccion_electoral', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Colonia</label>
                  <input type="text" value={formData.colonia} onChange={e => set('colonia', e.target.value)} className="input-field" />
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontWeight: 700, cursor: 'pointer', opacity: (createMutation.isLoading || updateMutation.isLoading) ? 0.7 : 1 }}
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Eventos;
