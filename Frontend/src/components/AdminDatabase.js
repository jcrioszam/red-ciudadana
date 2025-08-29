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
    
    // Estado para detectar el tamaño de pantalla
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
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
        daysOld: 0,
        status: 'todos',
        confirmDelete: false
    });
    const [previewReports, setPreviewReports] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Hook para detectar cambios en el tamaño de pantalla
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            setIsMobile(width <= 768);
            setIsTablet(width > 768 && width <= 1024);
        };

        // Verificar al montar el componente
        checkScreenSize();

        // Agregar listener para cambios de tamaño
        window.addEventListener('resize', checkScreenSize);

        // Cleanup
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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
            
            console.log('🔍 DEBUG: Llamando a endpoint con parámetros:', params);
            
            const response = await api.get('/admin/database/limpiar-preview', { params });
            console.log('✅ DEBUG: Respuesta del endpoint:', response.data);
            
            const reportes = response.data.reportes || [];
            console.log('📊 DEBUG: Reportes extraídos:', reportes);
            console.log('📊 DEBUG: Cantidad de reportes:', reportes.length);
            
            // Agregar propiedad selected a cada reporte
            const reportesConSeleccion = reportes.map(r => ({ ...r, selected: true }));
            setPreviewReports(reportesConSeleccion);
            
            // Mostrar información adicional si está disponible
            if (response.data.debug_info) {
                console.log('🔍 DEBUG: Información de debug del backend:', response.data.debug_info);
            }
            
        } catch (err) {
            console.error('❌ Error obteniendo vista previa:', err);
            console.error('❌ Detalles del error:', err.response?.data);
            setError('No se pudo obtener la vista previa de reportes: ' + (err.response?.data?.detail || err.message));
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCleanReports = async () => {
        try {
            // Obtener solo los reportes seleccionados
            const reportesSeleccionados = previewReports.filter(r => r.selected);
            
            if (reportesSeleccionados.length === 0) {
                alert('⚠️ No hay reportes seleccionados para eliminar');
                return;
            }
            
            // Confirmar antes de eliminar
            const confirmacion = window.confirm(
                `¿Estás seguro de que quieres eliminar ${reportesSeleccionados.length} reportes seleccionados?\n\n` +
                `Esta acción no se puede deshacer.`
            );
            
            if (!confirmacion) {
                return;
            }
            
            // Preparar datos para el backend
            const datosLimpieza = {
                ...cleanForm,
                reportes_ids: reportesSeleccionados.map(r => r.id),
                total_seleccionados: reportesSeleccionados.length
            };
            
            console.log('🗑️ Enviando datos de limpieza:', datosLimpieza);
            
            const response = await api.post('/admin/database/limpiar', datosLimpieza);
            
            alert(`✅ Reportes eliminados exitosamente: ${response.data.mensaje}`);
            setShowCleanModal(false);
            setPreviewReports([]);
            loadDatabaseInfo();
            
        } catch (err) {
            console.error('❌ Error al limpiar reportes:', err);
            alert('❌ Error al limpiar reportes: ' + (err.response?.data?.detail || err.message));
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
            {console.log('🔍 AdminDatabase: Renderizando componente...')}
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

            {/* Modal de Limpieza Mejorado y Responsive */}
            <Modal 
                show={showCleanModal} 
                onHide={() => setShowCleanModal(false)}
                centered
                size={isMobile ? "fullscreen" : isTablet ? "xl" : "xl"}
                backdrop="static"
                keyboard={false}
                className="admin-database-modal"
                style={{ zIndex: 9999 }}
                fullscreen={isMobile}
            >
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        🧹 Configurar Limpieza de Reportes
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form>
                        <Row>
                            <Col md={6} xs={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">📅 Días de antigüedad</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={cleanForm.daysOld}
                                        onChange={(e) => setCleanForm({...cleanForm, daysOld: parseInt(e.target.value)})}
                                        min="0"
                                        max="365"
                                        className={isMobile ? "form-control" : "form-control-lg"}
                                    />
                                    <Form.Text className="text-muted">
                                        Eliminar reportes más antiguos que este número de días (0 = todos)
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6} xs={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">📋 Estado de reportes</Form.Label>
                                    <Form.Select
                                        value={cleanForm.status}
                                        onChange={(e) => setCleanForm({...cleanForm, status: e.target.value})}
                                        className={isMobile ? "form-select" : "form-select-lg"}
                                    >
                                        <option value="todos">🔄 Todos los estados</option>
                                        <option value="completado">✅ Completados</option>
                                        <option value="resuelto">🔒 Resueltos</option>
                                        <option value="cancelado">❌ Cancelados</option>
                                        <option value="pendiente">⏳ Pendientes</option>
                                        <option value="en_proceso">🔄 En Proceso</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <div className="text-center mb-4">
                            <Button 
                                variant="info" 
                                onClick={getPreviewReports}
                                disabled={previewLoading}
                                size={isMobile ? "sm" : "lg"}
                                className="d-flex align-items-center gap-2 mx-auto px-4"
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
                                <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
                                    <span className="fs-5">⚠️</span>
                                    <div>
                                        <strong>Se eliminarán {previewReports.length} reportes</strong>
                                        <br />
                                        <small className="text-muted">
                                            Criterios: {cleanForm.daysOld === 0 ? 'Todos los días' : `${cleanForm.daysOld} días`} | 
                                            Estado: {cleanForm.status === 'todos' ? 'Todos los estados' : cleanForm.status}
                                        </small>
                                    </div>
                                </div>
                                
                                {/* Opciones de selección */}
                                <div className="mb-3 p-3 bg-light rounded">
                                    <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between'} align-items-center mb-2`}>
                                        <h6 className="mb-0">🎯 Selección de Reportes:</h6>
                                        <div className="d-flex gap-2 mt-2">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                onClick={() => {
                                                    const allSelected = previewReports.map(r => ({...r, selected: true}));
                                                    setPreviewReports(allSelected);
                                                }}
                                            >
                                                ✅ Seleccionar Todos
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm"
                                                onClick={() => {
                                                    const noneSelected = previewReports.map(r => ({...r, selected: false}));
                                                    setPreviewReports(noneSelected);
                                                }}
                                            >
                                                ❌ Deseleccionar Todos
                                            </Button>
                                        </div>
                                    </div>
                                    <small className="text-muted">
                                        Selecciona individualmente los reportes que deseas eliminar, o usa los botones para seleccionar/deseleccionar todos
                                    </small>
                                </div>
                                
                                {/* Tabla mejorada */}
                                <div className="table-responsive" style={{ 
                                    maxHeight: isMobile ? '250px' : isTablet ? '350px' : '400px', 
                                    overflowY: 'auto' 
                                }}>
                                    <Table striped bordered hover size="sm" className="table-hover">
                                        <thead className="table-dark sticky-top">
                                            <tr>
                                                <th style={{width: '50px'}}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={previewReports.length > 0 && previewReports.every(r => r.selected)}
                                                        onChange={(e) => {
                                                            const updated = previewReports.map(r => ({...r, selected: e.target.checked}));
                                                            setPreviewReports(updated);
                                                        }}
                                                    />
                                                </th>
                                                <th style={{width: '60px'}}>ID</th>
                                                <th>Título</th>
                                                <th style={{width: '120px'}}>Estado</th>
                                                <th style={{width: '100px'}}>Fecha</th>
                                                {!isMobile && <th style={{width: '100px'}}>Tipo</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewReports.map((reporte) => (
                                                <tr key={reporte.id} className={reporte.selected ? 'table-warning' : ''}>
                                                    <td>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={reporte.selected || false}
                                                            onChange={(e) => {
                                                                const updated = previewReports.map(r => 
                                                                    r.id === reporte.id ? {...r, selected: e.target.checked} : r
                                                                );
                                                                setPreviewReports(updated);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="fw-bold">{reporte.id}</td>
                                                    <td>{reporte.titulo}</td>
                                                    <td>
                                                        <Badge 
                                                            bg={
                                                                reporte.estado === 'completado' ? 'success' :
                                                                reporte.estado === 'resuelto' ? 'primary' :
                                                                reporte.estado === 'cancelado' ? 'danger' :
                                                                reporte.estado === 'pendiente' ? 'warning' :
                                                                reporte.estado === 'en_proceso' ? 'info' : 'secondary'
                                                            }
                                                        >
                                                            {reporte.estado}
                                                        </Badge>
                                                    </td>
                                                    <td>{new Date(reporte.fecha_creacion).toLocaleDateString()}</td>
                                                    {!isMobile && (
                                                        <td>
                                                            <Badge bg="secondary" className="text-uppercase">
                                                                {reporte.tipo}
                                                            </Badge>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                
                                {/* Resumen de selección */}
                                <div className="mt-3 p-3 bg-info bg-opacity-10 rounded selection-summary">
                                    <div className={`row text-center ${isMobile ? 'g-2' : ''}`}>
                                        <div className="col-md-4 col-12">
                                            <strong>Total Reportes:</strong> {previewReports.length}
                                        </div>
                                        <div className="col-md-4 col-12">
                                            <strong>Seleccionados:</strong> {previewReports.filter(r => r.selected).length}
                                        </div>
                                        <div className="col-md-4 col-12">
                                            <strong>Pendientes:</strong> {previewReports.filter(r => !r.selected).length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {previewReports.length === 0 && !previewLoading && (
                            <div className="alert alert-info text-center">
                                ℹ️ No se encontraron reportes que cumplan con los criterios especificados
                            </div>
                        )}
                        
                        <Form.Group className="mb-3 confirmation-checkbox">
                            <Form.Check
                                type="checkbox"
                                label="⚠️ Confirmar eliminación - Entiendo que esta acción no se puede deshacer"
                                checked={cleanForm.confirmDelete}
                                onChange={(e) => setCleanForm({...cleanForm, confirmDelete: e.target.checked})}
                                className="text-danger fw-bold"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowCleanModal(false)} 
                        size={isMobile ? "sm" : "lg"}
                        className={isMobile ? "w-100" : ""}
                    >
                        ❌ Cancelar
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleCleanReports}
                        disabled={!cleanForm.confirmDelete || previewReports.filter(r => r.selected).length === 0}
                        size={isMobile ? "sm" : "lg"}
                        className={`d-flex align-items-center gap-2 ${isMobile ? "w-100" : ""}`}
                    >
                        🗑️ Limpiar Reportes Seleccionados ({previewReports.filter(r => r.selected).length})
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDatabase;
