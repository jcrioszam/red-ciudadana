#!/usr/bin/env python3
"""
Script para verificar el progreso de la importación
"""

import requests
import json

# Configuración de la API
API_BASE = "https://red-ciudadana-production.up.railway.app"
USERNAME = "admin@redciudadana.com"
PASSWORD = "admin123"

def login():
    """Iniciar sesión y obtener token"""
    print("🔐 Iniciando sesión...")
    
    login_data = {
        "identificador": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{API_BASE}/login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login exitoso")
            return token
        else:
            print(f"❌ Error en login: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        return None

def verificar_estadisticas(token):
    """Verificar estadísticas del padrón"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/api/padron/estadisticas",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            total_registros = data.get('total_registros', 0)
            registros_disponibles = data.get('registros_disponibles', 0)
            registros_asignados = data.get('registros_asignados', 0)
            
            print(f"📊 ESTADÍSTICAS DEL PADRÓN:")
            print(f"   Total de registros: {total_registros:,}")
            print(f"   Registros disponibles: {registros_disponibles:,}")
            print(f"   Registros asignados: {registros_asignados:,}")
            
            return data
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error verificando estadísticas: {str(e)}")
        return None

def verificar_ultimos_registros(token):
    """Verificar los últimos registros importados"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Buscar algunos registros recientes
        response = requests.get(
            f"{API_BASE}/api/padron/buscar",
            headers=headers,
            params={"page": 1, "size": 10},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            registros = data.get('registros', [])
            
            print(f"\n🔍 ÚLTIMOS REGISTROS IMPORTADOS:")
            for i, registro in enumerate(registros[:5], 1):
                nombre = registro.get('nombre', 'N/A')
                ape_pat = registro.get('ape_pat', 'N/A')
                ape_mat = registro.get('ape_mat', 'N/A')
                elector = registro.get('elector', 'N/A')
                seccion = registro.get('seccion', 'N/A')
                
                print(f"   {i}. {nombre} {ape_pat} {ape_mat}")
                print(f"      Elector: {elector} | Sección: {seccion}")
            
            return registros
        else:
            print(f"❌ Error obteniendo registros: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error verificando registros: {str(e)}")
        return None

def main():
    """Función principal"""
    print("🔍 VERIFICAR PROGRESO DE IMPORTACIÓN")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo iniciar sesión")
        return
    
    # Verificar estadísticas
    stats = verificar_estadisticas(token)
    
    # Verificar últimos registros
    registros = verificar_ultimos_registros(token)
    
    print(f"\n✅ Verificación completada")

if __name__ == "__main__":
    main()
