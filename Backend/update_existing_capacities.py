#!/usr/bin/env python3
"""
Script para actualizar las capacidades de vehículos en seguimientos existentes
"""
import sqlite3
import os

def update_existing_capacities():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando seguimientos con capacidad nula...")
        
        # Obtener seguimientos activos con capacidad nula
        cursor.execute("""
            SELECT id, vehiculo_id, vehiculo_capacidad 
            FROM ubicaciones_tiempo_real 
            WHERE activo = 1 AND vehiculo_capacidad IS NULL
        """)
        trackings = cursor.fetchall()
        
        print(f"📊 Seguimientos con capacidad nula encontrados: {len(trackings)}")
        
        updated_count = 0
        for tracking in trackings:
            tracking_id, vehiculo_id, vehiculo_capacidad = tracking
            
            if vehiculo_id:
                # Obtener capacidad del vehículo
                cursor.execute("SELECT capacidad FROM vehiculos WHERE id = ?", (vehiculo_id,))
                vehiculo = cursor.fetchone()
                
                if vehiculo:
                    capacidad = vehiculo[0]
                    print(f"🔧 Actualizando seguimiento {tracking_id}: Vehículo {vehiculo_id} -> Capacidad {capacidad}")
                    
                    # Actualizar el seguimiento
                    cursor.execute("""
                        UPDATE ubicaciones_tiempo_real 
                        SET vehiculo_capacidad = ?
                        WHERE id = ?
                    """, (capacidad, tracking_id))
                    
                    updated_count += 1
                else:
                    print(f"⚠️ Vehículo {vehiculo_id} no encontrado")
        
        conn.commit()
        print(f"\n✅ Actualización completada: {updated_count} seguimientos actualizados")
        
        # Verificar resultado final
        cursor.execute("""
            SELECT id, vehiculo_id, vehiculo_capacidad, total_personas
            FROM ubicaciones_tiempo_real 
            WHERE activo = 1
        """)
        final_trackings = cursor.fetchall()
        
        print(f"\n📊 Estado final de seguimientos activos:")
        for tracking in final_trackings:
            tracking_id, vehiculo_id, vehiculo_capacidad, total_personas = tracking
            print(f"   Seguimiento {tracking_id}: Vehículo {vehiculo_id}, Capacidad: {vehiculo_capacidad}, Personas: {total_personas}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Actualizando capacidades de vehículos en seguimientos existentes...")
    success = update_existing_capacities()
    
    if success:
        print("\n🎉 Actualización completada exitosamente!")
    else:
        print("\n💥 Error en la actualización!") 