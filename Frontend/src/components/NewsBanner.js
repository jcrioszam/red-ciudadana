import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiClock, FiTag } from 'react-icons/fi';
import api from '../api';

const NewsBanner = () => {
  const [noticias, setNoticias] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar noticias del banner
  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        setLoading(true);
        const response = await api.get('/noticias/banner/?limit=5');
        setNoticias(response.data.data || []);
      } catch (error) {
        console.error('Error al cargar noticias:', error);
        setError('No se pudieron cargar las noticias');
      } finally {
        setLoading(false);
      }
    };

    cargarNoticias();
  }, []);

  // Auto-rotación del carrusel
  useEffect(() => {
    if (noticias.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === noticias.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [noticias.length]);

  // Navegación manual
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? noticias.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === noticias.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || noticias.length === 0) {
    return null; // No mostrar nada si hay error o no hay noticias
  }

  const currentNoticia = noticias[currentIndex];

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título de la sección */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Noticias y Anuncios
          </h2>
          <p className="text-lg text-gray-600">
            Mantente informado sobre los acontecimientos de tu comunidad
          </p>
        </div>

        {/* Banner principal */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Imagen de fondo */}
          {currentNoticia.imagen_url && (
            <div className="absolute inset-0">
              <img
                src={currentNoticia.imagen_url}
                alt={currentNoticia.imagen_alt || currentNoticia.titulo}
                className="w-full h-full object-cover"
              />
              {/* Overlay para mejorar legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
            </div>
          )}

          {/* Contenido de la noticia */}
          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-3xl">
              {/* Badges de categoría y prioridad */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  currentNoticia.destacada 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  <FiTag className="w-3 h-3 mr-1" />
                  {currentNoticia.destacada ? 'Destacada' : currentNoticia.categoria}
                </span>
                
                {currentNoticia.prioridad === 1 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🔴 Alta Prioridad
                  </span>
                )}
              </div>

              {/* Título */}
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {currentNoticia.titulo}
              </h3>

              {/* Descripción */}
              <p className="text-lg text-gray-100 mb-6 leading-relaxed">
                {currentNoticia.descripcion_corta}
              </p>

              {/* Fecha y botón */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-200">
                  <FiClock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {currentNoticia.fecha_publicacion 
                      ? new Date(currentNoticia.fecha_publicacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Publicado recientemente'
                    }
                  </span>
                </div>

                {currentNoticia.enlace_externo && (
                  <a
                    href={currentNoticia.enlace_externo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    {currentNoticia.boton_texto || 'Leer más'}
                    <FiExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Controles de navegación */}
          {noticias.length > 1 && (
            <>
              {/* Botones de navegación */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Noticia anterior"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Siguiente noticia"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>

              {/* Indicadores de posición */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-2">
                  {noticias.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Ir a noticia ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Lista de noticias adicionales */}
        {noticias.length > 1 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticias.slice(0, 3).map((noticia, index) => (
              <div
                key={noticia.id}
                className={`bg-white rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                  index === currentIndex ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => goToSlide(index)}
              >
                {noticia.imagen_url && (
                  <div className="mb-4">
                    <img
                      src={noticia.imagen_url}
                      alt={noticia.imagen_alt || noticia.titulo}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    noticia.destacada 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {noticia.destacada ? 'Destacada' : noticia.categoria}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {noticia.titulo}
                </h4>

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {noticia.descripcion_corta}
                </p>

                <div className="flex items-center text-xs text-gray-500">
                  <FiClock className="w-3 h-3 mr-1" />
                  {noticia.fecha_publicacion 
                    ? new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Reciente'
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsBanner;
