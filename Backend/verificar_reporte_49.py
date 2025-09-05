#!/usr/bin/env python3
"""
Script para verificar específicamente el reporte ID 49
"""

import requests
import json

def verificar_reporte_49():
    print("🔍 VERIFICANDO REPORTE ID 49")
    print("=" * 40)
    
    try:
        # Obtener reportes públicos
        response = requests.get('https://red-ciudadana-production.up.railway.app/reportes-publicos')
        
        if response.status_code != 200:
            print(f"❌ Error al obtener reportes: {response.status_code}")
            return
        
        data = response.json()
        print(f"✅ Reportes obtenidos: {len(data)}")
        
        # Buscar el reporte ID 49
        reporte_49 = None
        for reporte in data:
            if reporte['id'] == 49:
                reporte_49 = reporte
                break
        
        if not reporte_49:
            print("❌ Reporte ID 49 no encontrado")
            return
        
        print(f"✅ Reporte ID 49 encontrado: {reporte_49['titulo']}")
        print(f"📸 Fotos: {len(reporte_49.get('fotos', []))}")
        
        if reporte_49.get('fotos'):
            for i, foto in enumerate(reporte_49['fotos']):
                print(f"\n📸 FOTO {i+1}:")
                print(f"   ID: {foto['id']}")
                print(f"   Nombre: {foto['nombre_archivo']}")
                print(f"   URL: {foto['url']}")
                print(f"   Tipo: {foto['tipo']}")
                print(f"   Tamaño: {foto['tamaño']}")
                
                # Verificar si es base64
                if foto['url'] and foto['url'].startswith('data:'):
                    print("   ✅ Es base64 - ¡Funciona!")
                    print(f"   📏 Longitud base64: {len(foto['url'])} caracteres")
                else:
                    print("   ❌ No es base64")
        else:
            print("❌ No hay fotos en el reporte")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    verificar_reporte_49()
