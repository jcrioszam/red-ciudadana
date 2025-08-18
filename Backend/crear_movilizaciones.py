#!/usr/bin/env python3
"""
Script para crear la tabla movilizaciones y agregar datos de prueba.
"""

import sqlite3
from pathlib import Path

def crear_movilizaciones():
    """Crear tabla movilizaciones y agregar datos de prueba"""
    db_path = Path(__file__).parent / "red_ciudadana.db"
    
    if not db_path.exists():
        print(f"❌ Error: No se encontró la base de datos en {db_path}")
        return
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la tabla ya existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='movilizaciones'")
        if cursor.fetchone():
            print("⚠️  La tabla 'movilizaciones' ya existe")
            return
        
        # Crear tabla movilizaciones
        cursor.execute("""
            CREATE TABLE movilizaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_evento INTEGER NOT NULL,
                id_vehiculo INTEGER NOT NULL,
                id_persona INTEGER NOT NULL,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT 1,
                FOREIGN KEY (id_evento) REFERENCES eventos (id),
                FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id),
                FOREIGN KEY (id_persona) REFERENCES usuarios (id)
            )
        """)
        
        print("✅ Tabla 'movilizaciones' creada exitosamente")
        
        # Verificar si hay vehículos
        cursor.execute("SELECT COUNT(*) FROM vehiculos")
        count_vehiculos = cursor.fetchone()[0]
        
        if count_vehiculos == 0:
            print("⚠️  No hay vehículos en la base de datos")
            print("💡 Creando vehículos de prueba...")
            
            # Crear vehículos de prueba
            cursor.execute("""
                INSERT INTO vehiculos (tipo, capacidad, placas, descripcion, id_movilizador, activo)
                VALUES 
                ('Camioneta', 8, 'ABC-123', 'Camioneta de transporte', 1, 1),
                ('Autobús', 20, 'XYZ-789', 'Autobús de pasajeros', 1, 1),
                ('Automóvil', 4, 'DEF-456', 'Automóvil ejecutivo', 1, 1)
            """)
            print("✅ Vehículos de prueba creados")
        
        # Verificar si hay usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        count_usuarios = cursor.fetchone()[0]
        
        if count_usuarios == 0:
            print("⚠️  No hay usuarios en la base de datos")
            return
        
        # Obtener IDs de eventos activos
        cursor.execute("SELECT id FROM eventos WHERE activo = 1")
        eventos = cursor.fetchall()
        
        # Obtener IDs de vehículos
        cursor.execute("SELECT id FROM vehiculos WHERE activo = 1")
        vehiculos = cursor.fetchall()
        
        # Obtener IDs de usuarios (líderes)
        cursor.execute("SELECT id FROM usuarios WHERE rol IN ('lider_municipal', 'lider_zona', 'admin') AND activo = 1")
        usuarios = cursor.fetchall()
        
        if not eventos or not vehiculos or not usuarios:
            print("❌ No hay suficientes datos para crear movilizaciones")
            return
        
        # Crear movilizaciones de prueba
        print("💡 Creando movilizaciones de prueba...")
        
        for evento in eventos:
            for vehiculo in vehiculos[:2]:  # Usar solo los primeros 2 vehículos
                for usuario in usuarios[:2]:  # Usar solo los primeros 2 usuarios
                    cursor.execute("""
                        INSERT INTO movilizaciones (id_evento, id_vehiculo, id_persona, activo)
                        VALUES (?, ?, ?, 1)
                    """, (evento[0], vehiculo[0], usuario[0]))
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar movilizaciones creadas
        cursor.execute("SELECT COUNT(*) FROM movilizaciones")
        count_movilizaciones = cursor.fetchone()[0]
        
        print(f"✅ {count_movilizaciones} movilizaciones creadas exitosamente")
        
        # Mostrar detalles
        cursor.execute("""
            SELECT m.id, e.nombre as evento, v.placas as vehiculo, u.nombre as persona
            FROM movilizaciones m
            JOIN eventos e ON m.id_evento = e.id
            JOIN vehiculos v ON m.id_vehiculo = v.id
            JOIN usuarios u ON m.id_persona = u.id
            WHERE m.activo = 1
        """)
        
        movilizaciones = cursor.fetchall()
        print("\n📋 Movilizaciones creadas:")
        for mov in movilizaciones:
            print(f"  - ID: {mov[0]}, Evento: {mov[1]}, Vehículo: {mov[2]}, Persona: {mov[3]}")
        
    except Exception as e:
        print(f"❌ Error al crear movilizaciones: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 Creando tabla movilizaciones y datos de prueba...")
    crear_movilizaciones()
    print("✅ Proceso completado") 