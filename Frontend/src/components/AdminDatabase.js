import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  Modal, 
  Form, 
  Row, 
  Col,
  Badge,
  Table,
  ProgressBar,
  Container,
  Nav,
  Tab
} from 'react-bootstrap';
import { 
  Trash, 
  Person, 
  FileText, 
  Database, 
  ExclamationTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  BarChart,
  Activity,
  ExclamationCircle,
  ArrowClockwise,
  Gear,
  InfoCircle
} from 'react-bootstrap-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const AdminDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [operationType, setOperationType] = useState('');
  const [operationParams, setOperationParams] = useState({});
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('overview');

  // Verificar que solo admin pueda acceder
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      setMessage({ type: 'danger', text: 'Acceso denegado. Solo administradores pueden acceder a esta función.' });
    }
  }, [user]);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/database/stats');
      setStats(response.data);
      setMessage({ type: 'success', text: 'Estadísticas actualizadas correctamente' });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setMessage({ type: 'danger', text: 'Error al cargar estadísticas: ' + (error.response?.data?.detail || error.message) });
    } finally {
      setLoading(false);
    }
  };

  // Cargar logs
  const loadLogs = async () => {
    try {
      // Por ahora simulamos logs, después se implementará endpoint real
      const mockLogs = [
        { 
          id: 1, 
          fecha: new Date().toISOString(), 
          usuario: 'admin', 
          operacion: 'limpiar_reportes', 
          detalles: 'Eliminados 25 reportes antiguos',
          estado: 'completado'
        },
        { 
          id: 2, 
          fecha: new Date(Date.now() - 86400000).toISOString(), 
          usuario: 'admin', 
          operacion: 'limpiar_usuarios', 
          detalles: 'Eliminados 3 usuarios inactivos',
          estado: 'completado'
        },
        { 
          id: 3, 
          fecha: new Date(Date.now() - 172800000).toISOString(), 
          usuario: 'admin', 
          operacion: 'backup_automatico', 
          detalles: 'Backup automático completado',
          estado: 'completado'
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  };

  // Ejecutar operación de limpieza
  const executeOperation = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      if (operationType === 'limpiar_reportes') {
        endpoint = '/admin/database/limpiar-reportes';
      } else if (operationType === 'limpiar_usuarios') {
        endpoint = '/admin/database/limpiar-usuarios';
      }

      const response = await api.delete(endpoint, { params: operationParams });
      
      setMessage({ 
        type: 'success', 
        text: `Operación completada exitosamente: ${response.data.mensaje}` 
      });
      
      // Recargar estadísticas y logs
      await loadStats();
      await loadLogs();
      
    } catch (error) {
      console.error('Error en operación:', error);
      setMessage({ 
        type: 'danger', 
        text: 'Error en la operación: ' + (error.response?.data?.detail || error.message) 
      });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Confirmar operación
  const confirmOperation = (type, params = {}) => {
    setOperationType(type);
    setOperationParams(params);
    setShowConfirmModal(true);
  };

  // Obtener icono para operación
  const getOperationIcon = (operation) => {
    switch (operation) {
      case 'limpiar_reportes':
        return <FileText className="text-danger" />;
      case 'limpiar_usuarios':
        return <Person className="text-warning" />;
      case 'backup_automatico':
        return <Database className="text-success" />;
      default:
        return <Gear className="text-info" />;
    }
  };

  // Obtener badge para estado
  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completado':
        return <Badge bg="success">Completado</Badge>;
      case 'en_progreso':
        return <Badge bg="warning">En Progreso</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      default:
        return <Badge bg="secondary">Desconocido</Badge>;
    }
  };

  useEffect(() => {
    if (user?.rol === 'admin') {
      loadStats();
      loadLogs();
    }
  }, [user]);

  if (user?.rol !== 'admin') {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Shield className="me-2" />
          <strong>Acceso Denegado:</strong> Solo administradores pueden acceder a esta función.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">
            <Database className="me-2 text-primary" />
            Administración de Base de Datos
          </h1>
          <p className="text-muted mb-0">
            Gestión y mantenimiento del sistema de base de datos
          </p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={loadStats}
          disabled={loading}
          size="lg"
        >
          {loading ? <Spinner size="sm" className="me-2" /> : <ArrowClockwise className="me-2" />}
          Actualizar Datos
        </Button>
      </div>

      {/* Mensajes */}
      {message.text && (
        <Alert 
          variant={message.type} 
          dismissible 
          onClose={() => setMessage({ type: '', text: '' })}
          className="mb-4"
        >
          {message.text}
        </Alert>
      )}

      {/* Tabs de Navegación */}
      <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="overview" className="d-flex align-items-center">
            <BarChart className="me-2" />
            Vista General
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="operations" className="d-flex align-items-center">
            <Gear className="me-2" />
            Operaciones
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="logs" className="d-flex align-items-center">
            <Activity className="me-2" />
            Logs
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Contenido de Tabs */}
      <Tab.Content>
        {/* Tab: Vista General */}
        <Tab.Pane eventKey="overview" active={activeTab === 'overview'}>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <FileText size={48} className="text-primary mb-3" />
                  <h2 className="mb-2">{stats?.estadisticas?.reportes?.total || 0}</h2>
                  <Card.Title className="text-muted">Total Reportes</Card.Title>
                  <div className="small text-muted mt-2">
                    <div>{stats?.estadisticas?.reportes?.con_fotos || 0} con fotos</div>
                    <div>{stats?.estadisticas?.reportes?.sin_fotos || 0} sin fotos</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Person size={48} className="text-success mb-3" />
                  <h2 className="mb-2">{stats?.estadisticas?.usuarios || 0}</h2>
                  <Card.Title className="text-muted">Total Usuarios</Card.Title>
                  <div className="small text-muted mt-2">
                    Activos en el sistema
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Person size={48} className="text-info mb-3" />
                  <h2 className="mb-2">{stats?.estadisticas?.personas || 0}</h2>
                  <Card.Title className="text-muted">Total Personas</Card.Title>
                  <div className="small text-muted mt-2">
                    Registradas en el sistema
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Clock size={48} className="text-warning mb-3" />
                  <h2 className="mb-2">{new Date().toLocaleDateString()}</h2>
                  <Card.Title className="text-muted">Última Actualización</Card.Title>
                  <div className="small text-muted mt-2">
                    {new Date().toLocaleTimeString()}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Gráficos de Progreso */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Estado de Reportes</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Reportes con Fotos</span>
                      <span>{stats?.estadisticas?.reportes?.con_fotos || 0}</span>
                    </div>
                    <ProgressBar 
                      now={stats?.estadisticas?.reportes?.con_fotos || 0} 
                      max={stats?.estadisticas?.reportes?.total || 1}
                      variant="success"
                    />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Reportes sin Fotos</span>
                      <span>{stats?.estadisticas?.reportes?.sin_fotos || 0}</span>
                    </div>
                    <ProgressBar 
                      now={stats?.estadisticas?.reportes?.sin_fotos || 0} 
                      max={stats?.estadisticas?.reportes?.total || 1}
                      variant="warning"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Resumen del Sistema</h6>
                </Card.Header>
                <Card.Body>
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="border-end">
                        <h4 className="text-primary">{stats?.estadisticas?.usuarios || 0}</h4>
                        <small className="text-muted">Usuarios Activos</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <h4 className="text-success">{stats?.estadisticas?.personas || 0}</h4>
                      <small className="text-muted">Personas Registradas</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab.Pane>

        {/* Tab: Operaciones */}
        <Tab.Pane eventKey="operations" active={activeTab === 'operations'}>
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-danger text-white">
                  <Trash className="me-2" />
                  Limpieza de Reportes
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Eliminar reportes según criterios específicos o todos los reportes del sistema.
                  </p>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-danger" 
                      onClick={() => confirmOperation('limpiar_reportes', { eliminar_todos: true })}
                      disabled={loading}
                      size="lg"
                    >
                      <Trash className="me-2" />
                      Eliminar TODOS los Reportes
                    </Button>
                    <Button 
                      variant="outline-warning"
                      onClick={() => confirmOperation('limpiar_reportes', { 
                        fecha_desde: '2024-01-01',
                        fecha_hasta: '2024-06-30'
                      })}
                      disabled={loading}
                    >
                      <Clock className="me-2" />
                      Eliminar Reportes por Fecha
                    </Button>
                    <Button 
                      variant="outline-info"
                      onClick={() => confirmOperation('limpiar_reportes', { 
                        tipo: 'limpieza',
                        estado: 'resuelto'
                      })}
                      disabled={loading}
                    >
                      <FileText className="me-2" />
                      Eliminar por Tipo y Estado
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <Person className="me-2" />
                  Limpieza de Usuarios
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Eliminar usuarios inactivos por períodos específicos de inactividad.
                  </p>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-warning" 
                      onClick={() => confirmOperation('limpiar_usuarios', { inactivos_dias: 30 })}
                      disabled={loading}
                      size="lg"
                    >
                      <Person className="me-2" />
                      Usuarios Inactivos 30+ Días
                    </Button>
                    <Button 
                      variant="outline-info"
                      onClick={() => confirmOperation('limpiar_usuarios', { inactivos_dias: 90 })}
                      disabled={loading}
                    >
                      <Clock className="me-2" />
                      Usuarios Inactivos 90+ Días
                    </Button>
                                          <Button 
                        variant="outline-secondary"
                        onClick={() => confirmOperation('limpiar_usuarios', { inactivos_dias: 180 })}
                        disabled={loading}
                      >
                        <ExclamationCircle className="me-2" />
                        Usuarios Inactivos 180+ Días
                      </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Operaciones Adicionales */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-info text-white">
                  <Database className="me-2" />
                  Operaciones de Mantenimiento
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Button 
                        variant="outline-success" 
                        className="w-100 mb-2"
                        disabled={loading}
                      >
                        <CheckCircle className="me-2" />
                        Verificar Integridad BD
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button 
                        variant="outline-primary" 
                        className="w-100 mb-2"
                        disabled={loading}
                      >
                        <Database className="me-2" />
                        Crear Backup Manual
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button 
                        variant="outline-secondary" 
                        className="w-100 mb-2"
                        disabled={loading}
                      >
                        <Gear className="me-2" />
                        Optimizar Base de Datos
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab.Pane>

        {/* Tab: Logs */}
        <Tab.Pane eventKey="logs" active={activeTab === 'logs'}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <Activity className="me-2" />
                Logs de Operaciones
              </h6>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={loadLogs}
                disabled={loading}
              >
                <ArrowClockwise className="me-2" />
                Actualizar
              </Button>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario</th>
                    <th>Operación</th>
                    <th>Detalles</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div>{new Date(log.fecha).toLocaleDateString()}</div>
                        <small className="text-muted">
                          {new Date(log.fecha).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <Badge bg="secondary">{log.usuario}</Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {getOperationIcon(log.operacion)}
                          <span className="ms-2">{log.operacion.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td>{log.detalles}</td>
                      <td>{getStatusBadge(log.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {logs.length === 0 && (
                <div className="text-center text-muted py-4">
                  <Activity size={48} className="mb-3" />
                  <p>No hay logs de operaciones disponibles</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>

      {/* Modal de Confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <InfoCircle className="me-2" />
            Confirmar Operación Crítica
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>⚠️ ADVERTENCIA CRÍTICA:</strong> Esta operación es irreversible y eliminará datos permanentemente de la base de datos.
          </Alert>
          
          <div className="mb-3">
            <h6>Detalles de la Operación:</h6>
            <ul className="list-unstyled">
              <li><strong>Tipo:</strong> {operationType === 'limpiar_reportes' ? 'Limpiar Reportes' : 'Limpiar Usuarios'}</li>
              {operationParams.eliminar_todos && (
                <li><strong>Alcance:</strong> TODOS los reportes serán eliminados</li>
              )}
              {operationParams.inactivos_dias && (
                <li><strong>Criterio:</strong> Usuarios inactivos por más de {operationParams.inactivos_dias} días</li>
              )}
              {operationParams.fecha_desde && (
                <li><strong>Período:</strong> Desde {operationParams.fecha_desde} hasta {operationParams.fecha_hasta}</li>
              )}
            </ul>
          </div>

          <Alert variant="warning">
            <strong>Recomendaciones:</strong>
            <ul className="mb-0 mt-2">
              <li>Verifica que tengas un backup reciente</li>
              <li>Confirma que realmente necesitas esta operación</li>
              <li>Esta acción no se puede deshacer</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={executeOperation}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Ejecutando...
              </>
            ) : (
              <>
                <InfoCircle className="me-2" />
                Confirmar y Ejecutar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDatabase;