#!/usr/bin/env python3
"""
Script para actualizar permisos de dashboard en todos los roles
Agrega el permiso 'admin-dashboard' a roles administrativos
"""

import requests
import json
import time

# Configuración
BASE_URL = "https://red-ciudadana-production.up.railway.app"
ADMIN_EMAIL = "admin@redciudadana.com"
ADMIN_PASSWORD = "admin123"

def get_token():
    """Obtener token de autenticación"""
    try:
        login_data = {
            "identificador": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Error al hacer login: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def obtener_roles(token):
    """Obtener lista de roles disponibles"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/perfiles/roles", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            roles = data.get("roles", [])
            print(f"✅ Roles encontrados: {len(roles)}")
            return roles
        else:
            print(f"❌ Error al obtener roles: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error al obtener roles: {e}")
        return []

def actualizar_permisos_rol(token, rol_id, permisos_actuales):
    """Actualizar permisos de un rol específico"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Agregar permiso admin-dashboard si no existe
        if "admin-dashboard" not in permisos_actuales:
            permisos_actuales.append("admin-dashboard")
            print(f"  ➕ Agregando permiso 'admin-dashboard' a {rol_id}")
        else:
            print(f"  ✅ Permiso 'admin-dashboard' ya existe en {rol_id}")
        
        # Preparar datos para actualizar
        datos_actualizacion = {
            "opciones_web": permisos_actuales,
            "opciones_app": permisos_actuales  # También en app por consistencia
        }
        
        # Actualizar configuración del rol
        response = requests.put(
            f"{BASE_URL}/perfiles/configuracion/{rol_id}",
            json=datos_actualizacion,
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"  ✅ Permisos actualizados para {rol_id}")
            return True
        else:
            print(f"  ❌ Error al actualizar {rol_id}: {response.status_code}")
            print(f"  Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error al actualizar {rol_id}: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando actualización de permisos de dashboard...")
    
    # Obtener token
    token = get_token()
    if not token:
        print("❌ No se pudo obtener token de autenticación")
        return
    
    print("✅ Token obtenido exitosamente")
    
    # Obtener roles
    roles = obtener_roles(token)
    if not roles:
        print("❌ No se pudieron obtener roles")
        return
    
    # Roles que deben tener permiso admin-dashboard
    roles_admin_dashboard = [
        "admin", "presidente", "lider_estatal", "lider_regional", 
        "lider_municipal", "lider_zona"
    ]
    
    print(f"\n🎯 Actualizando permisos para roles administrativos...")
    
    exitos = 0
    errores = 0
    
    for rol in roles:
        rol_id = rol.get("id")
        rol_nombre = rol.get("nombre", rol_id)
        
        if rol_id in roles_admin_dashboard:
            print(f"\n🔧 Procesando {rol_nombre} ({rol_id})...")
            
            # Obtener configuración actual del rol
            try:
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(
                    f"{BASE_URL}/perfiles/configuracion/{rol_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    config = response.json()
                    opciones_web = config.get("configuracion", {}).get("opciones_web", [])
                    
                    # Actualizar permisos
                    if actualizar_permisos_rol(token, rol_id, opciones_web):
                        exitos += 1
                    else:
                        errores += 1
                else:
                    print(f"  ❌ No se pudo obtener configuración de {rol_id}: {response.status_code}")
                    errores += 1
                    
            except Exception as e:
                print(f"  ❌ Error al procesar {rol_id}: {e}")
                errores += 1
            
            # Pausa entre requests
            time.sleep(1)
        else:
            print(f"⏭️  Saltando {rol_nombre} ({rol_id}) - No requiere permiso admin-dashboard")
    
    # Resumen
    print(f"\n🎉 ACTUALIZACIÓN COMPLETADA")
    print(f"✅ Exitosos: {exitos}")
    print(f"❌ Errores: {errores}")
    print(f"📊 Total procesados: {exitos + errores}")
    
    if exitos > 0:
        print(f"\n🎯 Los siguientes roles ahora tienen permiso 'admin-dashboard':")
        for rol_id in roles_admin_dashboard:
            print(f"  • {rol_id}")
    
    print(f"\n💡 Para verificar, ve a 'Administrar Perfiles' y revisa que los roles tengan el permiso 'admin-dashboard'")

if __name__ == "__main__":
    main()
