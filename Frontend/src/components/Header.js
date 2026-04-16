import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiChevronDown, FiChevronUp, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleVerPerfil = () => {
    setShowProfileMenu(false);
    navigate('/perfil');
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 220,
        right: 0,
        height: isMobile ? 60 : 64,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e8eaf0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px 0 60px' : '0 24px',
        zIndex: 998,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'left 0.3s ease-in-out'
      }}
    >
      {/* Logo y título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: isMobile ? 30 : 36,
          height: isMobile ? 30 : 36,
          backgroundColor: '#1a237e',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: isMobile ? 12 : 15,
          letterSpacing: 0.5, flexShrink: 0
        }}>
          RC
        </div>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#1a237e', lineHeight: 1.2 }}>
            Red Ciudadana
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: '#888' }}>Sistema de Gestión</div>
          )}
        </div>
      </div>

      {/* Acciones del lado derecho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Campana de notificaciones */}
        <button
          onClick={() => navigate('/reportes-ciudadanos')}
          title="Reportes Ciudadanos"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, color: '#555',
            display: 'flex', alignItems: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <FiBell size={isMobile ? 18 : 20} />
        </button>

        {/* Perfil */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex', alignItems: 'center',
              gap: isMobile ? 6 : 10,
              padding: isMobile ? '5px 10px' : '6px 14px',
              backgroundColor: '#f5f6fa',
              border: '1px solid #e0e0e0',
              borderRadius: 8, cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eef0f8'; if (!isMobile) setShowProfileMenu(true); }}
            onMouseLeave={e => e.currentTarget.style.background = '#f5f6fa'}
          >
            <div style={{
              width: isMobile ? 26 : 30, height: isMobile ? 26 : 30,
              backgroundColor: '#1a237e', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: isMobile ? 11 : 13, fontWeight: 700
            }}>
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#222', lineHeight: 1.2 }}>
                  {user?.nombre || 'Usuario'}
                </div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>
                  {user?.rol?.replace(/_/g, ' ') || 'Rol'}
                </div>
              </div>
            )}
            <span style={{ color: '#888', marginLeft: 2 }}>
              {showProfileMenu ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </span>
          </button>

          {/* Dropdown */}
          {showProfileMenu && (
            <div
              onMouseLeave={() => !isMobile && setShowProfileMenu(false)}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: isMobile ? 160 : 200,
                zIndex: 1000, overflow: 'hidden'
              }}
            >
              <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{user?.nombre}</div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>
                  {user?.rol?.replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={handleVerPerfil}
                style={{
                  width: '100%', padding: '11px 16px',
                  border: 'none', backgroundColor: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', fontSize: 13, color: '#333',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FiUser size={15} />
                Ver Perfil
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '11px 16px',
                  border: 'none', backgroundColor: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', fontSize: 13, color: '#d32f2f',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FiLogOut size={15} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
