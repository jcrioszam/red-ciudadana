import React, { useState } from 'react';
import { FiUser, FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        left: 220, // Compensar el sidebar
        right: 0,
        height: 70,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {/* Logo y título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#1a237e',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 18
          }}
        >
          RC
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a237e' }}>
            Red Ciudadana
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Sistema de Gestión
          </div>
        </div>
      </div>

      {/* Perfil del usuario */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={toggleProfileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: 180
          }}
          onMouseEnter={() => setShowProfileMenu(true)}
        >
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#1a237e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
              {user?.nombre || 'Usuario'}
            </div>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
              {user?.rol?.replace('_', ' ') || 'Rol'}
            </div>
          </div>
          {showProfileMenu ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
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
              minWidth: 200,
              zIndex: 1000
            }}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {user?.email || 'usuario@ejemplo.com'}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#d32f2f',
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FiLogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
