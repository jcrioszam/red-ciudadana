import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        padding: 24, 
        marginLeft: 220, // Compensar el sidebar fijo
        width: 'calc(100% - 220px)' // Ajustar el ancho del contenido
      }}>
        <Outlet />
      </div>
    </div>
  );
} 