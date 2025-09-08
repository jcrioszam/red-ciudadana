from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class PadronElectoral(Base):
    __tablename__ = "padron_electoral"

    id = Column(Integer, primary_key=True, index=True)
    
    # Campos del padrón electoral
    consecutivo = Column(Integer, nullable=False, index=True)
    elector = Column(String(18), nullable=False, index=True)  # Clave de elector
    fol_nac = Column(String(20))
    ocr = Column(String(20))
    ape_pat = Column(String(100), nullable=False, index=True)
    ape_mat = Column(String(100), nullable=False, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    fnac = Column(Date)
    edad = Column(Integer)
    sexo = Column(String(10), index=True)
    curp = Column(String(18), unique=True, index=True)
    ocupacion = Column(String(100))
    calle = Column(String(200))
    num_ext = Column(String(20))
    num_int = Column(String(20))
    colonia = Column(String(100), index=True)
    codpostal = Column(String(10), index=True)
    tiempres = Column(String(50))
    entidad = Column(String(50), index=True)
    distrito = Column(String(10), index=True)
    municipio = Column(String(100), index=True)
    seccion = Column(String(10), index=True)
    localidad = Column(String(100))
    manzana = Column(String(20))
    en_ln = Column(String(10))
    misioncr = Column(String(50))
    
    # Campos de control
    fecha_importacion = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)
    
    # Asignación a líder
    id_lider_asignado = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_asignacion = Column(DateTime, nullable=True)
    id_usuario_asignacion = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relaciones
    lider_asignado = relationship("Usuario", foreign_keys=[id_lider_asignado], backref="personas_padron_asignadas")
    usuario_asignacion = relationship("Usuario", foreign_keys=[id_usuario_asignacion])

# Índices compuestos para optimizar búsquedas
Index('idx_padron_elector_seccion', PadronElectoral.elector, PadronElectoral.seccion)
Index('idx_padron_curp_activo', PadronElectoral.curp, PadronElectoral.activo)
Index('idx_padron_nombre_ape', PadronElectoral.nombre, PadronElectoral.ape_pat, PadronElectoral.ape_mat)
Index('idx_padron_municipio_seccion', PadronElectoral.municipio, PadronElectoral.seccion)
Index('idx_padron_lider_activo', PadronElectoral.id_lider_asignado, PadronElectoral.activo)
