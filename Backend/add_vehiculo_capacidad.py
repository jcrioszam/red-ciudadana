#!/usr/bin/env python3
"""
Script de migración para agregar campo vehiculo_capacidad a la tabla ubicaciones_tiempo_real
"""
import sqlite3
import os

def add_vehiculo_capacidad():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando estructura actual de la tabla ubicaciones_tiempo_real...")
        cursor.execute("PRAGMA table_info(ubicaciones_tiempo_real)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "vehiculo_capacidad" not in columns:
            print("➕ Agregando campo vehiculo_capacidad...")
            cursor.execute("ALTER TABLE ubicaciones_tiempo_real ADD COLUMN vehiculo_capacidad INTEGER")
            print("✅ Campo vehiculo_capacidad agregado exitosamente")
        else:
            print("✅ Campo vehiculo_capacidad ya existe")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente")
        
        # Verificar estructura final
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
    print("🚀 Agregando campo vehiculo_capacidad...")
    success = add_vehiculo_capacidad()
    
    if success:
        print("\n🎉 Migración completada exitosamente!")
    else:
        print("\n💥 Error en la migración!") 