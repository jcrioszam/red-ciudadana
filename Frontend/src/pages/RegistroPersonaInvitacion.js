import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const RegistroPersonaInvitacion = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [invitacion, setInvitacion] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    edad: '',
    sexo: '',
    clave_elector: '',
    curp: '',
    num_emision: '',
    seccion_electoral: '',
    distrito: '',
    municipio: '',
    estado: '',
    colonia: '',
    latitud: '',
    longitud: '',
    acepta_politica: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = query.get('token');
    setToken(t);
    // Decodificar el token para mostrar el mensaje de invitación
    if (t) {
      api.post('/invitaciones-personas/decode', { token: t })
        .then(res => {
          console.log('Respuesta del decode persona:', res.data);
          if (res.data && typeof res.data === 'object' && res.data.tipo && res.data.nombre_lider) {
            setInvitacion(res.data);
          } else {
            console.error('Respuesta inválida del decode persona:', res.data);
            setInvitacion(null);
          }
        })
        .catch((error) => {
          console.error('Error decodificando token persona:', error);
          setInvitacion(null);
        });
    }
  }, [query]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filtrar y convertir datos para evitar errores de validación
      const personaData = { ...form, token };
      Object.keys(personaData).forEach(key => {
        if (personaData[key] === '' || personaData[key] === null || personaData[key] === undefined) {
          delete personaData[key];
        } else if (typeof personaData[key] === 'object') {
          console.error(`Campo ${key} es un objeto:`, personaData[key]);
          delete personaData[key];
        } else if (key === 'latitud' || key === 'longitud') {
          // Convertir latitud y longitud a float si tienen valor
          const value = parseFloat(personaData[key]);
          if (!isNaN(value)) {
            personaData[key] = value;
          } else {
            delete personaData[key];
          }
        } else if (key === 'edad') {
          // Convertir edad a int si tiene valor
          const value = parseInt(personaData[key]);
          if (!isNaN(value)) {
            personaData[key] = value;
          } else {
            delete personaData[key];
          }
        }
      });
      
      console.log('Datos de persona a enviar:', personaData);
      await api.post('/registro-persona-invitacion', personaData);
      
      // Invalidar cache para que el Dashboard se actualice automáticamente
      queryClient.invalidateQueries('personas');
      queryClient.invalidateQueries('reportePersonas');
      queryClient.invalidateQueries('estructuraJerarquica');
      queryClient.invalidateQueries('reporteEventos');
      
      toast.success('Persona registrada exitosamente.');
      navigate('/personas');
    } catch (error) {
      console.error('Error completo:', error);
      const errorMessage = error.response?.data?.detail;
      if (typeof errorMessage === 'object') {
        console.error('Error de validación:', errorMessage);
        toast.error('Error al registrar persona: Verifica que todos los campos sean válidos');
      } else {
        toast.error(errorMessage || 'Error al registrar persona');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-8 text-center">Token de invitación no válido.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Registro de Persona por Invitación</h2>
      {invitacion && invitacion.tipo && invitacion.nombre_lider ? (
        <div className="mb-4 text-sm text-secondary-700">
          Invitación para registrar una persona<br />
          Te invita: <b>{invitacion.nombre_lider}</b>
        </div>
      ) : (
        <div className="mb-4 text-red-600">Invitación inválida o expirada.</div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Nombre Completo *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Edad</label>
              <input name="edad" type="number" value={form.edad} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} className="input-field">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Dirección</label>
            <textarea name="direccion" value={form.direccion} onChange={handleChange} className="input-field" rows="2" />
          </div>
        </div>

        {/* Datos de Credencial de Elector */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">Datos de Credencial de Elector</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Clave de Elector</label>
              <input name="clave_elector" value={form.clave_elector} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">CURP</label>
              <input name="curp" value={form.curp} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Número de Emisión</label>
              <input name="num_emision" value={form.num_emision} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Ubicación Electoral */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">Ubicación Electoral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Sección Electoral</label>
              <input name="seccion_electoral" value={form.seccion_electoral} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Distrito</label>
              <input name="distrito" value={form.distrito} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Municipio</label>
              <input name="municipio" value={form.municipio} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Estado</label>
              <input name="estado" value={form.estado} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Colonia</label>
              <input name="colonia" value={form.colonia} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Coordenadas */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">Coordenadas (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Latitud</label>
              <input name="latitud" type="number" step="any" value={form.latitud} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">Longitud</label>
              <input name="longitud" type="number" step="any" value={form.longitud} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        {/* Aceptación de Política */}
        <div className="flex items-center">
          <input
            name="acepta_politica"
            type="checkbox"
            checked={form.acepta_politica}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label className="ml-2 block text-sm text-secondary-900">
            Acepto la política de privacidad y el uso de mis datos
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Persona'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroPersonaInvitacion; 