#!/usr/bin/env python3
"""
Script para verificar las fotos de los reportes en la base de datos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def verificar_fotos_reportes():
    db = SessionLocal()
    
    try:
        # Obtener todos los reportes
        reportes = db.query(ReporteCiudadano).all()
        
        print(f"📊 Total de reportes: {len(reportes)}")
        print("\n📋 Reportes con fotos:")
        
        reportes_con_fotos = 0
        for reporte in reportes:
            if reporte.foto_url:
                reportes_con_fotos += 1
                print(f"  - ID: {reporte.id}")
                print(f"    Título: {reporte.titulo}")
                print(f"    Foto URL: {reporte.foto_url}")
                print(f"    Estado: {reporte.estado}")
                print()
        
        print(f"📸 Reportes con fotos: {reportes_con_fotos}/{len(reportes)}")
        
        if reportes_con_fotos == 0:
            print("\n⚠️  No hay reportes con fotos en la base de datos.")
            print("💡 Esto puede ser porque:")
            print("   1. Los reportes se crearon sin fotos")
            print("   2. Las fotos se guardaron con rutas locales del dispositivo")
            print("   3. Las fotos no se subieron correctamente al servidor")
        
    except Exception as e:
        print(f"❌ Error al verificar fotos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔍 Verificando fotos de reportes...")
    verificar_fotos_reportes()
    print("✅ Verificación completada.") 