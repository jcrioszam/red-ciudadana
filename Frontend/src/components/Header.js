import React, { useState, useEffect } from 'react';
import { FiUser, FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 220, // En móvil no hay sidebar
        right: 0,
        height: isMobile ? 60 : 70, // Altura reducida en móvil
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px', // Padding reducido en móvil
        zIndex: 999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'left 0.3s ease-in-out'
      }}
    >
      {/* Logo y título */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 12 : 16 
      }}>
        <div
          style={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 32 : 40,
            backgroundColor: '#1a237e',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: isMobile ? 14 : 18
          }}
        >
          RC
        </div>
        <div style={{ display: isMobile ? 'none' : 'block' }}> {/* Ocultar título en móvil */}
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a237e' }}>
            Red Ciudadana
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Sistema de Gestión
          </div>
        </div>
        {/* Título simplificado para móvil */}
        {isMobile && (
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1a237e' }}>
            Red Ciudadana
          </div>
        )}
      </div>

      {/* Perfil del usuario */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={toggleProfileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 12,
            padding: isMobile ? '6px 12px' : '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: isMobile ? 140 : 180
          }}
          onMouseEnter={() => !isMobile && setShowProfileMenu(true)}
        >
          <div
            style={{
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
              backgroundColor: '#1a237e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: isMobile ? 12 : 14,
              fontWeight: 'bold'
            }}
          >
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ 
            textAlign: 'left', 
            flex: 1,
            display: isMobile ? 'none' : 'block' // Ocultar texto en móvil
          }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
              {user?.nombre || 'Usuario'}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {user?.rol || 'Rol'}
            </div>
          </div>
          <span style={{ color: '#666' }}>
            {showProfileMenu ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </span>
        </button>

        {/* Menú desplegable del perfil */}
        {showProfileMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: isMobile ? 160 : 200,
              zIndex: 1000
            }}
            onMouseLeave={() => !isMobile && setShowProfileMenu(false)}
          >
            <div style={{ padding: '8px 0' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 14,
                  color: '#666'
                }}
              >
                <strong>Perfil</strong>
              </div>
              <button
                onClick={() => {/* Navegar al perfil */}}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#333',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FiUser size={16} />
                Ver Perfil
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#d32f2f',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebee'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FiLogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
