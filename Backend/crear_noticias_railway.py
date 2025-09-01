#!/usr/bin/env python3
"""
Script para crear noticias de ejemplo en Railway
"""

import os
import sys
import requests
import json

# URL del backend en Railway
BACKEND_URL = "https://red-ciudadana-production.up.railway.app"

def crear_noticias_ejemplo():
    """Crear noticias de ejemplo usando la API"""
    
    # Datos de login (usar credenciales de admin)
    login_data = {
        "username": "admin",  # Cambiar por el usuario admin real
        "password": "admin123"  # Cambiar por la contraseña real
    }
    
    try:
        print("🚀 Iniciando creación de noticias de ejemplo...")
        
        # 1. Hacer login
        print("🔐 Haciendo login...")
        login_response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Error en login: {login_response.status_code}")
            print(f"Respuesta: {login_response.text}")
            return
        
        token = login_response.json().get("access_token")
        if not token:
            print("❌ No se obtuvo token de acceso")
            return
        
        print("✅ Login exitoso")
        
        # Headers con autenticación
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 2. Crear noticias de ejemplo
        noticias_ejemplo = [
            {
                "titulo": "Bienvenidos a Red Ciudadana",
                "descripcion_corta": "Sistema integral para la gestión de reportes ciudadanos y movilización social",
                "contenido_completo": "Red Ciudadana es una plataforma moderna que permite a los ciudadanos reportar incidentes, participar en eventos comunitarios y contribuir al mejoramiento de su comunidad.",
                "imagen_url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop",
                "imagen_alt": "Comunidad trabajando juntos",
                "categoria": "general",
                "prioridad": 1,
                "activa": True,
                "destacada": True,
                "tags": "bienvenida, comunidad, sistema",
                "boton_texto": "Conocer más"
            },
            {
                "titulo": "Reporta incidentes en tu comunidad",
                "descripcion_corta": "Ayuda a mejorar tu barrio reportando problemas y sugerencias",
                "contenido_completo": "Utiliza nuestro sistema de reportes ciudadanos para informar sobre problemas en tu comunidad. Tu participación es fundamental para crear un entorno mejor.",
                "imagen_url": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=400&fit=crop",
                "imagen_alt": "Persona reportando incidente",
                "categoria": "noticias",
                "prioridad": 2,
                "activa": True,
                "destacada": False,
                "tags": "reportes, comunidad, participación",
                "boton_texto": "Crear reporte"
            },
            {
                "titulo": "Nuevas funcionalidades disponibles",
                "descripcion_corta": "Descubre las últimas mejoras en la plataforma",
                "contenido_completo": "Hemos agregado nuevas funcionalidades para mejorar tu experiencia en la plataforma. Explora todas las opciones disponibles.",
                "imagen_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
                "imagen_alt": "Tecnología y innovación",
                "categoria": "anuncios",
                "prioridad": 3,
                "activa": True,
                "destacada": False,
                "tags": "actualizaciones, funcionalidades, tecnología",
                "boton_texto": "Ver detalles"
            }
        ]
        
        # 3. Crear cada noticia
        for i, noticia in enumerate(noticias_ejemplo, 1):
            print(f"📰 Creando noticia {i}: {noticia['titulo']}")
            
            response = requests.post(
                f"{BACKEND_URL}/admin/noticias/",
                json=noticia,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Noticia {i} creada exitosamente")
            else:
                print(f"❌ Error al crear noticia {i}: {response.status_code}")
                print(f"Respuesta: {response.text}")
        
        print("🎉 Proceso completado!")
        
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    crear_noticias_ejemplo()
