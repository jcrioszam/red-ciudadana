#!/usr/bin/env python3
"""
Script para verificar el estado de la base de datos y crear datos iniciales si es necesario
"""

import sys
import os
from sqlalchemy import text

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal, engine
from app.models import Usuario as UsuarioModel, Persona as PersonaModel, Evento as EventoModel

def verificar_estado_bd():
    """Verificar el estado actual de la base de datos"""
    print("🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Verificar conexión
        db.execute(text("SELECT 1"))
        print("✅ Conexión a la base de datos: OK")
        
        # Verificar tablas principales
        tablas = ['usuarios', 'personas', 'eventos', 'asistencias']
        for tabla in tablas:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {tabla}"))
                count = result.scalar()
                print(f"📊 Tabla {tabla}: {count} registros")
            except Exception as e:
                print(f"❌ Error en tabla {tabla}: {e}")
        
        # Verificar usuarios específicos
        print("\n👥 USUARIOS EN EL SISTEMA:")
        usuarios = db.query(UsuarioModel).all()
        if usuarios:
            for usuario in usuarios:
                print(f"  - {usuario.nombre} ({usuario.email}) - Rol: {usuario.rol}")
        else:
            print("  ❌ No hay usuarios en el sistema")
        
        # Verificar personas
        print("\n👤 PERSONAS REGISTRADAS:")
        personas = db.query(PersonaModel).all()
        if personas:
            print(f"  Total: {len(personas)} personas")
            for persona in personas[:5]:  # Mostrar solo las primeras 5
                print(f"  - {persona.nombre} ({persona.telefono})")
            if len(personas) > 5:
                print(f"  ... y {len(personas) - 5} más")
        else:
            print("  ❌ No hay personas registradas")
        
        # Verificar eventos
        print("\n📅 EVENTOS EN EL SISTEMA:")
        eventos = db.query(EventoModel).all()
        if eventos:
            print(f"  Total: {len(eventos)} eventos")
            for evento in eventos[:3]:  # Mostrar solo los primeros 3
                print(f"  - {evento.nombre} ({evento.fecha})")
            if len(eventos) > 3:
                print(f"  ... y {len(eventos) - 3} más")
        else:
            print("  ❌ No hay eventos en el sistema")
            
    except Exception as e:
        print(f"❌ Error al verificar la base de datos: {e}")
    finally:
        db.close()

def crear_datos_iniciales():
    """Crear datos iniciales si la base de datos está vacía"""
    print("\n🚀 CREANDO DATOS INICIALES")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Verificar si ya hay usuarios
        usuarios_existentes = db.query(UsuarioModel).count()
        if usuarios_existentes > 0:
            print("✅ Ya existen usuarios en el sistema, saltando creación de datos iniciales")
            return
        
        print("🔧 Creando usuarios iniciales...")
        
        # Importar la función de creación de usuarios
        from app.main import create_initial_users
        create_initial_users()
        
        print("✅ Datos iniciales creados exitosamente")
        
    except Exception as e:
        print(f"❌ Error al crear datos iniciales: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verificar_estado_bd()
    
    # Preguntar si crear datos iniciales
    respuesta = input("\n¿Desea crear datos iniciales si la base de datos está vacía? (s/n): ")
    if respuesta.lower() == 's':
        crear_datos_iniciales()
        print("\n🔍 Verificando estado después de crear datos iniciales...")
        verificar_estado_bd()
