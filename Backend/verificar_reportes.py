#!/usr/bin/env python3
"""
Script para verificar específicamente la tabla de reportes ciudadanos
"""

import sys
import os
from sqlalchemy import text

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal, engine
from app.models import ReporteCiudadano as ReporteCiudadanoModel

def verificar_tabla_reportes():
    """Verificar si existe la tabla de reportes ciudadanos"""
    print("🔍 VERIFICANDO TABLA DE REPORTES CIUDADANOS")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Verificar si la tabla existe
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'reportes_ciudadanos'
            );
        """))
        
        tabla_existe = result.scalar()
        print(f"📊 Tabla reportes_ciudadanos existe: {tabla_existe}")
        
        if tabla_existe:
            # Contar registros
            result = db.execute(text("SELECT COUNT(*) FROM reportes_ciudadanos"))
            count = result.scalar()
            print(f"📊 Total de reportes: {count}")
            
            # Mostrar algunos reportes
            if count > 0:
                result = db.execute(text("SELECT id, titulo, tipo, estado, fecha_creacion FROM reportes_ciudadanos ORDER BY fecha_creacion DESC LIMIT 5"))
                reportes = result.fetchall()
                print("\n📋 ÚLTIMOS 5 REPORTES:")
                for reporte in reportes:
                    print(f"  - ID: {reporte[0]}, Título: {reporte[1]}, Tipo: {reporte[2]}, Estado: {reporte[3]}, Fecha: {reporte[4]}")
            else:
                print("❌ No hay reportes en la tabla")
        else:
            print("❌ La tabla reportes_ciudadanos NO existe")
            
            # Intentar crear la tabla
            print("\n🔧 Intentando crear la tabla...")
            try:
                from app.models import Base
                Base.metadata.create_all(bind=engine)
                print("✅ Tabla creada exitosamente")
            except Exception as e:
                print(f"❌ Error al crear tabla: {e}")
        
    except Exception as e:
        print(f"❌ Error al verificar tabla: {e}")
    finally:
        db.close()

def crear_reporte_prueba():
    """Crear un reporte de prueba"""
    print("\n🧪 CREANDO REPORTE DE PRUEBA")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        from datetime import datetime
        
        reporte_data = {
            "titulo": "Reporte de Prueba",
            "descripcion": "Este es un reporte de prueba para verificar que la funcionalidad funciona",
            "tipo": "bache",
            "latitud": 27.0706,
            "longitud": -109.4437,
            "direccion": "Calle de prueba, Navojoa, Sonora",
            "prioridad": "normal",
            "es_publico": True,
            "estado": "pendiente",
            "fecha_creacion": datetime.now(),
            "activo": True,
            "ciudadano_id": None,
            "administrador_id": None,
            "observaciones_admin": None,
            "contacto_email": None
        }
        
        print("📋 Datos del reporte:", reporte_data)
        
        # Crear el reporte
        db_reporte = ReporteCiudadanoModel(**reporte_data)
        db.add(db_reporte)
        db.commit()
        db.refresh(db_reporte)
        
        print(f"✅ Reporte creado exitosamente con ID: {db_reporte.id}")
        
    except Exception as e:
        print(f"❌ Error al crear reporte: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verificar_tabla_reportes()
    
    respuesta = input("\n¿Desea crear un reporte de prueba? (s/n): ")
    if respuesta.lower() == 's':
        crear_reporte_prueba()
        print("\n🔍 Verificando después de crear reporte...")
        verificar_tabla_reportes()
