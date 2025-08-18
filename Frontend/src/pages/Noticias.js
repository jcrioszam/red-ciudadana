import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Avatar,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Collapse,
  Paper,
  Badge,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Newspaper as NewspaperIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Announcement as AnnouncementIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import Comentarios from '../components/Comentarios';

const Noticias = () => {
  const { user } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedNoticia, setExpandedNoticia] = useState(null);
  const [comentarios, setComentarios] = useState({});
  const [nuevoComentario, setNuevoComentario] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    imagen_url: '',
    tipo: 'general'
  });

  const canCreateNoticias = ['admin', 'presidente', 'lider_estatal', 'lider_municipal', 'lider_zona'].includes(user?.rol);

  useEffect(() => {
    loadNoticias();
  }, [selectedTipo]);

  const loadNoticias = async () => {
    try {
      setLoading(true);
      const params = selectedTipo !== 'todos' ? `?tipo=${selectedTipo}` : '';
      const response = await api.get(`/noticias${params}`);
      setNoticias(response.data);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
      showSnackbar('Error al cargar las noticias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadComentarios = async (noticiaId) => {
    try {
      const response = await api.get(`/comentarios/?noticia_id=${noticiaId}`);
      setComentarios(prev => ({ ...prev, [noticiaId]: response.data }));
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    }
  };

  const handleCreateNoticia = async () => {
    try {
      if (!formData.titulo.trim() || !formData.contenido.trim()) {
        showSnackbar('El título y contenido son obligatorios', 'error');
        return;
      }

      await api.post('/noticias/', formData);
      showSnackbar('Noticia creada exitosamente', 'success');
      handleCloseDialog();
      loadNoticias();
    } catch (error) {
      console.error('Error al crear noticia:', error);
      showSnackbar('Error al crear la noticia', 'error');
    }
  };

  const handleUpdateNoticia = async () => {
    try {
      if (!formData.titulo.trim() || !formData.contenido.trim()) {
        showSnackbar('El título y contenido son obligatorios', 'error');
        return;
      }

      await api.put(`/noticias/${editingNoticia.id}`, formData);
      showSnackbar('Noticia actualizada exitosamente', 'success');
      handleCloseDialog();
      loadNoticias();
    } catch (error) {
      console.error('Error al actualizar noticia:', error);
      showSnackbar('Error al actualizar la noticia', 'error');
    }
  };

  const handleDeleteNoticia = async (noticiaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    try {
      await api.delete(`/noticias/${noticiaId}`);
      showSnackbar('Noticia eliminada exitosamente', 'success');
      loadNoticias();
    } catch (error) {
      console.error('Error al eliminar noticia:', error);
      showSnackbar('Error al eliminar la noticia', 'error');
    }
  };

  const handleLike = async (noticiaId) => {
    try {
      await api.post(`/noticias/${noticiaId}/like`);
      loadNoticias();
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleCompartir = async (noticiaId) => {
    try {
      await api.post(`/noticias/${noticiaId}/compartir`);
      loadNoticias();
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const handleToggleComentarios = async (noticiaId) => {
    if (expandedNoticia === noticiaId) {
      setExpandedNoticia(null);
    } else {
      setExpandedNoticia(noticiaId);
      if (!comentarios[noticiaId]) {
        await loadComentarios(noticiaId);
      }
    }
  };

  const handleCrearComentario = async (noticiaId) => {
    try {
      if (!nuevoComentario[noticiaId]?.trim()) {
        showSnackbar('El comentario no puede estar vacío', 'error');
        return;
      }

      await api.post('/comentarios/', {
        contenido: nuevoComentario[noticiaId],
        noticia_id: noticiaId
      });

      setNuevoComentario(prev => ({ ...prev, [noticiaId]: '' }));
      await loadComentarios(noticiaId);
      showSnackbar('Comentario agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error al crear comentario:', error);
      showSnackbar('Error al crear el comentario', 'error');
    }
  };

  const handleLikeComentario = async (comentarioId) => {
    try {
      await api.post(`/comentarios/${comentarioId}/like`);
      // Recargar comentarios de todas las noticias
      Object.keys(comentarios).forEach(noticiaId => {
        loadComentarios(noticiaId);
      });
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
    }
  };

  const handleOpenDialog = (noticia = null) => {
    if (noticia) {
      setEditingNoticia(noticia);
      setFormData({
        titulo: noticia.titulo,
        contenido: noticia.contenido,
        imagen_url: noticia.imagen_url || '',
        tipo: noticia.tipo
      });
    } else {
      setEditingNoticia(null);
      setFormData({
        titulo: '',
        contenido: '',
        imagen_url: '',
        tipo: 'general'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNoticia(null);
    setFormData({
      titulo: '',
      contenido: '',
      imagen_url: '',
      tipo: 'general'
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getTipoInfo = (tipo) => {
    const tipos = {
      'general': { icon: <NewspaperIcon />, color: '#2196F3', label: 'General' },
      'importante': { icon: <WarningIcon />, color: '#F44336', label: 'Importante' },
      'evento': { icon: <EventIcon />, color: '#4CAF50', label: 'Evento' },
      'aviso': { icon: <AnnouncementIcon />, color: '#FF9800', label: 'Aviso' }
    };
    return tipos[tipo] || tipos.general;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditNoticia = (noticia) => {
    return user?.id === noticia.autor_id || user?.rol === 'admin';
  };

  const canEditComentario = (comentario) => {
    return user?.id === comentario.autor_id || user?.rol === 'admin';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary" fontWeight="bold">
          📰 Noticias y Avisos
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Mantente informado de las últimas novedades de la organización
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Chip
              label="Todas"
              onClick={() => setSelectedTipo('todos')}
              color={selectedTipo === 'todos' ? 'primary' : 'default'}
              variant={selectedTipo === 'todos' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 'bold' }}
            />
          </Grid>
          <Grid item>
            <Chip
              label="General"
              onClick={() => setSelectedTipo('general')}
              color={selectedTipo === 'general' ? 'primary' : 'default'}
              variant={selectedTipo === 'general' ? 'filled' : 'outlined'}
              icon={<NewspaperIcon />}
            />
          </Grid>
          <Grid item>
            <Chip
              label="Importante"
              onClick={() => setSelectedTipo('importante')}
              color={selectedTipo === 'importante' ? 'primary' : 'default'}
              variant={selectedTipo === 'importante' ? 'filled' : 'outlined'}
              icon={<WarningIcon />}
            />
          </Grid>
          <Grid item>
            <Chip
              label="Eventos"
              onClick={() => setSelectedTipo('evento')}
              color={selectedTipo === 'evento' ? 'primary' : 'default'}
              variant={selectedTipo === 'evento' ? 'filled' : 'outlined'}
              icon={<EventIcon />}
            />
          </Grid>
          <Grid item>
            <Chip
              label="Avisos"
              onClick={() => setSelectedTipo('aviso')}
              color={selectedTipo === 'aviso' ? 'primary' : 'default'}
              variant={selectedTipo === 'aviso' ? 'filled' : 'outlined'}
              icon={<AnnouncementIcon />}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de noticias */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Cargando noticias...</Typography>
            </Box>
          </Grid>
        ) : noticias.length > 0 ? (
          noticias.map((noticia) => {
            const tipoInfo = getTipoInfo(noticia.tipo);
            const noticiaComentarios = comentarios[noticia.id] || [];
            
            return (
              <Grid item xs={12} key={noticia.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Avatar sx={{ mr: 2, bgcolor: tipoInfo.color, width: 56, height: 56 }}>
                          {tipoInfo.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                            {noticia.titulo}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              {noticia.autor_nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(noticia.fecha_publicacion)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip
                        label={tipoInfo.label}
                        size="small"
                        sx={{ bgcolor: tipoInfo.color, color: 'white', fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Contenido */}
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {noticia.contenido}
                    </Typography>

                    {/* Imagen si existe */}
                    {noticia.imagen_url && (
                      <Box sx={{ mb: 3 }}>
                        <img
                          src={noticia.imagen_url}
                          alt={noticia.titulo}
                          style={{
                            width: '100%',
                            height: 300,
                            objectFit: 'cover',
                            borderRadius: 12
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  {/* Acciones */}
                  <CardActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton
                        onClick={() => handleLike(noticia.id)}
                        color="error"
                        size="small"
                      >
                        <Badge badgeContent={noticia.likes} color="error">
                          <FavoriteIcon />
                        </Badge>
                      </IconButton>
                      
                      <IconButton
                        onClick={() => handleCompartir(noticia.id)}
                        color="primary"
                        size="small"
                      >
                        <Badge badgeContent={noticia.compartidos} color="primary">
                          <ShareIcon />
                        </Badge>
                      </IconButton>

                      <IconButton
                        onClick={() => handleToggleComentarios(noticia.id)}
                        color="info"
                        size="small"
                      >
                        <Badge badgeContent={noticiaComentarios.length} color="info">
                          <CommentIcon />
                        </Badge>
                      </IconButton>
                    </Box>

                    {/* Botones de edición */}
                    {canEditNoticia(noticia) && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(noticia)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNoticia(noticia.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </CardActions>

                  {/* Componente de comentarios */}
                  <Comentarios 
                    noticiaId={noticia.id}
                    expanded={expandedNoticia === noticia.id}
                  />


                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NewspaperIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay noticias
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTipo !== 'todos'
                  ? `No hay noticias de tipo "${selectedTipo}"`
                  : 'Aún no se han publicado noticias'}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* FAB para crear noticia */}
      {canCreateNoticias && (
        <Tooltip title="Crear noticia">
          <Fab
            color="primary"
            aria-label="crear noticia"
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              width: 56,
              height: 56
            }}
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Dialog para crear/editar noticia */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNoticia ? '✏️ Editar Noticia' : '📝 Crear Nueva Noticia'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Noticia</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  label="Tipo de Noticia"
                >
                  <MenuItem value="general">📰 General</MenuItem>
                  <MenuItem value="importante">⚠️ Importante</MenuItem>
                  <MenuItem value="evento">📅 Evento</MenuItem>
                  <MenuItem value="aviso">📢 Aviso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                helperText={`${formData.titulo.length}/200 caracteres`}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contenido"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                multiline
                rows={6}
                required
                helperText={`${formData.contenido.length}/2000 caracteres`}
                inputProps={{ maxLength: 2000 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de Imagen (Opcional)"
                value={formData.imagen_url}
                onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                helperText="Puedes agregar una imagen desde una URL pública"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={editingNoticia ? handleUpdateNoticia : handleCreateNoticia}
            variant="contained"
            disabled={!formData.titulo.trim() || !formData.contenido.trim()}
          >
            {editingNoticia ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Noticias; 