#!/usr/bin/env python3
"""
Script para actualizar las configuraciones de perfiles existentes
y agregar el permiso 'movilizador-seguimiento' a los roles correspondientes
"""

import sqlite3
import json
from pathlib import Path

def actualizar_perfiles():
    # Ruta a la base de datos
    db_path = Path(__file__).parent / "red_ciudadana.db"
    
    if not db_path.exists():
        print("❌ Base de datos no encontrada")
        return
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando configuraciones existentes...")
        
        # Obtener todas las configuraciones existentes
        cursor.execute("SELECT rol, opciones_app FROM configuraciones_perfiles")
        configuraciones = cursor.fetchall()
        
        if not configuraciones:
            print("ℹ️ No hay configuraciones existentes para actualizar")
            return
        
        # Roles que pueden ser movilizadores
        roles_movilizadores = [
            'admin', 'presidente', 'lider_estatal', 'lider_regional', 
            'lider_municipal', 'lider_zona'
        ]
        
        actualizaciones = 0
        
        for rol, opciones_app_json in configuraciones:
            try:
                opciones_app = json.loads(opciones_app_json)
                
                # Verificar si el rol puede ser movilizador y si ya tiene el permiso
                if rol in roles_movilizadores and 'movilizador-seguimiento' not in opciones_app:
                    # Agregar el permiso movilizador-seguimiento
                    opciones_app.append('movilizador-seguimiento')
                    
                    # Actualizar en la base de datos
                    cursor.execute(
                        "UPDATE configuraciones_perfiles SET opciones_app = ? WHERE rol = ?",
                        (json.dumps(opciones_app), rol)
                    )
                    
                    actualizaciones += 1
                    print(f"✅ Actualizado rol '{rol}': agregado 'movilizador-seguimiento'")
                
            except json.JSONDecodeError:
                print(f"⚠️ Error al decodificar JSON para rol '{rol}'")
                continue
        
        # Confirmar cambios
        conn.commit()
        
        print(f"\n🎉 Proceso completado:")
        print(f"   - Configuraciones verificadas: {len(configuraciones)}")
        print(f"   - Configuraciones actualizadas: {actualizaciones}")
        
        if actualizaciones > 0:
            print("\n📋 Roles actualizados con permiso 'movilizador-seguimiento':")
            for rol in roles_movilizadores:
                print(f"   - {rol}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Iniciando actualización de perfiles...")
    actualizar_perfiles()
    print("\n✨ Script completado") 