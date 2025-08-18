#!/usr/bin/env python3
"""
Script para verificar exactamente qué URLs están en la base de datos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def verificar_urls_bd():
    db = SessionLocal()
    
    try:
        # Obtener todos los reportes
        reportes = db.query(ReporteCiudadano).all()
        
        print(f"📊 Total de reportes: {len(reportes)}")
        print("\n📋 URLs exactas en la base de datos:")
        
        for reporte in reportes:
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    Foto URL: '{reporte.foto_url}'")
            print(f"    Tipo de URL: {type(reporte.foto_url)}")
            if reporte.foto_url:
                print(f"    Longitud URL: {len(reporte.foto_url)}")
                print(f"    Empieza con 'http': {reporte.foto_url.startswith('http') if reporte.foto_url else False}")
                print(f"    Empieza con 'file': {reporte.foto_url.startswith('file') if reporte.foto_url else False}")
            print()
        
        # Contar tipos de URLs
        urls_http = 0
        urls_file = 0
        urls_none = 0
        
        for reporte in reportes:
            if not reporte.foto_url:
                urls_none += 1
            elif reporte.foto_url.startswith('http'):
                urls_http += 1
            elif reporte.foto_url.startswith('file'):
                urls_file += 1
        
        print(f"📊 Resumen de URLs:")
        print(f"  - URLs HTTP (correctas): {urls_http}")
        print(f"  - URLs FILE (problemáticas): {urls_file}")
        print(f"  - Sin URL: {urls_none}")
        
    except Exception as e:
        print(f"❌ Error al verificar URLs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔍 Verificando URLs en la base de datos...")
    verificar_urls_bd()
    print("✅ Verificación completada.") 