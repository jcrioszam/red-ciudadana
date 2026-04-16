import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function Layout() {
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

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ 
          flex: 1, 
          marginLeft: isMobile ? 0 : 220, // En móvil no hay margen
          width: isMobile ? '100%' : 'calc(100% - 220px)', // En móvil ocupa todo el ancho
          transition: 'margin-left 0.3s ease-in-out'
        }}>
          <Header />
          <div style={{ 
            padding: isMobile ? '80px 16px 16px 16px' : '94px 24px 24px 24px', // Padding reducido en móvil
            minHeight: 'calc(100vh - 70px)',
            maxWidth: '100%',
            overflowX: 'auto' // Permitir scroll horizontal si es necesario
          }}>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
} 