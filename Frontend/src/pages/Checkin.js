import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const Toast = ({ message, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 20,
    right: 20,
    background: '#38a169',
    color: 'white',
    padding: '16px 24px',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: 200,
    fontWeight: 'bold',
    fontSize: 16
  }}>
    {message}
    <button style={{ marginLeft: 16, background: 'transparent', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={onClose}>×</button>
  </div>
);

const Checkin = () => {
  const { logout } = useAuth();
  const [claveElector, setClaveElector] = useState('');
  const [idEvento, setIdEvento] = useState('');
  const [asistenciaId, setAsistenciaId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [personasEvento, setPersonasEvento] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [eventos, setEventos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [idVehiculo, setIdVehiculo] = useState('');
  const [toast, setToast] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar eventos para el select
  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const response = await api.get('/eventos/?activos=true');
      setEventos(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
      }
    }
  };

  // Cargar vehículos para el evento seleccionado
  useEffect(() => {
    if (idEvento) {
      loadVehiculos();
    } else {
      setVehiculos([]);
    }
  }, [idEvento]);

  const loadVehiculos = async () => {
    try {
      const response = await api.get('/vehiculos/');
      setVehiculos(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
      }
    }
  };

  // Cargar personas asignadas al evento y vehículo seleccionado
  useEffect(() => {
    if (idEvento) {
      loadPersonasEvento();
    } else {
      setPersonasEvento([]);
    }
  }, [idEvento, idVehiculo, reload]);

  const loadPersonasEvento = async () => {
    try {
      const response = await api.get(`/movilizaciones/?evento_id=${idEvento}${idVehiculo ? `&vehiculo_id=${idVehiculo}` : ''}`);
      setPersonasEvento(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
      }
    }
  };

  // Escaneo real de QR
  const handleScan = (result, error) => {
    if (!!result) {
      try {
        const data = JSON.parse(result?.text || result);
        if (data.asistencia_id) {
          setAsistenciaId(data.asistencia_id);
          setScanned(true);
          setMensaje('QR leído correctamente. Listo para check-in.');
          setShowCamera(false);
        } else {
          setMensaje('QR inválido.');
        }
      } catch {
        setMensaje('QR inválido.');
      }
    }
    if (!!error && error.name !== 'NotFoundException') {
      setMensaje('Error al leer QR');
    }
  };

  // Simulación de escaneo de QR (input manual)
  const handleScanQR = (e) => {
    try {
      const data = JSON.parse(e.target.value);
      if (data.asistencia_id) {
        setAsistenciaId(data.asistencia_id);
        setScanned(true);
        setMensaje('QR leído correctamente. Listo para check-in.');
      } else {
        setMensaje('QR inválido.');
      }
    } catch {
      setMensaje('QR inválido.');
    }
  };

  // Check-in por QR
  const handleCheckinQR = async () => {
    if (!asistenciaId) return;
    try {
      await api.post(`/asistencias/${asistenciaId}/checkin`);
      setMensaje('¡Check-in realizado con éxito!');
      setScanned(false);
      setAsistenciaId(null);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      setMensaje(err?.response?.data?.detail || 'Error al hacer check-in');
    }
  };

  // Búsqueda manual por clave de elector
  const handleBuscarAsistencia = async () => {
    if (!claveElector || !idEvento) {
      setMensaje('Ingresa clave de elector y evento.');
      return;
    }
    try {
      const res = await api.get(`/asistencias/buscar-por-clave?clave_elector=${claveElector}&id_evento=${idEvento}`);
      setAsistenciaId(res.data.id);
      setMensaje('Asistencia encontrada. Listo para check-in.');
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      setMensaje(err?.response?.data?.detail || 'No se encontró asistencia para esa persona en el evento.');
    }
  };

  // Check-in manual
  const handleCheckinManual = async (id = null) => {
    // Si id es un objeto de asignación (de la tabla), usar el nuevo endpoint
    if (typeof id === 'object' && id !== null && id.id) {
      setLoadingId(id.id);
      try {
        await api.post(`/movilizaciones/${id.id}/checkin`);
        setToast('¡Check-in realizado con éxito!');
        setTimeout(() => setToast(null), 2500);
        setMensaje('');
        // Recargar tabla
        setTimeout(() => {
          setLoadingId(null);
          setMensaje('');
          setReload(r => r + 1); // Forzar recarga
        }, 500);
      } catch (err) {
        if (err.response?.status === 401) {
          alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          return;
        }
        setToast(err?.response?.data?.detail || 'Error al hacer check-in');
        setTimeout(() => setToast(null), 3000);
        setLoadingId(null);
      }
      return;
    }
    // Si id es un número (flujo QR), usar el endpoint antiguo
    const aid = id || asistenciaId;
    if (!aid) return;
    setLoadingId(aid);
    try {
      await api.post(`/asistencias/${aid}/checkin`);
      setToast('¡Check-in realizado con éxito!');
      setTimeout(() => setToast(null), 2500);
      setAsistenciaId(null);
      setMensaje('');
      setTimeout(() => {
        setLoadingId(null);
        setReload(r => r + 1); // Forzar recarga
      }, 500);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      setToast(err?.response?.data?.detail || 'Error al hacer check-in');
      setTimeout(() => setToast(null), 3000);
      setLoadingId(null);
    }
  };

  // Buscar persona en el check list (búsqueda dinámica)
  const personasFiltradas = personasEvento.filter(p => {
    if (!busqueda) return true;
    const persona = p.persona || {};
    return (
      (persona.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (persona.clave_elector || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (persona.telefono || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (persona.curp || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (persona.direccion || '').toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  // Calcular estadísticas del evento
  const estadisticasEvento = () => {
    if (!personasEvento.length) return null;
    const total = personasEvento.length;
    const presentes = personasEvento.filter(p => p.asistio).length;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { total, presentes, porcentaje };
  };

  const stats = estadisticasEvento();

  return (
    <div className="w-full min-h-screen flex bg-secondary-50">
      {/* Columna izquierda: controles */}
      <div className="w-full max-w-xs p-6 space-y-6 bg-white border-r border-secondary-200 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-4 text-left">Pase de Lista</h1>
        
        {/* Selector de evento */}
        <div className="mb-4 w-full text-left">
          <label className="block text-sm font-medium text-secondary-700 mb-1">Selecciona un evento:</label>
          <select
            className="input-field w-full"
            value={idEvento}
            onChange={e => { setIdEvento(e.target.value); setIdVehiculo(''); }}
          >
            <option value="">-- Selecciona --</option>
            {eventos.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre} ({new Date(ev.fecha).toLocaleString()})</option>
            ))}
          </select>
        </div>

        {/* Selector de vehículo y tarjeta resumen */}
        {idEvento && (
          <div className="mb-4 w-full text-left">
            <label className="block text-sm font-medium text-secondary-700 mb-1">Selecciona un vehículo:</label>
            <select
              className="input-field w-full mb-2"
              value={idVehiculo}
              onChange={e => setIdVehiculo(e.target.value)}
            >
              <option value="">-- Todos los vehículos --</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.tipo} {v.placas ? `(${v.placas})` : ''} - Capacidad: {v.capacidad}</option>
              ))}
            </select>
            {idVehiculo && (() => {
              const v = vehiculos.find(v => String(v.id) === String(idVehiculo));
              if (!v) return null;
              const ocupacion = personasEvento.length;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2 flex flex-col gap-2">
                  <div><span className="font-semibold">{v.tipo}</span> {v.placas && <span className="text-xs">({v.placas})</span>}</div>
                  <div className="text-xs">Capacidad: <span className="font-semibold">{v.capacidad}</span></div>
                  <div className="text-xs">Ocupación actual: <span className="font-semibold">{ocupacion}</span></div>
                  {v.descripcion && <div className="text-xs text-secondary-500">{v.descripcion}</div>}
                </div>
              );
            })()}
          </div>
        )}

        {/* Estadísticas del evento */}
        {stats && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">Resumen del Evento</h3>
            <div className="flex justify-between text-sm">
              <span>Total: <strong>{stats.total}</strong></span>
              <span>Presentes: <strong>{stats.presentes}</strong></span>
              <span>Faltantes: <strong>{stats.total - stats.presentes}</strong></span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats.porcentaje}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-700 mt-1">{stats.porcentaje}% de asistencia</div>
            </div>
          </div>
        )}

        {/* Escaneo real de QR */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Escanear QR con cámara</h2>
          <button className="btn-primary mb-2" onClick={() => setShowCamera(v => !v)}>
            {showCamera ? 'Cerrar cámara' : 'Abrir cámara para escanear QR'}
          </button>
          {showCamera && (
            <div className="mb-2">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={handleScan}
                style={{ width: '100%' }}
              />
            </div>
          )}
          <button
            className="btn-success"
            disabled={!scanned}
            onClick={handleCheckinQR}
          >
            Hacer Check-in por QR
          </button>
        </div>

        {/* Simulación de escaneo de QR */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Pegar contenido del QR (simulación)</h2>
          <input
            type="text"
            placeholder="Pega aquí el contenido del QR"
            className="input-field mb-2"
            onChange={handleScanQR}
          />
          <button
            className="btn-primary"
            disabled={!scanned}
            onClick={handleCheckinQR}
          >
            Hacer Check-in por QR
          </button>
        </div>

        {/* Búsqueda manual */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Buscar por Clave de Elector</h2>
          <input
            type="text"
            placeholder="Clave de elector"
            className="input-field mb-2"
            value={claveElector}
            onChange={e => setClaveElector(e.target.value)}
          />
          <button className="btn-primary mb-2" onClick={handleBuscarAsistencia}>
            Buscar asistencia
          </button>
          <button
            className="btn-success"
            disabled={!asistenciaId}
            onClick={() => handleCheckinManual()}
          >
            Hacer Check-in Manual
          </button>
        </div>

        {mensaje && <div className="text-center text-lg font-semibold text-blue-700">{mensaje}</div>}
      </div>

      {/* Columna derecha: tabla de personas asignadas */}
      <div className="flex-1 p-6">
        {idEvento && (
          <div className="card p-4 mb-4 w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-left">Lista de Personas Asignadas</h2>
              <button 
                className="btn-secondary text-sm"
                onClick={() => setReload(r => r + 1)}
              >
                🔄 Actualizar
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Buscar por nombre, clave de elector, teléfono, CURP o dirección..."
              className="input-field mb-4 w-full max-w-md"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Clave Elector</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Líder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {personasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-secondary-400 py-8">
                        {busqueda ? 'No hay coincidencias con la búsqueda.' : 'No hay personas asignadas.'}
                      </td>
                    </tr>
                  )}
                  {personasFiltradas.map(asig => (
                    <tr key={asig.id} className={`hover:bg-gray-50 transition-colors ${asig.asistio ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-3">
                        {asig.asistio ? (
                          <div className="flex items-center">
                            <span className="text-green-600 text-2xl">✅</span>
                            <span className="ml-2 text-sm text-green-700 font-medium">Presente</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-red-600 text-2xl">❌</span>
                            <span className="ml-2 text-sm text-red-700 font-medium">Pendiente</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">👤</span>
                          <span className="font-medium text-gray-900">{asig.persona?.nombre || 'Sin nombre'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{asig.persona?.clave_elector || ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{asig.persona?.telefono || ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{asig.persona?.lider_responsable?.nombre || ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {asig.hora_checkin ? new Date(asig.hora_checkin).toLocaleTimeString() : ''}
                      </td>
                      <td className="px-4 py-3">
                        {!asig.asistio && (
                          <button
                            className={`btn-success text-xs px-3 py-1 ${loadingId === asig.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                            disabled={loadingId === asig.id}
                            onClick={() => handleCheckinManual(asig)}
                          >
                            {loadingId === asig.id ? 'Marcando...' : 'Marcar Asistencia'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Checkin; 