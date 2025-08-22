#!/usr/bin/env python3
"""
Script para probar los permisos por rol en el endpoint de personas
"""

import requests
import json

# Configuración
BASE_URL = "https://red-ciudadana-production.up.railway.app"

# Credenciales de prueba
USUARIOS_PRUEBA = {
    "admin": {
        "email": "admin@redciudadana.com",
        "password": "admin123"
    },
    "lider_regional": {
        "email": "lider_regional@redciudadana.com", 
        "password": "lider123"
    },
    "capturista": {
        "email": "capturista@redciudadana.com",
        "password": "capturista123"
    }
}

def login_usuario(email, password):
    """Iniciar sesión como usuario"""
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Error al iniciar sesión como {email}: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def probar_endpoint_personas(token, rol):
    """Probar el endpoint de personas con el token del usuario"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print(f"\n🔍 Probando endpoint para rol: {rol}")
        print("-" * 50)
        
        # Probar endpoint con usuario registro
        response = requests.get(f"{BASE_URL}/personas/con-usuario-registro/", headers=headers)
        
        if response.status_code == 200:
            personas = response.json()
            print(f"✅ Endpoint funcionando - Se encontraron {len(personas)} personas")
            
            # Mostrar información de cada persona
            for i, persona in enumerate(personas[:3]):  # Solo mostrar las primeras 3
                print(f"\n👤 Persona {i+1}:")
                print(f"   ID: {persona.get('id')}")
                print(f"   Nombre: {persona.get('nombre')}")
                print(f"   Líder Responsable: {persona.get('id_lider_responsable')}")
                if persona.get('usuario_registro'):
                    print(f"   Registrado por: {persona.get('usuario_registro', {}).get('nombre')} ({persona.get('usuario_registro', {}).get('rol')})")
                else:
                    print(f"   Registrado por: N/A")
            
            if len(personas) > 3:
                print(f"\n... y {len(personas) - 3} personas más")
                
        else:
            print(f"❌ Error en endpoint: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")

def main():
    """Función principal"""
    print("🚀 PROBANDO PERMISOS POR ROL EN ENDPOINT DE PERSONAS")
    print("=" * 60)
    
    resultados = {}
    
    # Probar cada rol
    for rol, credenciales in USUARIOS_PRUEBA.items():
        print(f"\n🔐 Probando rol: {rol}")
        print(f"Email: {credenciales['email']}")
        
        # Iniciar sesión
        token = login_usuario(credenciales['email'], credenciales['password'])
        
        if token:
            print(f"✅ Login exitoso para {rol}")
            # Probar endpoint
            probar_endpoint_personas(token, rol)
            resultados[rol] = "✅ Exitoso"
        else:
            print(f"❌ Login falló para {rol}")
            resultados[rol] = "❌ Falló"
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    for rol, resultado in resultados.items():
        print(f"{rol}: {resultado}")
    
    print("\n" + "=" * 60)
    print("🎯 RESULTADO ESPERADO:")
    print("=" * 60)
    print("✅ admin: Ve todas las personas")
    print("✅ lider_regional: Ve solo personas de su jerarquía")
    print("✅ capturista: Ve solo personas que registró")
    print("=" * 60)

if __name__ == "__main__":
    main()
