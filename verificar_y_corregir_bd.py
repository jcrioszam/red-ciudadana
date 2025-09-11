#!/usr/bin/env python3
"""
Script para verificar y corregir la base de datos directamente
"""

import psycopg2
import pandas as pd
import getpass
import os

def conectar_bd():
    """Conectar directamente a la base de datos"""
    try:
        # Cadena de conexión completa de Railway
        connection_string = "postgresql://postgres:pPwQxyyfQQYTOWDvKZzNJrYglHjvQiJe@red-ciudadana-production.up.railway.app:5432/railway"
        
        conn = psycopg2.connect(connection_string)
        print("✅ Conectado directamente a la base de datos")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la BD: {e}")
        return None

def verificar_tabla_padron(conn):
    """Verificar la tabla padron_electoral"""
    try:
        cursor = conn.cursor()
        
        # Verificar si la tabla existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'padron_electoral'
            );
        """)
        tabla_existe = cursor.fetchone()[0]
        
        if not tabla_existe:
            print("❌ La tabla 'padron_electoral' no existe")
            return False
        
        print("✅ La tabla 'padron_electoral' existe")
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        total_registros = cursor.fetchone()[0]
        print(f"📊 Total de registros en la tabla: {total_registros:,}")
        
        # Ver algunos registros de muestra
        cursor.execute("SELECT * FROM padron_electoral LIMIT 5")
        registros = cursor.fetchall()
        
        print(f"\n🔍 Primeros 5 registros:")
        for i, registro in enumerate(registros, 1):
            print(f"   {i}. ID: {registro[0]}, Elector: {registro[2]}, Nombre: {registro[6]}")
        
        # Verificar estructura de la tabla
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'padron_electoral'
            ORDER BY ordinal_position;
        """)
        columnas = cursor.fetchall()
        
        print(f"\n📋 Estructura de la tabla:")
        for columna in columnas:
            print(f"   {columna[0]}: {columna[1]}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verificando tabla: {e}")
        return False

def insertar_registro_prueba(conn):
    """Insertar un registro de prueba directamente"""
    try:
        cursor = conn.cursor()
        
        # Insertar registro de prueba
        cursor.execute("""
            INSERT INTO padron_electoral (
                consecutivo, elector, ape_pat, ape_mat, nombre,
                sexo, entidad, municipio, seccion, activo
            ) VALUES (
                999999, 'TEST999', 'Prueba', 'Directa', 'Inserción',
                'M', 'Test', 'Test', '999', true
            )
        """)
        
        conn.commit()
        print("✅ Registro de prueba insertado directamente")
        
        # Verificar que se insertó
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        total = cursor.fetchone()[0]
        print(f"📊 Total de registros después de inserción: {total}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Error insertando registro: {e}")
        conn.rollback()
        return False

def main():
    print("🔍 VERIFICACIÓN Y CORRECCIÓN DE LA BASE DE DATOS")
    print("=" * 60)
    
    # Conectar a la base de datos
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        # Verificar tabla
        if verificar_tabla_padron(conn):
            print("\n✅ La tabla está funcionando correctamente")
        else:
            print("\n❌ Hay problemas con la tabla")
            return
        
        # Insertar registro de prueba
        print(f"\n🧪 Insertando registro de prueba...")
        if insertar_registro_prueba(conn):
            print("✅ Inserción directa funcionó")
        else:
            print("❌ Inserción directa falló")
    
    finally:
        conn.close()
        print("\n🔌 Conexión cerrada")

if __name__ == "__main__":
    main()
