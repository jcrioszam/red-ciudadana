import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
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
import ReportesCiudadanosPublico from './pages/ReportesCiudadanosPublico';
import ListaReportesPublica from './pages/ListaReportesPublica';
import MapaReportesPublico from './pages/MapaReportesPublico';
import SeguimientoReportes from './pages/SeguimientoReportes';
import MapaReportes from './pages/MapaReportes';
import Layout from './components/Layout';
import AdminDatabase from './components/AdminDatabase';
import AdminTiposReporte from './components/AdminTiposReporte';
import AdminNoticias from './components/AdminNoticias';
import AdminPadron from './pages/AdminPadron';

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
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/reportes-publico" element={<ReportesCiudadanosPublico />} />
            <Route path="/reportes-ciudadanos" element={<ReportesCiudadanos />} />
            <Route path="/lista-reportes" element={<ListaReportesPublica />} />
            <Route path="/mapa-reportes-publico" element={<MapaReportesPublico />} />
            <Route path="/mapa-reportes" element={<MapaReportes />} />
            
            {/* Rutas de autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro-invitacion" element={<RegistroInvitacion />} />
            <Route path="/registro-persona-invitacion" element={<RegistroPersonaInvitacion />} />
            
            {/* Rutas protegidas (requieren login) */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/admin-tipos-reporte" element={<AdminTiposReporte />} />
              <Route path="/admin-noticias" element={<AdminNoticias />} />
              <Route path="/seguimiento" element={<Seguimiento />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/reportes-ciudadanos-admin" element={<ReportesCiudadanos />} />
              <Route path="/mapa-reportes-admin" element={<MapaReportes />} />
              <Route path="/seguimiento-reportes" element={<SeguimientoReportes />} />
              <Route path="/admin-database" element={<AdminDatabase />} />
              <Route path="/admin-padron" element={<AdminPadron />} />
              {/* Rutas del submenú de Administración BD */}
              <Route path="/admin/database/stats" element={<AdminDatabase />} />
              <Route path="/admin/database/optimize" element={<AdminDatabase />} />
              <Route path="/admin/database/maintenance" element={<AdminDatabase />} />
              <Route path="/admin/database/backup" element={<AdminDatabase />} />
              <Route path="/admin/database/clean" element={<AdminDatabase />} />
              <Route path="/admin/database/status" element={<AdminDatabase />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;