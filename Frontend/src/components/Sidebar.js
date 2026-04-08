import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiHome, FiUsers, FiUserCheck, FiCalendar, FiBarChart, FiGitBranch, FiCheckSquare,
  FiClock, FiShield, FiMapPin, FiFileText, FiAlertTriangle, FiMap, FiSettings, FiMenu,
  FiX, FiDatabase, FiChevronDown, FiChevronRight, FiDownload, FiTrash2, FiActivity, FiServer
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const menu = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { to: '/usuarios', label: 'Usuarios', icon: <FiUsers /> },
  { to: '/personas', label: 'Personas', icon: <FiUserCheck /> },
  { to: '/eventos', label: 'Eventos', icon: <FiCalendar /> },
  { to: '/eventos-historicos', label: 'Eventos Históricos', icon: <FiClock /> },
  { to: '/movilizacion', label: 'Movilización', icon: <FiUsers /> },
  { to: '/reportes', label: 'Reportes', icon: <FiBarChart /> },
  { to: '/estructura-red', label: 'Estructura Red', icon: <FiGitBranch /> },
  { to: '/checkin', label: 'Check-in', icon: <FiCheckSquare /> },
  { to: '/seguimiento', label: 'Seguimiento', icon: <FiMapPin /> },
  { to: '/noticias', label: 'Noticias', icon: <FiFileText /> },
  { to: '/reportes-ciudadanos', label: 'Reportes Ciudadanos', icon: <FiAlertTriangle /> },
  { to: '/mapa-reportes', label: 'Mapa de Reportes', icon: <FiMap /> },
  { to: '/seguimiento-reportes', label: 'Seguimiento Reportes', icon: <FiAlertTriangle /> },
  { to: '/perfil', label: 'Perfil', icon: <FiUserCheck /> },
  { to: '/admin-perfiles', label: 'Administrar Perfiles', icon: <FiShield /> },
  { to: '/admin-dashboard', label: 'Administrar Dashboard', icon: <FiSettings /> },
  { to: '/admin-tipos-reporte', label: 'Tipos de Reporte', icon: <FiSettings /> },
  { to: '/admin-noticias', label: 'Administrar Noticias', icon: <FiFileText /> },
  { to: '/admin-padron', label: 'Padrón Electoral', icon: <FiUsers /> },
  {
    to: '/admin-database',
    label: 'Administración BD',
    icon: <FiDatabase />,
    hasSubmenu: true,
    submenu: [
      { to: '/admin/database/stats', label: 'Estadísticas BD', icon: <FiBarChart /> },
      { to: '/admin/database/optimize', label: 'Optimizar BD', icon: <FiSettings /> },
      { to: '/admin/database/maintenance', label: 'Mantenimiento', icon: <FiActivity /> },
      { to: '/admin/database/backup', label: 'Crear Backup', icon: <FiDownload /> },
      { to: '/admin/database/clean', label: 'Limpiar Reportes', icon: <FiTrash2 /> },
      { to: '/admin/database/status', label: 'Estado BD', icon: <FiServer /> }
    ]
  }
];

