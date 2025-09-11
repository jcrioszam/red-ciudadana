#!/usr/bin/env python3
"""
Script para diagnosticar el problema real del endpoint
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

def probar_endpoint_detallado(token):
    """Probar el endpoint con logging detallado"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Datos de prueba
    datos_prueba = [
        {
            "consecutivo": 999,
            "cedula": "TEST999",
            "nombre": "Test",
            "apellido_paterno": "Usuario",
            "apellido_materno": "Prueba",
            "fecha_nacimiento": "1990-01-01",
            "sexo": "M",
            "estado": "Test",
            "municipio": "Test",
            "seccion": "999",
            "localidad": "Test",
            "casilla": "A",
            "tipo_casilla": "Test",
            "domicilio": "Test 123",
            "colonia": "Test",
            "codigo_postal": "00000",
            "telefono": "0000000000",
            "email": "test@test.com"
        }
    ]
    
    print("🧪 PROBANDO ENDPOINT CON LOGGING DETALLADO")
    print("=" * 50)
    
    # Verificar estadísticas ANTES
    print("📊 Estadísticas ANTES:")
    response = requests.get(f"{API_BASE}/api/padron/estadisticas", headers=headers, timeout=30)
    if response.status_code == 200:
        stats_antes = response.json()
        print(f"   Total: {stats_antes.get('total_registros', 0)}")
    else:
        print(f"   Error: {response.status_code}")
    
    # Enviar datos
    print(f"\n📤 Enviando datos de prueba...")
    response = requests.post(
        f"{API_BASE}/api/padron/confirmar-importacion",
        headers=headers,
        json=datos_prueba,
        timeout=30
    )
    
    print(f"📊 Status Code: {response.status_code}")
    print(f"📝 Response Headers: {dict(response.headers)}")
    print(f"📝 Response Body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Respuesta exitosa:")
        print(f"   Success: {data.get('success')}")
        print(f"   Mensaje: {data.get('mensaje')}")
        print(f"   Total guardados: {data.get('total_guardados')}")
        print(f"   Total procesados: {data.get('total_procesados')}")
        print(f"   Errores: {data.get('errores')}")
    
    # Verificar estadísticas DESPUÉS
    print(f"\n📊 Estadísticas DESPUÉS:")
    response = requests.get(f"{API_BASE}/api/padron/estadisticas", headers=headers, timeout=30)
    if response.status_code == 200:
        stats_despues = response.json()
        print(f"   Total: {stats_despues.get('total_registros', 0)}")
        
        # Comparar
        if stats_antes and stats_despues:
            total_antes = stats_antes.get('total_registros', 0)
            total_despues = stats_despues.get('total_registros', 0)
            print(f"   Diferencia: {total_despues - total_antes}")
    else:
        print(f"   Error: {response.status_code}")

def verificar_logs_servidor():
    """Verificar si hay logs del servidor disponibles"""
    print(f"\n🔍 VERIFICANDO LOGS DEL SERVIDOR")
    print("=" * 50)
    
    # Probar endpoint de health
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Health endpoint: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error health: {e}")
    
    # Probar endpoint de docs
    try:
        response = requests.get(f"{API_BASE}/docs", timeout=10)
        print(f"Docs endpoint: {response.status_code}")
    except Exception as e:
        print(f"Error docs: {e}")

def main():
    print("🔍 DIAGNÓSTICO COMPLETO DEL PROBLEMA")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo conectar a la API")
        return
    
    print("✅ Conexión a la API exitosa")
    
    # Probar endpoint detallado
    probar_endpoint_detallado(token)
    
    # Verificar logs del servidor
    verificar_logs_servidor()

if __name__ == "__main__":
    main()
