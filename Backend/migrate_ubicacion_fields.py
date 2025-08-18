#!/usr/bin/env python3
"""
Script de migración para agregar campos adicionales a la tabla ubicaciones_tiempo_real
"""

import sqlite3
import os

def migrate_ubicacion_fields():
    """Agregar campos adicionales para información de movilización"""
    
    # Ruta de la base de datos
    db_path = "red_ciudadana.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando estructura actual de la tabla ubicaciones_tiempo_real...")
        
        # Verificar si los campos ya existen
        cursor.execute("PRAGMA table_info(ubicaciones_tiempo_real)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_fields = [
            ("evento_id", "INTEGER REFERENCES eventos(id)"),
            ("vehiculo_id", "INTEGER REFERENCES vehiculos(id)"),
            ("evento_nombre", "VARCHAR(200)"),
            ("vehiculo_tipo", "VARCHAR(50)"),
            ("vehiculo_placas", "VARCHAR(20)"),
            ("total_personas", "INTEGER")
        ]
        
        fields_to_add = []
        for field_name, field_type in new_fields:
            if field_name not in columns:
                fields_to_add.append((field_name, field_type))
                print(f"➕ Campo a agregar: {field_name}")
            else:
                print(f"✅ Campo ya existe: {field_name}")
        
        if not fields_to_add:
            print("✅ Todos los campos ya existen. No se requiere migración.")
            return True
        
        print(f"\n📝 Agregando {len(fields_to_add)} campos...")
        
        # Agregar cada campo
        for field_name, field_type in fields_to_add:
            try:
                cursor.execute(f"ALTER TABLE ubicaciones_tiempo_real ADD COLUMN {field_name} {field_type}")
                print(f"✅ Campo {field_name} agregado exitosamente")
            except sqlite3.OperationalError as e:
                print(f"⚠️ Campo {field_name} ya existe o error: {e}")
        
        # Confirmar cambios
        conn.commit()
        print("\n✅ Migración completada exitosamente")
        
        # Verificar la nueva estructura
        cursor.execute("PRAGMA table_info(ubicaciones_tiempo_real)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"\n📊 Estructura final de la tabla:")
        for column in final_columns:
            print(f"  - {column}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Iniciando migración de campos de ubicación...")
    success = migrate_ubicacion_fields()
    
    if success:
        print("\n🎉 Migración completada exitosamente!")
    else:
        print("\n💥 Error en la migración!") 