import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiUsers, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

const Movilizacion = () => {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [vehiculoForm, setVehiculoForm] = useState({ tipo: '', capacidad: '', placas: '', descripcion: '', id_movilizador: '' });
  const [vehiculoEdit, setVehiculoEdit] = useState(null);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [asignarPersonaId, setAsignarPersonaId] = useState(null);
  const [asignarObservaciones, setAsignarObservaciones] = useState('');
  const [asignarRequiereTransporte, setAsignarRequiereTransporte] = useState(false);
  const [asignarLoading, setAsignarLoading] = useState(false);
  const [alerta, setAlerta] = useState('');
  const [filtroColonia, setFiltroColonia] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState([]);

  // Cargar eventos al iniciar
  useEffect(() => {
    api.get('/eventos/').then(res => setEventos(res.data));
  }, []);

  // Cargar personas
  useEffect(() => {
    api.get('/personas/').then(res => setPersonas(res.data));
  }, []);

  // Cargar vehículos y asignaciones del evento seleccionado
  useEffect(() => {
    if (selectedEvento) {
      setLoading(true);
      Promise.all([
        api.get('/vehiculos/'),
        api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`)
      ]).then(([vehRes, asigRes]) => {
        setVehiculos(vehRes.data);
        setAsignaciones(asigRes.data);
        setLoading(false);
      });
    }
  }, [selectedEvento]);

  // --- Vehículo CRUD ---
  const handleOpenVehiculoModal = (vehiculo = null) => {
    setVehiculoEdit(vehiculo);
    setVehiculoForm(vehiculo ? {
      tipo: vehiculo.tipo,
      capacidad: vehiculo.capacidad,
      placas: vehiculo.placas || '',
      descripcion: vehiculo.descripcion || '',
      id_movilizador: vehiculo.id_movilizador
    } : { tipo: '', capacidad: '', placas: '', descripcion: '', id_movilizador: '' });
    setShowVehiculoModal(true);
  };
  const handleSaveVehiculo = async (e) => {
    e.preventDefault();
    if (!vehiculoForm.tipo || !vehiculoForm.capacidad || !vehiculoForm.id_movilizador) {
      setAlerta('Completa los campos obligatorios');
      return;
    }
    setAlerta('');
    try {
      if (vehiculoEdit) {
        await api.put(`/vehiculos/${vehiculoEdit.id}`, vehiculoForm);
      } else {
        await api.post('/vehiculos/', vehiculoForm);
      }
      setShowVehiculoModal(false);
      setVehiculoEdit(null);
      setVehiculoForm({ tipo: '', capacidad: '', placas: '', descripcion: '', id_movilizador: '' });
      // Refrescar
      api.get('/vehiculos/').then(res => setVehiculos(res.data));
    } catch (err) {
      setAlerta(err?.response?.data?.detail || 'Error al guardar vehículo');
    }
  };
  const handleDeleteVehiculo = async (vehiculoId) => {
    if (window.confirm('¿Eliminar este vehículo?')) {
      await api.delete(`/vehiculos/${vehiculoId}`);
      api.get('/vehiculos/').then(res => setVehiculos(res.data));
    }
  };

  // --- Asignación de personas ---
  const handleOpenAsignarModal = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo);
    setShowAsignarModal(true);
    setAsignarPersonaId(null);
    setAsignarObservaciones('');
    setAsignarRequiereTransporte(false);
    setAlerta('');
    setFiltroColonia('');
    setFiltroSeccion('');
    setPersonasSeleccionadas([]);
  };
  const handleAsignarPersona = async (personaId) => {
    setAsignarLoading(true);
    setAlerta('');
    try {
      await api.post('/movilizaciones/', {
        id_evento: selectedEvento.id,
        id_vehiculo: vehiculoSeleccionado.id,
        id_persona: personaId,
        asistio: false,
        requiere_transporte: asignarRequiereTransporte,
        observaciones: asignarObservaciones
      });
      // Refrescar asignaciones
      const asigRes = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
      setAsignaciones(asigRes.data);
      setAsignarPersonaId(null);
      setAsignarObservaciones('');
      setAsignarRequiereTransporte(false);
    } catch (err) {
      setAlerta(err?.response?.data?.detail || 'Error al asignar persona');
    }
    setAsignarLoading(false);
  };
  const handleQuitarPersona = async (asignacionId) => {
    if (window.confirm('¿Quitar a esta persona del vehículo?')) {
      await api.delete(`/movilizaciones/${asignacionId}`);
      const asigRes = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
      setAsignaciones(asigRes.data);
    }
  };

  // --- Helpers ---
  const getOcupacion = (vehiculoId) => {
    return asignaciones.filter(a => a.id_vehiculo === vehiculoId).length;
  };
  const getResponsableNombre = (id) => {
    const mov = personas.find(p => p.id === id);
    return mov ? mov.nombre : id;
  };
  const personasAsignadas = (vehiculoId) => {
    return asignaciones.filter(a => a.id_vehiculo === vehiculoId).map(a => a.id_persona);
  };
  const asignacionesPorVehiculo = (vehiculoId) => {
    return asignaciones.filter(a => a.id_vehiculo === vehiculoId);
  };
  const personasDisponibles = (vehiculoId) => {
    // No asignadas a ningún vehículo para este evento
    const asignadas = asignaciones.map(a => a.id_persona);
    return personas.filter(p => !asignadas.includes(p.id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900 mb-4">Movilización de Eventos</h1>
      {/* Selector de evento */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-secondary-700 mb-1">Selecciona un evento:</label>
        <select
          className="input-field"
          value={selectedEvento?.id || ''}
          onChange={e => {
            const evento = eventos.find(ev => ev.id === parseInt(e.target.value));
            setSelectedEvento(evento);
          }}
        >
          <option value="">-- Selecciona --</option>
          {eventos.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.nombre} ({new Date(ev.fecha).toLocaleString()})</option>
          ))}
        </select>
      </div>
      {/* Tabla de vehículos */}
      {selectedEvento && (
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Vehículos asignados</h2>
            <button className="btn-primary flex items-center" onClick={() => handleOpenVehiculoModal()}>
              <FiPlus className="mr-2" /> Agregar vehículo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Placas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Capacidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Responsable</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Ocupación</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {vehiculos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary-400 py-4">No hay vehículos registrados para este evento.</td>
                  </tr>
                )}
                {vehiculos.map(vehiculo => (
                  <tr key={vehiculo.id}>
                    <td className="px-4 py-2">{vehiculo.tipo}</td>
                    <td className="px-4 py-2">{vehiculo.placas || '-'}</td>
                    <td className="px-4 py-2">{vehiculo.capacidad}</td>
                    <td className="px-4 py-2">{getResponsableNombre(vehiculo.id_movilizador)}</td>
                    <td className="px-4 py-2">{getOcupacion(vehiculo.id)} / {vehiculo.capacidad}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="btn-secondary flex items-center text-xs" onClick={() => handleOpenAsignarModal(vehiculo)}>
                        <FiUsers className="mr-1" /> Ver/Asignar personas
                      </button>
                      <button className="btn-secondary flex items-center text-xs" onClick={() => handleOpenVehiculoModal(vehiculo)}>
                        <FiEdit className="mr-1" /> Editar
                      </button>
                      <button className="btn-danger flex items-center text-xs" onClick={() => handleDeleteVehiculo(vehiculo.id)}>
                        <FiTrash2 className="mr-1" /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal para agregar/editar vehículo */}
      {showVehiculoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{vehiculoEdit ? 'Editar vehículo' : 'Agregar vehículo'}</h3>
              <button className="text-secondary-400 hover:text-secondary-600" onClick={() => setShowVehiculoModal(false)}><FiX /></button>
            </div>
            {alerta && <div className="text-red-600 text-sm mb-2">{alerta}</div>}
            <form onSubmit={handleSaveVehiculo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Tipo *</label>
                <input type="text" className="input-field" value={vehiculoForm.tipo} onChange={e => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Capacidad *</label>
                <input type="number" className="input-field" value={vehiculoForm.capacidad} onChange={e => setVehiculoForm({ ...vehiculoForm, capacidad: e.target.value })} required min={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Placas</label>
                <input type="text" className="input-field" value={vehiculoForm.placas} onChange={e => setVehiculoForm({ ...vehiculoForm, placas: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Responsable (ID de persona) *</label>
                <input type="number" className="input-field" value={vehiculoForm.id_movilizador} onChange={e => setVehiculoForm({ ...vehiculoForm, id_movilizador: e.target.value })} required />
                {/* En una versión mejorada, aquí se puede poner un select de personas */}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Descripción</label>
                <textarea className="input-field" value={vehiculoForm.descripcion} onChange={e => setVehiculoForm({ ...vehiculoForm, descripcion: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowVehiculoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal para asignar personas a vehículo */}
      {showAsignarModal && vehiculoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Asignar personas a {vehiculoSeleccionado.tipo} ({vehiculoSeleccionado.placas || '-'})</h3>
              <button className="text-secondary-400 hover:text-secondary-600" onClick={() => setShowAsignarModal(false)}><FiX /></button>
            </div>
            {alerta && <div className="text-red-600 text-sm mb-2">{alerta}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personas ya asignadas */}
              <div>
                <h4 className="font-semibold mb-2">Asignados ({getOcupacion(vehiculoSeleccionado.id)} / {vehiculoSeleccionado.capacidad})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {asignacionesPorVehiculo(vehiculoSeleccionado.id).map(asig => {
                    const persona = personas.find(p => p.id === asig.id_persona);
                    return persona ? (
                      <div key={asig.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <span className="font-medium">{persona.nombre}</span>
                          <span className="ml-2 text-xs text-secondary-500">{persona.telefono}</span>
                          {asig.requiere_transporte && <span className="ml-2 text-xs text-yellow-700">Transporte</span>}
                          {asig.observaciones && <span className="ml-2 text-xs text-secondary-400">Obs: {asig.observaciones}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <QRCodeCanvas value={JSON.stringify({ asistencia_id: asig.id })} size={48} />
                          <button className="btn-danger text-xs" onClick={() => handleQuitarPersona(asig.id)}>Quitar</button>
                        </div>
                      </div>
                    ) : null;
                  })}
                  {getOcupacion(vehiculoSeleccionado.id) === 0 && <div className="text-secondary-400 text-sm">Nadie asignado aún.</div>}
                </div>
              </div>
              {/* Personas disponibles para asignar */}
              <div>
                <h4 className="font-semibold mb-2">Disponibles</h4>
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Filtrar por colonia"
                    value={filtroColonia}
                    onChange={e => setFiltroColonia(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Filtrar por sección"
                    value={filtroSeccion}
                    onChange={e => setFiltroSeccion(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {personasDisponibles(vehiculoSeleccionado.id)
                    .filter(p => (!filtroColonia || (p.colonia || '').toLowerCase().includes(filtroColonia.toLowerCase())) &&
                                 (!filtroSeccion || (p.seccion_electoral || '').includes(filtroSeccion)))
                    .length === 0 && <div className="text-secondary-400 text-sm">No hay personas disponibles.</div>}
                  {personasDisponibles(vehiculoSeleccionado.id)
                    .filter(p => (!filtroColonia || (p.colonia || '').toLowerCase().includes(filtroColonia.toLowerCase())) &&
                                 (!filtroSeccion || (p.seccion_electoral || '').includes(filtroSeccion)))
                    .map(persona => (
                      <div key={persona.id} className="p-2 border rounded flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={personasSeleccionadas.includes(persona.id)}
                            onChange={e => {
                              setPersonasSeleccionadas(sel =>
                                e.target.checked
                                  ? [...sel, persona.id]
                                  : sel.filter(id => id !== persona.id)
                              );
                            }}
                          />
                          <span className="font-medium">{persona.nombre}</span>
                          <span className="ml-2 text-xs text-secondary-500">{persona.telefono}</span>
                          {persona.seccion_electoral && <span className="ml-2 text-xs text-secondary-400">Sección: {persona.seccion_electoral}</span>}
                        </div>
                      </div>
                    ))}
                </div>
                <button
                  className="btn-primary mt-2"
                  disabled={personasSeleccionadas.length === 0 || getOcupacion(vehiculoSeleccionado.id) + personasSeleccionadas.length > vehiculoSeleccionado.capacidad}
                  onClick={async () => {
                    setAsignarLoading(true);
                    setAlerta('');
                    try {
                      await api.post('/movilizaciones/masivo', {
                        id_evento: selectedEvento.id,
                        id_vehiculo: vehiculoSeleccionado.id,
                        ids_persona: personasSeleccionadas
                      });
                      const asigRes = await api.get(`/movilizaciones/?evento_id=${selectedEvento.id}`);
                      setAsignaciones(asigRes.data);
                      setPersonasSeleccionadas([]);
                      toast.success('¡Personas asignadas correctamente!');
                    } catch (err) {
                      setAlerta(err?.response?.data?.detail || 'Error al asignar personas');
                    }
                    setAsignarLoading(false);
                  }}
                >
                  Asignar seleccionados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movilizacion;