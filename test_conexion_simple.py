#!/usr/bin/env python3
"""
Script simple para probar la conexión usando la URL completa de Railway
"""

import psycopg2

def test_conexion():
    """Probar conexión usando la URL completa"""
    print("🔌 Probando conexión a Railway...")
    
    # URL completa de Railway
    url = "postgresql://postgres:pPwQxyyfQQYTOWDvKZzNJrYglHjvQiJe@red-ciudadana-production.up.railway.app:5432/railway"
    
    try:
        conn = psycopg2.connect(url)
        print("✅ ¡Conexión exitosa!")
        
        # Probar consulta
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        total = cursor.fetchone()[0]
        print(f"📊 Total de registros actuales: {total}")
        
        cursor.close()
        conn.close()
        print("🔌 Conexión cerrada")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_conexion()
