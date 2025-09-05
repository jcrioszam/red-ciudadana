#!/usr/bin/env python3
"""
Script para agregar la columna contenido_base64 a la tabla fotos_reportes
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def agregar_columna_base64():
    print("🔧 AGREGANDO COLUMNA contenido_base64 A fotos_reportes")
    print("=" * 60)
    
    try:
        # Verificar si estamos usando PostgreSQL (Railway) o SQLite (local)
        with engine.connect() as conn:
            # Detectar el tipo de base de datos
            result = conn.execute(text("SELECT version()"))
            db_version = result.fetchone()[0]
            
            if "PostgreSQL" in db_version:
                print("🐘 Detectado PostgreSQL (Railway)")
                # Verificar si la columna ya existe
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'fotos_reportes' 
                    AND column_name = 'contenido_base64'
                """))
                
                if result.fetchone():
                    print("✅ La columna 'contenido_base64' ya existe")
                    return
                
                # Agregar la columna
                print("📝 Agregando columna 'contenido_base64'...")
                conn.execute(text("""
                    ALTER TABLE fotos_reportes 
                    ADD COLUMN contenido_base64 TEXT
                """))
                conn.commit()
                
                print("✅ Columna 'contenido_base64' agregada exitosamente")
                
            else:
                print("🗃️ Detectado SQLite (local)")
                # Para SQLite, usar PRAGMA table_info
                result = conn.execute(text("PRAGMA table_info(fotos_reportes)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'contenido_base64' in columns:
                    print("✅ La columna 'contenido_base64' ya existe")
                    return
                
                # Agregar la columna
                print("📝 Agregando columna 'contenido_base64'...")
                conn.execute(text("""
                    ALTER TABLE fotos_reportes 
                    ADD COLUMN contenido_base64 TEXT
                """))
                conn.commit()
                
                print("✅ Columna 'contenido_base64' agregada exitosamente")
                
    except Exception as e:
        print(f"❌ Error al agregar columna: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        print("💡 Nota: Este script debe ejecutarse en Railway (PostgreSQL)")

if __name__ == "__main__":
    agregar_columna_base64()
