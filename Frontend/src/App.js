import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Personas from './pages/Personas';
import Eventos from './pages/Eventos';
import Usuarios from './pages/Usuarios';
import Checkin from './pages/Checkin';
import Movilizacion from './pages/Movilizacion';
import Reportes from './pages/Reportes';
import EstructuraRed from './pages/EstructuraRed';
import RegistroInvitacion from './pages/RegistroInvitacion';
import RegistroPersonaInvitacion from './pages/RegistroPersonaInvitacion';
import Perfil from './pages/Perfil';
import EventosHistoricos from './pages/EventosHistoricos';
import AdminPerfiles from './pages/AdminPerfiles';
import AdminDashboard from './pages/AdminDashboard';
import Seguimiento from './pages/Seguimiento';
import Noticias from './pages/Noticias';
import ReportesCiudadanos from './pages/ReportesCiudadanos';
import SeguimientoReportes from './pages/SeguimientoReportes';
import MapaReportes from './pages/MapaReportes';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Cargando...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro-invitacion" element={<RegistroInvitacion />} />
            <Route path="/registro-persona-invitacion" element={<RegistroPersonaInvitacion />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personas" element={<Personas />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/checkin" element={<Checkin />} />
              <Route path="/movilizacion" element={<Movilizacion />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/estructura-red" element={<EstructuraRed />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/eventos-historicos" element={<EventosHistoricos />} />
              <Route path="/admin-perfiles" element={<AdminPerfiles />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/seguimiento" element={<Seguimiento />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/reportes-ciudadanos" element={<ReportesCiudadanos />} />
              <Route path="/mapa-reportes" element={<MapaReportes />} />
            <Route path="/seguimiento-reportes" element={<SeguimientoReportes />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 