#!/usr/bin/env python3
"""
Script de migración para agregar el campo id_usuario_registro a la tabla personas
"""

import requests
import json
import time

# Configuración
BASE_URL = "https://red-ciudadana-production.up.railway.app"
ADMIN_EMAIL = "admin@redciudadana.com"
ADMIN_PASSWORD = "admin123"

def login_admin():
    """Iniciar sesión como administrador"""
    try:
        # Usar el endpoint /token que vimos en los logs
        response = requests.post(f"{BASE_URL}/token", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Error al iniciar sesión: {response.status_code}")
            print(f"🔍 Respuesta del servidor: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def obtener_personas(token):
    """Obtener todas las personas del sistema"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/personas/", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error al obtener personas: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return []

def actualizar_persona_usuario_registro(token, persona_id, id_usuario_registro):
    """Actualizar el campo id_usuario_registro de una persona"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {"id_usuario_registro": id_usuario_registro}
        
        response = requests.put(f"{BASE_URL}/personas/{persona_id}", 
                              headers=headers, 
                              json=data)
        
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Error al actualizar persona {persona_id}: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    print("🚀 MIGRACIÓN: Agregando campo id_usuario_registro a personas")
    print("=" * 60)
    
    # 1. Iniciar sesión como admin
    print("🔐 Iniciando sesión como administrador...")
    token = login_admin()
    if not token:
        print("❌ No se pudo obtener el token. Abortando migración.")
        return
    
    print("✅ Sesión iniciada exitosamente")
    
    # 2. Obtener todas las personas
    print("\n📋 Obteniendo lista de personas...")
    personas = obtener_personas(token)
    
    if not personas:
        print("ℹ️ No hay personas para migrar")
        return
    
    print(f"✅ Se encontraron {len(personas)} personas")
    
    # 3. Migrar cada persona
    print("\n🔄 Iniciando migración...")
    exitosos = 0
    errores = 0
    
    for persona in personas:
        print(f"📝 Procesando: {persona.get('nombre', 'N/A')} (ID: {persona.get('id')})")
        
        # Si no tiene id_usuario_registro, asignar el id_lider_responsable
        if not persona.get('id_usuario_registro'):
            id_usuario_registro = persona.get('id_lider_responsable')
            
            if id_usuario_registro:
                if actualizar_persona_usuario_registro(token, persona['id'], id_usuario_registro):
                    print(f"  ✅ Actualizada: id_usuario_registro = {id_usuario_registro}")
                    exitosos += 1
                else:
                    print(f"  ❌ Error al actualizar")
                    errores += 1
            else:
                print(f"  ⚠️ Sin id_lider_responsable, saltando...")
        else:
            print(f"  ℹ️ Ya tiene id_usuario_registro: {persona.get('id_usuario_registro')}")
        
        # Pausa para no sobrecargar la API
        time.sleep(0.5)
    
    # 4. Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("=" * 60)
    print(f"✅ Personas migradas exitosamente: {exitosos}")
    print(f"❌ Errores: {errores}")
    print(f"📋 Total procesadas: {len(personas)}")
    
    if errores == 0:
        print("\n🎉 ¡Migración completada exitosamente!")
    else:
        print(f"\n⚠️ Migración completada con {errores} errores")

if __name__ == "__main__":
    main()
