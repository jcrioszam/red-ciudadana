from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class NoticiaBase(BaseModel):
    """Esquema base para noticias"""
    titulo: str
    descripcion_corta: str
    contenido_completo: Optional[str] = None
    imagen_url: Optional[str] = None
    imagen_alt: Optional[str] = None
    fecha_publicacion: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None
    activa: bool = True
    destacada: bool = False
    prioridad: int = 2  # 1=alta, 2=media, 3=baja
    categoria: str = "general"
    tags: Optional[str] = None
    enlace_externo: Optional[str] = None
    boton_texto: Optional[str] = None
    
    @validator('titulo')
    def validar_titulo(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('El título debe tener al menos 5 caracteres')
        if len(v) > 200:
            raise ValueError('El título no puede exceder 200 caracteres')
        return v.strip()
    
    @validator('descripcion_corta')
    def validar_descripcion_corta(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('La descripción corta debe tener al menos 10 caracteres')
        if len(v) > 500:
            raise ValueError('La descripción corta no puede exceder 500 caracteres')
        return v.strip()
    
    @validator('prioridad')
    def validar_prioridad(cls, v):
        if v not in [1, 2, 3]:
            raise ValueError('La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)')
        return v
    
    @validator('categoria')
    def validar_categoria(cls, v):
        categorias_validas = [
            'general', 'noticias', 'anuncios', 'eventos', 
            'emergencias', 'obras', 'servicios', 'comunidad'
        ]
        if v not in categorias_validas:
            raise ValueError(f'Categoría inválida. Categorías válidas: {", ".join(categorias_validas)}')
        return v

class NoticiaCreate(NoticiaBase):
    """Esquema para crear una nueva noticia"""
    pass

class NoticiaUpdate(BaseModel):
    """Esquema para actualizar una noticia existente"""
    titulo: Optional[str] = None
    descripcion_corta: Optional[str] = None
    contenido_completo: Optional[str] = None
    imagen_url: Optional[str] = None
    imagen_alt: Optional[str] = None
    fecha_publicacion: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None
    activa: Optional[bool] = None
    destacada: Optional[bool] = None
    prioridad: Optional[int] = None
    categoria: Optional[str] = None
    tags: Optional[str] = None
    enlace_externo: Optional[str] = None
    boton_texto: Optional[str] = None
    
    @validator('titulo')
    def validar_titulo(cls, v):
        if v is not None:
            if len(v.strip()) < 5:
                raise ValueError('El título debe tener al menos 5 caracteres')
            if len(v) > 200:
                raise ValueError('El título no puede exceder 200 caracteres')
            return v.strip()
        return v
    
    @validator('descripcion_corta')
    def validar_descripcion_corta(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción corta debe tener al menos 10 caracteres')
            if len(v) > 500:
                raise ValueError('La descripción corta no puede exceder 500 caracteres')
            return v.strip()
        return v
    
    @validator('prioridad')
    def validar_prioridad(cls, v):
        if v is not None and v not in [1, 2, 3]:
            raise ValueError('La prioridad debe ser 1 (alta), 2 (media) o 3 (baja)')
        return v
    
    @validator('categoria')
    def validar_categoria(cls, v):
        if v is not None:
            categorias_validas = [
                'general', 'noticias', 'anuncios', 'eventos', 
                'emergencias', 'obras', 'servicios', 'comunidad'
            ]
            if v not in categorias_validas:
                raise ValueError(f'Categoría inválida. Categorías válidas: {", ".join(categorias_validas)}')
        return v

class NoticiaResponse(NoticiaBase):
    """Esquema para respuesta de noticias"""
    id: int
    fecha_creacion: datetime
    fecha_modificacion: datetime
    vistas: int
    clicks: int
    autor_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class NoticiaBannerResponse(BaseModel):
    """Esquema simplificado para noticias del banner"""
    id: int
    titulo: str
    descripcion_corta: str
    imagen_url: Optional[str] = None
    imagen_alt: Optional[str] = None
    categoria: str
    destacada: bool
    prioridad: int
    enlace_externo: Optional[str] = None
    boton_texto: Optional[str] = None
    fecha_publicacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True
