#!/usr/bin/env python3
"""
Script para probar la importación directa de datos
"""

import requests
import time

def probar_importacion_directa():
    print("🔧 PROBADOR DE IMPORTACIÓN DIRECTA")
    print("=" * 50)
    
    base_url = "https://red-ciudadana-production.up.railway.app"
    
    # Credenciales correctas
    login_data = {
        "identificador": "admin@redciudadana.com",
        "password": "admin123"
    }
    
    print("🔐 Iniciando sesión...")
    
    try:
        # Login
        response = requests.post(f"{base_url}/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            print("✅ Login exitoso")
            token = response.json().get('access_token')
            print(f"🔑 Token obtenido: {token[:50]}...")
            
            # Probar endpoint de importación
            print("\n📥 Probando endpoint de importación...")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Datos de prueba
            test_data = [
                {
                    "consecutivo": 1,
                    "elector": "TEST001",
                    "ape_pat": "Test",
                    "ape_mat": "User",
                    "nombre": "Test User",
                    "sexo": "M",
                    "activo": True
                },
                {
                    "consecutivo": 2,
                    "elector": "TEST002",
                    "ape_pat": "Test",
                    "ape_mat": "User2",
                    "nombre": "Test User 2",
                    "sexo": "F",
                    "activo": True
                }
            ]
            
            import_response = requests.post(
                f"{base_url}/api/padron/guardar-datos-tabla",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            print(f"📊 Status: {import_response.status_code}")
            print(f"📝 Respuesta: {import_response.text}")
            
            if import_response.status_code == 200:
                print("✅ ¡Importación exitosa!")
                print("🎉 El endpoint está funcionando correctamente")
                return True
            else:
                print(f"❌ Error en importación: {import_response.status_code}")
                return False
                
        else:
            print(f"❌ Login falló: {response.status_code}")
            print(f"📝 Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    probar_importacion_directa()