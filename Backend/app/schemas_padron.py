from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PadronElectoralBase(BaseModel):
    consecutivo: int
    elector: str
    fol_nac: Optional[str] = None
    ocr: Optional[str] = None
    ape_pat: str
    ape_mat: str
    nombre: str
    fnac: Optional[date] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    curp: Optional[str] = None
    ocupacion: Optional[str] = None
    calle: Optional[str] = None
    num_ext: Optional[str] = None
    num_int: Optional[str] = None
    colonia: Optional[str] = None
    codpostal: Optional[str] = None
    tiempres: Optional[str] = None
    entidad: Optional[str] = None
    distrito: Optional[str] = None
    municipio: Optional[str] = None
    seccion: Optional[str] = None
    localidad: Optional[str] = None
    manzana: Optional[str] = None
    en_ln: Optional[str] = None
    misioncr: Optional[str] = None

class PadronElectoralCreate(PadronElectoralBase):
    pass

class PadronElectoralUpdate(BaseModel):
    id_lider_asignado: Optional[int] = None
    activo: Optional[bool] = None

class PadronElectoral(PadronElectoralBase):
    id: int
    fecha_importacion: datetime
    activo: bool
    id_lider_asignado: Optional[int] = None
    fecha_asignacion: Optional[datetime] = None
    id_usuario_asignacion: Optional[int] = None
    
    class Config:
        from_attributes = True

class PadronSearchRequest(BaseModel):
    elector: Optional[str] = None
    curp: Optional[str] = None
    nombre: Optional[str] = None
    ape_pat: Optional[str] = None
    ape_mat: Optional[str] = None
    seccion: Optional[str] = None
    municipio: Optional[str] = None
    distrito: Optional[str] = None
    limit: int = 50
    offset: int = 0

class PadronSearchResponse(BaseModel):
    registros: list[PadronElectoral]
    total: int
    pagina_actual: int
    total_paginas: int

class AsignacionPadronRequest(BaseModel):
    id_padron: int
    id_lider: int

class AsignacionPadronResponse(BaseModel):
    success: bool
    message: str
    registro: Optional[PadronElectoral] = None

class EstadisticasPadron(BaseModel):
    total_registros: int
    registros_asignados: int
    registros_disponibles: int
    total_lideres: int
    asignaciones_por_lider: list[dict]
