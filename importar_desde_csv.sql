-- Script para importar datos desde archivo CSV a PostgreSQL
-- Usar en pgAdmin o DBeaver

-- 1. Crear tabla temporal para la importación
CREATE TEMP TABLE temp_padron_import (
    consecutivo TEXT,
    elector TEXT,
    fol_nac TEXT,
    ocr TEXT,
    ape_pat TEXT,
    ape_mat TEXT,
    nombre TEXT,
    fnac TEXT,
    edad TEXT,
    sexo TEXT,
    curp TEXT,
    ocupacion TEXT,
    calle TEXT,
    num_ext TEXT,
    num_int TEXT,
    colonia TEXT,
    codpostal TEXT,
    tiempres TEXT,
    entidad TEXT,
    distrito TEXT,
    municipio TEXT,
    seccion TEXT,
    localidad TEXT,
    manzana TEXT,
    en_ln TEXT,
    misioncr TEXT
);

-- 2. Importar desde CSV (ajusta la ruta del archivo)
-- En pgAdmin: Click derecho en la tabla temp_padron_import > Import/Export > Import
-- O usar COPY command:
-- COPY temp_padron_import FROM '/ruta/a/tu/archivo.csv' WITH CSV HEADER;

-- 3. Insertar datos en la tabla principal con validación
INSERT INTO padron_electoral (
    consecutivo, elector, fol_nac, ocr, ape_pat, ape_mat, nombre, 
    fnac, edad, sexo, curp, ocupacion, calle, num_ext, num_int, 
    colonia, codpostal, tiempres, entidad, distrito, municipio, 
    seccion, localidad, manzana, en_ln, misioncr
)
SELECT 
    CASE WHEN consecutivo ~ '^[0-9]+$' THEN consecutivo::INTEGER ELSE 0 END,
    COALESCE(elector, ''),
    fol_nac,
    ocr,
    COALESCE(ape_pat, ''),
    COALESCE(ape_mat, ''),
    COALESCE(nombre, ''),
    CASE 
        WHEN fnac ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN fnac::DATE 
        ELSE NULL 
    END,
    CASE WHEN edad ~ '^[0-9]+$' THEN edad::INTEGER ELSE NULL END,
    sexo,
    curp,
    ocupacion,
    calle,
    num_ext,
    num_int,
    colonia,
    codpostal,
    tiempres,
    entidad,
    distrito,
    municipio,
    seccion,
    localidad,
    manzana,
    en_ln,
    misioncr
FROM temp_padron_import
WHERE elector IS NOT NULL AND elector != '';

-- 4. Verificar la importación
SELECT COUNT(*) as total_importados FROM padron_electoral;
SELECT * FROM padron_electoral ORDER BY id DESC LIMIT 10;

-- 5. Limpiar tabla temporal
DROP TABLE temp_padron_import;
