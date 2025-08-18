#!/usr/bin/env python3
"""
Script para limpiar el estado del seguimiento en la base de datos.
Este script desactiva todas las ubicaciones activas para limpiar el estado.
"""

import sqlite3
from pathlib import Path

def limpiar_seguimiento():
    """Limpiar todas las ubicaciones activas en la base de datos"""
    db_path = Path(__file__).parent / "red_ciudadana.db"
    
    if not db_path.exists():
        print(f"❌ Error: No se encontró la base de datos en {db_path}")
        return
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Contar ubicaciones activas antes de limpiar
        cursor.execute("SELECT COUNT(*) FROM ubicacion_tiempo_real WHERE activo = 1")
        count_before = cursor.fetchone()[0]
        
        print(f"📊 Ubicaciones activas encontradas: {count_before}")
        
        if count_before == 0:
            print("✅ No hay ubicaciones activas para limpiar")
            return
        
        # Desactivar todas las ubicaciones activas
        cursor.execute("UPDATE ubicacion_tiempo_real SET activo = 0 WHERE activo = 1")
        
        # Contar ubicaciones activas después de limpiar
        cursor.execute("SELECT COUNT(*) FROM ubicacion_tiempo_real WHERE activo = 1")
        count_after = cursor.fetchone()[0]
        
        # Confirmar cambios
        conn.commit()
        
        print(f"✅ Seguimiento limpiado exitosamente")
        print(f"📊 Ubicaciones desactivadas: {count_before - count_after}")
        print(f"📊 Ubicaciones activas restantes: {count_after}")
        
    except Exception as e:
        print(f"❌ Error al limpiar seguimiento: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🧹 Limpiando estado del seguimiento...")
    limpiar_seguimiento()
    print("✅ Proceso completado") 