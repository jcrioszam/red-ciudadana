#!/usr/bin/env python3
"""
Script para corregir el conteo de personas en seguimientos activos
"""

import sqlite3
import os

def fix_tracking_persons():
    """Corregir el conteo de personas en seguimientos activos"""
    
    # Ruta de la base de datos
    db_path = "red_ciudadana.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando seguimientos activos...")
        
        # Obtener seguimientos activos
        cursor.execute("""
            SELECT id, id_usuario, evento_id, vehiculo_id, evento_nombre, vehiculo_tipo, vehiculo_placas, total_personas
            FROM ubicaciones_tiempo_real 
            WHERE activo = 1
        """)
        trackings = cursor.fetchall()
        
        print(f"📊 Seguimientos activos encontrados: {len(trackings)}")
        
        updated_count = 0
        for tracking in trackings:
            tracking_id, user_id, evento_id, vehiculo_id, evento_nombre, vehiculo_tipo, vehiculo_placas, total_personas = tracking
            
            print(f"\n🔍 Analizando seguimiento {tracking_id}:")
            print(f"   Evento ID: {evento_id}, Vehículo ID: {vehiculo_id}")
            
            # Buscar asignaciones para este evento y vehículo
            cursor.execute("""
                SELECT COUNT(*) FROM asignaciones_movilizacion 
                WHERE id_evento = ? AND id_vehiculo = ?
            """, (evento_id, vehiculo_id))
            count = cursor.fetchone()
            
            if count and count[0] > 0:
                personas_count = count[0]
                print(f"   ✅ Encontradas {personas_count} personas asignadas")
                
                # Actualizar el seguimiento con el conteo correcto
                cursor.execute("""
                    UPDATE ubicaciones_tiempo_real 
                    SET total_personas = ?
                    WHERE id = ?
                """, (personas_count, tracking_id))
                
                updated_count += 1
                print(f"   ✅ Actualizado seguimiento {tracking_id}: {personas_count} personas")
            else:
                print(f"   ⚠️ No se encontraron asignaciones para evento {evento_id} y vehículo {vehiculo_id}")
                
                # Buscar asignaciones para el mismo vehículo en otros eventos
                cursor.execute("""
                    SELECT id_evento, COUNT(*) FROM asignaciones_movilizacion 
                    WHERE id_vehiculo = ? GROUP BY id_evento
                """, (vehiculo_id,))
                other_assignments = cursor.fetchall()
                
                if other_assignments:
                    print(f"   📋 Vehículo {vehiculo_id} tiene asignaciones en otros eventos:")
                    for event_id, count in other_assignments:
                        print(f"      - Evento {event_id}: {count} personas")
        
        # Confirmar cambios
        conn.commit()
        print(f"\n✅ Actualización completada: {updated_count} seguimientos actualizados")
        
        # Verificar resultado final
        cursor.execute("""
            SELECT id, evento_id, vehiculo_id, total_personas 
            FROM ubicaciones_tiempo_real 
            WHERE activo = 1
        """)
        final_trackings = cursor.fetchall()
        
        print(f"\n📊 Estado final de seguimientos activos:")
        for tracking in final_trackings:
            tracking_id, evento_id, vehiculo_id, total_personas = tracking
            print(f"   Seguimiento {tracking_id}: Evento {evento_id}, Vehículo {vehiculo_id}, Personas: {total_personas}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Corrigiendo conteo de personas en seguimientos activos...")
    success = fix_tracking_persons()
    
    if success:
        print("\n🎉 Corrección completada exitosamente!")
    else:
        print("\n💥 Error en la corrección!") 