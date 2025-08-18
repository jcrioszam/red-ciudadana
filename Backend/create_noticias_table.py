#!/usr/bin/env python3
"""
Script para crear la tabla de noticias en la base de datos
"""
import sqlite3
import os

def create_noticias_table():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando si la tabla noticias existe...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='noticias'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ La tabla noticias ya existe")
        else:
            print("➕ Creando tabla noticias...")
            cursor.execute("""
                CREATE TABLE noticias (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo VARCHAR(200) NOT NULL,
                    contenido TEXT NOT NULL,
                    imagen_url VARCHAR(500),
                    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    autor_id INTEGER NOT NULL,
                    tipo VARCHAR(50) DEFAULT 'general',
                    activo BOOLEAN DEFAULT 1,
                    likes INTEGER DEFAULT 0,
                    compartidos INTEGER DEFAULT 0,
                    FOREIGN KEY (autor_id) REFERENCES usuarios (id)
                )
            """)
            print("✅ Tabla noticias creada exitosamente")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente")
        
        # Verificar estructura final
        cursor.execute("PRAGMA table_info(noticias)")
        columns = cursor.fetchall()
        print(f"\n📊 Estructura de la tabla noticias:")
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Creando tabla de noticias...")
    success = create_noticias_table()
    
    if success:
        print("\n🎉 Migración completada exitosamente!")
    else:
        print("\n💥 Error en la migración!") 