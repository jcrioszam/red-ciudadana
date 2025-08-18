#!/usr/bin/env python3
"""
Script para verificar y actualizar permisos de seguimiento de reportes
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@redciudadana.com"
ADMIN_PASSWORD = "admin123"

def get_token():
    """Obtener token de autenticación"""
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Error al obtener token: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def get_user_config(token):
    """Obtener configuración del usuario admin"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/perfiles/mi-configuracion", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error al obtener configuración: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def update_admin_permissions(token):
    """Actualizar permisos del admin para incluir seguimiento de reportes"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Datos para actualizar permisos
        update_data = {
            "opciones_web": [
                "dashboard",
                "personas", 
                "reportes",
                "estructura-red",
                "perfil",
                "noticias",
                "reportes_ciudadanos",
                "seguimiento_reportes"
            ],
            "opciones_app": [
                "register",
                "perfil",
                "eventos-historicos",
                "dashboard",
                "seguimiento",
                "movilizador-seguimiento",
                "noticias",
                "reportes_ciudadanos"
            ]
        }
        
        response = requests.put(
            f"{BASE_URL}/perfiles/configuracion/admin",
            headers=headers,
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Permisos actualizados exitosamente")
            return True
        else:
            print(f"❌ Error al actualizar permisos: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    print("🔍 Verificando permisos de seguimiento de reportes...")
    
    # Obtener token
    token = get_token()
    if not token:
        print("❌ No se pudo obtener el token")
        return
    
    print("✅ Token obtenido exitosamente")
    
    # Obtener configuración actual
    config = get_user_config(token)
    if config:
        print("\n📋 Configuración actual:")
        print(f"  - Rol: {config.get('rol')}")
        print(f"  - Opciones web: {config.get('configuracion', {}).get('opciones_web', [])}")
        print(f"  - Opciones app: {config.get('configuracion', {}).get('opciones_app', [])}")
        
        # Verificar si falta seguimiento_reportes
        opciones_web = config.get('configuracion', {}).get('opciones_web', [])
        if 'seguimiento_reportes' not in opciones_web:
            print("\n⚠️  Falta 'seguimiento_reportes' en las opciones web")
            print("🔄 Actualizando permisos...")
            
            if update_admin_permissions(token):
                print("✅ Permisos actualizados. Verificando...")
                
                # Verificar configuración actualizada
                config_updated = get_user_config(token)
                if config_updated:
                    print("\n📋 Configuración actualizada:")
                    print(f"  - Opciones web: {config_updated.get('configuracion', {}).get('opciones_web', [])}")
                    
                    if 'seguimiento_reportes' in config_updated.get('configuracion', {}).get('opciones_web', []):
                        print("✅ 'seguimiento_reportes' agregado correctamente")
                    else:
                        print("❌ 'seguimiento_reportes' no se agregó correctamente")
                else:
                    print("❌ No se pudo verificar la configuración actualizada")
            else:
                print("❌ No se pudieron actualizar los permisos")
        else:
            print("\n✅ 'seguimiento_reportes' ya está en las opciones web")
    else:
        print("❌ No se pudo obtener la configuración")
    
    print("\n✅ Verificación completada")

if __name__ == "__main__":
    main() 