-- Script para importar datos del padrón electoral directamente a PostgreSQL
-- Ejecutar en pgAdmin, DBeaver o cualquier cliente PostgreSQL

-- 1. Crear la tabla si no existe (Railway ya la tiene, pero por si acaso)
CREATE TABLE IF NOT EXISTS padron_electoral (
    id SERIAL PRIMARY KEY,
    consecutivo INTEGER NOT NULL,
    elector VARCHAR(18) NOT NULL,
    fol_nac VARCHAR(20),
    ocr VARCHAR(20),
    ape_pat VARCHAR(100) NOT NULL,
    ape_mat VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fnac DATE,
    edad INTEGER,
    sexo VARCHAR(10),
    curp VARCHAR(18) UNIQUE,
    ocupacion VARCHAR(100),
    calle VARCHAR(200),
    num_ext VARCHAR(20),
    num_int VARCHAR(20),
    colonia VARCHAR(100),
    codpostal VARCHAR(10),
    tiempres VARCHAR(50),
    entidad VARCHAR(50),
    distrito VARCHAR(10),
    municipio VARCHAR(100),
    seccion VARCHAR(10),
    localidad VARCHAR(100),
    manzana VARCHAR(20),
    en_ln VARCHAR(10),
    misioncr VARCHAR(50),
    fecha_importacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    id_lider_asignado INTEGER,
    fecha_asignacion TIMESTAMP,
    id_usuario_asignacion INTEGER
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_padron_elector ON padron_electoral(elector);
CREATE INDEX IF NOT EXISTS idx_padron_ape_pat ON padron_electoral(ape_pat);
CREATE INDEX IF NOT EXISTS idx_padron_ape_mat ON padron_electoral(ape_mat);
CREATE INDEX IF NOT EXISTS idx_padron_nombre ON padron_electoral(nombre);
CREATE INDEX IF NOT EXISTS idx_padron_sexo ON padron_electoral(sexo);
CREATE INDEX IF NOT EXISTS idx_padron_entidad ON padron_electoral(entidad);
CREATE INDEX IF NOT EXISTS idx_padron_municipio ON padron_electoral(municipio);
CREATE INDEX IF NOT EXISTS idx_padron_seccion ON padron_electoral(seccion);
CREATE INDEX IF NOT EXISTS idx_padron_colonia ON padron_electoral(colonia);
CREATE INDEX IF NOT EXISTS idx_padron_codpostal ON padron_electoral(codpostal);

-- 3. Ejemplo de inserción de datos (reemplaza con tus datos reales)
-- Formato para insertar datos manualmente:

INSERT INTO padron_electoral (
    consecutivo, elector, ape_pat, ape_mat, nombre, fnac, sexo, 
    entidad, municipio, seccion, localidad, colonia, codpostal
) VALUES 
(1, '123456789012345678', 'GARCIA', 'LOPEZ', 'JUAN CARLOS', '1990-05-15', 'M', 
 'SONORA', 'HERMOSILLO', '001', 'CENTRO', 'CENTRO', '83000'),
(2, '123456789012345679', 'MARTINEZ', 'RODRIGUEZ', 'MARIA ELENA', '1985-08-22', 'F', 
 'SONORA', 'HERMOSILLO', '002', 'CENTRO', 'CENTRO', '83000');

-- 4. Verificar que los datos se insertaron correctamente
SELECT COUNT(*) as total_registros FROM padron_electoral;
SELECT * FROM padron_electoral LIMIT 10;

-- 5. Si necesitas limpiar la tabla (CUIDADO: esto borra todos los datos)
-- DELETE FROM padron_electoral;
