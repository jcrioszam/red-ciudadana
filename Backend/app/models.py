from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
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
    opciones_app_usuario = Column(Text, nullable=True)  # JSON — override personal de opciones de app

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
    ciudadano_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # Nullable para reportes públicos
    administrador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # Quien gestiona el reporte
    observaciones_admin = Column(Text, nullable=True)
    es_publico = Column(Boolean, default=False)  # Para reportes sin login
    contacto_email = Column(String(100), nullable=True)  # Email del ciudadano para reportes públicos
    activo = Column(Boolean, default=True)
    # Columnas extendidas (agregadas via migración)
    folio = Column(String(50), nullable=True)
    votos = Column(Integer, default=0)
    vistas = Column(Integer, default=0)
    colonia = Column(String(100), nullable=True)
    calle = Column(String(200), nullable=True)
    subtipo = Column(String(50), nullable=True)
    resuelto_en = Column(DateTime, nullable=True)
    
    # Relaciones
    ciudadano = relationship("Usuario", foreign_keys=[ciudadano_id])
    administrador = relationship("Usuario", foreign_keys=[administrador_id])
    fotos = relationship("FotoReporte", back_populates="reporte", cascade="all, delete-orphan")

class FotoReporte(Base):
    __tablename__ = "fotos_reportes"
    
    id = Column(Integer, primary_key=True, index=True)
    id_reporte = Column(Integer, ForeignKey("reportes_ciudadanos.id"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    tipo = Column(String(100), nullable=False)  # MIME type
    tamaño = Column(Integer, nullable=False)  # en bytes
    url = Column(String(500), nullable=True)  # URL opcional para archivos externos
    contenido_base64 = Column(Text, nullable=True)  # 🔧 NUEVO: Contenido de la imagen en base64
    fecha_creacion = Column(DateTime, default=func.now())
    activo = Column(Boolean, default=True)
    
    # Relaciones
    reporte = relationship("ReporteCiudadano", back_populates="fotos")

# 🆕 NUEVOS MODELOS: Sistema de Permisos Individuales
class Permiso(Base):
    __tablename__ = "permisos"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), unique=True, nullable=False, index=True)  # "admin-database"
    nombre = Column(String(200), nullable=False)  # "Administración de Base de Datos"
    descripcion = Column(Text, nullable=True)
    categoria = Column(String(100), nullable=True)  # "admin", "usuarios", "reportes"
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    perfiles_permisos = relationship("PerfilPermiso", back_populates="permiso")

class PerfilPermiso(Base):
    __tablename__ = "perfiles_permisos"
    
    id = Column(Integer, primary_key=True, index=True)
    id_perfil = Column(Integer, ForeignKey("configuraciones_perfiles.id"), nullable=False)
    id_permiso = Column(Integer, ForeignKey("permisos.id"), nullable=False)
    habilitado = Column(Boolean, default=False)
    fecha_asignacion = Column(DateTime, default=func.now())
    
    # Relaciones
    perfil = relationship("ConfiguracionPerfil")
    permiso = relationship("Permiso", back_populates="perfiles_permisos")

# 🆕 PERMISOS POR DEFECTO DEL SISTEMA
PERMISOS_POR_DEFECTO = [
    {"codigo": "usuarios", "nombre": "Gestión de Usuarios", "categoria": "admin", "descripcion": "Crear, editar y eliminar usuarios del sistema"},
    {"codigo": "personas", "nombre": "Gestión de Personas", "categoria": "usuarios", "descripcion": "Registrar y gestionar personas en la base de datos"},
    {"codigo": "eventos", "nombre": "Gestión de Eventos", "categoria": "eventos", "descripcion": "Crear y organizar eventos"},
    {"codigo": "eventos-historicos", "nombre": "Eventos Históricos", "categoria": "eventos", "descripcion": "Ver y gestionar eventos pasados"},
    {"codigo": "movilizacion", "nombre": "Gestión de Movilización", "categoria": "movilizacion", "descripcion": "Gestionar vehículos y movilización"},
    {"codigo": "reportes", "nombre": "Generación de Reportes", "categoria": "reportes", "descripcion": "Crear y exportar reportes del sistema"},
    {"codigo": "estructura-red", "nombre": "Estructura de Red", "categoria": "estructura", "descripcion": "Gestionar la estructura jerárquica de la red"},
    {"codigo": "checkin", "nombre": "Sistema de Check-in", "categoria": "eventos", "descripcion": "Gestionar asistencia a eventos"},
    {"codigo": "seguimiento", "nombre": "Seguimiento en Tiempo Real", "categoria": "seguimiento", "descripcion": "Monitorear ubicaciones y movimientos"},
    {"codigo": "noticias", "nombre": "Gestión de Noticias", "categoria": "contenido", "descripcion": "Publicar y gestionar noticias"},
    {"codigo": "reportes-ciudadanos", "nombre": "Reportes Ciudadanos", "categoria": "reportes", "descripcion": "Gestionar reportes de ciudadanos"},
    {"codigo": "mapa-reportes", "nombre": "Mapa de Reportes", "categoria": "reportes", "descripcion": "Visualizar reportes en mapa"},
    {"codigo": "seguimiento-reportes", "nombre": "Seguimiento de Reportes", "categoria": "reportes", "descripcion": "Dar seguimiento a reportes ciudadanos"},
    {"codigo": "perfil", "nombre": "Gestión de Perfil", "categoria": "usuarios", "descripcion": "Editar perfil personal"},
    {"codigo": "admin-perfiles", "nombre": "Administración de Perfiles", "categoria": "admin", "descripcion": "Configurar permisos y roles de usuarios"},
    {"codigo": "admin-dashboard", "nombre": "Administración del Dashboard", "categoria": "admin", "descripcion": "Configurar widgets y layout del dashboard"},
    {"codigo": "admin-database", "nombre": "Administración de Base de Datos", "categoria": "admin", "descripcion": "Acceso completo a la administración de la base de datos"},
    {"codigo": "admin-incentivos", "nombre": "Administración de Incentivos", "categoria": "admin", "descripcion": "Configurar montos y gestionar cortes de incentivos"},
    {"codigo": "admin-duplicados", "nombre": "Gestión de Duplicados", "categoria": "admin", "descripcion": "Revisar y resolver personas duplicadas"},
    {"codigo": "admin-perfiles", "nombre": "Opciones App por Usuario", "categoria": "admin", "descripcion": "Configurar qué secciones ve cada usuario en la app móvil"},
]


