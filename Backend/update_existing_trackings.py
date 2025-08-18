#!/usr/bin/env python3
"""
Script para actualizar seguimientos existentes con información faltante
"""

import sqlite3
import os

def update_existing_trackings():
    """Actualizar seguimientos existentes con información faltante"""
    
    # Ruta de la base de datos
    db_path = "red_ciudadana.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando seguimientos existentes...")
        
        # Obtener seguimientos activos sin información completa
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
            
            needs_update = False
            updates = {}
            
            # Verificar si falta información del evento
            if evento_id and not evento_nombre:
                cursor.execute("SELECT nombre FROM eventos WHERE id = ?", (evento_id,))
                evento = cursor.fetchone()
                if evento:
                    updates['evento_nombre'] = evento[0]
                    needs_update = True
            
            # Verificar si falta información del vehículo
            if vehiculo_id and (not vehiculo_tipo or not vehiculo_placas):
                cursor.execute("SELECT tipo, placas FROM vehiculos WHERE id = ?", (vehiculo_id,))
                vehiculo = cursor.fetchone()
                if vehiculo:
                    if not vehiculo_tipo:
                        updates['vehiculo_tipo'] = vehiculo[0]
                        needs_update = True
                    if not vehiculo_placas:
                        updates['vehiculo_placas'] = vehiculo[1]
                        needs_update = True
            
            # Verificar si falta total de personas
            if evento_id and vehiculo_id and not total_personas:
                cursor.execute("""
                    SELECT COUNT(*) FROM asignaciones_movilizacion 
                    WHERE id_evento = ? AND id_vehiculo = ?
                """, (evento_id, vehiculo_id))
                count = cursor.fetchone()
                if count:
                    updates['total_personas'] = count[0]
                    needs_update = True
            
            # Actualizar si es necesario
            if needs_update:
                set_clause = ", ".join([f"{key} = ?" for key in updates.keys()])
                values = list(updates.values()) + [tracking_id]
                
                cursor.execute(f"""
                    UPDATE ubicaciones_tiempo_real 
                    SET {set_clause}
                    WHERE id = ?
                """, values)
                
                updated_count += 1
                print(f"✅ Actualizado seguimiento {tracking_id}: {updates}")
        
        # Confirmar cambios
        conn.commit()
        print(f"\n✅ Actualización completada: {updated_count} seguimientos actualizados")
        
        # Verificar resultado final
        cursor.execute("""
            SELECT COUNT(*) FROM ubicaciones_tiempo_real 
            WHERE activo = 1 AND evento_nombre IS NOT NULL AND vehiculo_tipo IS NOT NULL
        """)
        complete_trackings = cursor.fetchone()[0]
        print(f"📊 Seguimientos con información completa: {complete_trackings}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Actualizando seguimientos existentes...")
    success = update_existing_trackings()
    
    if success:
        print("\n🎉 Actualización completada exitosamente!")
    else:
        print("\n💥 Error en la actualización!") 