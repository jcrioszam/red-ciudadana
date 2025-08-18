#!/usr/bin/env python3
"""
Script para verificar eventos activos en la base de datos.
"""

import sqlite3
from pathlib import Path

def verificar_eventos():
    """Verificar eventos activos en la base de datos"""
    db_path = Path(__file__).parent / "red_ciudadana.db"
    
    if not db_path.exists():
        print(f"❌ Error: No se encontró la base de datos en {db_path}")
        return
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si existe la tabla eventos
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='eventos'")
        if not cursor.fetchone():
            print("❌ La tabla 'eventos' no existe")
            return
        
        # Contar eventos activos
        cursor.execute("SELECT COUNT(*) FROM eventos WHERE activo = 1")
        count_activos = cursor.fetchone()[0]
        
        # Contar eventos totales
        cursor.execute("SELECT COUNT(*) FROM eventos")
        count_total = cursor.fetchone()[0]
        
        print(f"📊 Eventos totales: {count_total}")
        print(f"📊 Eventos activos: {count_activos}")
        
        if count_activos > 0:
            # Mostrar detalles de eventos activos
            cursor.execute("SELECT id, nombre, fecha, tipo FROM eventos WHERE activo = 1")
            eventos = cursor.fetchall()
            print("\n📋 Eventos activos:")
            for evento in eventos:
                print(f"  - ID: {evento[0]}, Nombre: {evento[1]}, Fecha: {evento[2]}, Tipo: {evento[3]}")
        else:
            print("\n⚠️  No hay eventos activos en la base de datos")
            print("💡 Para crear un evento de prueba, ejecuta:")
            print("   INSERT INTO eventos (nombre, fecha, tipo, activo) VALUES ('Evento de Prueba', '2024-01-15', 'Movilización', 1);")
        
        # Verificar movilizaciones
        cursor.execute("SELECT COUNT(*) FROM movilizaciones")
        count_movilizaciones = cursor.fetchone()[0]
        print(f"\n📊 Movilizaciones totales: {count_movilizaciones}")
        
        if count_movilizaciones > 0:
            cursor.execute("SELECT id, id_evento, id_vehiculo, id_persona FROM movilizaciones")
            movilizaciones = cursor.fetchall()
            print("📋 Movilizaciones:")
            for mov in movilizaciones:
                print(f"  - ID: {mov[0]}, Evento: {mov[1]}, Vehículo: {mov[2]}, Persona: {mov[3]}")
        
    except Exception as e:
        print(f"❌ Error al verificar eventos: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔍 Verificando eventos en la base de datos...")
    verificar_eventos()
    print("✅ Verificación completada") 