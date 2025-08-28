import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    const { action } = useParams();
    const navigate = useNavigate();
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
        if (!action) {
            navigate('/admin-database/stats');
            return;
        }
        loadDatabaseInfo();
    }, [action, navigate]);

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
                type: 'info',
                message: response.data.mensaje
            });
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
            <div className="admin-header">
                <h1 className="main-title">
                    <BarChart className="title-icon" />
                    Estadísticas de Base de Datos
                </h1>
                <p className="subtitle">
                    Información detallada del rendimiento y uso del sistema
                </p>
            </div>

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

            <Card className="mb-4 system-info-card">
                <Card.Header>
                    <Server className="me-2" />
                    Información del Sistema
                </Card.Header>
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
    );

    const renderOptimize = () => (
        <div>
            <div className="admin-header">
                <h1 className="main-title">
                    <Gear className="title-icon" />
                    Optimización de Base de Datos
                </h1>
                <p className="subtitle">
                    Mejora el rendimiento y eficiencia de tu base de datos
                </p>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <h5>¿Qué hace la optimización?</h5>
                    <ul>
                        <li>Ejecuta VACUUM ANALYZE para limpiar y analizar tablas</li>
                        <li>Actualiza estadísticas del optimizador de consultas</li>
                        <li>Libera espacio no utilizado</li>
                        <li>Mejora el rendimiento general del sistema</li>
                    </ul>
                    
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleOptimize}
                        disabled={actionLoading}
                        className="mt-3"
                    >
                        {actionLoading ? <Spinner size="sm" /> : <Gear />}
                        {actionLoading ? 'Optimizando...' : 'Optimizar Base de Datos'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderMaintenance = () => (
        <div>
            <div className="admin-header">
                <h1 className="main-title">
                    <Activity className="title-icon" />
                    Mantenimiento Automático
                </h1>
                <p className="subtitle">
                    Tareas de mantenimiento programadas para el sistema
                </p>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <h5>Tareas de Mantenimiento</h5>
                    <ul>
                        <li>Ejecuta VACUUM para limpiar tablas</li>
                        <li>Ejecuta ANALYZE para actualizar estadísticas</li>
                        <li>Identifica reportes antiguos para limpieza</li>
                        <li>Mantiene la integridad de la base de datos</li>
                    </ul>
                    
                    <Button
                        variant="info"
                        size="lg"
                        onClick={handleMaintenance}
                        disabled={actionLoading}
                        className="mt-3"
                    >
                        {actionLoading ? <Spinner size="sm" /> : <Activity />}
                        {actionLoading ? 'Ejecutando...' : 'Ejecutar Mantenimiento'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderBackup = () => (
        <div>
            <div className="admin-header">
                <h1 className="main-title">
                    <Download className="title-icon" />
                    Crear Backup de Base de Datos
                </h1>
                <p className="subtitle">
                    Genera una copia de seguridad completa del sistema
                </p>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <h5>Información del Backup</h5>
                    <ul>
                        <li>Backup completo de todas las tablas</li>
                        <li>Incluye estructura y datos</li>
                        <li>Formato SQL estándar</li>
                        <li>Descarga directa del archivo</li>
                    </ul>
                    
                    <Button
                        variant="success"
                        size="lg"
                        onClick={handleBackup}
                        disabled={actionLoading}
                        className="mt-3"
                    >
                        {actionLoading ? <Spinner size="sm" /> : <Download />}
                        {actionLoading ? 'Creando...' : 'Crear Backup Completo'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderClean = () => (
        <div>
            <div className="admin-header">
                <h1 className="main-title">
                    <Trash2 className="title-icon" />
                    Limpieza de Reportes
                </h1>
                <p className="subtitle">
                    Elimina reportes antiguos y libera espacio en la base de datos
                </p>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <h5>Configuración de Limpieza</h5>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Eliminar reportes de más de:</Form.Label>
                                <Form.Select
                                    value={cleanForm.daysOld}
                                    onChange={(e) => setCleanForm({...cleanForm, daysOld: parseInt(e.target.value)})}
                                >
                                    <option value={7}>7 días</option>
                                    <option value={30}>30 días</option>
                                    <option value={90}>90 días</option>
                                    <option value={365}>1 año</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado de los reportes:</Form.Label>
                                <Form.Select
                                    value={cleanForm.status}
                                    onChange={(e) => setCleanForm({...cleanForm, status: e.target.value})}
                                >
                                    <option value="completado">Completados</option>
                                    <option value="cancelado">Cancelados</option>
                                    <option value="ambos">Ambos</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label="Confirmo que entiendo que esta acción no se puede deshacer"
                            checked={cleanForm.confirmDelete}
                            onChange={(e) => setCleanForm({...cleanForm, confirmDelete: e.target.checked})}
                        />
                    </Form.Group>
                    
                    <Button
                        variant="warning"
                        size="lg"
                        onClick={() => setShowCleanModal(true)}
                        disabled={!cleanForm.confirmDelete}
                        className="mt-3"
                    >
                        <Trash2 />
                        Limpiar Reportes
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const renderStatus = () => (
        <div>
            <div className="admin-header">
                <h1 className="main-title">
                    <Shield className="title-icon" />
                    Estado de Base de Datos
                </h1>
                <p className="subtitle">
                    Monitoreo en tiempo real del estado del sistema
                </p>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <h5>Verificar Estado</h5>
                    <p>Obtén información detallada sobre el estado actual de la base de datos.</p>
                    
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleStatus}
                        disabled={actionLoading}
                        className="mt-3"
                    >
                        {actionLoading ? <Spinner size="sm" /> : <Shield />}
                        {actionLoading ? 'Verificando...' : 'Verificar Estado'}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    if (loading) {
        return (
            <div className="admin-database">
                <div className="text-center p-5">
                    <Spinner animation="border" role="status" size="lg">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-3">Cargando información de la base de datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-database">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
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
            {/* Botón de regreso */}
            <div className="mb-3">
                <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/admin-database/stats')}
                    className="d-flex align-items-center gap-2"
                >
                    <ArrowLeft />
                    Volver a Estadísticas
                </Button>
            </div>

            {actionMessage && (
                <Alert variant={actionMessage.type} className="action-alert">
                    {actionMessage.message}
                </Alert>
            )}

            {/* Contenido Principal */}
            <div className="main-content">
                {renderContent()}
            </div>

            {/* Modal para Limpiar Reportes */}
            <Modal show={showCleanModal} onHide={() => setShowCleanModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <Trash2 className="me-2" />
                        Limpiar Reportes Antiguos
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que quieres eliminar los reportes antiguos?</p>
                    <p><strong>Esta acción no se puede deshacer.</strong></p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCleanModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleCleanReports}>
                        {actionLoading ? <Spinner size="sm" /> : 'Limpiar Reportes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDatabase;
