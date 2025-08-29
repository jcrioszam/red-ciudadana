#!/usr/bin/env python3
"""
Script de prueba para verificar el endpoint de vista previa de reportes
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def test_reportes_preview():
    """Probar la lógica de vista previa de reportes"""
    db = SessionLocal()
    
    try:
        print("🔍 Verificando reportes en la base de datos...")
        
        # Contar total de reportes
        total_reportes = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes en BD: {total_reportes}")
        
        if total_reportes == 0:
            print("❌ No hay reportes en la base de datos")
            return
        
        # Ver reportes más antiguos
        reportes_antiguos = db.query(ReporteCiudadano).order_by(
            ReporteCiudadano.fecha_creacion.asc()
        ).limit(5).all()
        
        print("\n📅 Reportes más antiguos:")
        for reporte in reportes_antiguos:
            print(f"  - ID: {reporte.id}, Fecha: {reporte.fecha_creacion}, Estado: {reporte.estado}")
        
        # Probar filtro de días
        for days in [30, 60, 90]:
            fecha_limite = datetime.now() - timedelta(days=days)
            reportes_antiguos = db.query(ReporteCiudadano).filter(
                ReporteCiudadano.fecha_creacion < fecha_limite
            ).count()
            print(f"\n📅 Reportes más antiguos de {days} días: {reportes_antiguos}")
        
        # Ver estados disponibles
        estados = db.query(ReporteCiudadano.estado).distinct().all()
        print(f"\n🏷️ Estados disponibles: {[estado[0] for estado in estados]}")
        
        # Probar filtro por estado
        for estado in ['completado', 'resuelto', 'cancelado']:
            count = db.query(ReporteCiudadano).filter(
                ReporteCiudadano.estado == estado
            ).count()
            print(f"  - {estado}: {count}")
        
        # Simular la lógica del endpoint
        print("\n🧪 Simulando endpoint /admin/database/limpiar-preview:")
        
        # Con días = 30 y estado = todos
        fecha_limite = datetime.now() - timedelta(days=30)
        query = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.fecha_creacion < fecha_limite
        )
        total_a_eliminar = query.count()
        print(f"  - Días: 30, Estado: todos → {total_a_eliminar} reportes")
        
        # Con días = 30 y estado = completado
        query_completado = query.filter(ReporteCiudadano.estado == 'completado')
        total_completado = query_completado.count()
        print(f"  - Días: 30, Estado: completado → {total_completado} reportes")
        
        # Con días = 60 y estado = todos
        fecha_limite_60 = datetime.now() - timedelta(days=60)
        query_60 = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.fecha_creacion < fecha_limite_60
        )
        total_60 = query_60.count()
        print(f"  - Días: 60, Estado: todos → {total_60} reportes")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_reportes_preview()
