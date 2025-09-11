#!/usr/bin/env python3
"""
Script rápido para verificar el estado de la importación
"""

import requests
import json

# Configuración de la API
API_BASE = "https://red-ciudadana-production.up.railway.app"
USERNAME = "admin@redciudadana.com"
PASSWORD = "admin123"

def login():
    """Iniciar sesión y obtener token"""
    login_data = {
        "identificador": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{API_BASE}/login", json=login_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        return None
    except:
        return None

def verificar_estadisticas(token):
    """Verificar estadísticas del padrón"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{API_BASE}/api/padron/estadisticas", headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def main():
    print("🔍 VERIFICACIÓN RÁPIDA DEL ESTADO")
    print("=" * 40)
    
    # Login
    token = login()
    if not token:
        print("❌ Error: No se pudo conectar a la API")
        return
    
    print("✅ Conexión a la API exitosa")
    
    # Verificar estadísticas
    stats = verificar_estadisticas(token)
    if stats:
        total = stats.get('total_registros', 0)
        disponibles = stats.get('registros_disponibles', 0)
        asignados = stats.get('registros_asignados', 0)
        
        print(f"📊 ESTADÍSTICAS ACTUALES:")
        print(f"   Total de registros: {total:,}")
        print(f"   Disponibles: {disponibles:,}")
        print(f"   Asignados: {asignados:,}")
        
        if total == 1:
            print("⚠️  Solo hay 1 registro (el de prueba)")
            print("❌ La importación masiva no se completó")
        elif total > 1:
            print(f"✅ Hay {total:,} registros importados")
        else:
            print("❌ No hay registros en la base de datos")
    else:
        print("❌ Error obteniendo estadísticas")

if __name__ == "__main__":
    main()
