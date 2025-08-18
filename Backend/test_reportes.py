#!/usr/bin/env python3
"""
Script para probar el endpoint de reportes ciudadanos
"""

import requests
import json

def test_reportes_endpoint():
    # URL base
    base_url = "http://localhost:8000"
    
    # 1. Obtener token de autenticación
    print("🔑 Obteniendo token de autenticación...")
    login_data = {
        "username": "admin@redciudadana.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/token", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            print("✅ Token obtenido exitosamente")
        else:
            print(f"❌ Error al obtener token: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    # 2. Probar endpoint de reportes
    print("\n📋 Probando endpoint de reportes ciudadanos...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{base_url}/reportes-ciudadanos", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            reportes = response.json()
            print(f"✅ Se obtuvieron {len(reportes)} reportes")
            
            if reportes:
                print("\n📊 Primer reporte:")
                primer_reporte = reportes[0]
                print(f"  - ID: {primer_reporte.get('id')}")
                print(f"  - Título: {primer_reporte.get('titulo')}")
                print(f"  - Estado: {primer_reporte.get('estado')}")
                print(f"  - Tipo: {primer_reporte.get('tipo')}")
                print(f"  - Prioridad: {primer_reporte.get('prioridad')}")
                print(f"  - Ciudadano: {primer_reporte.get('ciudadano_nombre')}")
                print(f"  - Fecha creación: {primer_reporte.get('fecha_creacion')}")
        else:
            print(f"❌ Error en la respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error al obtener reportes: {e}")

if __name__ == "__main__":
    print("🚀 Probando endpoint de reportes ciudadanos...")
    test_reportes_endpoint()
    print("✅ Prueba completada.") 