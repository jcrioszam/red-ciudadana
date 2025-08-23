import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiMapPin, FiCalendar, FiFilter, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import api from '../api';

export default function ListaReportesPublica() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
    busqueda: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar reportes al montar el componente
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportes-ciudadanos/publicos');
      
      if (response.status === 200) {
        setReportes(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setError('Error al cargar los reportes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    // Aquí se aplicarían los filtros al backend
    // Por ahora solo recargamos todos los reportes
    cargarReportes();
  };

  const limpiarFiltros = () => {
    setFiltros({
      categoria: '',
      estado: '',
      fecha_inicio: '',
      fecha_fin: '',
      busqueda: ''
    });
    cargarReportes();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const obtenerColorCategoria = (categoria) => {
    switch (categoria?.toLowerCase()) {
      case 'infraestructura':
        return 'bg-blue-100 text-blue-800';
      case 'seguridad':
        return 'bg-red-100 text-red-800';
      case 'medio ambiente':
        return 'bg-green-100 text-green-800';
      case 'transporte':
        return 'bg-purple-100 text-purple-800';
      case 'salud':
        return 'bg-pink-100 text-pink-800';
      case 'educación':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={cargarReportes}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mr-6"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                Volver al inicio
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reportes Ciudadanos</h1>
                <p className="text-sm text-gray-500">Visualiza todos los reportes de la comunidad</p>
              </div>
            </div>
            
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <FiFilter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    placeholder="Buscar en reportes..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Medio Ambiente">Medio Ambiente</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Salud">Salud</option>
                  <option value="Educación">Educación</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Fecha fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Botones de filtros */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={aplicarFiltros}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={limpiarFiltros}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reportes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reportes.length === 0 ? (
          <div className="text-center py-12">
            <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes</h3>
            <p className="text-gray-500">No se encontraron reportes ciudadanos.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reportes.map((reporte) => (
              <div key={reporte.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{reporte.titulo}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorCategoria(reporte.categoria)}`}>
                          {reporte.categoria}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(reporte.estado)}`}>
                          {reporte.estado || 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{reporte.descripcion}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="w-4 h-4" />
                        {reporte.ubicacion}
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        {formatearFecha(reporte.fecha_creacion)}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-4 lg:mt-0 lg:ml-4">
                    <button
                      onClick={() => navigate(`/mapa-reportes?id=${reporte.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <FiMapPin className="w-4 h-4" />
                      Ver en Mapa
                    </button>
                  </div>
                </div>

                {/* Fotos si existen */}
                {reporte.fotos && reporte.fotos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Fotos del reporte:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {reporte.fotos.slice(0, 4).map((foto, index) => (
                        <img
                          key={index}
                          src={foto.url || foto}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                      {reporte.fotos.length > 4 && (
                        <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                          +{reporte.fotos.length - 4} más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
