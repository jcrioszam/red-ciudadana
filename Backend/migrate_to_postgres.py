"""
Script para migrar datos de SQLite a PostgreSQL en Render
"""
import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import *
from app.database import Base
import json

def migrate_sqlite_to_postgres():
    """Migra datos de SQLite local a PostgreSQL en Render"""
    
    # Conexión a SQLite local
    sqlite_conn = sqlite3.connect('red_ciudadana.db')
    sqlite_conn.row_factory = sqlite3.Row
    
    # Conexión a PostgreSQL (usar variable de entorno de Render)
    postgres_url = os.getenv("DATABASE_URL")
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
    
    postgres_engine = create_engine(postgres_url)
    
    # Crear todas las tablas en PostgreSQL
    Base.metadata.create_all(bind=postgres_engine)
    
    # Tablas a migrar en orden por dependencias
    tables_order = [
        'usuarios',
        'configuracion_perfiles', 
        'personas',
        'eventos',
        'asistencias',
        'vehiculos',
        'asignaciones_movilizacion',
        'noticias',
        'comentarios',
        'reportes_ciudadanos',
        'ubicacion_tiempo_real'
    ]
    
    postgres_conn = psycopg2.connect(postgres_url)
    postgres_cursor = postgres_conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        for table in tables_order:
            print(f"Migrando tabla: {table}")
            
            # Leer datos de SQLite
            sqlite_cursor = sqlite_conn.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print(f"  No hay datos en {table}")
                continue
                
            # Obtener nombres de columnas
            columns = [description[0] for description in sqlite_cursor.description]
            
            # Insertar en PostgreSQL
            for row in rows:
                placeholders = ', '.join(['%s'] * len(columns))
                columns_str = ', '.join(columns)
                
                insert_query = f"""
                    INSERT INTO {table} ({columns_str}) 
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """
                
                postgres_cursor.execute(insert_query, tuple(row))
            
            postgres_conn.commit()
            print(f"  ✓ Migrados {len(rows)} registros")
            
    except Exception as e:
        print(f"Error en migración: {e}")
        postgres_conn.rollback()
    finally:
        sqlite_conn.close()
        postgres_conn.close()

if __name__ == "__main__":
    migrate_sqlite_to_postgres()
