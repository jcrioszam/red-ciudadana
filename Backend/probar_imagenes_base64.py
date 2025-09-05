#!/usr/bin/env python3
"""
Script para probar el sistema de imágenes base64
"""

import requests
import base64
import io
from PIL import Image

def crear_imagen_prueba():
    """Crear una imagen de prueba simple"""
    # Crear una imagen simple de 100x100 píxeles
    img = Image.new('RGB', (100, 100), color='red')
    
    # Convertir a bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def probar_reporte_con_imagen():
    print("🧪 PROBANDO SISTEMA DE IMÁGENES BASE64")
    print("=" * 50)
    
    try:
        # Crear imagen de prueba
        print("📸 Creando imagen de prueba...")
        img_bytes = crear_imagen_prueba()
        
        # Datos del reporte
        data = {
            'titulo': 'Prueba de Imagen Base64',
            'descripcion': 'Este es un reporte de prueba para verificar el sistema de imágenes base64',
            'tipo': 'bache',
            'latitud': 27.0706,
            'longitud': -109.4437,
            'direccion': 'Calle de prueba, Navojoa, Sonora',
            'prioridad': 'normal',
            'es_publico': True
        }
        
        # Archivo de imagen
        files = {
            'foto': ('test_image.jpg', img_bytes, 'image/jpeg')
        }
        
        print("📤 Enviando reporte con imagen...")
        response = requests.post(
            'https://red-ciudadana-production.up.railway.app/reportes-ciudadanos/publico',
            data=data,
            files=files
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Reporte creado exitosamente: ID {result['id']}")
            
            # Verificar que el reporte se creó correctamente
            print("🔍 Verificando reporte creado...")
            reportes_response = requests.get('https://red-ciudadana-production.up.railway.app/reportes-publicos')
            
            if reportes_response.status_code == 200:
                reportes = reportes_response.json()
                print(f"📊 Total de reportes: {len(reportes)}")
                
                # Buscar el reporte que acabamos de crear
                for reporte in reportes:
                    if reporte['titulo'] == 'Prueba de Imagen Base64':
                        print(f"✅ Reporte encontrado: {reporte['titulo']}")
                        print(f"📸 Fotos: {len(reporte.get('fotos', []))}")
                        
                        if reporte.get('fotos'):
                            for i, foto in enumerate(reporte['fotos']):
                                print(f"  📸 Foto {i+1}:")
                                print(f"    URL: {foto['url']}")
                                print(f"    Tipo: {foto['tipo']}")
                                print(f"    Tamaño: {foto['tamaño']}")
                                
                                # Verificar si es base64
                                if foto['url'] and foto['url'].startswith('data:'):
                                    print("    ✅ Es base64 - ¡Funciona!")
                                else:
                                    print("    ❌ No es base64")
                        break
            else:
                print(f"❌ Error al obtener reportes: {reportes_response.status_code}")
        else:
            print(f"❌ Error al crear reporte: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    probar_reporte_con_imagen()
