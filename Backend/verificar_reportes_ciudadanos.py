#!/usr/bin/env python3
"""
Script para verificar reportes ciudadanos en la base de datos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano, Usuario

def verificar_reportes_ciudadanos():
    print("🔍 Verificando reportes ciudadanos en la base de datos...")
    
    db = SessionLocal()
    try:
        # Contar todos los reportes
        total_reportes = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes ciudadanos: {total_reportes}")
        
        if total_reportes == 0:
            print("❌ No hay reportes ciudadanos en la base de datos")
            print("💡 Necesitamos crear algunos reportes de prueba")
            return
        
        # Obtener todos los reportes
        reportes = db.query(ReporteCiudadano).all()
        
        print(f"\n📋 Lista de reportes ciudadanos:")
        for i, reporte in enumerate(reportes, 1):
            print(f"{i}. ID: {reporte.id}")
            print(f"   Título: {reporte.titulo}")
            print(f"   Descripción: {reporte.descripcion}")
            print(f"   Estado: {reporte.estado}")
            print(f"   Prioridad: {reporte.prioridad}")
            print(f"   Ciudadano ID: {reporte.ciudadano_id}")
            print(f"   Fecha creación: {reporte.fecha_creacion}")
            print(f"   Foto URL: {reporte.foto_url}")
            print()
        
        # Verificar usuarios ciudadanos
        usuarios_ciudadanos = db.query(Usuario).filter(Usuario.rol == 'ciudadano').all()
        print(f"👥 Usuarios con rol 'ciudadano': {len(usuarios_ciudadanos)}")
        
        for usuario in usuarios_ciudadanos:
            print(f"   - ID: {usuario.id}, Nombre: {usuario.nombre}, Email: {usuario.email}")
        
    except Exception as e:
        print(f"❌ Error consultando la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verificar_reportes_ciudadanos() 