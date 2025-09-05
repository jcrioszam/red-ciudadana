#!/usr/bin/env python3
"""
Script para agregar la columna contenido_base64 directamente en Railway
"""

import os
import psycopg2
from urllib.parse import urlparse

def agregar_columna_railway():
    print("🔧 AGREGANDO COLUMNA contenido_base64 EN RAILWAY")
    print("=" * 60)
    
    try:
        # Obtener DATABASE_URL de Railway
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL no encontrada en variables de entorno")
            print("💡 Ejecuta este script en Railway o configura DATABASE_URL")
            return
        
        print("🔗 Conectando a la base de datos de Railway...")
        
        # Parsear la URL de la base de datos
        parsed_url = urlparse(database_url)
        
        # Conectar a PostgreSQL
        conn = psycopg2.connect(
            host=parsed_url.hostname,
            port=parsed_url.port,
            database=parsed_url.path[1:],  # Remover el '/' inicial
            user=parsed_url.username,
            password=parsed_url.password
        )
        
        print("✅ Conectado a la base de datos")
        
        # Crear cursor
        cursor = conn.cursor()
        
        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fotos_reportes' 
            AND column_name = 'contenido_base64'
        """)
        
        if cursor.fetchone():
            print("✅ La columna 'contenido_base64' ya existe")
            return
        
        # Agregar la columna
        print("📝 Agregando columna 'contenido_base64'...")
        cursor.execute("""
            ALTER TABLE fotos_reportes 
            ADD COLUMN contenido_base64 TEXT
        """)
        
        # Confirmar cambios
        conn.commit()
        
        print("✅ Columna 'contenido_base64' agregada exitosamente")
        
        # Verificar que se agregó correctamente
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'fotos_reportes' 
            AND column_name = 'contenido_base64'
        """)
        
        row = cursor.fetchone()
        if row:
            print(f"✅ Verificación: Columna '{row[0]}' de tipo '{row[1]}' creada correctamente")
        else:
            print("❌ Error: No se pudo verificar la creación de la columna")
        
        # Cerrar conexión
        cursor.close()
        conn.close()
        
        print("🎉 ¡Migración completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"Tipo de error: {type(e)}")

if __name__ == "__main__":
    agregar_columna_railway()
