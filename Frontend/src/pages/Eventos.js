import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

// Utilidad para mostrar errores legibles
function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || 'Error desconocido';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || JSON.stringify(e)).join(' | ');
  }
  if (typeof detail === 'object') return JSON.stringify(detail);
  return String(detail);
}

const Eventos = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAsistenciasModal, setShowAsistenciasModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    lugar: '',
    tipo: 'mitin',
    seccion_electoral: '',
    colonia: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Estado para el formulario de asistencia
  const [showAsistenciaForm, setShowAsistenciaForm] = useState(false);
  const [asistenciaForm, setAsistenciaForm] = useState({
    id: null, // null para nueva, o id para editar
    id_persona: null,
    asistio: false,
    movilizado: false,
    requiere_transporte: false,
    observaciones: ''
  });

  const queryClient = useQueryClient();

  // Obtener lista de eventos
  const { data: eventos, isLoading } = useQuery('eventos', async () => {
    const response = await api.get('/eventos/');
    return response.data;
  });

  // Obtener personas para asistencias
  const { data: personas } = useQuery('personas', async () => {
    const response = await api.get('/personas/');
    return response.data;
  });

  // Obtener asistencias del evento seleccionado
  const { data: asistencias } = useQuery(
    ['asistencias', selectedEvento?.id],
    async () => {
      if (!selectedEvento) return [];
      const response = await api.get(`/asistencias/buscar/?id_evento=${selectedEvento.id}`);
      return response.data;
    },
    { enabled: !!selectedEvento }
  );

  // Mutación para crear evento
  const createEventoMutation = useMutation(
    async (eventoData) => {
      const response = await api.post('/eventos/', eventoData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento creado exitosamente');
        setShowModal(false);
        resetForm();
        setFormErrors({});
      },
      onError: (error) => {
        // Manejo de errores de validación
        const detail = error?.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errors = {};
          detail.forEach(e => {
            if (e.loc && e.loc.length > 0) {
              const field = e.loc[e.loc.length - 1];
              errors[field] = e.msg;
            }
          });
          setFormErrors(errors);
        } else {
          setFormErrors({});
        }
        toast.error(getErrorMessage(error));
      }
    }
  );

  // Mutación para actualizar evento
  const updateEventoMutation = useMutation(
    async ({ id, eventoData }) => {
      const response = await api.put(`/eventos/${id}`, eventoData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento actualizado exitosamente');
        setShowModal(false);
        setEditingEvento(null);
        resetForm();
        setFormErrors({});
      },
      onError: (error) => {
        // Manejo de errores de validación
        const detail = error?.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errors = {};
          detail.forEach(e => {
            if (e.loc && e.loc.length > 0) {
              const field = e.loc[e.loc.length - 1];
              errors[field] = e.msg;
            }
          });
          setFormErrors(errors);
        } else {
          setFormErrors({});
        }
        toast.error(getErrorMessage(error));
      }
    }
  );

  // Mutación para desactivar evento
  const deactivateEventoMutation = useMutation(
    async (eventoId) => {
      const response = await api.delete(`/eventos/${eventoId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('eventos');
        toast.success('Evento desactivado exitosamente');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      }
    }
  );

  // Mutación para registrar asistencia
  const createAsistenciaMutation = useMutation(
    async (asistenciaData) => {
      const response = await api.post('/asistencias/', asistenciaData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['asistencias', selectedEvento?.id]);
        toast.success('Asistencia registrada exitosamente');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      }
    }
  );

  // Mutación para actualizar asistencia
  const updateAsistenciaMutation = useMutation(
    async ({ id, asistenciaData }) => {
      const response = await api.put(`/asistencias/${id}`, asistenciaData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['asistencias', selectedEvento?.id]);
        toast.success('Asistencia actualizada exitosamente');
        setShowAsistenciaForm(false);
        setAsistenciaForm({ id: null, id_persona: null, asistio: false, movilizado: false, requiere_transporte: false, observaciones: '' });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      }
    }
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      lugar: '',
      tipo: 'mitin',
      seccion_electoral: '',
      colonia: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventoData = { ...formData, id_lider_organizador: user.id };
    if (editingEvento) {
      updateEventoMutation.mutate({ id: editingEvento.id, eventoData });
    } else {
      createEventoMutation.mutate(eventoData);
    }
  };

  const handleEdit = (evento) => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || '',
      fecha: evento.fecha ? format(new Date(evento.fecha), 'yyyy-MM-dd\'T\'HH:mm') : '',
      lugar: evento.lugar || '',
      tipo: evento.tipo,
      seccion_electoral: evento.seccion_electoral || '',
      colonia: evento.colonia || ''
    });
    setShowModal(true);
  };

  const handleDeactivate = (eventoId) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar este evento?')) {
      deactivateEventoMutation.mutate(eventoId);
    }
  };

  const handleAsistencias = (evento) => {
    setSelectedEvento(evento);
    setShowAsistenciasModal(true);
  };

  // Abrir formulario para registrar nueva asistencia
  const handleRegistrarAsistencia = (personaId) => {
    setAsistenciaForm({
      id: null,
      id_persona: personaId,
      asistio: false,
      movilizado: false,
      requiere_transporte: false,
      observaciones: ''
    });
    setShowAsistenciaForm(true);
  };

  // Abrir formulario para editar asistencia existente
  const handleEditarAsistencia = (asistencia) => {
    setAsistenciaForm({
      id: asistencia.id,
      id_persona: asistencia.id_persona,
      asistio: asistencia.asistio,
      movilizado: asistencia.movilizado,
      requiere_transporte: asistencia.requiere_transporte,
      observaciones: asistencia.observaciones || ''
    });
    setShowAsistenciaForm(true);
  };

  // Guardar (crear o actualizar) asistencia
  const handleGuardarAsistencia = (e) => {
    e.preventDefault();
    if (!selectedEvento) return;
    const data = {
      id_evento: selectedEvento.id,
      id_persona: asistenciaForm.id_persona,
      asistio: asistenciaForm.asistio,
      movilizado: asistenciaForm.movilizado,
      requiere_transporte: asistenciaForm.requiere_transporte,
      observaciones: asistenciaForm.observaciones
    };
    if (asistenciaForm.id) {
      // Editar existente
      updateAsistenciaMutation.mutate({ id: asistenciaForm.id, asistenciaData: data });
    } else {
      // Nueva
      createAsistenciaMutation.mutate(data, {
        onSuccess: () => {
          setShowAsistenciaForm(false);
          setAsistenciaForm({ id: null, id_persona: null, asistio: false, movilizado: false, requiere_transporte: false, observaciones: '' });
        }
      });
    }
  };

  const getTipoLabel = (tipo) => {
    const tipoLabels = {
      'mitin': 'Mitin',
      'eleccion': 'Elección',
      'reunion': 'Reunión',
      'movilizacion': 'Movilización',
      'otro': 'Otro'
    };
    return tipoLabels[tipo] || tipo;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'mitin': 'bg-red-100 text-red-800',
      'eleccion': 'bg-blue-100 text-blue-800',
      'reunion': 'bg-green-100 text-green-800',
      'movilizacion': 'bg-purple-100 text-purple-800',
      'otro': 'bg-gray-100 text-gray-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Gestión de Eventos</h1>
          <p className="text-secondary-600">Crea y administra eventos políticos</p>
        </div>
        <button
          onClick={() => {
            setEditingEvento(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          Nuevo Evento
        </button>
      </div>

      {/* Tabla de eventos */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Fecha y Lugar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {eventos?.map((evento) => (
                <tr key={evento.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <FiCalendar className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {evento.nombre}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {evento.descripcion || 'Sin descripción'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      <div className="flex items-center">
                        <FiClock className="h-4 w-4 text-secondary-400 mr-1" />
                        {format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                    <div className="text-sm text-secondary-500">
                      {evento.lugar && (
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 text-secondary-400 mr-1" />
                          {evento.lugar}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(evento.tipo)}`}>
                      {getTipoLabel(evento.tipo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      evento.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {evento.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAsistencias(evento)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Gestionar Asistencias"
                      >
                        <FiUsers className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(evento)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      {evento.activo && (
                        <button
                          onClick={() => handleDeactivate(evento.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingEvento ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Nombre del Evento *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="input-field"
                  required
                />
                {formErrors.nombre && <div className="text-xs text-red-600 mt-1">{formErrors.nombre}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="input-field"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="input-field"
                    required
                  />
                  {formErrors.fecha && <div className="text-xs text-red-600 mt-1">{formErrors.fecha}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Tipo de Evento *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="mitin">Mitin</option>
                    <option value="eleccion">Elección</option>
                    <option value="reunion">Reunión</option>
                    <option value="movilizacion">Movilización</option>
                    <option value="otro">Otro</option>
                  </select>
                  {formErrors.tipo && <div className="text-xs text-red-600 mt-1">{formErrors.tipo}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Lugar</label>
                <input
                  type="text"
                  value={formData.lugar}
                  onChange={(e) => setFormData({...formData, lugar: e.target.value})}
                  className="input-field"
                />
                {formErrors.lugar && <div className="text-xs text-red-600 mt-1">{formErrors.lugar}</div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sección Electoral</label>
                  <input
                    type="text"
                    value={formData.seccion_electoral}
                    onChange={(e) => setFormData({...formData, seccion_electoral: e.target.value})}
                    className="input-field"
                  />
                  {formErrors.seccion_electoral && <div className="text-xs text-red-600 mt-1">{formErrors.seccion_electoral}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Colonia</label>
                  <input
                    type="text"
                    value={formData.colonia}
                    onChange={(e) => setFormData({...formData, colonia: e.target.value})}
                    className="input-field"
                  />
                  {formErrors.colonia && <div className="text-xs text-red-600 mt-1">{formErrors.colonia}</div>}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createEventoMutation.isLoading || updateEventoMutation.isLoading}
                  className="btn-primary"
                >
                  {createEventoMutation.isLoading || updateEventoMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gestionar asistencias */}
      {showAsistenciasModal && selectedEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Asistencias - {selectedEvento.nombre}
              </h2>
              <button
                onClick={() => setShowAsistenciasModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de asistencias registradas */}
              <div>
                <h3 className="text-md font-semibold text-secondary-900 mb-3">
                  Asistencias Registradas ({asistencias?.length || 0})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {asistencias?.map((asistencia) => {
                    const persona = personas?.find(p => p.id === asistencia.id_persona);
                    return persona ? (
                      <div key={asistencia.id} className="p-3 border border-secondary-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-secondary-900">{persona.nombre}</p>
                            <p className="text-sm text-secondary-500">{persona.telefono}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${asistencia.asistio ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {asistencia.asistio ? 'Asistió' : 'No asistió'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${asistencia.movilizado ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {asistencia.movilizado ? 'Movilizado' : 'No movilizado'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${asistencia.requiere_transporte ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                {asistencia.requiere_transporte ? 'Requiere transporte' : 'Sin transporte'}
                              </span>
                            </div>
                            {asistencia.observaciones && (
                              <p className="text-xs text-secondary-400 mt-1">Obs: {asistencia.observaciones}</p>
                            )}
                          </div>
                          <div className="text-right flex flex-col gap-2">
                            <button
                              onClick={() => handleEditarAsistencia(asistencia)}
                              className="text-primary-600 hover:text-primary-900 text-xs"
                            >
                              <FiEdit className="inline mr-1" />Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {(!asistencias || asistencias.length === 0) && (
                    <p className="text-secondary-500 text-center py-4">No hay asistencias registradas</p>
                  )}
                </div>
              </div>
              {/* Lista de personas disponibles */}
              <div>
                <h3 className="text-md font-semibold text-secondary-900 mb-3">
                  Registrar Asistencia
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {personas?.map((persona) => {
                    const yaRegistrada = asistencias?.some(a => a.id_persona === persona.id);
                    return (
                      <div key={persona.id} className="p-3 border border-secondary-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-secondary-900">{persona.nombre}</p>
                            <p className="text-sm text-secondary-500">{persona.telefono}</p>
                            {persona.seccion_electoral && (
                              <p className="text-xs text-secondary-400">Sección: {persona.seccion_electoral}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRegistrarAsistencia(persona.id)}
                            disabled={yaRegistrada || createAsistenciaMutation.isLoading}
                            className={`px-3 py-1 text-xs rounded-full ${
                              yaRegistrada 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            }`}
                          >
                            {yaRegistrada ? 'Ya registrada' : 'Registrar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Formulario para registrar/editar asistencia */}
      {showAsistenciaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{asistenciaForm.id ? 'Editar Asistencia' : 'Registrar Asistencia'}</h3>
            <form onSubmit={handleGuardarAsistencia} className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={asistenciaForm.asistio}
                    onChange={e => setAsistenciaForm({ ...asistenciaForm, asistio: e.target.checked })}
                  />
                  Asistió
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={asistenciaForm.movilizado}
                    onChange={e => setAsistenciaForm({ ...asistenciaForm, movilizado: e.target.checked })}
                  />
                  Movilizado
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={asistenciaForm.requiere_transporte}
                    onChange={e => setAsistenciaForm({ ...asistenciaForm, requiere_transporte: e.target.checked })}
                  />
                  Requiere transporte
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Observaciones</label>
                <textarea
                  value={asistenciaForm.observaciones}
                  onChange={e => setAsistenciaForm({ ...asistenciaForm, observaciones: e.target.value })}
                  className="input-field"
                  rows="2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAsistenciaForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createAsistenciaMutation.isLoading || updateAsistenciaMutation.isLoading}
                >
                  {asistenciaForm.id ? (updateAsistenciaMutation.isLoading ? 'Guardando...' : 'Guardar cambios') : (createAsistenciaMutation.isLoading ? 'Registrando...' : 'Registrar')}
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