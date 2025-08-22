import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        marginLeft: 220, // Compensar el sidebar fijo
        width: 'calc(100% - 220px)' // Ajustar el ancho del contenido
      }}>
        <Header />
        <div style={{ 
          padding: '94px 24px 24px 24px', // Margen superior para el header
          minHeight: 'calc(100vh - 70px)' // Altura mínima ajustada
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
} 