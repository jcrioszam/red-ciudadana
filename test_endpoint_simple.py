#!/usr/bin/env python3
"""
Script para probar el endpoint de confirmar importación con datos mínimos
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

def test_confirmar_importacion(token):
    """Probar el endpoint con datos mínimos"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Datos de prueba muy simples
    datos_prueba = [
        {
            "consecutivo": 1,
            "cedula": "12345678",
            "nombre": "Juan",
            "apellido_paterno": "Pérez",
            "apellido_materno": "García",
            "fecha_nacimiento": "1990-01-01",
            "sexo": "M",
            "estado": "Sonora",
            "municipio": "Hermosillo",
            "seccion": "001",
            "localidad": "Centro",
            "casilla": "A",
            "tipo_casilla": "Básica",
            "domicilio": "Calle Principal 123",
            "colonia": "Centro",
            "codigo_postal": "83000",
            "telefono": "6621234567",
            "email": "juan@email.com"
        }
    ]
    
    print(f"📤 Enviando {len(datos_prueba)} registros de prueba...")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/padron/confirmar-importacion",
            headers=headers,
            json=datos_prueba,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa: {data}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en la petición: {str(e)}")
        return False

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
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📝 Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Estadísticas: {data}")
            return data
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error verificando estadísticas: {str(e)}")
        return None

def main():
    """Función principal"""
    print("🧪 PRUEBA DEL ENDPOINT DE CONFIRMAR IMPORTACIÓN")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo iniciar sesión")
        return
    
    # Verificar estadísticas antes
    print("\n🔍 Estadísticas ANTES de la prueba:")
    stats_antes = verificar_estadisticas(token)
    
    # Probar endpoint
    print("\n🧪 Probando endpoint de confirmar importación:")
    if test_confirmar_importacion(token):
        print("✅ Endpoint funcionó")
    else:
        print("❌ Endpoint falló")
    
    # Verificar estadísticas después
    print("\n🔍 Estadísticas DESPUÉS de la prueba:")
    stats_despues = verificar_estadisticas(token)
    
    # Comparar
    if stats_antes and stats_despues:
        total_antes = stats_antes.get('total_registros', 0)
        total_despues = stats_despues.get('total_registros', 0)
        print(f"\n📊 Comparación:")
        print(f"   Antes: {total_antes} registros")
        print(f"   Después: {total_despues} registros")
        print(f"   Diferencia: {total_despues - total_antes} registros")

if __name__ == "__main__":
    main()
