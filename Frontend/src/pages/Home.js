import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiFileText, FiUsers, FiChevronLeft, FiChevronRight,
  FiArrowRight, FiMenu, FiX, FiClock, FiAlertCircle
} from 'react-icons/fi';
import api from '../api';

/* ─── utilidad de fecha ───────────────────────────────────── */
const fmtFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Categoría → color ───────────────────────────────────── */
const catColor = {
  general:     'bg-blue-600',
  noticias:    'bg-indigo-600',
  anuncios:    'bg-amber-500',
  eventos:     'bg-green-600',
  emergencias: 'bg-red-600',
  obras:       'bg-orange-500',
  servicios:   'bg-teal-600',
  comunidad:   'bg-purple-600',
};

/* ═══════════════════════════════════════════════════════════
   FLYER CARD — muestra una noticia tipo póster con galería
═══════════════════════════════════════════════════════════ */
const FlyerCard = ({ noticia, featured = false }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = [
    ...(noticia.imagen_url ? [noticia.imagen_url] : []),
    ...(noticia.imagenes || []).filter(u => u !== noticia.imagen_url),
  ];
  const uniqueImgs = [...new Set(imgs)];

  const prev = (e) => { e.stopPropagation(); setImgIdx(i => (i === 0 ? uniqueImgs.length - 1 : i - 1)); };
  const next = (e) => { e.stopPropagation(); setImgIdx(i => (i === uniqueImgs.length - 1 ? 0 : i + 1)); };

  const bgColor = catColor[noticia.categoria] || 'bg-blue-600';
  const imgSrc = uniqueImgs[imgIdx];

  if (featured) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 group" style={{ minHeight: 380 }}>
        {/* Imagen */}
        {imgSrc ? (
          <img src={imgSrc} alt={noticia.titulo} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
        ) : (
          <div className={`absolute inset-0 ${bgColor} opacity-90`} />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Navegación de imágenes */}
        {uniqueImgs.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition">
              <FiChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {uniqueImgs.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8" style={{ minHeight: 380 }}>
          <span className={`self-start px-3 py-1 rounded-full text-xs font-bold text-white ${bgColor} mb-3`}>
            {noticia.categoria?.toUpperCase()}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">{noticia.titulo}</h2>
          {noticia.descripcion_corta && (
            <p className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4">{noticia.descripcion_corta}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="flex items-center text-gray-300 text-xs">
              <FiClock className="w-3.5 h-3.5 mr-1" />{fmtFecha(noticia.fecha_publicacion)}
            </span>
            {noticia.enlace_externo && (
              <a href={noticia.enlace_externo} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition">
                {noticia.boton_texto || 'Ver más'} <FiArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card pequeña
  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-900 group cursor-pointer hover:-translate-y-1 transition-transform duration-300" style={{ minHeight: 220 }}>
      {imgSrc ? (
        <img src={imgSrc} alt={noticia.titulo} className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-85 transition-opacity duration-300" />
      ) : (
        <div className={`absolute inset-0 ${bgColor} opacity-80`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

      {uniqueImgs.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 text-white rounded-full text-xs">
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 text-white rounded-full text-xs">
            <FiChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="relative z-10 h-full flex flex-col justify-end p-4" style={{ minHeight: 220 }}>
        <span className={`self-start px-2 py-0.5 rounded-full text-xs font-bold text-white ${bgColor} mb-2`}>
          {noticia.categoria}
        </span>
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-1">{noticia.titulo}</h3>
        <span className="flex items-center text-gray-300 text-xs">
          <FiClock className="w-3 h-3 mr-1" />{fmtFecha(noticia.fecha_publicacion)}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════ */
const Home = () => {
  const [noticias, setNoticias] = useState([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroTimer = useRef(null);

  // Scroll para header sticky
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cargar noticias
  useEffect(() => {
    api.get('/noticias/banner/?limit=6')
      .then(res => setNoticias(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingNoticias(false));
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(heroTimer.current), []);

  const featured = noticias[0];
  const resto = noticias.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── HEADER STICKY ─────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-base">RC</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-extrabold text-gray-900 leading-none text-lg">Red Ciudadana</p>
                <p className="text-xs text-gray-500 leading-none">Sistema de Gestión Integral</p>
              </div>
            </div>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#noticias" className="hover:text-blue-600 transition-colors">Noticias</a>
              <Link to="/reportes-publico" className="hover:text-blue-600 transition-colors">Reportes</Link>
              <Link to="/mapa-reportes-publico" className="hover:text-blue-600 transition-colors">Mapa</Link>
            </nav>

            {/* Botón login + hamburger */}
            <div className="flex items-center gap-3">
              <Link to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow">
                <FiUsers className="w-4 h-4" /> Iniciar Sesión
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600">
                {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 text-sm font-medium text-gray-700">
            <a href="#noticias" onClick={() => setMenuOpen(false)} className="block py-2">Noticias</a>
            <Link to="/reportes-publico" onClick={() => setMenuOpen(false)} className="block py-2">Reportes</Link>
            <Link to="/mapa-reportes-publico" onClick={() => setMenuOpen(false)} className="block py-2">Mapa</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="block text-center py-2.5 bg-blue-600 text-white rounded-lg font-semibold">
              Iniciar Sesión
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="pt-16 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Patrón */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-semibold mb-6">
            Plataforma ciudadana activa
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Tu voz,<br className="hidden sm:block" />{' '}
            <span className="text-blue-200">tu comunidad</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Reporta incidentes, mantente informado y participa activamente en la mejora de tu entorno.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/reportes-publico"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-blue-800 font-bold rounded-xl shadow-xl hover:bg-blue-50 transition-all hover:-translate-y-0.5">
              <FiFileText className="w-5 h-5" /> Crear Reporte
            </Link>
            <Link to="/mapa-reportes-publico"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 border border-white/40 text-white font-bold rounded-xl hover:bg-white/20 transition-all hover:-translate-y-0.5">
              <FiMapPin className="w-5 h-5" /> Ver Mapa
            </Link>
          </div>
        </div>

        {/* Ola inferior */}
        <div className="relative h-12 overflow-hidden">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── NOTICIAS TIPO FLYER ────────────────────────────── */}
      <section id="noticias" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Encabezado */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Noticias y Anuncios</h2>
              <p className="text-gray-500 text-sm mt-1">Información actualizada de tu comunidad</p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> EN VIVO
            </span>
          </div>

          {loadingNoticias ? (
            /* Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-gray-200 animate-pulse" style={{ height: 260 }} />
              ))}
            </div>
          ) : noticias.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No hay noticias publicadas aún.</p>
            </div>
          ) : (
            <>
              {/* Noticia destacada (grande) */}
              {featured && (
                <div className="mb-5">
                  <FlyerCard noticia={featured} featured />
                </div>
              )}

              {/* Resto en grid */}
              {resto.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resto.map(n => <FlyerCard key={n.id} noticia={n} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── ACCIONES RÁPIDAS ──────────────────────────────── */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">¿Qué quieres hacer?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/reportes-publico"
              className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors group">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Crear Reporte</p>
                <p className="text-sm text-gray-500">Reporta un problema en tu comunidad</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link to="/mapa-reportes-publico"
              className="flex items-center gap-4 p-5 rounded-2xl bg-green-50 hover:bg-green-100 border border-green-100 transition-colors group">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiMapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Ver Mapa</p>
                <p className="text-sm text-gray-500">Explora reportes en el mapa interactivo</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-green-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link to="/login"
              className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors group">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Acceso al Sistema</p>
                <p className="text-sm text-gray-500">Inicia sesión para gestionar reportes</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-indigo-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">RC</span>
              </div>
              <div>
                <p className="text-white font-bold leading-none">Red Ciudadana</p>
                <p className="text-xs">Sistema de Gestión Integral</p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/reportes-publico" className="hover:text-white transition-colors">Crear Reporte</Link>
              <Link to="/mapa-reportes-publico" className="hover:text-white transition-colors">Mapa</Link>
              <Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
            </nav>

            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Red Ciudadana. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
