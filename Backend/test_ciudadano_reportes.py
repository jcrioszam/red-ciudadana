#!/usr/bin/env python3
"""
Script para probar la API de reportes ciudadanos con un usuario ciudadano
"""

import requests
import json

# Configuración
BASE_URL = "http://192.168.2.150:8000"
CIUDADANO_EMAIL = "zam@gmail.com"  # Email real del ciudadano
CIUDADANO_PASSWORD = "12345678"  # Contraseña real del ciudadano

def test_ciudadano_reportes():
    print("🔍 Probando reportes ciudadanos con usuario ciudadano...")
    
    # 1. Obtener token del ciudadano
    print("📝 Obteniendo token del ciudadano...")
    try:
        token_response = requests.post(f"{BASE_URL}/token", data={
            "username": CIUDADANO_EMAIL,
            "password": CIUDADANO_PASSWORD
        })
        
        if token_response.status_code != 200:
            print(f"❌ Error obteniendo token: {token_response.status_code}")
            print(f"Respuesta: {token_response.text}")
            return
            
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        token_type = token_data.get("token_type")
        
        if not access_token:
            print("❌ No se obtuvo el access_token")
            return
            
        print("✅ Token obtenido exitosamente")
        
    except Exception as e:
        print(f"❌ Error en la petición de token: {e}")
        return
    
    # 2. Obtener información del usuario
    print("\n👤 Obteniendo información del usuario...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        user_response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
        
        if user_response.status_code == 200:
            user_data = user_response.json()
            print(f"✅ Usuario: {user_data.get('nombre', 'N/A')}")
            print(f"✅ Rol: {user_data.get('rol', 'N/A')}")
            print(f"✅ Email: {user_data.get('email', 'N/A')}")
        else:
            print(f"❌ Error obteniendo información del usuario: {user_response.status_code}")
            print(f"Respuesta: {user_response.text}")
            return
            
    except Exception as e:
        print(f"❌ Error obteniendo información del usuario: {e}")
        return
    
    # 3. Obtener configuración del usuario
    print("\n⚙️ Obteniendo configuración del usuario...")
    try:
        config_response = requests.get(f"{BASE_URL}/perfiles/mi-configuracion", headers=headers)
        
        if config_response.status_code == 200:
            config_data = config_response.json()
            print(f"✅ Opciones app: {config_data.get('configuracion', {}).get('opciones_app', [])}")
            print(f"✅ Opciones web: {config_data.get('configuracion', {}).get('opciones_web', [])}")
        else:
            print(f"❌ Error obteniendo configuración: {config_response.status_code}")
            print(f"Respuesta: {config_response.text}")
            
    except Exception as e:
        print(f"❌ Error obteniendo configuración: {e}")
    
    # 4. Probar endpoint de reportes ciudadanos
    print("\n📊 Probando endpoint de reportes ciudadanos...")
    try:
        reportes_response = requests.get(f"{BASE_URL}/reportes-ciudadanos", headers=headers)
        
        if reportes_response.status_code == 200:
            reportes_data = reportes_response.json()
            print(f"✅ Se obtuvieron {len(reportes_data)} reportes")
            
            if reportes_data:
                print("\n📋 Primeros 3 reportes:")
                for i, reporte in enumerate(reportes_data[:3]):
                    print(f"  {i+1}. ID: {reporte.get('id')}")
                    print(f"     Título: {reporte.get('titulo')}")
                    print(f"     Estado: {reporte.get('estado')}")
                    print(f"     Prioridad: {reporte.get('prioridad')}")
                    print(f"     Ciudadano: {reporte.get('ciudadano_nombre')}")
                    print()
            else:
                print("ℹ️ No hay reportes disponibles")
                
        else:
            print(f"❌ Error obteniendo reportes: {reportes_response.status_code}")
            print(f"Respuesta: {reportes_response.text}")
            
    except Exception as e:
        print(f"❌ Error obteniendo reportes: {e}")
    
    # 5. Probar endpoint de noticias
    print("\n📰 Probando endpoint de noticias...")
    try:
        noticias_response = requests.get(f"{BASE_URL}/noticias", headers=headers)
        
        if noticias_response.status_code == 200:
            noticias_data = noticias_response.json()
            print(f"✅ Se obtuvieron {len(noticias_data)} noticias")
            
            if noticias_data:
                print("\n📋 Primeras 2 noticias:")
                for i, noticia in enumerate(noticias_data[:2]):
                    print(f"  {i+1}. ID: {noticia.get('id')}")
                    print(f"     Título: {noticia.get('titulo')}")
                    print(f"     Autor: {noticia.get('autor', 'N/A')}")
                    print()
            else:
                print("ℹ️ No hay noticias disponibles")
                
        else:
            print(f"❌ Error obteniendo noticias: {noticias_response.status_code}")
            print(f"Respuesta: {noticias_response.text}")
            
    except Exception as e:
        print(f"❌ Error obteniendo noticias: {e}")
    
    print("\n✅ Prueba completada")

if __name__ == "__main__":
    test_ciudadano_reportes() 