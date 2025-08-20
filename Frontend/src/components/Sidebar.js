import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiHome, FiUsers, FiUserCheck, FiCalendar, FiBarChart, FiGitBranch, FiCheckSquare, FiClock, FiShield, FiLogOut, FiMapPin, FiFileText, FiAlertTriangle, FiMap
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
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [logoUrl, setLogoUrl] = React.useState(null);

  // Obtener configuración de permisos del usuario actual
  const { data: configuracionPerfil } = useQuery(
    ['configuracion-perfil-usuario', user?.rol],
    async () => {
      if (!user?.rol) return null;
      const response = await api.get('/perfiles/mi-configuracion');
      return response.data;
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

  return (
    <nav
      style={{
        minWidth: 220,
        background: 'linear-gradient(180deg, #1a237e 0%, #3949ab 100%)',
        height: '100vh',
        padding: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 32 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ maxWidth: 120, maxHeight: 120, margin: '0 auto', borderRadius: 12, background: '#fff' }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: 22, letterSpacing: 1, padding: '32px 0 24px 0' }}>
              Red Ciudadana
            </div>
          )}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
              'reportes-ciudadanos': 'reportes_ciudadanos', // Corrected mapping
              'mapa-reportes': 'reportes_ciudadanos', // Usar los mismos permisos que reportes ciudadanos
              'seguimiento-reportes': 'seguimiento_reportes', // Nuevo mapeo
              'admin-perfiles': 'admin-perfiles'
            };
            
            // Aplicar mapeo si existe, sino usar el valor original
            permisoRequerido = mapeoPermisos[permisoRequerido] || permisoRequerido;
            
            const tienePermiso = opcionesPermitidas.includes(permisoRequerido);
            
            // Debug logs para todas las opciones
            console.log(`Sidebar - Checking ${item.to} permission:`);
            console.log(`  - User role: ${user?.rol}`);
            console.log(`  - Permiso requerido: ${permisoRequerido}`);
            console.log(`  - Opciones permitidas:`, opcionesPermitidas);
            console.log(`  - Tiene permiso: ${tienePermiso}`);
            
            // Log adicional para ver las opciones exactas del backend
            if (item.to === '/eventos-historicos') {
              console.log('=== DEBUG: Opciones exactas del backend ===');
              console.log('Opciones permitidas completas:', opcionesPermitidas);
              console.log('Buscando:', permisoRequerido);
              console.log('Incluye eventos-historicos:', opcionesPermitidas.includes('eventos-historicos'));
              console.log('Incluye eventos_historicos:', opcionesPermitidas.includes('eventos_historicos'));
              console.log('==========================================');
            }
            
            // TEMPORAL: Mostrar todas las opciones mientras se soluciona el proxy
            // Si no tiene permiso, no mostrar la opción
            // if (!tienePermiso) return null;
            
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 32px',
                    color: location.pathname === item.to ? '#fff' : '#c5cae9',
                    background: location.pathname === item.to ? 'rgba(255,255,255,0.10)' : 'none',
                    fontWeight: location.pathname === item.to ? 'bold' : 'normal',
                    textDecoration: 'none',
                    borderLeft: location.pathname === item.to ? '4px solid #ffb300' : '4px solid transparent',
                    transition: 'background 0.2s, color 0.2s'
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#c5cae9', borderTop: '1px solid #283593' }}>
        <div>© {new Date().getFullYear()} Red Ciudadana</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Institucional</div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        >
          <FiLogOut style={{ fontSize: 14 }} />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
} 