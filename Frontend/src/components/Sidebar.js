import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiHome, FiUsers, FiUserCheck, FiCalendar, FiBarChart, FiGitBranch, FiCheckSquare, FiClock, FiShield, FiMapPin, FiFileText, FiAlertTriangle, FiMap, FiSettings, FiMenu, FiX
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const menu = [
  { to: '/', label: 'Dashboard', icon: <FiHome /> },
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
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = React.useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Obtener configuración de permisos del usuario actual
  const { data: configuracionPerfil } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      try {
        // Usar el endpoint que permite a cada usuario obtener su propia configuración
        const response = await api.get('/perfiles/mi-configuracion');
        return response.data;
      } catch (error) {
        console.error('Error al obtener configuración del perfil:', error);
        return null;
      }
    },
    {
      enabled: !!user?.rol,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  // Refresca el logo cada vez que se monta el Sidebar o cambia la ruta
  React.useEffect(() => {
    // Usar backend directo para consistencia
    const baseURL = process.env.NODE_ENV === 'production' ? 'https://red-ciudadana-production.up.railway.app' : 'http://localhost:8000';
    setLogoUrl(`${baseURL}/logo?` + Date.now());
  }, [location.pathname]);

  // Botón de menú móvil
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 1001,
        background: '#1a237e',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        color: 'white',
        cursor: 'pointer',
        display: isMobile ? 'block' : 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
    </button>
  );

  // Estilos del sidebar
  const sidebarStyles = {
    width: isMobile ? '100vw' : 220,
    minWidth: isMobile ? '100vw' : 220,
    maxWidth: isMobile ? '100vw' : 220,
    background: 'linear-gradient(180deg, #1a237e 0%, #3949ab 100%)',
    height: '100vh',
    padding: 0,
    boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
    transition: 'transform 0.3s ease-in-out',
    overflowY: 'auto'
  };

  // Overlay para móvil
  const MobileOverlay = () => (
    isMobile && isMobileMenuOpen ? (
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
      />
    ) : null
  );

  return (
    <>
      <MobileMenuButton />
      <MobileOverlay />
      <nav style={sidebarStyles}>
        <div>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 20, 
            marginTop: isMobile ? 80 : 32,
            padding: isMobile ? '0 20px' : '0'
          }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                style={{ 
                  maxWidth: isMobile ? 80 : 120, 
                  maxHeight: isMobile ? 80 : 120, 
                  margin: '0 auto', 
                  borderRadius: 12, 
                  background: '#fff' 
                }} 
                onError={e => { e.target.style.display = 'none'; }} 
              />
            ) : (
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: isMobile ? 18 : 22, 
                letterSpacing: 1, 
                padding: isMobile ? '20px 0 16px 0' : '32px 0 24px 0' 
              }}>
                Red Ciudadana
              </div>
            )}
          </div>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            paddingBottom: isMobile ? 20 : 0
          }}>
            {menu.map(item => {
              // Verificar si el usuario tiene permiso para ver esta opción
              const opcionesPermitidas = configuracionPerfil?.configuracion?.opciones_web || [];
              
              // Convertir la ruta del menú al formato de permisos del backend
              let permisoRequerido = item.to.replace('/', '');
              if (permisoRequerido === '') permisoRequerido = 'dashboard';
              
              // Mapeo específico para coincidir con el backend
              const mapeoPermisos = {
                'eventos-historicos': 'eventos-historicos',
                'estructura-red': 'estructura-red',
                'reportes-ciudadanos': 'reportes_ciudadanos',
                'mapa-reportes': 'reportes_ciudadanos', // Usar los mismos permisos que reportes ciudadanos
                'seguimiento-reportes': 'seguimiento_reportes',
                'admin-perfiles': 'admin-perfiles',
                'admin-dashboard': 'admin-perfiles' // Usar los mismos permisos que admin-perfiles
              };
              
              // Aplicar mapeo si existe, sino usar el valor original
              permisoRequerido = mapeoPermisos[permisoRequerido] || permisoRequerido;
              
              const tienePermiso = opcionesPermitidas.includes(permisoRequerido);
              
              // Debug logs para desarrollo
              if (process.env.NODE_ENV === 'development') {
                console.log(`Sidebar - Checking ${item.to} permission:`);
                console.log(`  - User role: ${user?.rol}`);
                console.log(`  - Permiso requerido: ${permisoRequerido}`);
                console.log(`  - Opciones permitidas:`, opcionesPermitidas);
                console.log(`  - Tiene permiso: ${tienePermiso}`);
              }
              
              // VALIDACIÓN DE PERMISOS HABILITADA: Si no tiene permiso, no mostrar la opción
              if (!tienePermiso) return null;
              
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 12,
                      padding: isMobile ? '16px 20px' : '14px 32px',
                      color: location.pathname === item.to ? '#fff' : '#c5cae9',
                      background: location.pathname === item.to ? 'rgba(255,255,255,0.10)' : 'none',
                      fontWeight: location.pathname === item.to ? 'bold' : 'normal',
                      textDecoration: 'none',
                      borderLeft: location.pathname === item.to ? '4px solid #ffb300' : '4px solid transparent',
                      transition: 'background 0.2s, color 0.2s',
                      fontSize: isMobile ? '14px' : '16px'
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 18 : 20 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div style={{ 
          padding: isMobile ? '16px 20px' : 24, 
          textAlign: 'center', 
          fontSize: isMobile ? 11 : 13, 
          color: '#c5cae9', 
          borderTop: '1px solid #283593' 
        }}>
          <div>© {new Date().getFullYear()} Red Ciudadana</div>
          <div style={{ fontSize: isMobile ? 9 : 11, marginTop: 4 }}>Institucional</div>
        </div>
      </nav>
    </>
  );
} 