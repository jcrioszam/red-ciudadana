#!/usr/bin/env python3
"""
Script para actualizar las configuraciones de perfiles existentes
y agregar el permiso 'seguimiento_reportes' a los roles correspondientes
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

def update_profile_configuration(token, rol, configuracion):
    """Actualizar configuración de un perfil específico"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.put(
            f"{BASE_URL}/perfiles/configuracion/{rol}",
            headers=headers,
            json=configuracion
        )
        
        if response.status_code == 200:
            print(f"✅ Configuración actualizada para rol '{rol}'")
            return True
        else:
            print(f"❌ Error al actualizar rol '{rol}': {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión para rol '{rol}': {e}")
        return False

def main():
    print("🔧 Actualizando configuraciones de perfiles...")
    
    # Obtener token
    token = get_token()
    if not token:
        print("❌ No se pudo obtener el token")
        return
    
    print("✅ Token obtenido exitosamente")
    
    # Configuraciones actualizadas con seguimiento_reportes
    configuraciones_actualizadas = {
        "admin": {
            "opciones_web": ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["register", "perfil", "eventos-historicos", "dashboard", "seguimiento", "movilizador-seguimiento", "noticias", "reportes_ciudadanos"]
        },
        "presidente": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_estatal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_regional": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "lider_municipal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_zona": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }
    
    # Actualizar cada rol
    roles_actualizados = 0
    roles_con_error = 0
    
    for rol, configuracion in configuraciones_actualizadas.items():
        print(f"\n🔄 Actualizando rol '{rol}'...")
        
        if update_profile_configuration(token, rol, configuracion):
            roles_actualizados += 1
        else:
            roles_con_error += 1
        
        # Pausa entre actualizaciones para no sobrecargar el servidor
        time.sleep(1)
    
    # Resumen
    print(f"\n🎉 Proceso completado:")
    print(f"   - Roles actualizados exitosamente: {roles_actualizados}")
    print(f"   - Roles con errores: {roles_con_error}")
    
    if roles_actualizados > 0:
        print(f"\n📋 Roles actualizados con permisos completos:")
        for rol in configuraciones_actualizadas.keys():
            print(f"   - {rol}")
        
        print(f"\n🔑 Permisos agregados:")
        print(f"   - 'seguimiento_reportes' para admin, presidente, lider_estatal, lider_municipal")
        print(f"   - 'reportes_ciudadanos' para todos los roles relevantes")

if __name__ == "__main__":
    main()
