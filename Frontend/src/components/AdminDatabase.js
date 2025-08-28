import React, { useState, useEffect } from 'react';
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
    BarChart3, 
    Trash2, 
    Download, 
    Settings, 
    Activity,
    Shield,
    Clock,
    HardDrive,
    Server,
    Cpu,
    Memory
} from 'react-bootstrap-icons';
import api from '../utils/api';

const AdminDatabase = () => {
    const [stats, setStats] = useState(null);
    const [tables, setTables] = useState([]);
    const [performance, setPerformance] = useState(null);
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
        loadDatabaseInfo();
    }, []);

    const loadDatabaseInfo = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar estadísticas
            const statsResponse = await api.get('/admin/database/stats');
            setStats(statsResponse.data);

            // Cargar información de tablas
            const tablesResponse = await api.get('/admin/database/tables');
            setTables(tablesResponse.data);

            // Cargar métricas de rendimiento
            try {
                const perfResponse = await api.get('/admin/database/performance');
                setPerformance(perfResponse.data);
            } catch (perfError) {
                console.log('Métricas de rendimiento no disponibles:', perfError.message);
            }

        } catch (err) {
            console.error('Error cargando información de BD:', err);
            setError('Error al cargar información de la base de datos');
        } finally {
            setLoading(false);
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

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatPercentage = (value, total) => {
        if (total === 0) return '0%';
        return Math.round((value / total) * 100) + '%';
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
            <div className="header-section">
                <h1 className="main-title">
                    <Database className="title-icon" />
                    Administración de Base de Datos
                </h1>
                <p className="subtitle">
                    Monitoreo, optimización y mantenimiento del sistema de datos
                </p>
            </div>

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

            {/* Estadísticas Generales */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="stat-card primary">
                        <Card.Body>
                            <div className="stat-icon">
                                <BarChart3 />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.estadisticas?.total_reportes || 0}</h3>
                                <p>Total Reportes</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-card success">
                        <Card.Body>
                            <div className="stat-icon">
                                <Shield />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.estadisticas?.total_usuarios || 0}</h3>
                                <p>Usuarios Activos</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-card warning">
                        <Card.Body>
                            <div className="stat-icon">
                                <Activity />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.estadisticas?.total_personas || 0}</h3>
                                <p>Personas Registradas</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="stat-card info">
                        <Card.Body>
                            <div className="stat-icon">
                                <Clock />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.estadisticas?.reportes_ultimo_mes || 0}</h3>
                                <p>Reportes este Mes</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Información del Sistema */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="system-card">
                        <Card.Header>
                            <h5><Server className="me-2" />Información del Sistema</h5>
                        </Card.Header>
                        <Card.Body>
                            {stats?.sistema && (
                                <div className="system-info">
                                    <div className="info-row">
                                        <span>Plataforma:</span>
                                        <Badge bg="secondary">{stats.sistema.platform}</Badge>
                                    </div>
                                    <div className="info-row">
                                        <span>Python:</span>
                                        <Badge bg="info">{stats.sistema.python_version}</Badge>
                                    </div>
                                    <div className="info-row">
                                        <span>CPU Cores:</span>
                                        <Badge bg="success">{stats.sistema.cpu_count}</Badge>
                                    </div>
                                    <div className="info-row">
                                        <span>Memoria Total:</span>
                                        <Badge bg="primary">{formatBytes(stats.sistema.memory_total)}</Badge>
                                    </div>
                                    <div className="info-row">
                                        <span>Memoria Disponible:</span>
                                        <Badge bg="warning">{formatBytes(stats.sistema.memory_available)}</Badge>
                                    </div>
                                    <div className="info-row">
                                        <span>Uso de Disco:</span>
                                        <ProgressBar 
                                            now={stats.sistema.disk_usage} 
                                            variant={stats.sistema.disk_usage > 80 ? 'danger' : 'success'}
                                            className="disk-progress"
                                        />
                                        <span className="ms-2">{stats.sistema.disk_usage}%</span>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="actions-card">
                        <Card.Header>
                            <h5><Settings className="me-2" />Acciones de Administración</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="action-buttons">
                                <Button 
                                    variant="primary" 
                                    onClick={handleOptimize}
                                    disabled={actionLoading}
                                    className="action-btn"
                                >
                                    {actionLoading ? <Spinner size="sm" /> : <Database />}
                                    Optimizar BD
                                </Button>
                                
                                <Button 
                                    variant="success" 
                                    onClick={handleMaintenance}
                                    disabled={actionLoading}
                                    className="action-btn"
                                >
                                    {actionLoading ? <Spinner size="sm" /> : <Settings />}
                                    Mantenimiento
                                </Button>
                                
                                <Button 
                                    variant="info" 
                                    onClick={handleBackup}
                                    disabled={actionLoading}
                                    className="action-btn"
                                >
                                    {actionLoading ? <Spinner size="sm" /> : <Download />}
                                    Crear Backup
                                </Button>
                                
                                <Button 
                                    variant="warning" 
                                    onClick={() => setShowCleanModal(true)}
                                    disabled={actionLoading}
                                    className="action-btn"
                                >
                                    <Trash2 />
                                    Limpiar Reportes
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Tablas de la Base de Datos */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5><HardDrive className="me-2" />Estructura de la Base de Datos</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Tabla</th>
                                        <th>Columnas</th>
                                        <th>Tamaño Aproximado</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tables.map((table, index) => (
                                        <tr key={index}>
                                            <td>
                                                <Badge bg="primary">{table.nombre}</Badge>
                                            </td>
                                            <td>{table.columnas}</td>
                                            <td>{table.tamaño_aproximado}</td>
                                            <td>
                                                <Badge bg="success">Activa</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Métricas de Rendimiento */}
            {performance && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <h5><Activity className="me-2" />Métricas de Rendimiento</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <div className="performance-metric">
                                            <h6>Consultas Lentas</h6>
                                            <p className="metric-value">{performance.consultas_lentas || 'N/A'}</p>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="performance-metric">
                                            <h6>Conexiones Activas</h6>
                                            <p className="metric-value">{performance.conexiones_activas || 'N/A'}</p>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

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

            {/* Información de Última Actualización */}
            <div className="update-info">
                <small className="text-muted">
                    Última actualización: {stats?.fecha_consulta ? new Date(stats.fecha_consulta).toLocaleString() : 'N/A'}
                </small>
            </div>
        </div>
    );
};

export default AdminDatabase;
