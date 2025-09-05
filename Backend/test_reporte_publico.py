#!/usr/bin/env python3
"""
Script para probar el endpoint de reportes ciudadanos públicos
"""

import requests
import json

def test_reporte_publico():
    """Probar el endpoint de reportes públicos"""
    
    # URL del backend (ajusta según tu configuración)
    base_url = "https://red-ciudadana-production.up.railway.app"
    
    # Datos de prueba
    test_data = {
        "titulo": "Prueba de Reporte",
        "descripcion": "Este es un reporte de prueba para verificar que el endpoint funciona",
        "tipo": "bache",
        "latitud": 27.0706,
        "longitud": -109.4437,
        "direccion": "Calle de prueba, Navojoa, Sonora",
        "prioridad": "normal",
        "es_publico": True
    }
    
    print("🧪 PROBANDO ENDPOINT DE REPORTES PÚBLICOS")
    print("=" * 50)
    print(f"URL: {base_url}/reportes-ciudadanos/publico")
    print(f"Datos: {json.dumps(test_data, indent=2)}")
    
    try:
        # Crear FormData
        files = {}
        data = test_data
        
        print("\n📤 Enviando petición...")
        response = requests.post(
            f"{base_url}/reportes-ciudadanos/publico",
            data=data,
            files=files,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📊 Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 201]:
            print("✅ ¡ÉXITO! Reporte creado correctamente")
            print(f"📋 Respuesta: {response.json()}")
        else:
            print("❌ ERROR al crear reporte")
            print(f"📋 Respuesta: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    
    # Probar obtener reportes
    print("\n🔍 PROBANDO OBTENER REPORTES PÚBLICOS")
    print("=" * 50)
    
    try:
        response = requests.get(f"{base_url}/reportes-publicos", timeout=30)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            reportes = response.json()
            print(f"✅ ¡ÉXITO! Se obtuvieron {len(reportes)} reportes")
            for i, reporte in enumerate(reportes[:3]):  # Mostrar solo los primeros 3
                print(f"  {i+1}. {reporte.get('titulo', 'Sin título')} - {reporte.get('estado', 'Sin estado')}")
        else:
            print("❌ ERROR al obtener reportes")
            print(f"📋 Respuesta: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_reporte_publico()
