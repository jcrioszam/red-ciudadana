#!/usr/bin/env python3
"""
Script para probar que las imágenes sean accesibles
"""

import requests
import os

def test_imagenes():
    """Probar que las imágenes sean accesibles"""
    
    base_url = "http://localhost:8000"
    imagenes = [
        "static/reportes/ejemplo1.jpg",
        "static/reportes/ejemplo2.jpg", 
        "static/reportes/ejemplo3.jpg",
        "static/reportes/ejemplo4.jpg",
        "static/reportes/ejemplo5.jpg",
        "static/reportes/ejemplo6.jpg"
    ]
    
    print("🔍 Probando acceso a imágenes...")
    
    for imagen in imagenes:
        url = f"{base_url}/{imagen}"
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"✅ {imagen} - {response.status_code} - {len(response.content)} bytes")
            else:
                print(f"❌ {imagen} - {response.status_code}")
        except Exception as e:
            print(f"❌ {imagen} - Error: {e}")
    
    print("\n📋 URLs completas para probar en el navegador:")
    for imagen in imagenes:
        url = f"{base_url}/{imagen}"
        print(f"  {url}")
    
    print("\n💡 Si las imágenes no se cargan en el frontend, verifica:")
    print("  1. Que el backend esté corriendo en http://localhost:8000")
    print("  2. Que no haya errores CORS en la consola del navegador")
    print("  3. Que las URLs en la base de datos sean correctas")

if __name__ == "__main__":
    print("🔍 Probando imágenes...")
    test_imagenes()
    print("✅ Prueba completada.") 