#!/usr/bin/env python3
"""
Script simple para probar la conexión a la base de datos
"""

import psycopg2
import getpass
import os

def test_conexion():
    """Probar conexión a la base de datos"""
    print("🔌 Probando conexión a Railway...")
    
    # Obtener password
    password = os.getenv('PGPASSWORD')
    if not password:
        password = getpass.getpass("🔑 Ingresa la contraseña de Railway: ")
    
    try:
        # Usar la URL completa de Railway
        conn = psycopg2.connect(
            host='red-ciudadana-production.up.railway.app',
            port=5432,
            database='railway',
            user='postgres',
            password=password
        )
        
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
