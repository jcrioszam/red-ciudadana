from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20))
    direccion = Column(Text)
    edad = Column(Integer)
    sexo = Column(String(10))
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    id_lider_superior = Column(Integer, ForeignKey("usuarios.id"))
    fecha_registro = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)

    # Relaciones
    subordinados = relationship("Usuario", backref="lider_superior", remote_side=[id])
    personas_registradas = relationship("Persona", back_populates="lider_responsable", foreign_keys="Persona.id_lider_responsable")
    personas_registradas_por_mi = relationship("Persona", foreign_keys="Persona.id_usuario_registro")
    eventos_organizados = relationship("Evento", back_populates="lider_organizador")

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20))
    direccion = Column(Text)
    edad = Column(Integer)
    sexo = Column(String(10))
    clave_elector = Column(String(18), unique=True, index=True)
    curp = Column(String(18))
    num_emision = Column(String(10))
    seccion_electoral = Column(String(10), index=True)
    distrito = Column(String(10))
    municipio = Column(String(100))
    estado = Column(String(50))
    foto_credencial = Column(String(255))
    firma = Column(String(255))
    acepta_politica = Column(Boolean, default=False)
    id_lider_responsable = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_usuario_registro = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    latitud = Column(Float)
    longitud = Column(Float)
    colonia = Column(String(100), index=True)
    codigo_postal = Column(String(10), index=True)
    fecha_registro = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)

    # Relaciones
    lider_responsable = relationship("Usuario", back_populates="personas_registradas", foreign_keys=[id_lider_responsable])
    usuario_registro = relationship("Usuario", foreign_keys=[id_usuario_registro])
    asistencias = relationship("Asistencia", back_populates="persona")

class Evento(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    fecha = Column(DateTime, nullable=False, index=True)
    lugar = Column(String(200))
    tipo = Column(String(50))
    id_lider_organizador = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    seccion_electoral = Column(String(10))
    colonia = Column(String(100))
    fecha_creacion = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)

    # Relaciones
    lider_organizador = relationship("Usuario", back_populates="eventos_organizados")
    asistencias = relationship("Asistencia", back_populates="evento")

class Asistencia(Base):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    id_evento = Column(Integer, ForeignKey("eventos.id"), nullable=False)
    id_persona = Column(Integer, ForeignKey("personas.id"), nullable=False)
    asistio = Column(Boolean, default=False)
    movilizado = Column(Boolean, default=False)
    requiere_transporte = Column(Boolean, default=False)
    observaciones = Column(Text)
    fecha_registro = Column(DateTime, default=func.now())
    hora_checkin = Column(DateTime, nullable=True)
    usuario_checkin = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    evento = relationship("Evento", back_populates="asistencias")
    persona = relationship("Persona", back_populates="asistencias")

class SeccionElectoral(Base):
    __tablename__ = "secciones_electorales"

    id = Column(Integer, primary_key=True, index=True)
    seccion = Column(String(10), unique=True, nullable=False)
    distrito = Column(String(10))
    municipio = Column(String(100))
    estado = Column(String(50))
    latitud = Column(Float)
    longitud = Column(Float)

class Colonia(Base):
    __tablename__ = "colonias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    seccion_electoral = Column(String(10), ForeignKey("secciones_electorales.seccion"))
    latitud = Column(Float)
    longitud = Column(Float)

class Vehiculo(Base):
    __tablename__ = "vehiculos"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)  # camión, carro, taxi, etc.
    capacidad = Column(Integer, nullable=False)
    placas = Column(String(20))
    descripcion = Column(Text)
    id_movilizador = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    movilizador = relationship("Usuario")
    activo = Column(Boolean, default=True)

class AsignacionMovilizacion(Base):
    __tablename__ = "asignaciones_movilizacion"
    id = Column(Integer, primary_key=True, index=True)
    id_evento = Column(Integer, ForeignKey("eventos.id"), nullable=False)
    id_vehiculo = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    id_persona = Column(Integer, ForeignKey("personas.id"), nullable=False)
    asistio = Column(Boolean, default=False)
    requiere_transporte = Column(Boolean, default=False)
    observaciones = Column(Text)
    evento = relationship("Evento")
    vehiculo = relationship("Vehiculo")
    persona = relationship("Persona")

class ConfiguracionPerfil(Base):
    __tablename__ = "configuraciones_perfiles"
    
    id = Column(Integer, primary_key=True, index=True)
    rol = Column(String(50), unique=True, nullable=False, index=True)
    opciones_web = Column(Text, nullable=False)  # JSON string
    opciones_app = Column(Text, nullable=False)  # JSON string
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())

class ConfiguracionDashboard(Base):
    __tablename__ = "configuraciones_dashboard"
    
    id = Column(Integer, primary_key=True, index=True)
    rol = Column(String(50), unique=True, nullable=False, index=True)
    widgets = Column(Text, nullable=False)  # JSON string
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())

class UbicacionTiempoReal(Base):
    __tablename__ = "ubicaciones_tiempo_real"
    
    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    velocidad = Column(Float, nullable=True)  # km/h
    direccion = Column(String(200), nullable=True)  # dirección formateada
    precision = Column(Float, nullable=True)  # precisión del GPS en metros
    bateria = Column(Integer, nullable=True)  # porcentaje de batería
    timestamp = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)
    
    # Campos adicionales para movilización
    evento_id = Column(Integer, ForeignKey("eventos.id"), nullable=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=True)
    evento_nombre = Column(String(200), nullable=True)
    vehiculo_tipo = Column(String(50), nullable=True)
    vehiculo_placas = Column(String(20), nullable=True)
    vehiculo_capacidad = Column(Integer, nullable=True)
    total_personas = Column(Integer, nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario")
    evento = relationship("Evento")
    vehiculo = relationship("Vehiculo") 

class Noticia(Base):
    __tablename__ = "noticias"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    contenido = Column(Text, nullable=False)
    imagen_url = Column(String(500), nullable=True)
    fecha_publicacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(50), default="general")  # general, importante, evento, aviso
    activo = Column(Boolean, default=True)
    likes = Column(Integer, default=0)
    compartidos = Column(Integer, default=0)
    
    # Relaciones
    autor = relationship("Usuario")
    comentarios = relationship("Comentario", back_populates="noticia", cascade="all, delete-orphan")

class Comentario(Base):
    __tablename__ = "comentarios"
    
    id = Column(Integer, primary_key=True, index=True)
    contenido = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    noticia_id = Column(Integer, ForeignKey("noticias.id"), nullable=False)
    activo = Column(Boolean, default=True)
    likes = Column(Integer, default=0)
    
    # Relaciones
    autor = relationship("Usuario")
    noticia = relationship("Noticia", back_populates="comentarios") 

class ReporteCiudadano(Base):
    __tablename__ = "reportes_ciudadanos"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String(50), nullable=False)  # baches, iluminacion, salud, seguridad, agua, etc.
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    direccion = Column(String(500), nullable=True)
    foto_url = Column(String(50000), nullable=True)  # 🔧 AUMENTADO: De 10000 a 50000 para base64
    estado = Column(String(50), default="pendiente")  # pendiente, en_revision, en_progreso, resuelto, rechazado
    prioridad = Column(String(20), default="normal")  # baja, normal, alta, urgente
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    fecha_resolucion = Column(DateTime, nullable=True)
    ciudadano_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    administrador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # Quien gestiona el reporte
    observaciones_admin = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)
    
    # Relaciones
    ciudadano = relationship("Usuario", foreign_keys=[ciudadano_id])
    administrador = relationship("Usuario", foreign_keys=[administrador_id]) 