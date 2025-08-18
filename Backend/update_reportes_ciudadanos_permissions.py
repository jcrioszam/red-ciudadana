#!/usr/bin/env python3
"""
Script para agregar reportes_ciudadanos a las configuraciones de permisos existentes
"""
import sqlite3
import json
import os

def update_reportes_ciudadanos_permissions():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔍 Verificando configuraciones de perfiles...")
        cursor.execute("SELECT rol, opciones_web, opciones_app FROM configuraciones_perfil")
        configuraciones = cursor.fetchall()

        if not configuraciones:
            print("✅ No hay configuraciones existentes, se usarán las configuraciones por defecto")
            return True

        print(f"📊 Encontradas {len(configuraciones)} configuraciones de perfiles")

        for config in configuraciones:
            rol, opciones_web_json, opciones_app_json = config
            
            # Parsear las opciones actuales
            opciones_web = json.loads(opciones_web_json) if opciones_web_json else []
            opciones_app = json.loads(opciones_app_json) if opciones_app_json else []
            
            # Agregar reportes_ciudadanos si no existe
            if "reportes_ciudadanos" not in opciones_web:
                opciones_web.append("reportes_ciudadanos")
                print(f"➕ Agregado 'reportes_ciudadanos' a opciones_web para rol '{rol}'")
            
            if "reportes_ciudadanos" not in opciones_app:
                opciones_app.append("reportes_ciudadanos")
                print(f"➕ Agregado 'reportes_ciudadanos' a opciones_app para rol '{rol}'")
            
            # Actualizar en la base de datos
            cursor.execute("""
                UPDATE configuraciones_perfiles 
                SET opciones_web = ?, opciones_app = ?
                WHERE rol = ?
            """, (json.dumps(opciones_web), json.dumps(opciones_app), rol))

        conn.commit()
        print("\n✅ Permisos de reportes ciudadanos actualizados exitosamente")

        # Verificar los cambios
        cursor.execute("SELECT rol, opciones_web, opciones_app FROM configuraciones_perfil")
        configuraciones_actualizadas = cursor.fetchall()
        
        print(f"\n📋 Configuraciones actualizadas:")
        for config in configuraciones_actualizadas:
            rol, opciones_web_json, opciones_app_json = config
            opciones_web = json.loads(opciones_web_json)
            opciones_app = json.loads(opciones_app_json)
            
            print(f"  - {rol}:")
            print(f"    Web: {opciones_web}")
            print(f"    App: {opciones_app}")

        return True

    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Actualizando permisos de reportes ciudadanos...")
    success = update_reportes_ciudadanos_permissions()

    if success:
        print("\n🎉 Permisos actualizados exitosamente!")
    else:
        print("\n💥 Error en la actualización!") 