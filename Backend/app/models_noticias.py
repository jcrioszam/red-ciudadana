from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Noticia(Base):
    """Modelo para gestionar noticias y anuncios del banner principal"""
    __tablename__ = "noticias"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False, index=True)
    descripcion_corta = Column(String(500), nullable=False)
    contenido_completo = Column(Text, nullable=True)
    imagen_url = Column(String(500), nullable=True)
    imagen_alt = Column(String(200), nullable=True)
    
    # Metadatos
    fecha_creacion = Column(DateTime, default=func.now(), nullable=False)
    fecha_publicacion = Column(DateTime, nullable=True)
    fecha_expiracion = Column(DateTime, nullable=True)
    
    # Estado y prioridad
    activa = Column(Boolean, default=True, nullable=False)
    destacada = Column(Boolean, default=False, nullable=False)
    prioridad = Column(Integer, default=1, nullable=False)  # 1=alta, 2=media, 3=baja
    
    # Categorías
    categoria = Column(String(100), default="general", nullable=False)
    tags = Column(String(500), nullable=True)  # Separados por comas
    
    # Enlaces
    enlace_externo = Column(String(500), nullable=True)
    boton_texto = Column(String(100), nullable=True)
    
    # Estadísticas
    vistas = Column(Integer, default=0, nullable=False)
    clicks = Column(Integer, default=0, nullable=False)
    
    # Autor y auditoría
    autor_id = Column(Integer, nullable=True)  # ID del usuario que creó la noticia
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Noticia(id={self.id}, titulo='{self.titulo}', activa={self.activa})>"
    
    def to_dict(self):
        """Convertir a diccionario para API"""
        return {
            "id": self.id,
            "titulo": self.titulo,
            "descripcion_corta": self.descripcion_corta,
            "contenido_completo": self.contenido_completo,
            "imagen_url": self.imagen_url,
            "imagen_alt": self.imagen_alt,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "fecha_publicacion": self.fecha_publicacion.isoformat() if self.fecha_publicacion else None,
            "fecha_expiracion": self.fecha_expiracion.isoformat() if self.fecha_expiracion else None,
            "activa": self.activa,
            "destacada": self.destacada,
            "prioridad": self.prioridad,
            "categoria": self.categoria,
            "tags": self.tags,
            "enlace_externo": self.enlace_externo,
            "boton_texto": self.boton_texto,
            "vistas": self.vistas,
            "clicks": self.clicks,
            "autor_id": self.autor_id,
            "fecha_modificacion": self.fecha_modificacion.isoformat() if self.fecha_modificacion else None
        }
