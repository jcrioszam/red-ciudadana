import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiStar, 
  FiCalendar,
  FiTag,
  FiLink,
  FiImage,
  FiSave,
  FiX,
  FiSearch,
  FiFilter,
  FiUpload,
  FiCheck
} from 'react-icons/fi';
import api from '../api';

const AdminNoticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [galeriaUrls, setGaleriaUrls] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion_corta: '',
    contenido_completo: '',
    imagen_url: '',
    imagen_alt: '',
    fecha_publicacion: '',
    fecha_expiracion: '',
    activa: true,
    destacada: false,
    prioridad: 2,
    categoria: 'general',
    tags: '',
    enlace_externo: '',
    boton_texto: ''
  });

  // Categorías disponibles
  const categorias = [
    'general', 'noticias', 'anuncios', 'eventos', 
    'emergencias', 'obras', 'servicios', 'comunidad'
  ];

  // Cargar noticias
  useEffect(() => {
    cargarNoticias();
  }, []);

  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const noticiasResponse = await api.get('/admin/noticias/?limit=100');
      setNoticias(Array.isArray(noticiasResponse.data) ? noticiasResponse.data : []);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      titulo: '',
      descripcion_corta: '',
      contenido_completo: '',
      imagen_url: '',
      imagen_alt: '',
      fecha_publicacion: '',
      fecha_expiracion: '',
      activa: true,
      destacada: false,
      prioridad: 2,
      categoria: 'general',
      tags: '',
      enlace_externo: '',
      boton_texto: ''
    });
    setEditingNoticia(null);
    setSelectedFile(null);
    setPreviewImage(null);
    setGaleriaUrls([]);
  };

  // Abrir formulario para crear
  const abrirFormularioCrear = () => {
    limpiarFormulario();
    setShowForm(true);
  };

  // Abrir formulario para editar
  const abrirFormularioEditar = (noticia) => {
    setFormData({
      titulo: noticia.titulo,
      descripcion_corta: noticia.descripcion_corta || '',
      contenido_completo: noticia.contenido_completo || '',
      imagen_url: noticia.imagen_url || '',
      imagen_alt: noticia.imagen_alt || '',
      fecha_publicacion: noticia.fecha_publicacion ? noticia.fecha_publicacion.split('T')[0] : '',
      fecha_expiracion: noticia.fecha_expiracion ? noticia.fecha_expiracion.split('T')[0] : '',
      activa: noticia.activa,
      destacada: noticia.destacada,
      prioridad: noticia.prioridad,
      categoria: noticia.categoria,
      tags: noticia.tags || '',
      enlace_externo: noticia.enlace_externo || '',
      boton_texto: noticia.boton_texto || ''
    });
    // Cargar galería existente
    try {
      setGaleriaUrls(noticia.imagenes ? JSON.parse(noticia.imagenes) : []);
    } catch { setGaleriaUrls([]); }
    setEditingNoticia(noticia);
    setShowForm(true);
  };

  // Cerrar formulario
  const cerrarFormulario = () => {
    setShowForm(false);
    setErrorMsg('');
    limpiarFormulario();
  };

  // Guardar noticia
  const guardarNoticia = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validación básica frontend
    if (!formData.titulo || formData.titulo.trim().length < 5) {
      setErrorMsg('El título es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      if (payload.prioridad !== undefined) payload.prioridad = parseInt(payload.prioridad, 10);
      if (galeriaUrls.length > 0) payload.imagenes = JSON.stringify(galeriaUrls);

      if (editingNoticia) {
        await api.put(`/noticias/${editingNoticia.id}`, payload);
      } else {
        await api.post('/noticias/', payload);
      }

      await cargarNoticias();
      cerrarFormulario();
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Errores de validación Pydantic: [{loc, msg, type}]
        setErrorMsg(detail.map(e => `${e.loc?.slice(-1)[0] || 'Campo'}: ${e.msg}`).join(' | '));
      } else {
        setErrorMsg(detail || 'Error al guardar la noticia. Revisa los datos e intenta de nuevo.');
      }
    }
  };

  // Eliminar noticia
  const eliminarNoticia = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;
    
    try {
      await api.delete(`/noticias/${id}`);
      await cargarNoticias();
    } catch (error) {
      console.error('Error al eliminar noticia:', error);
      alert('Error al eliminar la noticia');
    }
  };

  // Toggle estado activo
  const toggleActiva = async (id) => {
    try {
      const noticia = noticias.find(n => n.id === id);
      await api.put(`/noticias/${id}`, { activa: !noticia.activa });
      await cargarNoticias();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const toggleDestacada = async (id) => {
    try {
      const noticia = noticias.find(n => n.id === id);
      await api.put(`/noticias/${id}`, { destacada: !noticia.destacada });
      await cargarNoticias();
    } catch (error) {
      console.error('Error al cambiar destacada:', error);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir imagen y agregar a galería
  const uploadImage = async () => {
    if (!selectedFile) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', selectedFile);
      const response = await api.post('/admin/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        const url = response.data.data.url;
        // Primera imagen también va a imagen_url principal
        setFormData(prev => ({
          ...prev,
          imagen_url: prev.imagen_url || url
        }));
        setGaleriaUrls(prev => [...prev, url]);
        setSelectedFile(null);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Eliminar imagen de galería
  const eliminarImagenGaleria = (idx) => {
    setGaleriaUrls(prev => {
      const nueva = prev.filter((_, i) => i !== idx);
      // Si se eliminó la imagen principal, actualizar imagen_url
      setFormData(fd => ({
        ...fd,
        imagen_url: idx === 0 ? (nueva[0] || '') : fd.imagen_url
      }));
      return nueva;
    });
  };

  // Mover imagen como portada (primera de galería)
  const marcarComoPortada = (idx) => {
    setGaleriaUrls(prev => {
      const nueva = [...prev];
      const [item] = nueva.splice(idx, 1);
      nueva.unshift(item);
      setFormData(fd => ({ ...fd, imagen_url: item }));
      return nueva;
    });
  };

  // Filtrar noticias
  const noticiasFiltradas = noticias.filter(noticia => {
    const matchesSearch = noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         noticia.descripcion_corta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !filterCategoria || noticia.categoria === filterCategoria;
    const matchesEstado = !filterEstado || 
                         (filterEstado === 'activas' && noticia.activa) ||
                         (filterEstado === 'inactivas' && !noticia.activa);
    
    return matchesSearch && matchesCategoria && matchesEstado;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrar Noticias</h1>
          <p className="text-gray-600">Gestiona las noticias y anuncios del banner principal</p>
        </div>
        <button
          onClick={abrirFormularioCrear}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Nueva Noticia
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategoria('');
                setFilterEstado('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de noticias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Noticia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {noticiasFiltradas.map((noticia) => (
                <tr key={noticia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {noticia.imagen_url && (
                        <img
                          src={noticia.imagen_url}
                          alt={noticia.imagen_alt || noticia.titulo}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {noticia.titulo}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {noticia.descripcion_corta}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      noticia.destacada 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <FiTag className="w-3 h-3 mr-1" />
                      {noticia.destacada ? 'Destacada' : noticia.categoria}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActiva(noticia.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        noticia.activa
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors duration-200`}
                    >
                      {noticia.activa ? (
                        <>
                          <FiEye className="w-3 h-3 mr-1" />
                          Activa
                        </>
                      ) : (
                        <>
                          <FiEyeOff className="w-3 h-3 mr-1" />
                          Inactiva
                        </>
                      )}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      noticia.prioridad === 1 ? 'bg-red-100 text-red-800' :
                      noticia.prioridad === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {noticia.prioridad === 1 ? '🔴 Alta' :
                       noticia.prioridad === 2 ? '🟡 Media' : '🟢 Baja'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 mr-1" />
                      {noticia.fecha_publicacion 
                        ? new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES')
                        : 'Sin fecha'
                      }
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => abrirFormularioEditar(noticia)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Editar"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleDestacada(noticia.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          noticia.destacada
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={noticia.destacada ? 'Quitar destacada' : 'Marcar como destacada'}
                      >
                        <FiStar className={`w-4 h-4 ${noticia.destacada ? 'text-yellow-600' : 'text-gray-400'}`} />
                      </button>
                      
                      <button
                        onClick={() => eliminarNoticia(noticia.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {noticiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron noticias con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}
              </h2>
              <button
                onClick={cerrarFormulario}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={guardarNoticia} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">(mínimo 5 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Título de la noticia"
                  />
                </div>

                {/* Descripción corta */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción corta
                    <span className="ml-1 text-xs text-gray-400 font-normal">(opcional — se genera automáticamente del contenido)</span>
                  </label>
                  <textarea
                    name="descripcion_corta"
                    value={formData.descripcion_corta}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción breve para el banner"
                  />
                </div>

                {/* Contenido completo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido completo
                  </label>
                  <textarea
                    name="contenido_completo"
                    value={formData.contenido_completo}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contenido completo de la noticia (opcional)"
                  />
                </div>

                {/* Galería de imágenes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes de la noticia
                    <span className="ml-2 text-xs text-gray-400 font-normal">La primera imagen es la portada</span>
                  </label>

                  {/* Grid de imágenes subidas */}
                  {galeriaUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {galeriaUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
                          <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-24 object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                              Portada
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => marcarComoPortada(idx)}
                                className="p-1.5 bg-blue-600 text-white rounded text-xs"
                                title="Usar como portada"
                              >
                                <FiStar className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => eliminarImagenGaleria(idx)}
                              className="p-1.5 bg-red-600 text-white rounded text-xs"
                              title="Eliminar"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subir nueva imagen */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    {previewImage && (
                      <img src={previewImage} alt="Preview" className="h-24 rounded-lg object-cover" />
                    )}
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={uploadImage}
                          disabled={uploadingImage}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {uploadingImage ? (
                            <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>Subiendo...</>
                          ) : (
                            <><FiUpload className="w-3.5 h-3.5 mr-1.5" />Subir</>
                          )}
                        </button>
                      )}
                    </div>

                    {/* URL manual */}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1.5">O agrega URL directamente</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="url"
                            id="urlManual"
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = document.getElementById('urlManual').value.trim();
                            if (!val) return;
                            setGaleriaUrls(prev => [...prev, val]);
                            setFormData(fd => ({ ...fd, imagen_url: fd.imagen_url || val }));
                            document.getElementById('urlManual').value = '';
                          }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alt text */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Texto alternativo (accesibilidad)</label>
                    <input
                      type="text"
                      name="imagen_alt"
                      value={formData.imagen_alt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción breve de la imagen"
                    />
                  </div>
                </div>

                {/* Fecha de publicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de publicación
                  </label>
                  <input
                    type="date"
                    name="fecha_publicacion"
                    value={formData.fecha_publicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha de expiración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de expiración
                  </label>
                  <input
                    type="date"
                    name="fecha_expiracion"
                    value={formData.fecha_expiracion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>🔴 Alta</option>
                    <option value={2}>🟡 Media</option>
                    <option value={3}>🟢 Baja</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                {/* Enlace externo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enlace externo
                  </label>
                  <div className="relative">
                    <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      name="enlace_externo"
                      value={formData.enlace_externo}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>

                {/* Texto del botón */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    name="boton_texto"
                    value={formData.boton_texto}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leer más"
                  />
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="activa"
                        checked={formData.activa}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Activa</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="destacada"
                        checked={formData.destacada}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Destacada</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mensaje de error */}
              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  {editingNoticia ? 'Actualizar' : 'Crear'} Noticia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticias;
