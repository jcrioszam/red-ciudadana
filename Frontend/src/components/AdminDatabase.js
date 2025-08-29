import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Button,
    ProgressBar,
    Alert,
    Badge,
    Modal,
    Form,
    Spinner,
    Table
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
    ArrowLeft
} from 'react-bootstrap-icons';
import api from '../api';

const AdminDatabase = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extraer la acción de la URL
    const getActionFromPath = () => {
        const path = location.pathname;
        if (path.includes('/admin/database/stats')) return 'stats';
        if (path.includes('/admin/database/optimize')) return 'optimize';
        if (path.includes('/admin/database/maintenance')) return 'maintenance';
        if (path.includes('/admin/database/backup')) return 'backup';
        if (path.includes('/admin/database/clean')) return 'clean';
        if (path.includes('/admin/database/status')) return 'status';
        return 'stats'; // Default
    };
    
    const action = getActionFromPath();
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

    useEffect(() => {
        // Siempre cargar información cuando cambie la acción
        loadDatabaseInfo();
    }, [action]);

    const loadDatabaseInfo = async () => {
        try {
            setLoading(true);
            setError(null);
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
            const response = await api.post('/admin/database/limpiar', cleanForm);
            setActionMessage({
                type: 'success',
                message: response.data.mensaje
            });
            setShowCleanModal(false);
            loadDatabaseInfo();
        } catch (err) {
            setActionMessage({
                type: 'danger',
                message: 'Error al limpiar reportes: ' + (err.response?.data?.detail || err.message)
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOptimize = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            const response = await api.post('/admin/database/optimizar');
            setActionMessage({
                type: 'success',
                message: response.data.mensaje
            });
            loadDatabaseInfo();
        } catch (err) {
            setActionMessage({
                type: 'danger',
                message: 'Error al optimizar BD: ' + (err.response?.data?.detail || err.message)
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleMaintenance = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            const response = await api.post('/admin/database/maintenance');
            setActionMessage({
                type: 'success',
                message: response.data.mensaje
            });
            loadDatabaseInfo();
        } catch (err) {
            setActionMessage({
                type: 'danger',
                message: 'Error en mantenimiento: ' + (err.response?.data?.detail || err.message)
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setActionLoading(true);
            setActionMessage(null);
            const response = await api.post('/admin/database/backup');
            setActionMessage({
                type: 'success',
                message: response.data.mensaje
            });
            loadDatabaseInfo();
        } catch (err) {
            setActionMessage({
                type: 'danger',
                message: 'Error al crear backup: ' + (err.response?.data?.detail || err.message)
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
                message: response.data.mensaje
            });
            loadDatabaseInfo();
        } catch (err) {
            setActionMessage({
                type: 'danger',
                message: 'Error al obtener estado: ' + (err.response?.data?.detail || err.message)
            });
        } finally {
            setActionLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status" className="mb-3">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <div>Cargando información de la base de datos...</div>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            );
        }

        switch (action) {
            case 'stats':
                return renderStats();
            case 'optimize':
                return renderOptimize();
            case 'maintenance':
                return renderMaintenance();
            case 'backup':
                return renderBackup();
            case 'clean':
                return renderClean();
            case 'status':
                return renderStatus();
            default:
                return renderStats();
        }
    };

    const renderStats = () => (
        <div>
            <h2 className="mb-4">📊 Estadísticas de Base de Datos</h2>
            {stats && (
                <Row>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>📋 Reportes</Card.Title>
                                <h3>{stats.estadisticas?.reportes?.total || 0}</h3>
                                <p className="text-muted">Total de reportes</p>
                                <div className="d-flex justify-content-between">
                                    <span>Con fotos: {stats.estadisticas?.reportes?.con_fotos || 0}</span>
                                    <span>Sin fotos: {stats.estadisticas?.reportes?.sin_fotos || 0}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>👥 Usuarios</Card.Title>
                                <h3>{stats.estadisticas?.usuarios || 0}</h3>
                                <p className="text-muted">Total de usuarios registrados</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>👤 Personas</Card.Title>
                                <h3>{stats.estadisticas?.personas || 0}</h3>
                                <p className="text-muted">Total de personas registradas</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );

    const renderOptimize = () => (
        <div>
            <h2 className="mb-4">⚙️ Optimización de Base de Datos</h2>
            <Card>
                <Card.Body>
                    <Card.Title>Optimización Automática</Card.Title>
                    <p>Esta función optimizará automáticamente las tablas de la base de datos para mejorar el rendimiento.</p>
                    <Button 
                        variant="primary" 
                        onClick={handleOptimize}
                        disabled={actionLoading}
                        className="d-flex align-items-center gap-2"
                    >
                        {actionLoading ? <Spinner animation="border" size="sm" /> : <Gear />}
                        {actionLoading ? 'Optimizando...' : 'Iniciar Optimización'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderMaintenance = () => (
        <div>
            <h2 className="mb-4">🔧 Mantenimiento de Base de Datos</h2>
            <Card>
                <Card.Body>
                    <Card.Title>Mantenimiento Preventivo</Card.Title>
                    <p>Ejecutar tareas de mantenimiento preventivo para mantener la base de datos en óptimas condiciones.</p>
                    <Button 
                        variant="warning" 
                        onClick={handleMaintenance}
                        disabled={actionLoading}
                        className="d-flex align-items-center gap-2"
                    >
                        {actionLoading ? <Spinner animation="border" size="sm" /> : <Activity />}
                        {actionLoading ? 'Ejecutando...' : 'Iniciar Mantenimiento'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderBackup = () => (
        <div>
            <h2 className="mb-4">💾 Crear Backup</h2>
            <Card>
                <Card.Body>
                    <Card.Title>Backup de Seguridad</Card.Title>
                    <p>Crear una copia de seguridad completa de la base de datos.</p>
                    <Button 
                        variant="info" 
                        onClick={handleBackup}
                        disabled={actionLoading}
                        className="d-flex align-items-center gap-2"
                    >
                        {actionLoading ? <Spinner animation="border" size="sm" /> : <Download />}
                        {actionLoading ? 'Creando...' : 'Crear Backup'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderClean = () => (
        <div>
            <h2 className="mb-4">🧹 Limpiar Reportes</h2>
            <Card>
                <Card.Body>
                    <Card.Title>Limpieza de Reportes</Card.Title>
                    <p>Eliminar reportes antiguos o completados para liberar espacio en la base de datos.</p>
                    <Button 
                        variant="danger" 
                        onClick={() => setShowCleanModal(true)}
                        className="d-flex align-items-center gap-2"
                    >
                        <Trash2 />
                        Configurar Limpieza
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderStatus = () => (
        <div>
            <h2 className="mb-4">📈 Estado de Base de Datos</h2>
            <Card>
                <Card.Body>
                    <Card.Title>Estado del Sistema</Card.Title>
                    <p>Verificar el estado actual de la base de datos y sus conexiones.</p>
                    <Button 
                        variant="secondary" 
                        onClick={handleStatus}
                        disabled={actionLoading}
                        className="d-flex align-items-center gap-2"
                    >
                        {actionLoading ? <Spinner animation="border" size="sm" /> : <Server />}
                        {actionLoading ? 'Verificando...' : 'Verificar Estado'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0">🗄️ Administración de Base de Datos</h1>
                    <p className="text-muted">Gestionar y mantener la base de datos del sistema</p>
                </div>
                <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/admin/database/stats')}
                    className="d-flex align-items-center gap-2"
                >
                    <ArrowLeft />
                    Volver a Estadísticas
                </Button>
            </div>

            {actionMessage && (
                <Alert variant={actionMessage.type} dismissible onClose={() => setActionMessage(null)}>
                    {actionMessage.message}
                </Alert>
            )}

            {renderContent()}

            {/* Modal de Limpieza */}
            <Modal show={showCleanModal} onHide={() => setShowCleanModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Configurar Limpieza de Reportes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Días de antigüedad</Form.Label>
                            <Form.Control
                                type="number"
                                value={cleanForm.daysOld}
                                onChange={(e) => setCleanForm({...cleanForm, daysOld: parseInt(e.target.value)})}
                                min="1"
                                max="365"
                            />
                            <Form.Text className="text-muted">
                                Eliminar reportes más antiguos que este número de días
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Estado de reportes</Form.Label>
                            <Form.Select
                                value={cleanForm.status}
                                onChange={(e) => setCleanForm({...cleanForm, status: e.target.value})}
                            >
                                <option value="completado">Completados</option>
                                <option value="resuelto">Resueltos</option>
                                <option value="cancelado">Cancelados</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Confirmar eliminación"
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
                        {actionLoading ? <Spinner animation="border" size="sm" /> : 'Limpiar Reportes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDatabase;
