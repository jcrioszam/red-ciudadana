#!/usr/bin/env python3
"""
Script para crear la tabla de comentarios en la base de datos
"""
import sqlite3
import os

def create_comentarios_table():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔍 Verificando si la tabla comentarios existe...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='comentarios'")
        table_exists = cursor.fetchone()

        if table_exists:
            print("✅ La tabla comentarios ya existe")
        else:
            print("➕ Creando tabla comentarios...")
            cursor.execute("""
                CREATE TABLE comentarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contenido TEXT NOT NULL,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    autor_id INTEGER NOT NULL,
                    noticia_id INTEGER NOT NULL,
                    activo BOOLEAN DEFAULT 1,
                    likes INTEGER DEFAULT 0,
                    FOREIGN KEY (autor_id) REFERENCES usuarios (id),
                    FOREIGN KEY (noticia_id) REFERENCES noticias (id)
                )
            """)
            print("✅ Tabla comentarios creada exitosamente")

        conn.commit()
        print("\n✅ Migración completada exitosamente")

        # Verificar estructura final
        cursor.execute("PRAGMA table_info(comentarios)")
        columns = cursor.fetchall()
        print(f"\n📊 Estructura de la tabla comentarios:")
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
    print("🚀 Creando tabla de comentarios...")
    success = create_comentarios_table()

    if success:
        print("\n🎉 Migración completada exitosamente!")
    else:
        print("\n💥 Error en la migración!") 