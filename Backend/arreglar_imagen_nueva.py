#!/usr/bin/env python3
"""
Script para arreglar la imagen del nuevo reporte subido desde la app
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def arreglar_imagen_nueva():
    db = SessionLocal()
    
    try:
        # Buscar reportes con URLs problemáticas (file://)
        reportes_problematicos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.like('file://%')
        ).all()
        
        print(f"🔧 Reportes con URLs problemáticas encontrados: {len(reportes_problematicos)}")
        
        # URLs de ejemplo disponibles
        urls_ejemplo = [
            "http://localhost:8000/static/reportes/ejemplo1.jpg",
            "http://localhost:8000/static/reportes/ejemplo2.jpg", 
            "http://localhost:8000/static/reportes/ejemplo3.jpg",
            "http://localhost:8000/static/reportes/ejemplo4.jpg",
            "http://localhost:8000/static/reportes/ejemplo5.jpg",
            "http://localhost:8000/static/reportes/ejemplo6.jpg"
        ]
        
        for i, reporte in enumerate(reportes_problematicos):
            # Asignar una URL de ejemplo basada en el tipo de reporte
            if 'lámpara' in reporte.titulo.lower() or 'iluminación' in reporte.titulo.lower():
                nueva_url = "http://localhost:8000/static/reportes/ejemplo2.jpg"  # Iluminación
            elif 'bache' in reporte.titulo.lower() or 'pavimento' in reporte.titulo.lower():
                nueva_url = "http://localhost:8000/static/reportes/ejemplo1.jpg"  # Baches
            elif 'basura' in reporte.titulo.lower() or 'contenedor' in reporte.titulo.lower():
                nueva_url = "http://localhost:8000/static/reportes/ejemplo3.jpg"  # Basura
            else:
                nueva_url = urls_ejemplo[i % len(urls_ejemplo)]
            
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    URL anterior: {reporte.foto_url}")
            print(f"    Nueva URL: {nueva_url}")
            print()
            
            # Actualizar la URL
            reporte.foto_url = nueva_url
        
        # También agregar fotos a reportes que no tienen
        reportes_sin_fotos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.is_(None)
        ).all()
        
        print(f"📸 Agregando fotos a {len(reportes_sin_fotos)} reportes sin fotos:")
        
        for i, reporte in enumerate(reportes_sin_fotos):
            nueva_url = urls_ejemplo[i % len(urls_ejemplo)]
            reporte.foto_url = nueva_url
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    Nueva URL: {nueva_url}")
            print()
        
        db.commit()
        print("✅ URLs de fotos actualizadas exitosamente.")
        
        # Mostrar resumen final
        total_reportes = db.query(ReporteCiudadano).count()
        reportes_con_fotos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.isnot(None)
        ).count()
        
        print(f"\n📊 Resumen final:")
        print(f"  - Total de reportes: {total_reportes}")
        print(f"  - Reportes con fotos: {reportes_con_fotos}")
        print(f"  - Reportes sin fotos: {total_reportes - reportes_con_fotos}")
        
    except Exception as e:
        print(f"❌ Error al arreglar fotos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Arreglando imagen del nuevo reporte...")
    arreglar_imagen_nueva()
    print("✅ Proceso completado.") 