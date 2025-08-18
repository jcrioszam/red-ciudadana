import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiUser, FiKey } from 'react-icons/fi';
import api from '../api';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

const Usuarios = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    edad: '',
    sexo: '',
    rol: 'capturista',
    id_lider_superior: null,
    password: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('lider_zona');
  const [inviteToken, setInviteToken] = useState('');

  const queryClient = useQueryClient();

  // Obtener lista de usuarios
  const { data: usuarios, isLoading } = useQuery('usuarios', async () => {
    const response = await api.get('/users/');
    return response.data;
  });

  // Obtener líderes para el select
  const { data: lideres } = useQuery('lideres', async () => {
    const response = await api.get('/users/');
    // Incluir presidente y admin como posibles superiores
    return response.data.filter(u => u.rol.includes('lider') || u.rol === 'presidente' || u.rol === 'admin');
  });

  // Mutación para crear usuario
  const createUserMutation = useMutation(
    async (userData) => {
      const response = await api.post('/users/', userData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('usuarios');
        toast.success('Usuario creado exitosamente');
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Error al crear usuario');
      }
    }
  );

  // Mutación para actualizar usuario
  const updateUserMutation = useMutation(
    async ({ id, userData }) => {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('usuarios');
        toast.success('Usuario actualizado exitosamente');
        setShowModal(false);
        setEditingUser(null);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar usuario');
      }
    }
  );

  // Mutación para desactivar usuario
  const deactivateUserMutation = useMutation(
    async (userId) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('usuarios');
        toast.success('Usuario desactivado exitosamente');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Error al desactivar usuario');
      }
    }
  );

  // Mutación para cambiar contraseña
  const changePasswordMutation = useMutation(
    async ({ id, password }) => {
      const response = await api.put(`/users/${id}/password`, { new_password: password });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Contraseña actualizada exitosamente');
        setShowPasswordModal(false);
        setPasswordUser(null);
        setNewPassword('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar contraseña');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      edad: '',
      sexo: '',
      rol: 'capturista',
      id_lider_superior: null,
      password: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { ...formData };
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      edad: user.edad || '',
      sexo: user.sexo || '',
      rol: user.rol,
      id_lider_superior: user.id_lider_superior,
      password: ''
    });
    setShowModal(true);
  };

  const handleDeactivate = (userId) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      deactivateUserMutation.mutate(userId);
    }
  };

  const handleInvite = async () => {
    try {
      const res = await api.post(`/invitaciones/?rol=${inviteRole}`);
      console.log('Respuesta de invitación:', res.data);
      const token = res.data.token;
      if (token && typeof token === 'string') {
        setInviteToken(token);
      } else {
        console.error('Token inválido recibido:', token);
        setInviteToken('');
        toast.error('Error: Token inválido recibido del servidor');
      }
    } catch (error) {
      console.error('Error generando invitación:', error);
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

  const getRoleLabel = (role) => {
    const roleLabels = {
      'presidente': 'Presidente',
      'admin': 'Administrador',
      'lider_estatal': 'Líder Estatal',
      'lider_regional': 'Líder Regional',
      'lider_municipal': 'Líder Municipal',
      'lider_zona': 'Líder de Zona',
      'capturista': 'Capturista',
      'ciudadano': 'Ciudadano'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'presidente': 'bg-red-100 text-red-800',
      'admin': 'bg-red-100 text-red-800',
      'lider_estatal': 'bg-purple-100 text-purple-800',
      'lider_regional': 'bg-blue-100 text-blue-800',
      'lider_municipal': 'bg-green-100 text-green-800',
      'lider_zona': 'bg-yellow-100 text-yellow-800',
      'capturista': 'bg-gray-100 text-gray-800',
      'ciudadano': 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Mapa de jerarquía para roles
  const superiorPorRol = {
    'presidente': [], // No tiene superior
    'admin': [], // No tiene superior
    'lider_estatal': ['presidente'],
    'lider_regional': ['lider_estatal'],
    'lider_municipal': ['lider_regional'],
    'lider_zona': ['lider_municipal'],
    'capturista': ['lider_zona'],
    'ciudadano': [], // No tiene superior, es un rol independiente
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
          <h1 className="text-2xl font-bold text-secondary-900">Gestión de Usuarios</h1>
          <p className="text-secondary-600">Administra líderes y capturistas del sistema</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Nuevo Usuario
          </button>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteToken('');
              setInviteRole('lider_zona');
            }}
            className="btn-secondary flex items-center ml-2"
          >
            <FiKey className="mr-2" />
            Invitar líder
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Contacto
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
              {usuarios?.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {user.nombre}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.rol)}`}>
                      {getRoleLabel(user.rol)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {user.telefono || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPasswordUser(user);
                          setShowPasswordModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Cambiar contraseña"
                      >
                        <FiKey className="h-4 w-4" />
                      </button>
                      {user.activo && (
                        <button
                          onClick={() => handleDeactivate(user.id)}
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

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input-field"
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-700">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="presidente">Presidente</option>
                  <option value="admin">Administrador</option>
                  <option value="lider_estatal">Líder Estatal</option>
                  <option value="lider_regional">Líder Regional</option>
                  <option value="lider_municipal">Líder Municipal</option>
                  <option value="lider_zona">Líder de Zona</option>
                  <option value="capturista">Capturista</option>
                  <option value="ciudadano">Ciudadano</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Líder Superior</label>
                {['presidente', 'admin', 'ciudadano'].includes(formData.rol) ? (
                  <input
                    type="text"
                    className="input w-full bg-gray-100"
                    value="No aplica"
                    disabled
                  />
                ) : (
                  <select
                    className="input w-full"
                    value={formData.id_lider_superior || ''}
                    onChange={e => setFormData({ ...formData, id_lider_superior: e.target.value ? Number(e.target.value) : null })}
                    required
                  >
                    <option value="">Selecciona líder superior</option>
                    {lideres && lideres
                      .filter(l => superiorPorRol[formData.rol]?.includes(l.rol))
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre} ({getRoleLabel(l.rol)})
                        </option>
                      ))}
                  </select>
                )}
                {/* Mostrar líder actual si se está editando */}
                {editingUser && editingUser.id_lider_superior && (
                  <div className="text-xs text-secondary-500 mt-1">
                    Líder actual: {lideres?.find(l => l.id === editingUser.id_lider_superior)?.nombre || 'No encontrado'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-secondary-700">Dirección</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="input-field"
                  rows="3"
                />
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
                  disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                  className="btn-primary"
                >
                  {createUserMutation.isLoading || updateUserMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Cambiar contraseña</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                changePasswordMutation.mutate({ id: passwordUser.id, password: newPassword });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-secondary-700">Nueva contraseña para {passwordUser.nombre}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordUser(null);
                    setNewPassword('');
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="btn-primary"
                >
                  {changePasswordMutation.isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Invitar líder</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Tipo de líder a invitar</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="input-field"
              >
                <option value="lider_zona">Líder de Zona</option>
                <option value="lider_municipal">Líder Municipal</option>
                <option value="lider_regional">Líder Regional</option>
                <option value="lider_estatal">Líder Estatal</option>
              </select>
            </div>
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
                onClick={handleInvite}
                className="btn-primary"
              >
                Generar invitación
              </button>
            </div>
            {typeof inviteToken === 'string' && inviteToken.length > 0 && !inviteToken.startsWith('[object') && (
              <div className="mt-6 text-center">
                <p className="mb-2 text-sm">Escanea este QR para registrarte:</p>
                <QRCodeCanvas value={`http://localhost:3000/registro-invitacion?token=${String(inviteToken)}`} size={180} />
                <p className="mt-2 break-all text-xs">O comparte este enlace:<br />
                  <a href={`http://localhost:3000/registro-invitacion?token=${String(inviteToken)}`} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                    {`http://localhost:3000/registro-invitacion?token=${String(inviteToken)}`}
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

export default Usuarios; 