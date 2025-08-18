#!/usr/bin/env python3
"""
Script para crear la tabla de reportes ciudadanos en la base de datos
"""
import sqlite3
import os

def create_reportes_table():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔍 Verificando si la tabla reportes_ciudadanos existe...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reportes_ciudadanos'")
        table_exists = cursor.fetchone()

        if table_exists:
            print("✅ La tabla reportes_ciudadanos ya existe")
        else:
            print("➕ Creando tabla reportes_ciudadanos...")
            cursor.execute("""
                CREATE TABLE reportes_ciudadanos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo VARCHAR(200) NOT NULL,
                    descripcion TEXT NOT NULL,
                    tipo VARCHAR(50) NOT NULL,
                    latitud REAL NOT NULL,
                    longitud REAL NOT NULL,
                    direccion VARCHAR(500),
                    foto_url VARCHAR(500),
                    estado VARCHAR(50) DEFAULT 'pendiente',
                    prioridad VARCHAR(20) DEFAULT 'normal',
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_resolucion DATETIME,
                    ciudadano_id INTEGER NOT NULL,
                    administrador_id INTEGER,
                    observaciones_admin TEXT,
                    activo BOOLEAN DEFAULT 1,
                    FOREIGN KEY (ciudadano_id) REFERENCES usuarios (id),
                    FOREIGN KEY (administrador_id) REFERENCES usuarios (id)
                )
            """)
            print("✅ Tabla reportes_ciudadanos creada exitosamente")

        conn.commit()
        print("\n✅ Migración completada exitosamente")

        # Verificar estructura final
        cursor.execute("PRAGMA table_info(reportes_ciudadanos)")
        columns = cursor.fetchall()
        print(f"\n📊 Estructura de la tabla reportes_ciudadanos:")
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
    print("🚀 Creando tabla de reportes ciudadanos...")
    success = create_reportes_table()

    if success:
        print("\n🎉 Migración completada exitosamente!")
    else:
        print("\n💥 Error en la migración!") 