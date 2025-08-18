#!/usr/bin/env python3
"""
Script para limpiar todos los reportes ciudadanos de la base de datos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def limpiar_reportes():
    db = SessionLocal()
    
    try:
        # Contar reportes antes de eliminar
        total_reportes = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes antes de limpiar: {total_reportes}")
        
        if total_reportes == 0:
            print("✅ No hay reportes para eliminar.")
            return
        
        # Mostrar reportes que se van a eliminar
        reportes = db.query(ReporteCiudadano).all()
        print("\n🗑️ Reportes que se eliminarán:")
        for reporte in reportes:
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    Estado: {reporte.estado}")
            print(f"    Tipo: {reporte.tipo}")
            print(f"    Ciudadano: {reporte.ciudadano_nombre if hasattr(reporte, 'ciudadano_nombre') else 'N/A'}")
            print()
        
        # Confirmar eliminación
        confirmacion = input("¿Estás seguro de que quieres eliminar TODOS los reportes? (sí/no): ")
        
        if confirmacion.lower() in ['sí', 'si', 's', 'yes', 'y']:
            # Eliminar todos los reportes
            db.query(ReporteCiudadano).delete()
            db.commit()
            
            print("✅ Todos los reportes han sido eliminados exitosamente.")
            
            # Verificar que se eliminaron
            total_despues = db.query(ReporteCiudadano).count()
            print(f"📊 Total de reportes después de limpiar: {total_despues}")
            
        else:
            print("❌ Operación cancelada. No se eliminaron reportes.")
            
    except Exception as e:
        print(f"❌ Error al limpiar reportes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Limpiando todos los reportes ciudadanos...")
    limpiar_reportes()
    print("✅ Proceso completado.") 