import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUser, FiMapPin, FiKey } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

const Personas = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [editingPersona, setEditingPersona] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    clave_elector: '',
    seccion_electoral: '',
    colonia: '',
    id_lider_responsable: ''
  });
  const [formData, setFormData] = useState({
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
    codigo_postal: '',
    latitud: '',
    longitud: '',
    acepta_politica: false
  });
  const queryClient = useQueryClient();

  // Función para geocodificar dirección
  const geocodificarDireccion = async () => {
    if (!formData.direccion) {
      toast.error('Por favor ingresa una dirección primero');
      return;
    }

    try {
      const response = await api.post('/geocodificar', {
        direccion: formData.direccion,
        colonia: formData.colonia,
        codigo_postal: formData.codigo_postal,
        municipio: formData.municipio,
        estado: formData.estado
      });

      const { latitud, longitud, direccion_formateada } = response.data;
      
      setFormData(prev => ({
        ...prev,
        latitud: latitud.toString(),
        longitud: longitud.toString()
      }));

      toast.success('Coordenadas obtenidas automáticamente');
    } catch (error) {
      console.error('Error al geocodificar:', error);
      toast.error('Error al obtener coordenadas. Puedes ingresarlas manualmente.');
    }
  };

  // Obtener lista de personas
  const { data: personas, isLoading } = useQuery(['personas', searchFilters], async () => {
    const params = new URLSearchParams();
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/personas/buscar/?${params.toString()}`);
    return response.data;
  });

  // Obtener líderes para el select
  const { data: lideres } = useQuery('lideres', async () => {
    const response = await api.get('/users/');
    return response.data.filter(u => u.rol.includes('lider') || u.rol === 'admin');
  });

  // Mutación para crear persona
  const createPersonaMutation = useMutation(
    async (personaData) => {
      const response = await api.post('/personas/', personaData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('personas');
        toast.success('Persona registrada exitosamente');
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        console.error('Error registrando persona:', error);
        
        // Manejar error de autenticación
        if (error.response?.status === 401) {
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          // Redirigir al login
          window.location.href = '/login';
          return;
        }
        
        const errorMessage = error.response?.data?.detail;
        if (typeof errorMessage === 'object') {
          console.error('Error de validación:', errorMessage);
          toast.error('Error al registrar persona: Verifica que todos los campos sean válidos');
        } else {
          toast.error(errorMessage || 'Error al registrar persona');
        }
      }
    }
  );

  // Mutación para actualizar persona
  const updatePersonaMutation = useMutation(
    async ({ id, personaData }) => {
      const response = await api.put(`/personas/${id}`, personaData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('personas');
        toast.success('Persona actualizada exitosamente');
        setShowModal(false);
        setEditingPersona(null);
        resetForm();
      },
      onError: (error) => {
        console.error('Error actualizando persona:', error);
        const errorMessage = error.response?.data?.detail;
        if (typeof errorMessage === 'object') {
          console.error('Error de validación:', errorMessage);
          toast.error('Error al actualizar persona: Verifica que todos los campos sean válidos');
        } else {
          toast.error(errorMessage || 'Error al actualizar persona');
        }
      }
    }
  );

  // Mutación para desactivar persona
  const deactivatePersonaMutation = useMutation(
    async (personaId) => {
      const response = await api.delete(`/personas/${personaId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('personas');
        toast.success('Persona desactivada exitosamente');
      },
      onError: (error) => {
        console.error('Error desactivando persona:', error);
        const errorMessage = error.response?.data?.detail;
        if (typeof errorMessage === 'object') {
          console.error('Error de validación:', errorMessage);
          toast.error('Error al desactivar persona: Datos inválidos');
        } else {
          toast.error(errorMessage || 'Error al desactivar persona');
        }
      }
    }
  );

  const resetForm = () => {
    setFormData({
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
      codigo_postal: '',
      latitud: '',
      longitud: '',
      acepta_politica: false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filtrar y convertir datos para evitar errores de validación
    const personaData = { ...formData };
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
    
    console.log('Datos a enviar:', personaData);
    if (editingPersona) {
      updatePersonaMutation.mutate({ id: editingPersona.id, personaData });
    } else {
      // Agregar el id_lider_responsable del usuario actual
      const personaDataWithLider = {
        ...personaData,
        id_lider_responsable: currentUser.id
      };
      console.log('Datos con líder responsable:', personaDataWithLider);
      createPersonaMutation.mutate(personaDataWithLider);
    }
  };

  const handleEdit = (persona) => {
    setEditingPersona(persona);
    setFormData({
      nombre: String(persona.nombre || ''),
      telefono: String(persona.telefono || ''),
      direccion: String(persona.direccion || ''),
      edad: String(persona.edad || ''),
      sexo: String(persona.sexo || ''),
      clave_elector: String(persona.clave_elector || ''),
      curp: String(persona.curp || ''),
      num_emision: String(persona.num_emision || ''),
      seccion_electoral: String(persona.seccion_electoral || ''),
      distrito: String(persona.distrito || ''),
      municipio: String(persona.municipio || ''),
      estado: String(persona.estado || ''),
      colonia: String(persona.colonia || ''),
      latitud: String(persona.latitud || ''),
      longitud: String(persona.longitud || ''),
      acepta_politica: Boolean(persona.acepta_politica || false)
    });
    setShowModal(true);
  };

  const handleDeactivate = (personaId) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar esta persona?')) {
      deactivatePersonaMutation.mutate(personaId);
    }
  };

  const handleSearch = () => {
    queryClient.invalidateQueries(['personas', searchFilters]);
  };

  const clearSearch = () => {
    setSearchFilters({
      clave_elector: '',
      seccion_electoral: '',
      colonia: '',
      id_lider_responsable: ''
    });
  };

  const handleInvitePersona = async () => {
    try {
      const res = await api.post('/invitaciones-personas/');
      console.log('Respuesta de invitación persona:', res.data);
      const token = res.data.token;
      if (token && typeof token === 'string') {
        setInviteToken(token);
      } else {
        console.error('Token inválido recibido:', token);
        setInviteToken('');
        toast.error('Error: Token inválido recibido del servidor');
      }
    } catch (error) {
      console.error('Error generando invitación persona:', error);
      setInviteToken(''); // Limpia el token si hay error
      const errorMessage = error.response?.data?.detail;
      if (typeof errorMessage === 'object') {
        console.error('Error de validación:', errorMessage);
        toast.error('Error al generar invitación: Datos inválidos');
      } else {
        toast.error(errorMessage || 'Error al generar invitación');
      }
    }
  };

  // Verificar si el usuario está autenticado
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a esta página.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-secondary-900">Gestión de Personas</h1>
          <p className="text-secondary-600">Registra y administra afiliados y simpatizantes</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingPersona(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Registrar Persona
          </button>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteToken('');
            }}
            className="btn-secondary flex items-center"
          >
            <FiKey className="mr-2" />
            Invitar registro
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Búsqueda Avanzada</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Clave de Elector</label>
            <input
              type="text"
              value={searchFilters.clave_elector}
              onChange={(e) => setSearchFilters({...searchFilters, clave_elector: e.target.value})}
              className="input-field"
              placeholder="Buscar por clave..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Sección Electoral</label>
            <input
              type="text"
              value={searchFilters.seccion_electoral}
              onChange={(e) => setSearchFilters({...searchFilters, seccion_electoral: e.target.value})}
              className="input-field"
              placeholder="Buscar por sección..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Colonia</label>
            <input
              type="text"
              value={searchFilters.colonia}
              onChange={(e) => setSearchFilters({...searchFilters, colonia: e.target.value})}
              className="input-field"
              placeholder="Buscar por colonia..."
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center"
            >
              <FiSearch className="mr-2" />
              Buscar
            </button>
            <button
              onClick={clearSearch}
              className="btn-secondary"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de personas */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Datos INE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ubicación
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
              {personas?.map((persona) => (
                <tr key={persona.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {persona.nombre}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {persona.telefono || 'Sin teléfono'}
                        </div>
                        <div className="text-xs text-secondary-400">
                          {persona.edad} años • {persona.sexo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {persona.clave_elector ? (
                        <div className="flex items-center">
                          <FiUser className="h-4 w-4 text-secondary-400 mr-1" />
                          {persona.clave_elector}
                        </div>
                      ) : (
                        <span className="text-secondary-400">Sin clave</span>
                      )}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {persona.seccion_electoral && `Sección: ${persona.seccion_electoral}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {persona.colonia && (
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 text-secondary-400 mr-1" />
                          {persona.colonia}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {persona.municipio && `${persona.municipio}, ${persona.estado}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      persona.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {persona.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(persona)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      {persona.activo && (
                        <button
                          onClick={() => handleDeactivate(persona.id)}
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

      {/* Modal para crear/editar persona */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingPersona ? 'Editar Persona' : 'Registrar Nueva Persona'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Edad</label>
                  <input
                    type="number"
                    value={formData.edad}
                    onChange={(e) => setFormData({...formData, edad: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">Dirección</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="input-field"
                  rows="2"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-secondary-900 mb-3">Datos de Credencial de Elector</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Clave de Elector</label>
                    <input
                      type="text"
                      value={formData.clave_elector}
                      onChange={(e) => setFormData({...formData, clave_elector: e.target.value})}
                      className="input-field"
                      maxLength="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">CURP</label>
                    <input
                      type="text"
                      value={formData.curp}
                      onChange={(e) => setFormData({...formData, curp: e.target.value})}
                      className="input-field"
                      maxLength="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Número de Emisión</label>
                    <input
                      type="text"
                      value={formData.num_emision}
                      onChange={(e) => setFormData({...formData, num_emision: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-secondary-900 mb-3">Ubicación Electoral</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Sección Electoral</label>
                    <input
                      type="text"
                      value={formData.seccion_electoral}
                      onChange={(e) => setFormData({...formData, seccion_electoral: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Distrito</label>
                    <input
                      type="text"
                      value={formData.distrito}
                      onChange={(e) => setFormData({...formData, distrito: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Municipio</label>
                    <input
                      type="text"
                      value={formData.municipio}
                      onChange={(e) => setFormData({...formData, municipio: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Estado</label>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Colonia</label>
                    <input
                      type="text"
                      value={formData.colonia}
                      onChange={(e) => setFormData({...formData, colonia: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Código Postal</label>
                    <input
                      type="text"
                      value={formData.codigo_postal}
                      onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                      className="input-field"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitud}
                      onChange={(e) => setFormData({...formData, latitud: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitud}
                      onChange={(e) => setFormData({...formData, longitud: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={geocodificarDireccion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiMapPin className="h-4 w-4 mr-2" />
                    Obtener coordenadas automáticamente
                  </button>
                  <p className="text-xs text-secondary-500 mt-1">
                    Ingresa la dirección, colonia, municipio y estado, luego haz clic para obtener las coordenadas
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acepta_politica"
                    checked={formData.acepta_politica}
                    onChange={(e) => setFormData({...formData, acepta_politica: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="acepta_politica" className="ml-2 block text-sm text-secondary-900">
                    Acepta la política de privacidad y el uso de datos
                  </label>
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
                  disabled={createPersonaMutation.isLoading || updatePersonaMutation.isLoading}
                  className="btn-primary"
                >
                  {createPersonaMutation.isLoading || updatePersonaMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de invitación para registro de personas */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Invitar registro de persona</h2>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInvitePersona}
                className="btn-primary"
              >
                Generar invitación
              </button>
            </div>
            {typeof inviteToken === 'string' && inviteToken.length > 0 && !inviteToken.startsWith('[object') && (
              <div className="mt-6 text-center">
                <p className="mb-2 text-sm">Escanea este QR para registrar una persona:</p>
                <QRCodeCanvas value={`http://localhost:3000/registro-persona-invitacion?token=${String(inviteToken)}`} size={180} />
                <p className="mt-2 break-all text-xs">O comparte este enlace:<br />
                  <a href={`http://localhost:3000/registro-persona-invitacion?token=${String(inviteToken)}`} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                    {`http://localhost:3000/registro-persona-invitacion?token=${String(inviteToken)}`}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Personas; 