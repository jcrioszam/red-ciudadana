#!/usr/bin/env python3
"""
Script para verificar directamente en la base de datos
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

def verificar_estadisticas_detalladas(token):
    """Verificar estadísticas detalladas"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Probar diferentes endpoints
        endpoints = [
            "/api/padron/estadisticas",
            "/api/padron/buscar?page=1&size=1",
            "/api/padron/buscar?page=1&size=10"
        ]
        
        for endpoint in endpoints:
            print(f"\n🔍 Probando endpoint: {endpoint}")
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=30)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
            else:
                print(f"   Error: {response.text[:100]}...")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    print("🔍 VERIFICACIÓN DIRECTA DE LA BASE DE DATOS")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        print("❌ Error: No se pudo conectar a la API")
        return
    
    print("✅ Conexión a la API exitosa")
    
    # Verificar endpoints
    verificar_estadisticas_detalladas(token)

if __name__ == "__main__":
    main()
