#!/usr/bin/env python3
"""
Script para inicializar las configuraciones del dashboard en la base de datos
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

def inicializar_configuraciones_dashboard(token):
    """Inicializar configuraciones del dashboard para todos los roles"""
    if not token:
        print("❌ No hay token válido")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Configuraciones por defecto para cada rol
    configuraciones_default = {
        "admin": {
            "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                       "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "presidente": {
            "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                       "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "lider_estatal": {
            "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                       "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "lider_regional": {
            "widgets": ["total-personas", "total-eventos", "secciones-cubiertas", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "lider_municipal": {
            "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                       "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "lider_zona": {
            "widgets": ["total-personas", "total-eventos", "secciones-cubiertas", 
                       "top-secciones", "top-lideres", "estructura-red"]
        },
        "capturista": {
            "widgets": ["total-personas", "total-eventos", "secciones-cubiertas"]
        },
        "ciudadano": {
            "widgets": ["total-eventos", "estructura-red"]
        }
    }
    
    roles_actualizados = 0
    errores = 0
    
    print("🚀 Inicializando configuraciones del dashboard...")
    
    for rol, config in configuraciones_default.items():
        try:
            print(f"📝 Configurando {rol}...")
            
            response = requests.put(
                f"{BASE_URL}/perfiles/configuracion-dashboard/{rol}",
                json=config,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ {rol} configurado exitosamente")
                roles_actualizados += 1
            else:
                print(f"❌ Error configurando {rol}: {response.status_code}")
                print(f"Respuesta: {response.text}")
                errores += 1
            
            # Pequeña pausa para no sobrecargar el servidor
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Error de conexión configurando {rol}: {e}")
            errores += 1
    
    print(f"\n📊 RESUMEN:")
    print(f"✅ Roles actualizados: {roles_actualizados}")
    print(f"❌ Errores: {errores}")
    
    return errores == 0

def verificar_configuraciones(token):
    """Verificar que las configuraciones se guardaron correctamente"""
    if not token:
        print("❌ No hay token válido")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print("\n🔍 Verificando configuraciones guardadas...")
        
        response = requests.get(f"{BASE_URL}/perfiles/configuracion-dashboard", headers=headers)
        
        if response.status_code == 200:
            configuraciones = response.json()
            print(f"✅ Configuraciones obtenidas: {len(configuraciones)} roles")
            
            for rol, config in configuraciones.items():
                widgets = config.get("widgets", [])
                print(f"  📋 {rol}: {len(widgets)} widgets")
            
            return True
        else:
            print(f"❌ Error verificando configuraciones: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión verificando configuraciones: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 INICIALIZADOR DE CONFIGURACIONES DEL DASHBOARD")
    print("=" * 60)
    
    # Obtener token
    print("🔐 Obteniendo token de administrador...")
    token = get_token()
    
    if not token:
        print("❌ No se pudo obtener el token. Saliendo...")
        return
    
    print("✅ Token obtenido exitosamente")
    
    # Inicializar configuraciones
    if inicializar_configuraciones_dashboard(token):
        print("✅ Configuraciones inicializadas correctamente")
        
        # Verificar que se guardaron
        if verificar_configuraciones(token):
            print("✅ Verificación exitosa - Dashboard configurado completamente")
        else:
            print("⚠️  Verificación fallida - Revisar logs")
    else:
        print("❌ Error inicializando configuraciones")

if __name__ == "__main__":
    main()
