from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from .constants import TIPOS_REPORTE, ESTADOS_REPORTE, PRIORIDADES_REPORTE, es_tipo_reporte_valido

# Schemas para Reportes Ciudadanos
class ReporteCiudadanoBase(BaseModel):
    titulo: str
    descripcion: str
    tipo: str
    latitud: float
    longitud: float
    direccion: str | None = None
    foto_url: str | None = None
    prioridad: str = "normal"
    
    @validator('tipo')
    def validar_tipo(cls, v):
        if not es_tipo_reporte_valido(v):
            tipos_validos = ", ".join(TIPOS_REPORTE)
            raise ValueError(f"Tipo de reporte inválido. Tipos válidos: {tipos_validos}")
        return v
    
    @validator('prioridad')
    def validar_prioridad(cls, v):
        if v not in PRIORIDADES_REPORTE:
            prioridades_validas = ", ".join(PRIORIDADES_REPORTE)
            raise ValueError(f"Prioridad inválida. Prioridades válidas: {prioridades_validas}")
        return v

class ReporteCiudadanoCreate(ReporteCiudadanoBase):
    pass

class ReporteCiudadanoUpdate(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    tipo: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    direccion: str | None = None
    foto_url: str | None = None
    estado: str | None = None
    prioridad: str | None = None
    observaciones_admin: str | None = None
    administrador_id: int | None = None
    
    @validator('tipo')
    def validar_tipo(cls, v):
        if v is not None and not es_tipo_reporte_valido(v):
            tipos_validos = ", ".join(TIPOS_REPORTE)
            raise ValueError(f"Tipo de reporte inválido. Tipos válidos: {tipos_validos}")
        return v
    
    @validator('estado')
    def validar_estado(cls, v):
        if v is not None and v not in ESTADOS_REPORTE:
            estados_validos = ", ".join(ESTADOS_REPORTE)
            raise ValueError(f"Estado inválido. Estados válidos: {estados_validos}")
        return v
    
    @validator('prioridad')
    def validar_prioridad(cls, v):
        if v is not None and v not in PRIORIDADES_REPORTE:
            prioridades_validas = ", ".join(PRIORIDADES_REPORTE)
            raise ValueError(f"Prioridad inválida. Prioridades válidas: {prioridades_validas}")
        return v

class ReporteCiudadano(ReporteCiudadanoBase):
    id: int
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    fecha_resolucion: datetime | None = None
    ciudadano_id: int
    administrador_id: int | None = None
    observaciones_admin: str | None = None
    activo: bool
    ciudadano_nombre: str | None = None
    administrador_nombre: str | None = None

    class Config:
        from_attributes = True 