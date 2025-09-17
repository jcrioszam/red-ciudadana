from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime

# Schemas para Usuarios
class UsuarioBase(BaseModel):
    username: str
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    email: EmailStr
    rol: str

class UsuarioCreate(UsuarioBase):
    # Permitir username opcional en creación; si falta, el backend lo generará
    username: Optional[str] = None
    password: str
    id_lider_superior: Optional[int] = None

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None
    id_lider_superior: Optional[int] = None
    activo: Optional[bool] = None

class Usuario(UsuarioBase):
    id: int
    fecha_registro: datetime
    activo: bool
    id_lider_superior: Optional[int] = None

    class Config:
        from_attributes = True

# Schemas para Personas
class PersonaBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    clave_elector: Optional[str] = None
    curp: Optional[str] = None
    num_emision: Optional[str] = None
    seccion_electoral: Optional[str] = None
    distrito: Optional[str] = None
    municipio: Optional[str] = None
    estado: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    colonia: Optional[str] = None
    codigo_postal: Optional[str] = None

class PersonaUbicacion(BaseModel):
    id: int
    nombre: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class PersonaCreate(PersonaBase):
    id_lider_responsable: int
    acepta_politica: bool = False
    id_usuario_registro: Optional[int] = None

class PersonaUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    clave_elector: Optional[str] = None
    curp: Optional[str] = None
    num_emision: Optional[str] = None
    seccion_electoral: Optional[str] = None
    distrito: Optional[str] = None
    municipio: Optional[str] = None
    estado: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    colonia: Optional[str] = None
    codigo_postal: Optional[str] = None
    activo: Optional[bool] = None
    id_lider_responsable: Optional[int] = None
    id_usuario_registro: Optional[int] = None

class Persona(PersonaBase):
    id: int
    id_lider_responsable: int
    id_usuario_registro: Optional[int] = None
    acepta_politica: bool
    fecha_registro: datetime
    activo: bool
    lider_responsable: Optional[Usuario] = None

    class Config:
        from_attributes = True

# Schemas para Eventos
class EventoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha: datetime
    lugar: Optional[str] = None
    tipo: str
    seccion_electoral: Optional[str] = None
    colonia: Optional[str] = None

class EventoCreate(EventoBase):
    id_lider_organizador: int

class EventoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[datetime] = None
    lugar: Optional[str] = None
    tipo: Optional[str] = None
    seccion_electoral: Optional[str] = None
    colonia: Optional[str] = None
    activo: Optional[bool] = None

class Evento(EventoBase):
    id: int
    id_lider_organizador: int
    fecha_creacion: datetime
    activo: bool

    class Config:
        from_attributes = True

# Schemas para Asistencias
class AsistenciaBase(BaseModel):
    asistio: bool = False
    movilizado: bool = False
    requiere_transporte: bool = False
    observaciones: Optional[str] = None
    hora_checkin: Optional[datetime] = None
    usuario_checkin: Optional[int] = None

class AsistenciaCreate(AsistenciaBase):
    id_evento: int
    id_persona: int

class AsistenciaUpdate(BaseModel):
    asistio: Optional[bool] = None
    movilizado: Optional[bool] = None
    requiere_transporte: Optional[bool] = None
    observaciones: Optional[str] = None
    hora_checkin: Optional[datetime] = None
    usuario_checkin: Optional[int] = None

class Asistencia(AsistenciaBase):
    id: int
    id_evento: int
    id_persona: int
    fecha_registro: datetime

    class Config:
        from_attributes = True

# Schemas para Autenticación
class Login(BaseModel):
    identificador: str  # Puede ser email o teléfono
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Schemas para Reportes
class ReportePersonas(BaseModel):
    total_personas: int
    personas_por_seccion: dict
    personas_por_colonia: dict
    personas_por_lider: dict

class ReporteEventos(BaseModel):
    total_eventos: int
    eventos_por_tipo: dict
    asistencias_por_evento: dict
    eficiencia_movilizacion: dict

# Schema para Estructura Jerárquica
class NodoJerarquico(BaseModel):
    id: int
    nombre: str
    rol: str
    total_personas: int
    total_subordinados: int
    subordinados: List['NodoJerarquico'] = []

class EstructuraJerarquica(BaseModel):
    lider_general: NodoJerarquico
    total_personas_red: int
    total_lideres_red: int
    niveles_jerarquia: int 

# Schemas para Vehículos
class VehiculoBase(BaseModel):
    tipo: str
    capacidad: int
    placas: Optional[str] = None
    descripcion: Optional[str] = None
    id_movilizador: int
    activo: bool = True

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(BaseModel):
    tipo: Optional[str] = None
    capacidad: Optional[int] = None
    placas: Optional[str] = None
    descripcion: Optional[str] = None
    id_movilizador: Optional[int] = None
    activo: Optional[bool] = None

class Vehiculo(VehiculoBase):
    id: int
    class Config:
        from_attributes = True

# Schemas para Asignaciones de Movilización
class AsignacionMovilizacionBase(BaseModel):
    id_evento: int
    id_vehiculo: int
    id_persona: int
    asistio: bool = False
    requiere_transporte: bool = False
    observaciones: Optional[str] = None

class AsignacionMovilizacionCreate(AsignacionMovilizacionBase):
    pass

class AsignacionMovilizacionUpdate(BaseModel):
    asistio: Optional[bool] = None
    requiere_transporte: Optional[bool] = None
    observaciones: Optional[str] = None

class AsignacionMovilizacion(AsignacionMovilizacionBase):
    id: int
    persona: Optional[Persona] = None
    class Config:
        from_attributes = True 

class NoticiaBase(BaseModel):
    titulo: str
    contenido: str
    imagen_url: str | None = None
    tipo: str = "general"

class NoticiaCreate(NoticiaBase):
    pass

class NoticiaUpdate(BaseModel):
    titulo: str | None = None
    contenido: str | None = None
    imagen_url: str | None = None
    tipo: str | None = None
    activo: bool | None = None

class Noticia(NoticiaBase):
    id: int
    fecha_publicacion: datetime
    fecha_actualizacion: datetime
    autor_id: int
    activo: bool
    likes: int
    compartidos: int
    autor_nombre: str | None = None

    class Config:
        from_attributes = True

# Schemas para Comentarios
class ComentarioBase(BaseModel):
    contenido: str

class ComentarioCreate(ComentarioBase):
    noticia_id: int

class ComentarioUpdate(BaseModel):
    contenido: str | None = None
    activo: bool | None = None

class Comentario(ComentarioBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    autor_id: int
    noticia_id: int
    activo: bool
    likes: int
    autor_nombre: str | None = None

    class Config:
        from_attributes = True 