from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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