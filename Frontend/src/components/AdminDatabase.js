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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                                    className="action-btn"
                                    onClick={() => alert('Funcionalidad en desarrollo')}
                                >
                                    <Database />
                                    Optimizar BD
                                </Button>
                                
                                <Button 
                                    variant="success" 
                                    className="action-btn"
                                    onClick={() => alert('Funcionalidad en desarrollo')}
                                >
                                    <Settings />
                                    Mantenimiento
                                </Button>
                                
                                <Button 
                                    variant="info" 
                                    className="action-btn"
                                    onClick={() => alert('Funcionalidad en desarrollo')}
                                >
                                    <Download />
                                    Crear Backup
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

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
