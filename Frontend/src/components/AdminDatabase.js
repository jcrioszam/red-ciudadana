import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Button,
    Alert,
    Badge,
    Modal,
    Form,
    Spinner,
    Table
} from 'react-bootstrap';
import {
    Trash2,
    ArrowLeft
} from 'react-bootstrap-icons';
import api from '../api';
import './AdminDatabase.css';

const AdminDatabase = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extraer la acción de la URL
    const getActionFromPath = () => {
        const path = location.pathname;
        if (path.includes('/admin/database/stats')) return 'stats';
        if (path.includes('/admin/database/clean')) return 'clean';
        return 'stats'; // Default
    };
    
    const action = getActionFromPath();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCleanModal, setShowCleanModal] = useState(false);
    const [cleanForm, setCleanForm] = useState({
        daysOld: 30,
        status: 'todos',
        confirmDelete: false
    });
    const [previewReports, setPreviewReports] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
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

    // Función para obtener vista previa de reportes a eliminar
    const getPreviewReports = async () => {
        try {
            setPreviewLoading(true);
            setPreviewReports([]);
            
            const params = {
                days_old: cleanForm.daysOld,
                preview: true
            };
            
            if (cleanForm.status !== 'todos') {
                params.status = cleanForm.status;
            }
            
            const response = await api.get('/admin/database/limpiar-preview', { params });
            setPreviewReports(response.data.reportes || []);
        } catch (err) {
            console.error('Error obteniendo vista previa:', err);
            setError('No se pudo obtener la vista previa de reportes: ' + (err.response?.data?.detail || err.message));
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCleanReports = async () => {
        try {
            const response = await api.post('/admin/database/limpiar', cleanForm);
            alert('Reportes limpiados exitosamente: ' + response.data.mensaje);
            setShowCleanModal(false);
            loadDatabaseInfo();
        } catch (err) {
            alert('Error al limpiar reportes: ' + (err.response?.data?.detail || err.message));
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

        if (action === 'clean') {
            return (
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
        }

        // Default: stats
        return (
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
    };

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

            {renderContent()}

            {/* Modal de Limpieza Simplificado */}
            <Modal 
                show={showCleanModal} 
                onHide={() => setShowCleanModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>🧹 Configurar Limpieza de Reportes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>📅 Días de antigüedad</Form.Label>
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
                            <Form.Label>📋 Estado de reportes</Form.Label>
                            <Form.Select
                                value={cleanForm.status}
                                onChange={(e) => setCleanForm({...cleanForm, status: e.target.value})}
                            >
                                <option value="todos">🔄 Todos los estados</option>
                                <option value="completado">✅ Completados</option>
                                <option value="resuelto">🔒 Resueltos</option>
                                <option value="cancelado">❌ Cancelados</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <div className="text-center mb-3">
                            <Button 
                                variant="info" 
                                onClick={getPreviewReports}
                                disabled={previewLoading}
                                className="d-flex align-items-center gap-2 mx-auto"
                            >
                                {previewLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" />
                                        Obteniendo vista previa...
                                    </>
                                ) : (
                                    <>
                                        👁️ Ver Reportes a Eliminar
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {previewReports.length > 0 && (
                            <div className="mt-4">
                                <h6 className="text-danger mb-3">
                                    ⚠️ Se eliminarán {previewReports.length} reportes:
                                </h6>
                                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <Table striped bordered hover size="sm">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>ID</th>
                                                <th>Título</th>
                                                <th>Estado</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewReports.map((reporte) => (
                                                <tr key={reporte.id}>
                                                    <td>{reporte.id}</td>
                                                    <td>{reporte.titulo}</td>
                                                    <td>
                                                        <Badge 
                                                            bg={
                                                                reporte.estado === 'completado' ? 'success' :
                                                                reporte.estado === 'resuelto' ? 'primary' :
                                                                reporte.estado === 'cancelado' ? 'danger' : 'secondary'
                                                            }
                                                        >
                                                            {reporte.estado}
                                                        </Badge>
                                                    </td>
                                                    <td>{new Date(reporte.fecha_creacion).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="⚠️ Confirmar eliminación - Entiendo que esta acción no se puede deshacer"
                                checked={cleanForm.confirmDelete}
                                onChange={(e) => setCleanForm({...cleanForm, confirmDelete: e.target.checked})}
                                className="text-danger"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCleanModal(false)}>
                        ❌ Cancelar
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleCleanReports}
                        disabled={!cleanForm.confirmDelete}
                        className="d-flex align-items-center gap-2"
                    >
                        🗑️ Limpiar Reportes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDatabase;
