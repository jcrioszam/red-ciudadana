import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMapPin, 
  FiFileText, 
  FiUsers, 
  FiSettings, 
  FiTrendingUp,
  FiShield,
  FiGlobe,
  FiAward,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import NewsBanner from '../components/NewsBanner';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">RC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Red Ciudadana</h1>
                <p className="text-sm text-gray-600">Sistema de Gestión Integral</p>
              </div>
            </div>

            {/* Botón de login */}
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FiUsers className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Banner de Noticias */}
      <NewsBanner />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Plataforma de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
              Reportes Ciudadanos
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Sistema integral para la gestión de reportes ciudadanos, eventos comunitarios y movilización social. 
            Reporta incidentes, participa en eventos y contribuye a mejorar tu comunidad.
          </p>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/reportes-publico"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              <FiFileText className="w-6 h-6 mr-3" />
              Crear Reporte
            </Link>
            
            <Link
              to="/mapa-reportes-publico"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white font-bold text-lg rounded-xl border-2 border-white hover:bg-white hover:text-blue-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FiMapPin className="w-6 h-6 mr-3" />
              Ver Mapa
            </Link>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre las herramientas que hacen de Red Ciudadana la plataforma más completa para la gestión comunitaria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reportes Ciudadanos */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiFileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reportes Ciudadanos</h3>
              <p className="text-gray-600 leading-relaxed">
                Reporta incidentes, problemas o sugerencias en tu comunidad. Sistema abierto y accesible para todos los ciudadanos.
              </p>
            </div>

            {/* Mapa Interactivo */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiMapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mapa Interactivo</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualiza todos los reportes en un mapa interactivo. Filtra por categoría, fecha y ubicación.
              </p>
            </div>

            {/* Gestión Comunitaria */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiUsers className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestión Comunitaria</h3>
              <p className="text-gray-600 leading-relaxed">
                Sistema completo para líderes comunitarios. Gestiona eventos, personas y movilizaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso Rápido */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Acceso Rápido
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accede directamente a las funcionalidades más utilizadas de la plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Crear Reporte */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <FiFileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Crear Reporte</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Reporta un incidente o problema en tu comunidad
              </p>
              <Link
                to="/reportes-publico"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200"
              >
                Ir a crear reporte →
              </Link>
            </div>

            {/* Ver Mapa */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <FiMapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ver Mapa</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Explora reportes en el mapa interactivo
              </p>
              <Link
                to="/mapa-reportes-publico"
                className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors duration-200"
              >
                Ver mapa →
              </Link>
            </div>

            {/* Ver Reportes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                <FiTrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ver Reportes</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Revisa todos los reportes ciudadanos
              </p>
              <Link
                to="/reportes"
                className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors duration-200"
              >
                Ver reportes →
              </Link>
            </div>

            {/* Acceso Sistema */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <FiSettings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Acceso Sistema</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Accede a funcionalidades avanzadas
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200"
              >
                Iniciar sesión →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Red Ciudadana?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre las ventajas que hacen de nuestra plataforma la mejor opción para la gestión comunitaria
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Transparencia */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiShield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transparencia Total</h3>
                <p className="text-gray-600">
                  Todos los reportes son visibles públicamente, promoviendo la transparencia y la rendición de cuentas.
                </p>
              </div>
            </div>

            {/* Accesibilidad */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiGlobe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Accesibilidad Universal</h3>
                <p className="text-gray-600">
                  Plataforma disponible para todos los ciudadanos, sin restricciones de acceso o registro obligatorio.
                </p>
              </div>
            </div>

            {/* Eficiencia */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiAward className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Eficiencia Comprobada</h3>
                <p className="text-gray-600">
                  Sistema probado que ha mejorado significativamente la gestión de reportes en múltiples comunidades.
                </p>
              </div>
            </div>

            {/* Tiempo Real */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiClock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tiempo Real</h3>
                <p className="text-gray-600">
                  Actualizaciones en tiempo real y notificaciones instantáneas sobre el estado de los reportes.
                </p>
              </div>
            </div>

            {/* Seguridad */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiShield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Seguridad Garantizada</h3>
                <p className="text-gray-600">
                  Protección de datos y privacidad de los usuarios con estándares de seguridad de nivel empresarial.
                </p>
              </div>
            </div>

            {/* Soporte */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Soporte Continuo</h3>
                <p className="text-gray-600">
                  Equipo de soporte disponible para resolver dudas y proporcionar asistencia técnica cuando sea necesario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para mejorar tu comunidad?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a miles de ciudadanos que ya están usando Red Ciudadana para hacer de su comunidad un lugar mejor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/reportes-publico"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              <FiFileText className="w-6 h-6 mr-3" />
              Crear mi primer reporte
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white font-bold text-lg rounded-xl border-2 border-white hover:bg-white hover:text-blue-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FiUsers className="w-6 h-6 mr-3" />
              Acceder al sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">RC</span>
                </div>
                <span className="text-xl font-bold">Red Ciudadana</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema integral para la gestión de reportes ciudadanos y eventos comunitarios.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Funcionalidades</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/reportes-publico" className="hover:text-white transition-colors">Crear Reporte</Link></li>
                <li><Link to="/mapa-reportes-publico" className="hover:text-white transition-colors">Ver Mapa</Link></li>
                <li><Link to="/reportes" className="hover:text-white transition-colors">Ver Reportes</Link></li>
                <li><Link to="/eventos" className="hover:text-white transition-colors">Eventos</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Sistema</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Administración</Link></li>
                <li><Link to="/ayuda" className="hover:text-white transition-colors">Ayuda</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📧 info@redciudadana.com</li>
                <li>📱 +52 644 123 4567</li>
                <li>📍 Navojoa, Sonora, México</li>
                <li>🕒 Lun-Vie 8:00 - 18:00</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Red Ciudadana. Todos los derechos reservados. | 
              <Link to="/privacidad" className="hover:text-white transition-colors ml-2">Política de Privacidad</Link> | 
              <Link to="/terminos" className="hover:text-white transition-colors ml-2">Términos de Uso</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
