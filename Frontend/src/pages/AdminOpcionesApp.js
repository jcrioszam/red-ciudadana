import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { FiSmartphone, FiCheck, FiSave, FiAlertCircle, FiInfo } from 'react-icons/fi';
import api from '../api';

const ROLES = [
  { id: 'admin',           label: 'Administrador',   color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'presidente',      label: 'Presidente',       color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'lider_estatal',   label: 'Líder Estatal',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'lider_regional',  label: 'Líder Regional',   color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'lider_municipal', label: 'Líder Municipal',  color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'lider_zona',      label: 'Líder de Zona',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'capturista',      label: 'Capturista',       color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'movilizador',     label: 'Movilizador',      color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'ciudadano',       label: 'Ciudadano',        color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const OPCIONES_APP = [
  { id: 'dashboard',           label: 'Dashboard',                  desc: 'Estadísticas generales' },
  { id: 'register',            label: 'Registrar persona',          desc: 'Captura de nuevos registros' },
  { id: 'reassign',            label: 'Reasignar',                  desc: 'Cambiar líder de personas' },
  { id: 'pase-lista',          label: 'Check-in',                   desc: 'Pase de lista en eventos' },
  { id: 'movilizacion',        label: 'Movilización',               desc: 'Control de vehículos y traslados' },
  { id: 'estructura-red',      label: 'Estructura de Red',          desc: 'Árbol jerárquico de líderes' },
  { id: 'eventos-historicos',  label: 'Eventos Históricos',         desc: 'Consulta de eventos pasados' },
  { id: 'reportes',            label: 'Reportes Estadísticos',      desc: 'Gráficas y análisis' },
  { id: 'noticias',            label: 'Noticias',                   desc: 'Feed de noticias' },
  { id: 'reportes_ciudadanos', label: 'Reportes Ciudadanos',        desc: 'Ver reportes de la comunidad' },
  { id: 'seguimiento_reportes', label: 'Seguimiento de Reportes',   desc: 'Gestionar estados de reportes' },
  { id: 'seguimiento',         label: 'Ubicación en Tiempo Real',   desc: 'Rastreo GPS de movilizadores' },
  { id: 'perfil',              label: 'Perfil',                     desc: 'Ver y editar perfil de usuario' },
];

export default function AdminOpcionesApp() {
  const queryClient = useQueryClient();
  const [rolSeleccionado, setRolSeleccionado] = useState('admin');
  const [opcionesEdit, setOpcionesEdit] = useState([]);
  const [msg, setMsg] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Obtener configuración del rol seleccionado
  const { data: configRol, isLoading } = useQuery(
    ['config-rol-app', rolSeleccionado],
    async () => {
      const r = await api.get(`/perfiles/configuracion/${rolSeleccionado}`);
      return r.data ?? r;
    },
    {
      onSuccess: (d) => {
        setOpcionesEdit(d?.configuracion?.opciones_app ?? []);
        setMsg(null);
      },
    }
  );

  const toggle = (id) => {
    setMsg(null);
    setOpcionesEdit(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const guardar = async () => {
    setGuardando(true);
    setMsg(null);
    try {
      const configActual = configRol?.configuracion ?? {};
      await api.put(`/perfiles/configuracion/${rolSeleccionado}`, {
        opciones_web: configActual.opciones_web ?? [],
        opciones_app: opcionesEdit,
      });
      queryClient.invalidateQueries(['config-rol-app', rolSeleccionado]);
      setMsg({ tipo: 'ok', texto: 'Configuración guardada. Se aplicará en la próxima vez que el usuario abra la app.' });
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const rolInfo = ROLES.find(r => r.id === rolSeleccionado);
  const totalActivas = opcionesEdit.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FiSmartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Opciones de App por Perfil</h1>
            <p className="text-sm text-gray-500">Configura qué secciones ve cada perfil en la app móvil</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <FiInfo className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Los cambios aplican a <strong>todos los usuarios</strong> con ese perfil automáticamente.
            No necesitas configurar usuario por usuario.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Selector de perfil */}
          <div className="w-56 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Perfil</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {ROLES.map(rol => (
                <button
                  key={rol.id}
                  onClick={() => setRolSeleccionado(rol.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-0 ${
                    rolSeleccionado === rol.id
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-l-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {rol.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de opciones */}
          <div className="flex-1">
            {/* Cabecera del panel */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${rolInfo?.color}`}>
                  {rolInfo?.label}
                </span>
                <span className="text-sm text-gray-500">{totalActivas} de {OPCIONES_APP.length} secciones activas</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50"
                  onClick={() => { setOpcionesEdit(OPCIONES_APP.map(o => o.id)); setMsg(null); }}
                >
                  Todas
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => { setOpcionesEdit(['dashboard', 'perfil']); setMsg(null); }}
                >
                  Mínimo
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                Cargando configuración...
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {OPCIONES_APP.map(op => {
                    const activa = opcionesEdit.includes(op.id);
                    return (
                      <label
                        key={op.id}
                        className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                          activa ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Checkbox visual */}
                        <div
                          onClick={() => toggle(op.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                            activa ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {activa && <FiCheck className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1" onClick={() => toggle(op.id)}>
                          <p className={`text-sm font-semibold ${activa ? 'text-blue-900' : 'text-gray-800'}`}>
                            {op.label}
                          </p>
                          <p className="text-xs text-gray-500">{op.desc}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          activa ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {activa ? 'Visible' : 'Oculta'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div>
                    {msg && (
                      <div className={`flex items-center gap-2 text-sm ${
                        msg.tipo === 'ok' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {msg.tipo === 'ok'
                          ? <FiCheck className="h-4 w-4" />
                          : <FiAlertCircle className="h-4 w-4" />}
                        {msg.texto}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    <FiSave className="h-4 w-4" />
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
