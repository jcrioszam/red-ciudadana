import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  TextField,
  Badge,
  Collapse,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import api from '../api';

const Comentarios = ({ noticiaId, expanded }) => {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadComentarios();
    }
  }, [expanded, noticiaId]);

  const loadComentarios = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comentarios/?noticia_id=${noticiaId}`);
      setComentarios(response.data);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearComentario = async () => {
    try {
      if (!nuevoComentario.trim()) {
        return;
      }

      await api.post('/comentarios/', {
        contenido: nuevoComentario,
        noticia_id: noticiaId
      });

      setNuevoComentario('');
      await loadComentarios();
    } catch (error) {
      console.error('Error al crear comentario:', error);
    }
  };

  const handleLikeComentario = async (comentarioId) => {
    try {
      await api.post(`/comentarios/${comentarioId}/like`);
      await loadComentarios();
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
    }
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

  return (
    <Collapse in={expanded}>
      <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          💬 Comentarios ({comentarios.length})
        </Typography>
        
        {/* Lista de comentarios */}
        <List sx={{ mb: 2 }}>
          {comentarios.map((comentario) => (
            <ListItem key={comentario.id} sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {comentario.autor_nombre?.charAt(0) || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {comentario.autor_nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comentario.fecha_creacion)}
                    </Typography>
                  </Box>
                }
                secondary={comentario.contenido}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleLikeComentario(comentario.id)}
                  color="error"
                >
                  <Badge badgeContent={comentario.likes} color="error">
                    <ThumbUpIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>

        {/* Formulario para nuevo comentario */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Escribe un comentario..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCrearComentario();
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleCrearComentario}
            disabled={!nuevoComentario.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Collapse>
  );
};

export default Comentarios; 