const mapeoPermisos = {
  'eventos-historicos': 'eventos-historicos',
  'estructura-red': 'estructura-red',
  'reportes-ciudadanos': 'reportes_ciudadanos',
  'mapa-reportes': 'reportes_ciudadanos',
  'seguimiento-reportes': 'seguimiento_reportes',
  'admin-perfiles': 'admin-perfiles',
  'admin-dashboard': 'admin-perfiles',
  'admin-tipos-reporte': 'admin-perfiles',
  'admin-noticias': 'admin-perfiles'
};

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const { data: configuracionPerfil } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        const response = await api.get('/perfiles/mi-configuracion');
        return response.data;
      } catch {
        if (user?.rol === 'admin') {
          return {
            rol: 'admin',
            configuracion: {
              opciones_web: [
                "dashboard", "usuarios", "personas", "eventos", "eventos-historicos",
                "movilizacion", "reportes", "estructura-red", "checkin", "perfil",
                "admin-perfiles", "admin-database", "seguimiento", "noticias",
                "reportes_ciudadanos", "seguimiento_reportes"
              ],
              opciones_app: ["register", "perfil", "eventos-historicos", "dashboard",
                "seguimiento", "movilizador-seguimiento", "noticias", "reportes_ciudadanos"]
            }
          };
        }
        return null;
      }
    },
    { enabled: !!user?.rol, staleTime: 5 * 60 * 1000, retry: 3, retryDelay: 1000 }
  );

  useEffect(() => {
    const base = process.env.NODE_ENV === 'production'
      ? 'https://red-ciudadana-production.up.railway.app'
      : 'http://localhost:8000';
    setLogoUrl(`${base}/logo?t=${Date.now()}`);
  }, [location.pathname]);

  const opcionesPermitidas = configuracionPerfil?.configuracion?.opciones_web || [];

  const tienePermiso = (item) => {
    if (user?.rol === 'admin') return true;
    let permiso = item.to.replace('/', '') || 'dashboard';
    permiso = mapeoPermisos[permiso] || permiso;
    return opcionesPermitidas.includes(permiso);
  };

  const menuItemStyle = (isActive, isHovered) => ({
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? 8 : 10,
    padding: isMobile ? '13px 16px' : '11px 20px',
    margin: '2px 8px',
    borderRadius: 8,
    color: isActive ? '#fff' : isHovered ? '#e8eaf6' : '#c5cae9',
    background: isActive
      ? 'rgba(255,255,255,0.18)'
      : isHovered
      ? 'rgba(255,255,255,0.08)'
      : 'transparent',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    fontSize: isMobile ? 13 : 14,
    cursor: 'pointer',
    borderLeft: isActive ? '3px solid #ffb300' : '3px solid transparent',
  });

  const renderMenuItem = (item) => {
    if (!tienePermiso(item)) return null;

    const isActive = location.pathname === item.to ||
      (item.submenu?.some(s => location.pathname === s.to));
    const isExpanded = expandedSubmenu === item.to;
    const isHovered = hoveredItem === item.to;

    if (item.hasSubmenu) {
      return (
        <li key={item.to}>
          <div
            onClick={() => setExpandedSubmenu(isExpanded ? null : item.to)}
            onMouseEnter={() => setHoveredItem(item.to)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{ ...menuItemStyle(isActive, isHovered), justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
              <span style={{ fontSize: isMobile ? 16 : 17, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </div>
            <span style={{ fontSize: 14 }}>
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>
          {isExpanded && (
            <ul style={{ listStyle: 'none', padding: '0 0 0 12px', margin: 0 }}>
              {item.submenu.map(subItem => {
                const isSubActive = location.pathname === subItem.to;
                const isSubHovered = hoveredItem === subItem.to;
                return (
                  <li key={subItem.to}>
                    <Link
                      to={subItem.to}
                      onMouseEnter={() => setHoveredItem(subItem.to)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={menuItemStyle(isSubActive, isSubHovered)}
                    >
                      <span style={{ fontSize: 15 }}>{subItem.icon}</span>
                      {subItem.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.to}>
        <Link
          to={item.to}
          onMouseEnter={() => setHoveredItem(item.to)}
          onMouseLeave={() => setHoveredItem(null)}
          style={menuItemStyle(isActive, isHovered)}
        >
          <span style={{ fontSize: isMobile ? 16 : 17, flexShrink: 0 }}>{item.icon}</span>
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Botón menú móvil */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          position: 'fixed', top: 15, left: 15, zIndex: 1001,
          background: '#1a237e', border: 'none', borderRadius: 8,
          padding: 10, color: 'white', cursor: 'pointer',
          display: isMobile ? 'flex' : 'none', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }}
      >
        {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Overlay móvil */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }}
        />
      )}

      {/* Sidebar */}
      <nav style={{
        width: isMobile ? '100vw' : 220,
        minWidth: isMobile ? '100vw' : 220,
        background: 'linear-gradient(180deg, #1a237e 0%, #3949ab 100%)',
        height: '100vh',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, zIndex: 1000,
        transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease-in-out',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '80px 20px 16px' : '28px 20px 16px'
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: 90, maxHeight: 90, borderRadius: 10, background: '#fff' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.5, color: '#fff' }}>
              Red Ciudadana
            </div>
          )}
        </div>

        {/* Menú */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
          {menu.map(item => renderMenuItem(item)).filter(Boolean)}
        </ul>

        {/* Footer con usuario */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          fontSize: 12
        }}>
          {user && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, truncate: true }}>
                {user.nombre}
              </div>
              <div style={{ color: '#c5cae9', fontSize: 11, textTransform: 'capitalize' }}>
                {user.rol?.replace(/_/g, ' ')}
              </div>
            </div>
          )}
          <div style={{ color: '#c5cae9', fontSize: 11 }}>
            © {new Date().getFullYear()} Red Ciudadana
          </div>
        </div>
      </nav>
    </>
  );
}
