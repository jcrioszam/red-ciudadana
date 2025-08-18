#!/usr/bin/env python3
"""
Script para arreglar las URLs de las fotos de los reportes
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def fix_fotos_reportes():
    db = SessionLocal()
    
    try:
        # Obtener todos los reportes con fotos locales
        reportes = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.like('file://%')
        ).all()
        
        print(f"🔧 Reportes con URLs locales encontrados: {len(reportes)}")
        
        # URLs de ejemplo para fotos (puedes reemplazar con URLs reales)
        urls_ejemplo = [
            "http://localhost:8000/static/reportes/ejemplo1.jpg",
            "http://localhost:8000/static/reportes/ejemplo2.jpg",
            "http://localhost:8000/static/reportes/ejemplo3.jpg",
            "http://localhost:8000/static/reportes/ejemplo4.jpg",
            "http://localhost:8000/static/reportes/ejemplo5.jpg",
            "http://localhost:8000/static/reportes/ejemplo6.jpg"
        ]
        
        for i, reporte in enumerate(reportes):
            # Asignar una URL de ejemplo
            nueva_url = urls_ejemplo[i % len(urls_ejemplo)]
            reporte.foto_url = nueva_url
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    URL anterior: {reporte.foto_url}")
            print(f"    Nueva URL: {nueva_url}")
            print()
        
        # También vamos a agregar fotos a algunos reportes que no tienen
        reportes_sin_fotos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.is_(None)
        ).limit(3).all()
        
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
    print("🔧 Arreglando URLs de fotos de reportes...")
    fix_fotos_reportes()
    print("✅ Proceso completado.") 