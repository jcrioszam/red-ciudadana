#!/usr/bin/env python3
"""
Script para crear la tabla noticias en la base de datos
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.models_noticias import Base, Noticia
from app.database import SQLALCHEMY_DATABASE_URL

def crear_tabla_noticias():
    """Crear la tabla noticias en la base de datos"""
    try:
        print("🚀 Creando tabla noticias...")
        
        # Crear engine
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Crear la tabla
        Base.metadata.create_all(bind=engine, tables=[Noticia.__table__])
        
        print("✅ Tabla noticias creada exitosamente!")
        
        # Verificar que la tabla existe
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='noticias'"))
            if result.fetchone():
                print("✅ Verificación: Tabla noticias existe en la base de datos")
            else:
                print("❌ Error: Tabla noticias no se creó correctamente")
                
    except Exception as e:
        print(f"❌ Error al crear tabla noticias: {e}")

if __name__ == "__main__":
    crear_tabla_noticias()
