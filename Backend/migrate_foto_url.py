#!/usr/bin/env python3
"""
Script para migrar el campo foto_url de reportes ciudadanos
Aumentar límite de 500 a 10000 caracteres para soportar base64
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def migrate_foto_url():
    """Migrar campo foto_url de reportes ciudadanos"""
    
    # Obtener DATABASE_URL del environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL no encontrada en environment")
        return False
    
    try:
        # Conectar a la base de datos
        print("🔌 Conectando a la base de datos...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Conectado a la base de datos")
        
        # Verificar si la tabla existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'reportes_ciudadanos'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("❌ Tabla reportes_ciudadanos no existe")
            return False
        
        print("✅ Tabla reportes_ciudadanos encontrada")
        
        # Verificar el tipo actual del campo foto_url
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'reportes_ciudadanos' 
            AND column_name = 'foto_url';
        """)
        
        column_info = cursor.fetchone()
        if not column_info:
            print("❌ Campo foto_url no encontrado")
            return False
        
        current_length = column_info[2]
        print(f"📏 Campo foto_url actual: {column_info[1]}({current_length})")
        
        # Si ya tiene el tamaño correcto, no hacer nada
        if current_length and current_length >= 10000:
            print("✅ Campo foto_url ya tiene el tamaño correcto")
            return True
        
        # Alterar el campo para aumentar el límite
        print("🔧 Alterando campo foto_url...")
        cursor.execute("""
            ALTER TABLE reportes_ciudadanos 
            ALTER COLUMN foto_url TYPE VARCHAR(10000);
        """)
        
        print("✅ Campo foto_url alterado exitosamente")
        
        # Verificar el cambio
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'reportes_ciudadanos' 
            AND column_name = 'foto_url';
        """)
        
        new_column_info = cursor.fetchone()
        print(f"📏 Campo foto_url nuevo: {new_column_info[1]}({new_column_info[2]})")
        
        cursor.close()
        conn.close()
        
        print("🎉 Migración completada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando migración del campo foto_url...")
    success = migrate_foto_url()
    if success:
        print("✅ Migración exitosa")
    else:
        print("❌ Migración fallida")
