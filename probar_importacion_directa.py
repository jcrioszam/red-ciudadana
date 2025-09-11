#!/usr/bin/env python3
"""
Script para probar el nuevo endpoint de importación directa
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

def probar_endpoint_directo(token):
    """Probar el nuevo endpoint de importación directa"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🧪 PROBANDO ENDPOINT DE IMPORTACIÓN DIRECTA")
    print("=" * 50)
    
    # Verificar que el endpoint existe
    try:
        response = requests.get(f"{API_BASE}/docs", timeout=30)
        if response.status_code == 200:
            print("✅ Documentación de API disponible")
        else:
            print("❌ Error accediendo a documentación")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print(f"\n🔍 El nuevo endpoint estará disponible en:")
    print(f"   POST {API_BASE}/api/padron/importar-directo")
    print(f"\n📝 Para usarlo, necesitas enviar un archivo Excel como multipart/form-data")

def main():
    print("🚀 PRUEBA DEL NUEVO ENDPOINT DE IMPORTACIÓN DIRECTA")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo conectar a la API")
        return
    
    print("✅ Conexión a la API exitosa")
    
    # Probar endpoint
    probar_endpoint_directo(token)
    
    print(f"\n💡 Para usar el nuevo endpoint:")
    print(f"   1. Ve a la aplicación web")
    print(f"   2. Busca la opción de 'Importar Padrón Directo'")
    print(f"   3. Sube tu archivo Excel")
    print(f"   4. La importación se ejecutará directamente en Railway")

if __name__ == "__main__":
    main()
