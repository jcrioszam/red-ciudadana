-- Esquema SQL para Red Ciudadana - Sistema de Partido Político
-- Base de datos: SQLite

-- Tabla de Usuarios (Líderes y Capturistas)
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    edad INTEGER,
    sexo VARCHAR(10),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'lider_estatal', 'lider_regional', 'lider_municipal', 'lider_zona', 'capturista')),
    id_lider_superior INTEGER,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_lider_superior) REFERENCES usuarios(id)
);

-- Tabla de Personas (Afiliados/Simpatizantes)
CREATE TABLE personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    edad INTEGER,
    sexo VARCHAR(10),
    clave_elector VARCHAR(18) UNIQUE,
    curp VARCHAR(18),
    num_emision VARCHAR(10),
    seccion_electoral VARCHAR(10),
    distrito VARCHAR(10),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    foto_credencial VARCHAR(255),
    firma VARCHAR(255),
    acepta_politica BOOLEAN DEFAULT 0,
    id_lider_responsable INTEGER NOT NULL,
    latitud REAL,
    longitud REAL,
    colonia VARCHAR(100),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_lider_responsable) REFERENCES usuarios(id)
);

-- Tabla de Eventos
CREATE TABLE eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha DATETIME NOT NULL,
    lugar VARCHAR(200),
    tipo VARCHAR(50) CHECK (tipo IN ('mitin', 'eleccion', 'reunion', 'movilizacion', 'otro')),
    id_lider_organizador INTEGER NOT NULL,
    seccion_electoral VARCHAR(10),
    colonia VARCHAR(100),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_lider_organizador) REFERENCES usuarios(id)
);

-- Tabla de Asistencias
CREATE TABLE asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_evento INTEGER NOT NULL,
    id_persona INTEGER NOT NULL,
    asistio BOOLEAN DEFAULT 0,
    movilizado BOOLEAN DEFAULT 0,
    requiere_transporte BOOLEAN DEFAULT 0,
    observaciones TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evento) REFERENCES eventos(id),
    FOREIGN KEY (id_persona) REFERENCES personas(id),
    UNIQUE(id_evento, id_persona)
);

-- Tabla de Secciones Electorales (para validación)
CREATE TABLE secciones_electorales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seccion VARCHAR(10) UNIQUE NOT NULL,
    distrito VARCHAR(10),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    latitud REAL,
    longitud REAL
);

-- Tabla de Colonias (para validación)
CREATE TABLE colonias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    seccion_electoral VARCHAR(10),
    latitud REAL,
    longitud REAL,
    FOREIGN KEY (seccion_electoral) REFERENCES secciones_electorales(seccion)
);

-- Tabla de Vehículos
CREATE TABLE vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo VARCHAR(50) NOT NULL, -- camión, carro, taxi, etc.
    capacidad INTEGER NOT NULL,
    placas VARCHAR(20),
    descripcion TEXT,
    id_movilizador INTEGER NOT NULL,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_movilizador) REFERENCES usuarios(id)
);

-- Tabla de Asignaciones de Movilización
CREATE TABLE asignaciones_movilizacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_evento INTEGER NOT NULL,
    id_vehiculo INTEGER NOT NULL,
    id_persona INTEGER NOT NULL,
    asistio BOOLEAN DEFAULT 0,
    requiere_transporte BOOLEAN DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_evento) REFERENCES eventos(id),
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id),
    FOREIGN KEY (id_persona) REFERENCES personas(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_lider_superior ON usuarios(id_lider_superior);
CREATE INDEX idx_personas_lider_responsable ON personas(id_lider_responsable);
CREATE INDEX idx_personas_seccion ON personas(seccion_electoral);
CREATE INDEX idx_personas_colonia ON personas(colonia);
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_lider_organizador ON eventos(id_lider_organizador);
CREATE INDEX idx_asistencias_evento ON asistencias(id_evento);
CREATE INDEX idx_asistencias_persona ON asistencias(id_persona);

-- Índices para movilización
CREATE INDEX idx_vehiculos_movilizador ON vehiculos(id_movilizador);
CREATE INDEX idx_asignaciones_evento ON asignaciones_movilizacion(id_evento);
CREATE INDEX idx_asignaciones_vehiculo ON asignaciones_movilizacion(id_vehiculo);
CREATE INDEX idx_asignaciones_persona ON asignaciones_movilizacion(id_persona);

-- Datos iniciales (opcional)
-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Administrador', 'admin@redciudadana.com', 'hash_placeholder', 'admin');

-- Comentarios sobre el esquema:
-- 1. Las claves de elector son únicas para evitar duplicados
-- 2. Se incluyen campos de georreferenciación (latitud, longitud)
-- 3. Se mantiene trazabilidad con fechas de registro
-- 4. Se incluyen campos de activo/inactivo para soft deletes
-- 5. Se validan roles y tipos de eventos con CHECK constraints
-- 6. Se crean índices para optimizar consultas frecuentes 