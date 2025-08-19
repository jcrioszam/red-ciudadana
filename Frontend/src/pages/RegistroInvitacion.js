import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const RegistroInvitacion = () => {
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
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = query.get('token');
    setToken(t);
    // Decodificar el token para mostrar el mensaje de invitación
    if (t) {
      api.post('/invitaciones/decode', { token: t })
        .then(res => {
          console.log('Respuesta del decode:', res.data);
          if (res.data && typeof res.data === 'object' && res.data.rol && res.data.nombre_lider) {
            setInvitacion(res.data);
          } else {
            console.error('Respuesta inválida del decode:', res.data);
            setInvitacion(null);
          }
        })
        .catch((error) => {
          console.error('Error decodificando token:', error);
          setInvitacion(null);
        });
    }
  }, [query]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filtrar campos vacíos para evitar errores de validación
      const formData = { ...form, token };
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
          delete formData[key];
        }
      });
      
      await api.post('/registro-invitacion', formData);
      
      // Invalidar cache para que el Dashboard se actualice automáticamente
      queryClient.invalidateQueries('usuarios');
      queryClient.invalidateQueries('lideres');
      queryClient.invalidateQueries('estructuraJerarquica');
      queryClient.invalidateQueries('reportePersonas');
      queryClient.invalidateQueries('reporteEventos');
      
      toast.success('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error completo:', error);
      const errorMessage = error.response?.data?.detail;
      if (typeof errorMessage === 'object') {
        console.error('Error de validación:', errorMessage);
        toast.error('Error al registrar: Verifica que todos los campos sean válidos');
      } else {
        toast.error(errorMessage || 'Error al registrar');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-8 text-center">Token de invitación no válido.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Registro por invitación</h2>
      {invitacion && invitacion.rol && invitacion.nombre_lider && typeof invitacion.rol === 'string' && typeof invitacion.nombre_lider === 'string' ? (
        <div className="mb-4 text-sm text-secondary-700">
          Invitación para registrarte como <b>{invitacion.rol}</b><br />
          Te invita: <b>{invitacion.nombre_lider}</b>
        </div>
      ) : (
        <div className="mb-4 text-red-600">Invitación inválida o expirada.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Contraseña</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium">Edad</label>
            <input name="edad" type="number" value={form.edad} onChange={handleChange} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Sexo</label>
          <select name="sexo" value={form.sexo} onChange={handleChange} className="input-field">
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Dirección</label>
          <textarea name="direccion" value={form.direccion} onChange={handleChange} className="input-field" rows="2" />
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroInvitacion; 