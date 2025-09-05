#!/usr/bin/env python3
"""
Script para verificar las URLs de las imágenes de los reportes
"""

import requests
import json

def verificar_imagenes():
    print("🔍 VERIFICANDO IMÁGENES DE REPORTES")
    print("=" * 50)
    
    try:
        # Obtener reportes públicos
        print("📡 Obteniendo reportes públicos...")
        response = requests.get('https://red-ciudadana-production.up.railway.app/reportes-publicos')
        
        if response.status_code != 200:
            print(f"❌ Error al obtener reportes: {response.status_code}")
            return
        
        data = response.json()
        print(f"✅ Reportes obtenidos: {len(data)}")
        
        # Buscar reportes con fotos
        reportes_con_fotos = []
        for reporte in data:
            if reporte.get('fotos') and len(reporte['fotos']) > 0:
                reportes_con_fotos.append(reporte)
        
        print(f"📸 Reportes con fotos: {len(reportes_con_fotos)}")
        
        if not reportes_con_fotos:
            print("❌ No hay reportes con fotos")
            return
        
        # Verificar el primer reporte con fotos
        primer_reporte = reportes_con_fotos[0]
        print(f"\n🔍 PRIMER REPORTE CON FOTOS:")
        print(f"📋 ID: {primer_reporte['id']}")
        print(f"📋 Título: {primer_reporte['titulo']}")
        print(f"📸 Cantidad de fotos: {len(primer_reporte['fotos'])}")
        
        # Verificar cada foto
        for i, foto in enumerate(primer_reporte['fotos']):
            print(f"\n📸 FOTO {i+1}:")
            print(f"   ID: {foto['id']}")
            print(f"   Nombre: {foto['nombre_archivo']}")
            print(f"   URL: {foto['url']}")
            print(f"   Tipo: {foto['tipo']}")
            print(f"   Tamaño: {foto['tamaño']}")
            
            # Probar si la URL es accesible
            try:
                img_response = requests.head(foto['url'], timeout=10)
                print(f"   ✅ Status: {img_response.status_code}")
                if img_response.status_code == 200:
                    print(f"   ✅ Content-Type: {img_response.headers.get('content-type', 'N/A')}")
                else:
                    print(f"   ❌ Error: No se puede acceder a la imagen")
            except Exception as e:
                print(f"   ❌ Error al verificar URL: {str(e)}")
        
        # Verificar si el directorio uploads existe
        print(f"\n🔍 VERIFICANDO DIRECTORIO UPLOADS:")
        try:
            uploads_response = requests.get('https://red-ciudadana-production.up.railway.app/uploads/', timeout=10)
            print(f"   Status uploads/: {uploads_response.status_code}")
        except Exception as e:
            print(f"   ❌ Error al acceder a uploads/: {str(e)}")
        
    except Exception as e:
        print(f"❌ Error general: {str(e)}")

if __name__ == "__main__":
    verificar_imagenes()
