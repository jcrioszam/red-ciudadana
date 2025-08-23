import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCamera, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import api from '../api';

export default function ReportesCiudadanosPublico() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    ubicacion: '',
    latitud: null,
    longitud: null,
    contacto_email: '',
    fotos: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const categorias = [
    'Infraestructura',
    'Seguridad',
    'Medio Ambiente',
    'Transporte',
    'Salud',
    'Educación',
    'Otros'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      fotos: [...prev.fotos, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }
    
    if (!formData.categoria) {
      newErrors.categoria = 'Selecciona una categoría';
    }
    
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      submitData.append('titulo', formData.titulo);
      submitData.append('descripcion', formData.descripcion);
      submitData.append('categoria', formData.categoria);
      submitData.append('ubicacion', formData.ubicacion);
      submitData.append('latitud', formData.latitud || '');
      submitData.append('longitud', formData.longitud || '');
      submitData.append('contacto_email', formData.contacto_email);
      submitData.append('es_publico', 'true');
      
      // Agregar fotos
      formData.fotos.forEach((foto, index) => {
        submitData.append(`fotos`, foto);
      });

      // Enviar reporte público
      const response = await api.post('/reportes-ciudadanos/publico', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      setErrors({ general: 'Error al crear el reporte. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Reporte Enviado!</h2>
          <p className="text-gray-600 mb-6">
            Tu reporte ha sido enviado exitosamente. Será revisado y procesado por nuestro equipo.
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo a la página principal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Volver al inicio
            </button>
            <div className="ml-6">
              <h1 className="text-xl font-bold text-gray-900">Crear Reporte Ciudadano</h1>
              <p className="text-sm text-gray-500">Reporta un incidente o problema en tu comunidad</p>
            </div>
          </div>
        </div>
      </header>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título del Reporte *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe brevemente el problema"
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.categoria ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.categoria && (
                <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.descripcion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe detalladamente el problema, incluye información relevante como fecha, hora, personas involucradas, etc."
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.ubicacion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dirección, colonia, referencia, etc."
                />
                <FiMapPin className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
              {errors.ubicacion && (
                <p className="mt-1 text-sm text-red-600">{errors.ubicacion}</p>
              )}
            </div>

            {/* Email de contacto (opcional) */}
            <div>
              <label htmlFor="contacto_email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de Contacto (Opcional)
              </label>
              <input
                type="email"
                id="contacto_email"
                name="contacto_email"
                value={formData.contacto_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="tu@email.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                Si proporcionas tu email, podremos contactarte para más detalles o seguimiento.
              </p>
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiCamera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="fotos" className="cursor-pointer">
                    <span className="text-indigo-600 hover:text-indigo-500 font-medium">
                      Selecciona archivos
                    </span>
                    <span className="text-gray-500"> o arrastra y suelta</span>
                  </label>
                  <input
                    id="fotos"
                    name="fotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF hasta 10MB cada una
                </p>
              </div>
              
              {/* Mostrar fotos seleccionadas */}
              {formData.fotos.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Fotos seleccionadas:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.fotos.map((foto, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(foto)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <FiAlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Reporte'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
