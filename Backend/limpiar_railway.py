 
#!/usr/bin/env python3
"""
Script para limpiar reportes en Railway
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def limpiar_railway():
    db = SessionLocal()

    try:
        print("🧹 LIMPIANDO BASE DE DATOS EN RAILWAY...")
        
        # Contar reportes antes
        total_antes = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes antes: {total_antes}")
        
        # Eliminar TODOS los reportes
        reportes_eliminados = db.query(ReporteCiudadano).delete()
        
        # Confirmar cambios
        db.commit()
        
        print(f"🗑️ Reportes eliminados: {reportes_eliminados}")
        print("✅ Base de datos limpiada exitosamente en Railway")
        
        # Verificar estado final
        total_despues = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes después: {total_despues}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    limpiar_railway()