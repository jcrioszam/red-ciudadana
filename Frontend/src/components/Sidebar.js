import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiHome, FiUsers, FiUserCheck, FiCalendar, FiBarChart, FiGitBranch, FiCheckSquare, FiClock, FiShield, FiMapPin, FiFileText, FiAlertTriangle, FiMap, FiSettings, FiMenu, FiX, FiDatabase, FiChevronDown, FiChevronRight, FiDownload, FiTrash2, FiActivity, FiServer
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
  // NUEVA OPCIÓN CON SUBMENÚ:
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

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = React.useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);

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
  const { data: configuracionPerfil, error: configError, isLoading: configLoading } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      console.log('🔍 Sidebar: obteniendo configuración del perfil para rol:', user?.rol);
      if (!user?.rol) {
        console.log('❌ Sidebar: sin rol de usuario, retornando null');
        return null;
      }
      try {
        console.log('🔍 Sidebar: llamando a /perfiles/mi-configuracion...');
        const response = await api.get('/perfiles/mi-configuracion');
        console.log('✅ Sidebar: configuración obtenida:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Sidebar: error al obtener configuración del perfil:', error);
        console.error('❌ Sidebar: detalles del error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        // 🔧 NUEVO: Fallback para admin - si hay error, crear configuración por defecto
        if (user?.rol === 'admin') {
          console.log('🔧 Sidebar: creando configuración por defecto para admin');
          return {
            rol: 'admin',
            configuracion: {
              opciones_web: ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "admin-database", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
              opciones_app: ["register", "perfil", "eventos-historicos", "dashboard", "seguimiento", "movilizador-seguimiento", "noticias", "reportes_ciudadanos"]
            }
          };
        }
        return null;
      }
    },
    {
      enabled: !!user?.rol,
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 3,
      retryDelay: 1000,
    }
  );

  // Debug logs
  console.log('🔍 Sidebar render:', {
    user: user ? { id: user.id, email: user.email, rol: user.rol } : null,
    configuracionPerfil,
    configError,
    configLoading
  });

  // 🔧 NUEVO: Logs adicionales para debuggear permisos
  console.log('🔍 Sidebar - Debug permisos:', {
    userRol: user?.rol,
    opcionesPermitidas: configuracionPerfil?.configuracion?.opciones_web || [],
    esAdmin: user?.rol === 'admin',
    configuracionCompleta: configuracionPerfil
  });

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

  // Función para renderizar elementos del menú
  const renderMenuItem = (item, level = 0) => {
    // 🔍 NUEVO: Log al inicio para ver qué se está procesando
    console.log(`🔍 Sidebar - Procesando elemento del menú:`, {
      label: item.label,
      ruta: item.to,
      tieneSubmenu: item.hasSubmenu,
      submenuItems: item.submenu?.length || 0
    });

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
    
    // 🔧 CORRECCIÓN: Si el usuario es admin, permitir acceso a todas las opciones
    const tienePermiso = user?.rol === 'admin' || opcionesPermitidas.includes(permisoRequerido);
    
    // 🔍 NUEVO: Logs detallados para cada elemento del menú
    console.log(`🔍 Sidebar - Verificando menú "${item.label}":`, {
      ruta: item.to,
      permisoRequerido,
      userRol: user?.rol,
      esAdmin: user?.rol === 'admin',
      opcionesPermitidas,
      tienePermiso,
      resultado: tienePermiso ? '✅ PERMITIDO' : '❌ BLOQUEADO'
    });
    
    // VALIDACIÓN DE PERMISOS HABILITADA: Si no tiene permiso, no mostrar la opción
    if (!tienePermiso) {
      console.log(`❌ Sidebar - Elemento bloqueado: ${item.label} (${permisoRequerido})`);
      return null;
    }

    console.log(`✅ Sidebar - Elemento permitido: ${item.label} (${permisoRequerido})`);

    const isActive = location.pathname === item.to || 
                     (item.submenu && item.submenu.some(subItem => location.pathname === subItem.to));
    const isExpanded = expandedSubmenu === item.to;

    if (item.hasSubmenu) {
      return (
        <li key={item.to}>
          <div
            onClick={() => setExpandedSubmenu(expandedSubmenu === item.to ? null : item.to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 8 : 12,
              padding: isMobile ? '16px 20px' : '14px 32px',
              color: isActive ? '#fff' : '#c5cae9',
              background: isActive ? 'rgba(255,255,255,0.10)' : 'none',
              fontWeight: isActive ? 'bold' : 'normal',
              textDecoration: 'none',
              borderLeft: isActive ? '4px solid #ffb300' : '4px solid transparent',
              transition: 'background 0.2s, color 0.2s',
              fontSize: isMobile ? '14px' : '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              <span style={{ fontSize: isMobile ? 18 : 20 }}>{item.icon}</span>
              {item.label}
            </div>
            <span style={{ fontSize: isMobile ? 16 : 18 }}>
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>
          
          {/* Submenú */}
          {isExpanded && (
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              background: 'rgba(255,255,255,0.05)',
              borderLeft: '2px solid #ffb300'
            }}>
              {item.submenu.map(subItem => {
                const isSubActive = location.pathname === subItem.to;
                return (
                  <li key={subItem.to}>
                    <Link
                      to={subItem.to}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 8 : 12,
                        padding: isMobile ? '12px 20px 12px 40px' : '10px 32px 10px 50px',
                        color: isSubActive ? '#fff' : '#c5cae9',
                        background: isSubActive ? 'rgba(255,255,255,0.15)' : 'none',
                        fontWeight: isSubActive ? 'bold' : 'normal',
                        textDecoration: 'none',
                        borderLeft: isSubActive ? '4px solid #ffb300' : '4px solid transparent',
                        transition: 'background 0.2s, color 0.2s',
                        fontSize: isMobile ? '13px' : '15px',
                        marginLeft: '10px'
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 16 : 18 }}>{subItem.icon}</span>
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

    // Elemento normal del menú
    return (
      <li key={item.to}>
        <Link
          to={item.to}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 12,
            padding: isMobile ? '16px 20px' : '14px 32px',
            color: isActive ? '#fff' : '#c5cae9',
            background: isActive ? 'rgba(255,255,255,0.10)' : 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            textDecoration: 'none',
            borderLeft: isActive ? '4px solid #ffb300' : '4px solid transparent',
            transition: 'background 0.2s, color 0.2s',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          <span style={{ fontSize: isMobile ? 18 : 20 }}>{item.icon}</span>
          {item.label}
        </Link>
      </li>
    );
  };

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
            {(() => {
              const elementosRenderizados = menu.map(item => renderMenuItem(item)).filter(Boolean);
              console.log(`🔍 Sidebar - Total elementos renderizados: ${elementosRenderizados.length}/${menu.length}`);
              return elementosRenderizados;
            })()}
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