# ── Sistema de Incentivos ─────────────────────────────────────────────────────

class ConfiguracionIncentivo(Base):
    __tablename__ = "configuracion_incentivo"

    id = Column(Integer, primary_key=True, index=True)
    monto_por_persona = Column(Float, nullable=False, default=0.0)
    descripcion = Column(String(300), nullable=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    creador = relationship("Usuario", foreign_keys=[creado_por])


class CorteIncentivo(Base):
    """Representa un corte/pago generado para un registrador."""
    __tablename__ = "cortes_incentivo"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_corte = Column(DateTime, default=func.now())
    total_personas = Column(Integer, nullable=False, default=0)
    monto_por_persona = Column(Float, nullable=False, default=0.0)
    monto_total = Column(Float, nullable=False, default=0.0)
    pagado = Column(Boolean, default=False)
    fecha_pago = Column(DateTime, nullable=True)
    notas = Column(Text, nullable=True)
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_creacion = Column(DateTime, default=func.now())

    usuario = relationship("Usuario", foreign_keys=[id_usuario])
    creador = relationship("Usuario", foreign_keys=[creado_por])
    detalles = relationship("DetalleCorteIncentivo", back_populates="corte", cascade="all, delete-orphan")


class DetalleCorteIncentivo(Base):
    """Personas incluidas en un corte de incentivo."""
    __tablename__ = "detalles_corte_incentivo"

    id = Column(Integer, primary_key=True, index=True)
    id_corte = Column(Integer, ForeignKey("cortes_incentivo.id"), nullable=False)
    id_persona = Column(Integer, ForeignKey("personas.id"), nullable=False)

    corte = relationship("CorteIncentivo", back_populates="detalles")
    persona = relationship("Persona")


# ── Sistema de Duplicados ─────────────────────────────────────────────────────

class ProbableDuplicado(Base):
    """Registro de posibles personas duplicadas detectadas automáticamente."""
    __tablename__ = "probables_duplicados"

    id = Column(Integer, primary_key=True, index=True)
    id_persona_1 = Column(Integer, ForeignKey("personas.id"), nullable=False)
    id_persona_2 = Column(Integer, ForeignKey("personas.id"), nullable=False)
    # Tipo: 'clave_elector', 'curp', 'nombre_seccion', 'nombre_municipio'
    tipo_coincidencia = Column(String(50), nullable=False)
    similitud = Column(Float, default=1.0)  # 0.0 – 1.0
    # Estado: 'pendiente', 'mismo' (confirmado dup), 'diferente' (descartado)
    estado = Column(String(20), default="pendiente")
    id_persona_ganadora = Column(Integer, ForeignKey("personas.id"), nullable=True)
    resuelto_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)
    fecha_deteccion = Column(DateTime, default=func.now())
    notas = Column(Text, nullable=True)

    persona_1 = relationship("Persona", foreign_keys=[id_persona_1])
    persona_2 = relationship("Persona", foreign_keys=[id_persona_2])
    persona_ganadora = relationship("Persona", foreign_keys=[id_persona_ganadora])
    resuelto_por_usuario = relationship("Usuario", foreign_keys=[resuelto_por])

