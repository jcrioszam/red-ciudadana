import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 DEBUG PANEL</div>
      <div>Loading: {loading ? '✅' : '❌'}</div>
      <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {user ? `${user.email} (${user.rol})` : 'null'}</div>
      <div>Token: {localStorage.getItem('token') ? '✅' : '❌'}</div>
      <div>Env: {process.env.NODE_ENV}</div>
      <div>API URL: {process.env.REACT_APP_API_URL || 'default'}</div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default DebugPanel;
