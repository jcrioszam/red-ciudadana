#!/usr/bin/env python3
"""
Script para crear reportes de prueba con diferentes fechas y estados
para probar la funcionalidad de limpieza de base de datos
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, ReporteCiudadano, Usuario, Persona
from app.database import get_db

def crear_reportes_prueba():
    """Crear reportes de prueba con diferentes fechas y estados"""
    db = SessionLocal()
    
    try:
        print("🔧 Creando reportes de prueba...")
        
        # Verificar si ya existen reportes
        total_existente = db.query(ReporteCiudadano).count()
        if total_existente > 0:
            print(f"⚠️ Ya existen {total_existente} reportes en la base de datos")
            return
        
        # Crear reportes con diferentes fechas y estados
        estados = ['pendiente', 'en_proceso', 'completado', 'resuelto', 'cancelado']
        tipos = ['bache', 'alumbrado', 'basura', 'seguridad', 'transporte']
        titulos = [
            "Bache en la calle principal",
            "Lámpara rota en el parque",
            "Basura acumulada en esquina",
            "Problema de seguridad nocturna",
            "Parada de bus sin techo",
            "Semáforo no funciona",
            "Pozo de agua en la calle",
            "Árbol caído en acera",
            "Grafiti en pared pública",
            "Escaleras rotas en plaza"
        ]
        
        # Crear reportes con fechas de hace 1 a 120 días atrás
        for i in range(20):
            # Fecha aleatoria entre 1 y 120 días atrás
            dias_atras = random.randint(1, 120)
            fecha_creacion = datetime.now() - timedelta(days=dias_atras)
            
            # Estado aleatorio
            estado = random.choice(estados)
            
            # Tipo aleatorio
            tipo = random.choice(tipos)
            
            # Título aleatorio
            titulo = random.choice(titulos) + f" #{i+1}"
            
            # Crear reporte
            reporte = ReporteCiudadano(
                titulo=titulo,
                descripcion=f"Descripción del reporte {i+1} - {estado}",
                tipo=tipo,
                estado=estado,
                fecha_creacion=fecha_creacion,
                fecha_actualizacion=fecha_creacion,
                ubicacion="Ubicación de prueba",
                latitud=random.uniform(19.0, 19.5),
                longitud=random.uniform(-99.0, -98.5),
                prioridad=random.choice(['baja', 'media', 'alta']),
                id_usuario=1,  # Asumiendo que existe un usuario con ID 1
                id_persona=1   # Asumiendo que existe una persona con ID 1
            )
            
            db.add(reporte)
            print(f"✅ Reporte {i+1}: {titulo} - {estado} - {fecha_creacion.strftime('%Y-%m-%d')}")
        
        # Commit de los cambios
        db.commit()
        print(f"\n🎉 Se crearon 20 reportes de prueba exitosamente!")
        
        # Verificar la creación
        total_final = db.query(ReporteCiudadano).count()
        print(f"📊 Total de reportes en BD: {total_final}")
        
        # Mostrar algunos ejemplos
        print("\n📋 Ejemplos de reportes creados:")
        reportes_ejemplo = db.query(ReporteCiudadano).limit(5).all()
        for reporte in reportes_ejemplo:
            print(f"  - ID: {reporte.id}, Título: {reporte.titulo}")
            print(f"    Estado: {reporte.estado}, Fecha: {reporte.fecha_creacion.strftime('%Y-%m-%d')}")
            print(f"    Tipo: {reporte.tipo}")
            print()
        
    except Exception as e:
        print(f"❌ Error creando reportes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    crear_reportes_prueba() 