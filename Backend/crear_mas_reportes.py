#!/usr/bin/env python3
"""
Script para crear más datos de prueba para reportes ciudadanos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import ReporteCiudadano, Usuario
from datetime import datetime
import random

def crear_mas_reportes():
    db = SessionLocal()
    
    try:
        # Obtener algunos usuarios para asignar como ciudadanos
        usuarios = db.query(Usuario).limit(5).all()
        if not usuarios:
            print("No hay usuarios en la base de datos. Creando reportes con usuario_id = 1")
            ciudadanos_ids = [1]
        else:
            ciudadanos_ids = [u.id for u in usuarios]
        
        # Datos adicionales de prueba
        reportes_adicionales = [
            {
                "titulo": "Alcantarilla sin tapa",
                "descripcion": "Hay una alcantarilla sin tapa en la calle principal, es muy peligroso",
                "tipo": "drenaje",
                "latitud": 19.4334,
                "longitud": -99.1340,
                "direccion": "Calle Principal 100",
                "prioridad": "urgente",
                "estado": "pendiente"
            },
            {
                "titulo": "Árbol caído en parque",
                "descripcion": "Un árbol se cayó en el parque y está bloqueando el paso",
                "tipo": "parques",
                "latitud": 19.4335,
                "longitud": -99.1341,
                "direccion": "Parque Central",
                "prioridad": "alta",
                "estado": "en_progreso"
            },
            {
                "titulo": "Contenedor de basura roto",
                "descripcion": "El contenedor de basura está roto y la basura se está esparciendo",
                "tipo": "basura",
                "latitud": 19.4336,
                "longitud": -99.1342,
                "direccion": "Calle de la Basura 200",
                "prioridad": "normal",
                "estado": "resuelto"
            },
            {
                "titulo": "Fuga de gas",
                "descripcion": "Se detectó olor a gas en la calle, puede ser peligroso",
                "tipo": "seguridad",
                "latitud": 19.4337,
                "longitud": -99.1343,
                "direccion": "Calle del Gas 300",
                "prioridad": "urgente",
                "estado": "en_progreso"
            },
            {
                "titulo": "Pavimento dañado",
                "descripcion": "El pavimento está muy dañado y es difícil transitar",
                "tipo": "baches",
                "latitud": 19.4338,
                "longitud": -99.1344,
                "direccion": "Avenida del Pavimento 400",
                "prioridad": "alta",
                "estado": "pendiente"
            }
        ]
        
        # Crear los reportes adicionales
        for i, reporte_data in enumerate(reportes_adicionales):
            reporte = ReporteCiudadano(
                titulo=reporte_data["titulo"],
                descripcion=reporte_data["descripcion"],
                tipo=reporte_data["tipo"],
                latitud=reporte_data["latitud"],
                longitud=reporte_data["longitud"],
                direccion=reporte_data["direccion"],
                prioridad=reporte_data["prioridad"],
                estado=reporte_data["estado"],
                ciudadano_id=random.choice(ciudadanos_ids),
                fecha_creacion=datetime.now(),
                fecha_actualizacion=datetime.now(),
                activo=True
            )
            
            # Agregar fecha de resolución si está resuelto
            if reporte_data["estado"] == "resuelto":
                reporte.fecha_resolucion = datetime.now()
            
            # Agregar observaciones administrativas para algunos reportes
            if reporte_data["estado"] in ["en_progreso", "resuelto"]:
                reporte.observaciones_admin = "Reporte en proceso de atención por el departamento correspondiente."
            
            db.add(reporte)
        
        db.commit()
        print(f"✅ Se crearon {len(reportes_adicionales)} reportes adicionales exitosamente.")
        
        # Mostrar total de reportes
        total_reportes = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes en la base de datos: {total_reportes}")
        
    except Exception as e:
        print(f"❌ Error al crear reportes adicionales: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creando reportes adicionales...")
    crear_mas_reportes()
    print("✅ Proceso completado.") 