#!/usr/bin/env python3
"""
Script para crear el rol ciudadano y sus configuraciones en la base de datos
"""
import sqlite3
import json
import os

def create_ciudadano_role():
    db_path = "red_ciudadana.db"
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔍 Verificando si el rol ciudadano ya existe...")
        cursor.execute("SELECT rol FROM configuraciones_perfiles WHERE rol = 'ciudadano'")
        existing_role = cursor.fetchone()

        if existing_role:
            print("✅ El rol ciudadano ya existe en la base de datos")
            return True

        print("➕ Creando configuración para el rol ciudadano...")
        
        # Configuración para el rol ciudadano
        opciones_web = ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        opciones_app = ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        
        cursor.execute("""
            INSERT INTO configuraciones_perfiles (rol, opciones_web, opciones_app)
            VALUES (?, ?, ?)
        """, ("ciudadano", json.dumps(opciones_web), json.dumps(opciones_app)))

        conn.commit()
        print("✅ Rol ciudadano creado exitosamente")

        # Verificar la creación
        cursor.execute("SELECT rol, opciones_web, opciones_app FROM configuraciones_perfiles WHERE rol = 'ciudadano'")
        configuracion = cursor.fetchone()
        
        if configuracion:
            rol, opciones_web_json, opciones_app_json = configuracion
            opciones_web = json.loads(opciones_web_json)
            opciones_app = json.loads(opciones_app_json)
            
            print(f"\n📋 Configuración del rol ciudadano:")
            print(f"  - Rol: {rol}")
            print(f"  - Opciones Web: {opciones_web}")
            print(f"  - Opciones App: {opciones_app}")

        return True

    except Exception as e:
        print(f"❌ Error durante la creación: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Creando rol ciudadano...")
    success = create_ciudadano_role()

    if success:
        print("\n🎉 Rol ciudadano creado exitosamente!")
    else:
        print("\n💥 Error en la creación!") 