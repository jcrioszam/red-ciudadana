-- Script SQL para agregar la columna id_usuario_registro a la tabla personas
-- Ejecutar directamente en la base de datos PostgreSQL

-- 1. Agregar la columna id_usuario_registro
ALTER TABLE personas 
ADD COLUMN id_usuario_registro INTEGER;

-- 2. Agregar la restricción de foreign key
ALTER TABLE personas 
ADD CONSTRAINT fk_personas_usuario_registro 
FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id);

-- 3. Actualizar registros existentes para que id_usuario_registro = id_lider_responsable
UPDATE personas 
SET id_usuario_registro = id_lider_responsable 
WHERE id_usuario_registro IS NULL;

-- 4. Hacer la columna NOT NULL después de poblarla
ALTER TABLE personas 
ALTER COLUMN id_usuario_registro SET NOT NULL;

-- 5. Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name = 'id_usuario_registro';

-- 6. Verificar que los datos se copiaron correctamente
SELECT 
    COUNT(*) as total_personas,
    COUNT(id_usuario_registro) as con_usuario_registro,
    COUNT(id_lider_responsable) as con_lider_responsable
FROM personas;
