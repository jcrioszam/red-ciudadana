#!/usr/bin/env python3
"""
Script para crear imágenes de ejemplo para los reportes
"""

import os
from PIL import Image, ImageDraw, ImageFont
import random

def crear_imagen_ejemplo(nombre_archivo, texto, color_fondo=(100, 150, 200)):
    """Crear una imagen de ejemplo con texto"""
    
    # Crear imagen
    width, height = 400, 300
    img = Image.new('RGB', (width, height), color_fondo)
    draw = ImageDraw.Draw(img)
    
    # Agregar borde
    draw.rectangle([(0, 0), (width-1, height-1)], outline=(50, 50, 50), width=3)
    
    # Agregar texto
    try:
        # Intentar usar una fuente del sistema
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        # Si no está disponible, usar la fuente por defecto
        font = ImageFont.load_default()
    
    # Centrar el texto
    bbox = draw.textbbox((0, 0), texto, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Agregar sombra al texto
    draw.text((x+2, y+2), texto, fill=(0, 0, 0), font=font)
    draw.text((x, y), texto, fill=(255, 255, 255), font=font)
    
    # Agregar marca de agua
    marca_agua = "Ejemplo"
    try:
        font_pequena = ImageFont.truetype("arial.ttf", 16)
    except:
        font_pequena = ImageFont.load_default()
    
    bbox_agua = draw.textbbox((0, 0), marca_agua, font=font_pequena)
    agua_width = bbox_agua[2] - bbox_agua[0]
    agua_height = bbox_agua[3] - bbox_agua[1]
    
    agua_x = width - agua_width - 10
    agua_y = height - agua_height - 10
    
    draw.text((agua_x, agua_y), marca_agua, fill=(200, 200, 200, 128), font=font_pequena)
    
    return img

def crear_imagenes_ejemplo():
    """Crear todas las imágenes de ejemplo"""
    
    # Asegurar que el directorio existe
    directorio = "static/reportes"
    if not os.path.exists(directorio):
        os.makedirs(directorio)
        print(f"📁 Directorio creado: {directorio}")
    
    # Configuraciones de imágenes
    imagenes = [
        {
            "nombre": "ejemplo1.jpg",
            "texto": "Bache en la calle",
            "color": (255, 100, 100)  # Rojo
        },
        {
            "nombre": "ejemplo2.jpg", 
            "texto": "Alcantarilla sin tapa",
            "color": (100, 100, 255)  # Azul
        },
        {
            "nombre": "ejemplo3.jpg",
            "texto": "Contenedor de basura",
            "color": (100, 255, 100)  # Verde
        },
        {
            "nombre": "ejemplo4.jpg",
            "texto": "Árbol caído",
            "color": (255, 200, 100)  # Naranja
        },
        {
            "nombre": "ejemplo5.jpg",
            "texto": "Semáforo dañado",
            "color": (200, 100, 255)  # Púrpura
        },
        {
            "nombre": "ejemplo6.jpg",
            "texto": "Iluminación rota",
            "color": (255, 255, 100)  # Amarillo
        }
    ]
    
    print("🎨 Creando imágenes de ejemplo...")
    
    for i, config in enumerate(imagenes, 1):
        ruta_archivo = os.path.join(directorio, config["nombre"])
        
        # Crear la imagen
        img = crear_imagen_ejemplo(
            config["nombre"],
            config["texto"],
            config["color"]
        )
        
        # Guardar la imagen
        img.save(ruta_archivo, "JPEG", quality=85)
        
        print(f"  {i}. ✅ {config['nombre']} - {config['texto']}")
    
    print(f"\n📸 Se crearon {len(imagenes)} imágenes de ejemplo en {directorio}/")
    
    # Verificar que las imágenes existen
    print("\n🔍 Verificando archivos creados:")
    for config in imagenes:
        ruta_archivo = os.path.join(directorio, config["nombre"])
        if os.path.exists(ruta_archivo):
            tamano = os.path.getsize(ruta_archivo)
            print(f"  ✅ {config['nombre']} - {tamano} bytes")
        else:
            print(f"  ❌ {config['nombre']} - No encontrado")

if __name__ == "__main__":
    print("🎨 Generando imágenes de ejemplo para reportes...")
    crear_imagenes_ejemplo()
    print("✅ Proceso completado.") 