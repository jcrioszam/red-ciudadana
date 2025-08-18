#!/usr/bin/env python3
"""
Script para crear datos de prueba para reportes ciudadanos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import ReporteCiudadano, Usuario
from datetime import datetime
import random

def crear_reportes_prueba():
    db = SessionLocal()
    
    try:
        # Verificar si ya existen reportes
        reportes_existentes = db.query(ReporteCiudadano).count()
        if reportes_existentes > 0:
            print(f"Ya existen {reportes_existentes} reportes en la base de datos.")
            return
        
        # Obtener algunos usuarios para asignar como ciudadanos
        usuarios = db.query(Usuario).limit(5).all()
        if not usuarios:
            print("No hay usuarios en la base de datos. Creando reportes con usuario_id = 1")
            ciudadanos_ids = [1]
        else:
            ciudadanos_ids = [u.id for u in usuarios]
        
        # Datos de prueba
        reportes_prueba = [
            {
                "titulo": "Bache en Avenida Principal",
                "descripcion": "Hay un bache grande en la Avenida Principal cerca del semáforo, es peligroso para los vehículos",
                "tipo": "baches",
                "latitud": 19.4326,
                "longitud": -99.1332,
                "direccion": "Avenida Principal 123",
                "prioridad": "alta",
                "estado": "pendiente"
            },
            {
                "titulo": "Lámpara de alumbrado público rota",
                "descripcion": "La lámpara de alumbrado público en la esquina de la calle está rota desde hace 3 días",
                "tipo": "iluminacion",
                "latitud": 19.4327,
                "longitud": -99.1333,
                "direccion": "Calle Secundaria 456",
                "prioridad": "normal",
                "estado": "en_progreso"
            },
            {
                "titulo": "Fuga de agua en la calle",
                "descripcion": "Hay una fuga de agua en la calle que está causando charcos y desperdicio de agua",
                "tipo": "agua",
                "latitud": 19.4328,
                "longitud": -99.1334,
                "direccion": "Calle del Agua 789",
                "prioridad": "urgente",
                "estado": "resuelto"
            },
            {
                "titulo": "Basura acumulada en parque",
                "descripcion": "Hay basura acumulada en el parque central que no se ha recogido en varios días",
                "tipo": "basura",
                "latitud": 19.4329,
                "longitud": -99.1335,
                "direccion": "Parque Central",
                "prioridad": "normal",
                "estado": "pendiente"
            },
            {
                "titulo": "Semáforo no funciona",
                "descripcion": "El semáforo en la intersección principal no está funcionando correctamente",
                "tipo": "semaforos",
                "latitud": 19.4330,
                "longitud": -99.1336,
                "direccion": "Intersección Principal",
                "prioridad": "urgente",
                "estado": "en_progreso"
            },
            {
                "titulo": "Drenaje tapado",
                "descripcion": "El drenaje en la calle está tapado y se está inundando cuando llueve",
                "tipo": "drenaje",
                "latitud": 19.4331,
                "longitud": -99.1337,
                "direccion": "Calle del Drenaje 321",
                "prioridad": "alta",
                "estado": "pendiente"
            },
            {
                "titulo": "Área de juegos dañada",
                "descripcion": "Los juegos del parque están dañados y son peligrosos para los niños",
                "tipo": "parques",
                "latitud": 19.4332,
                "longitud": -99.1338,
                "direccion": "Parque Infantil",
                "prioridad": "alta",
                "estado": "resuelto"
            },
            {
                "titulo": "Poste de luz inclinado",
                "descripcion": "Hay un poste de luz que está muy inclinado y parece que se puede caer",
                "tipo": "iluminacion",
                "latitud": 19.4333,
                "longitud": -99.1339,
                "direccion": "Calle de la Luz 654",
                "prioridad": "urgente",
                "estado": "en_progreso"
            }
        ]
        
        # Crear los reportes
        for i, reporte_data in enumerate(reportes_prueba):
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
        print(f"✅ Se crearon {len(reportes_prueba)} reportes de prueba exitosamente.")
        
    except Exception as e:
        print(f"❌ Error al crear reportes de prueba: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creando reportes de prueba...")
    crear_reportes_prueba()
    print("✅ Proceso completado.") 