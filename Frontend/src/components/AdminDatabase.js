import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Alert,
    Modal,
    Form,
    Spinner,
    Nav,
    Tab
} from 'react-bootstrap';
import {
    Database,
    BarChart,
    Trash2,
    Download,
    Gear,
    Activity,
    Shield,
    Clock,
    Hdd,
    Server,
    Cpu,
    Memory,
    ArrowClockwise,
    GraphUp,
    Tools,
    InfoCircle
} from 'react-bootstrap-icons';
import api from '../api';

const AdminDatabase = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCleanModal, setShowCleanModal] = useState(false);
    const [cleanForm, setCleanForm] = useState({
        daysOld: 30,
        status: 'completado',
        confirmDelete: false
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        loadDatabaseInfo();
    }, []);

    const loadDatabaseInfo = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar estadísticas básicas
            const statsResponse = await api.get('/admin/database/stats');
            setStats(statsResponse.data);

        } catch (err) {
            console.error('Error cargando información de BD:', err);
            setError('Error al cargar información de la base de datos');
        } finally {
            setLoading(false);
        }
    };

    const handleCleanReports = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            
            await api.post('/admin/database/limpiar-reportes', cleanForm);
            setActionMessage({
                type: 'success',
                text: `Limpieza completada. Reportes de más de ${cleanForm.daysOld} días han sido eliminados.`
            });
            
            setShowCleanModal(false);
            setCleanForm({ daysOld: 30, status: 'completado', confirmDelete: false });
            
            // Recargar estadísticas
            setTimeout(() => {
                loadDatabaseInfo();
            }, 2000);
            
        } catch (err) {
            setActionMessage({
                type: 'danger',
                text: 'Error al limpiar reportes: ' + err.message
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOptimize = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            
            await api.post('/admin/database/optimizar');
            setActionMessage({
                type: 'success',
                text: 'Optimización iniciada. Esto puede tomar varios minutos.'
            });
            
            // Recargar información después de un tiempo
            setTimeout(() => {
                loadDatabaseInfo();
            }, 10000);
            
        } catch (err) {
            setActionMessage({
                type: 'danger',
                text: 'Error al iniciar optimización: ' + err.message
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMaintenance = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            
            await api.post('/admin/database/maintenance');
            setActionMessage({
                type: 'success',
                text: 'Mantenimiento automático iniciado.'
            });
            
        } catch (err) {
            setActionMessage({
                type: 'danger',
                text: 'Error al iniciar mantenimiento: ' + err.message
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            
            await api.post('/admin/database/backup');
            setActionMessage({
                type: 'success',
                text: 'Backup iniciado. Se notificará cuando esté completo.'
            });
            
        } catch (err) {
            setActionMessage({
                type: 'danger',
                text: 'Error al iniciar backup: ' + err.message
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatus = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            
            const response = await api.get('/admin/database/status');
            setActionMessage({
                type: 'success',
                text: `Estado de BD: ${response.data.estado}`
            });
            
        } catch (err) {
            setActionMessage({
                type: 'danger',
                text: 'Error al verificar estado: ' + err.message
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-database">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Cargando información de la base de datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-database">
                <Alert variant="danger">
                    <h4>Error</h4>
                    <p>{error}</p>
                    <Button onClick={loadDatabaseInfo} variant="outline-danger">
                        Reintentar
                    </Button>
                </Alert>
            </div>
        );
    }

    return (
        <div className="admin-database">
            {/* Header */}
            <div className="admin-header">
                <h1>
                    <Database className="me-3" />
                    Administración de Base de Datos
                </h1>
                <p className="text-muted">
                    Gestiona y optimiza el rendimiento de tu base de datos
                </p>
            </div>

            {/* Alertas de acción */}
            {actionMessage && (
                <Alert
                    variant={actionMessage.type}
                    dismissible
                    onClose={() => setActionMessage(null)}
                    className="action-alert"
                >
                    {actionMessage.text}
                </Alert>
            )}

            {/* Sistema de Pestañas */}
            <Card className="main-content-card">
                <Card.Body className="p-0">
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Row>
                            <Col md={3} className="sidebar-tabs">
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="dashboard" className="tab-link">
                                            <BarChart className="me-2" />
                                            Dashboard
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="actions" className="tab-link">
                                            <Tools className="me-2" />
                                            Acciones
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="system" className="tab-link">
                                            <InfoCircle className="me-2" />
                                            Sistema
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="maintenance" className="tab-link">
                                            <Gear className="me-2" />
                                            Mantenimiento
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            
                            <Col md={9} className="tab-content-area">
                                <Tab.Content>
                                    {/* Pestaña Dashboard */}
                                    <Tab.Pane eventKey="dashboard">
                                        <div className="tab-pane-content">
                                            <h3 className="tab-title">
                                                <BarChart className="me-2" />
                                                Dashboard de Base de Datos
                                            </h3>
                                            
                                            {/* Estadísticas en una sola fila */}
                                            {stats && (
                                                <Row className="mb-4">
                                                    <Col md={3}>
                                                        <Card className="stat-card">
                                                            <Card.Body className="text-center">
                                                                <BarChart className="stat-icon" />
                                                                <h3 className="stat-value">{stats.estadisticas.reportes.total}</h3>
                                                                <p className="stat-label">Total Reportes</p>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="stat-card">
                                                            <Card.Body className="text-center">
                                                                <Shield className="stat-icon" />
                                                                <h3 className="stat-value">{stats.estadisticas.usuarios}</h3>
                                                                <p className="stat-label">Usuarios Activos</p>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="stat-card">
                                                            <Card.Body className="text-center">
                                                                <Activity className="stat-icon" />
                                                                <h3 className="stat-value">{stats.estadisticas.personas}</h3>
                                                                <p className="stat-label">Personas Registradas</p>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Card className="stat-card">
                                                            <Card.Body className="text-center">
                                                                <Clock className="stat-icon" />
                                                                <h3 className="stat-value">{stats.estadisticas.reportes.con_fotos}</h3>
                                                                <p className="stat-label">Con Fotos</p>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            )}
                                            
                                            <div className="text-center text-muted mt-4">
                                                <small>
                                                    Última actualización: {stats?.fecha_consulta || 'Nunca'}
                                                </small>
                                            </div>
                                        </div>
                                    </Tab.Pane>

                                    {/* Pestaña Acciones */}
                                    <Tab.Pane eventKey="actions">
                                        <div className="tab-pane-content">
                                            <h3 className="tab-title">
                                                <Tools className="me-2" />
                                                Acciones de Administración
                                            </h3>
                                            
                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="primary"
                                                        className="action-btn w-100"
                                                        onClick={handleOptimize}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <Spinner size="sm" /> : <Gear />}
                                                        Optimizar BD
                                                    </Button>
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="info"
                                                        className="action-btn w-100"
                                                        onClick={handleMaintenance}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <Spinner size="sm" /> : <Activity />}
                                                        Mantenimiento
                                                    </Button>
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="success"
                                                        className="action-btn w-100"
                                                        onClick={handleBackup}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <Spinner size="sm" /> : <Download />}
                                                        Crear Backup
                                                    </Button>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="warning"
                                                        className="action-btn w-100"
                                                        onClick={() => setShowCleanModal(true)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Trash2 />
                                                        Limpiar Reportes
                                                    </Button>
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="secondary"
                                                        className="action-btn w-100"
                                                        onClick={handleStatus}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <Spinner size="sm" /> : <Shield />}
                                                        Estado BD
                                                    </Button>
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Button
                                                        variant="dark"
                                                        className="action-btn w-100"
                                                        onClick={loadDatabaseInfo}
                                                        disabled={loading}
                                                    >
                                                        {loading ? <Spinner size="sm" /> : <ArrowClockwise />}
                                                        Actualizar
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>

                                    {/* Pestaña Sistema */}
                                    <Tab.Pane eventKey="system">
                                        <div className="tab-pane-content">
                                            <h3 className="tab-title">
                                                <InfoCircle className="me-2" />
                                                Información del Sistema
                                            </h3>
                                            
                                            <Card className="system-info-card">
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="system-item">
                                                                <Cpu className="me-2" />
                                                                <span>CPU: {stats?.sistema?.cpu || 'N/A'}</span>
                                                            </div>
                                                            <div className="system-item">
                                                                <Memory className="me-2" />
                                                                <span>Memoria: {stats?.sistema?.memoria || 'N/A'}</span>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="system-item">
                                                                <Hdd className="me-2" />
                                                                <span>Disco: {stats?.sistema?.disco || 'N/A'}</span>
                                                            </div>
                                                            <div className="system-item">
                                                                <Clock className="me-2" />
                                                                <span>Última actualización: {stats?.fecha_consulta || 'N/A'}</span>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    </Tab.Pane>

                                    {/* Pestaña Mantenimiento */}
                                    <Tab.Pane eventKey="maintenance">
                                        <div className="tab-pane-content">
                                            <h3 className="tab-title">
                                                <Gear className="me-2" />
                                                Herramientas de Mantenimiento
                                            </h3>
                                            
                                            <Row>
                                                <Col md={6}>
                                                    <Card className="maintenance-card">
                                                        <Card.Header>
                                                            <Trash2 className="me-2" />
                                                            Limpieza de Reportes
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <p className="text-muted mb-3">
                                                                Elimina reportes antiguos para optimizar el rendimiento de la base de datos.
                                                            </p>
                                                            <Button
                                                                variant="warning"
                                                                onClick={() => setShowCleanModal(true)}
                                                                className="w-100"
                                                            >
                                                                <Trash2 className="me-2" />
                                                                Configurar Limpieza
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                                <Col md={6}>
                                                    <Card className="maintenance-card">
                                                        <Card.Header>
                                                            <GraphUp className="me-2" />
                                                            Optimización
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <p className="text-muted mb-3">
                                                                Ejecuta procesos de optimización para mejorar el rendimiento.
                                                            </p>
                                                            <Button
                                                                variant="primary"
                                                                onClick={handleOptimize}
                                                                disabled={actionLoading}
                                                                className="w-100"
                                                            >
                                                                {actionLoading ? <Spinner size="sm" /> : <Gear />}
                                                                Iniciar Optimización
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Card.Body>
            </Card>

            {/* Modal para Limpiar Reportes */}
            <Modal show={showCleanModal} onHide={() => setShowCleanModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <Trash2 className="me-2" />
                        Limpiar Reportes Antiguos
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Eliminar reportes de más de:</Form.Label>
                            <Form.Select
                                value={cleanForm.daysOld}
                                onChange={(e) => setCleanForm({...cleanForm, daysOld: parseInt(e.target.value)})}
                            >
                                <option value={7}>7 días</option>
                                <option value={30}>30 días</option>
                                <option value={90}>90 días</option>
                                <option value={180}>180 días</option>
                                <option value={365}>1 año</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Estado de los reportes:</Form.Label>
                            <Form.Select
                                value={cleanForm.status}
                                onChange={(e) => setCleanForm({...cleanForm, status: e.target.value})}
                            >
                                <option value="completado">Completados</option>
                                <option value="cancelado">Cancelados</option>
                                <option value="todos">Todos</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Confirmo que entiendo que esta acción no se puede deshacer"
                                checked={cleanForm.confirmDelete}
                                onChange={(e) => setCleanForm({...cleanForm, confirmDelete: e.target.checked})}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCleanModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleCleanReports}
                        disabled={!cleanForm.confirmDelete || actionLoading}
                    >
                        {actionLoading ? <Spinner size="sm" /> : 'Limpiar Reportes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDatabase;
