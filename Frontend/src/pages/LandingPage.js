import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiAlertTriangle, FiUsers, FiCalendar, FiBarChart, FiArrowRight, FiPlus, FiEye, FiMap } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hero');

  // Si el usuario ya está logueado, redirigir al dashboard
  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = () => {
    navigate('/login');
  };

  const handleCreateReport = () => {
    navigate('/reportes-ciudadanos');
  };

  const handleViewMap = () => {
    navigate('/mapa-reportes');
  };

  const handleViewReports = () => {
    navigate('/lista-reportes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Público */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">RC</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Red Ciudadana</h1>
                <p className="text-sm text-gray-500">Sistema de Gestión</p>
              </div>
            </div>

            {/* Botón de Login */}
            <button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <FiUsers className="w-4 h-4" />
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Plataforma de
            <span className="text-indigo-600 block">Reportes Ciudadanos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema integral para la gestión de reportes ciudadanos, eventos comunitarios y movilización social. 
            Reporta incidentes, participa en eventos y contribuye a mejorar tu comunidad.
          </p>
          
          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreateReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <FiPlus className="w-5 h-5" />
              Crear Reporte
            </button>
            <button
              onClick={handleViewMap}
              className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <FiMap className="w-5 h-5" />
              Ver Mapa
            </button>
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características Principales
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Reportes Ciudadanos */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Reportes Ciudadanos</h3>
              <p className="text-gray-600">
                Reporta incidentes, problemas o sugerencias en tu comunidad. 
                Sistema abierto y accesible para todos los ciudadanos.
              </p>
            </div>

            {/* Mapa Interactivo */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mapa Interactivo</h3>
              <p className="text-gray-600">
                Visualiza todos los reportes en un mapa interactivo. 
                Filtra por categoría, fecha y ubicación.
              </p>
            </div>

            {/* Gestión Comunitaria */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Gestión Comunitaria</h3>
              <p className="text-gray-600">
                Sistema completo para líderes comunitarios. 
                Gestiona eventos, personas y movilizaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso rápido a funcionalidades */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Acceso Rápido
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Crear Reporte */}
            <div 
              onClick={handleCreateReport}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <FiPlus className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Crear Reporte</h3>
              <p className="text-sm text-gray-600 mb-4">
                Reporta un incidente o problema en tu comunidad
              </p>
              <div className="flex items-center text-indigo-600 text-sm font-medium">
                Ir a crear reporte
                <FiArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Ver Mapa */}
            <div 
              onClick={handleViewMap}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FiMap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ver Mapa</h3>
              <p className="text-sm text-gray-600 mb-4">
                Explora reportes en el mapa interactivo
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                Ver mapa
                <FiArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Lista de Reportes */}
            <div 
              onClick={handleViewReports}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FiEye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ver Reportes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Revisa todos los reportes ciudadanos
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Ver reportes
                <FiArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Acceso al Sistema */}
            <div 
              onClick={handleLogin}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Acceso Sistema</h3>
              <p className="text-sm text-gray-600 mb-4">
                Accede a funcionalidades avanzadas
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Iniciar sesión
                <FiArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Red Ciudadana</h3>
              <p className="text-gray-300">
                Plataforma integral para la gestión comunitaria y reportes ciudadanos.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Funcionalidades</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Reportes Ciudadanos</li>
                <li>• Mapa Interactivo</li>
                <li>• Gestión Comunitaria</li>
                <li>• Eventos y Movilización</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <p className="text-gray-300">
                Para más información sobre el sistema y funcionalidades avanzadas, 
                inicia sesión en la plataforma.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; {new Date().getFullYear()} Red Ciudadana. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
