#!/usr/bin/env python3
"""
Script para actualizar URLs de fotos a Railway
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def arreglar_urls_railway():
    db = SessionLocal()

    try:
        print("🚀 Actualizando URLs de fotos a Railway...")
        
        # URLs de Railway (usando las imágenes que ya tenemos en uploads/)
        urls_railway = [
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo1.jpg",
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo2.jpg",
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo3.jpg",
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo4.jpg",
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo5.jpg",
            "https://red-ciudadana-production.up.railway.app/uploads/ejemplo6.jpg"
        ]

        # Actualizar reportes con URLs locales
        reportes_locales = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.like('http://localhost%')
        ).all()

        print(f"📸 Reportes con URLs locales encontrados: {len(reportes_locales)}")

        for i, reporte in enumerate(reportes_locales):
            nueva_url = urls_railway[i % len(urls_railway)]
            reporte.foto_url = nueva_url
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    Nueva URL: {nueva_url}")
            print()

        db.commit()
        print("✅ URLs actualizadas a Railway exitosamente.")

        # Verificar estado final
        total_reportes = db.query(ReporteCiudadano).count()
        reportes_con_fotos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.foto_url.isnot(None)
        ).count()

        print(f"\n📊 Resumen final:")
        print(f"  - Total de reportes: {total_reportes}")
        print(f"  - Reportes con fotos: {reportes_con_fotos}")
        print(f"  - Reportes sin fotos: {total_reportes - reportes_con_fotos}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    arreglar_urls_railway()
