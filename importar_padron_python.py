#!/usr/bin/env python3
"""
Script para importar datos del padrón electoral directamente a PostgreSQL
Ejecutar: python importar_padron_python.py
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
from datetime import datetime
import sys

# Configuración de la base de datos (Railway)
# Obtener password desde variable de entorno o pedir al usuario
import getpass

def obtener_config_bd():
    """Obtener configuración de la base de datos"""
    password = os.getenv('PGPASSWORD')
    if not password:
        password = getpass.getpass("🔑 Ingresa la contraseña de Railway: ")
    
    return {
        'host': 'red-ciudadana-production.up.railway.app',
        'port': 5432,
        'database': 'railway',
        'user': 'postgres',
        'password': password
    }

def conectar_bd():
    """Conectar a la base de datos PostgreSQL"""
    try:
        config = obtener_config_bd()
        conn = psycopg2.connect(**config)
        print("✅ Conectado a la base de datos")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la BD: {e}")
        return None

def importar_desde_excel(archivo_excel, conn):
    """Importar datos desde archivo Excel"""
    try:
        # Leer archivo Excel
        df = pd.read_excel(archivo_excel)
        print(f"📊 Archivo leído: {len(df)} registros, {len(df.columns)} columnas")
        print(f"🔍 Columnas: {list(df.columns)}")
        
        # Mapeo de columnas (ajusta según tu archivo)
        column_mapping = {
            'CONSECUTIV': 'consecutivo',
            'ELECTOR': 'elector', 
            'FOL_NAC': 'fol_nac',
            'OCR': 'ocr',
            'APE_PAT': 'ape_pat',
            'APE_MAT': 'ape_mat',
            'NOMBRE': 'nombre',
            'FNAC': 'fnac',
            'EDAD': 'edad',
            'SEXO': 'sexo',
            'CURP': 'curp',
            'OCUPACION': 'ocupacion',
            'CALLE': 'calle',
            'NUM_EXT': 'num_ext',
            'NUM_INT': 'num_int',
            'COLONIA': 'colonia',
            'CODPOSTAL': 'codpostal',
            'TIEMPRES': 'tiempres',
            'ENTIDAD': 'entidad',
            'DISTRITO': 'distrito',
            'MUNICIPIO': 'municipio',
            'SECCION': 'seccion',
            'LOCALIDAD': 'localidad',
            'MANZANA': 'manzana',
            'EN_LN': 'en_ln',
            'MISIONCR': 'misioncr'
        }
        
        # Procesar datos
        datos_procesados = []
        for index, row in df.iterrows():
            registro = {}
            for col_excel, col_bd in column_mapping.items():
                if col_excel in df.columns:
                    valor = str(row[col_excel]) if pd.notna(row[col_excel]) else ''
                    registro[col_bd] = valor[:100]  # Limitar a 100 caracteres
                else:
                    registro[col_bd] = ''
            
            # Asegurar campos obligatorios
            registro['consecutivo'] = registro.get('consecutivo', str(index + 1))
            registro['elector'] = registro.get('elector', f'ELECTOR_{index + 1}')
            registro['ape_pat'] = registro.get('ape_pat', 'SIN_APELLIDO')
            registro['ape_mat'] = registro.get('ape_mat', 'SIN_APELLIDO')
            registro['nombre'] = registro.get('nombre', 'SIN_NOMBRE')
            
            datos_procesados.append(registro)
        
        print(f"✅ Datos procesados: {len(datos_procesados)} registros")
        return datos_procesados
        
    except Exception as e:
        print(f"❌ Error procesando Excel: {e}")
        return []

def insertar_datos(datos, conn):
    """Insertar datos en la base de datos"""
    try:
        cursor = conn.cursor()
        
        # Preparar datos para inserción
        valores = []
        for registro in datos:
            valores.append((
                int(registro.get('consecutivo', 0)),
                registro.get('elector', ''),
                registro.get('fol_nac', ''),
                registro.get('ocr', ''),
                registro.get('ape_pat', ''),
                registro.get('ape_mat', ''),
                registro.get('nombre', ''),
                registro.get('fnac') if registro.get('fnac') else None,
                int(registro.get('edad', 0)) if registro.get('edad') else None,
                registro.get('sexo', ''),
                registro.get('curp', ''),
                registro.get('ocupacion', ''),
                registro.get('calle', ''),
                registro.get('num_ext', ''),
                registro.get('num_int', ''),
                registro.get('colonia', ''),
                registro.get('codpostal', ''),
                registro.get('tiempres', ''),
                registro.get('entidad', ''),
                registro.get('distrito', ''),
                registro.get('municipio', ''),
                registro.get('seccion', ''),
                registro.get('localidad', ''),
                registro.get('manzana', ''),
                registro.get('en_ln', ''),
                registro.get('misioncr', ''),
                datetime.now(),  # fecha_importacion
                True  # activo
            ))
        
        # Insertar en lotes
        insert_query = """
        INSERT INTO padron_electoral (
            consecutivo, elector, fol_nac, ocr, ape_pat, ape_mat, nombre,
            fnac, edad, sexo, curp, ocupacion, calle, num_ext, num_int,
            colonia, codpostal, tiempres, entidad, distrito, municipio,
            seccion, localidad, manzana, en_ln, misioncr, fecha_importacion, activo
        ) VALUES %s
        """
        
        execute_values(cursor, insert_query, valores)
        conn.commit()
        
        print(f"✅ Datos insertados: {len(valores)} registros")
        return True
        
    except Exception as e:
        print(f"❌ Error insertando datos: {e}")
        conn.rollback()
        return False

def verificar_importacion(conn):
    """Verificar que los datos se importaron correctamente"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        total = cursor.fetchone()[0]
        print(f"📊 Total de registros en la BD: {total}")
        
        cursor.execute("SELECT * FROM padron_electoral ORDER BY id DESC LIMIT 5")
        registros = cursor.fetchall()
        print("🔍 Últimos 5 registros:")
        for reg in registros:
            print(f"  ID: {reg[0]}, Elector: {reg[2]}, Nombre: {reg[6]} {reg[5]} {reg[4]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando datos: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando importación del padrón electoral")
    
    # Verificar que existe el archivo
    archivo_excel = input("📁 Ingresa la ruta del archivo Excel: ").strip()
    if not os.path.exists(archivo_excel):
        print(f"❌ Archivo no encontrado: {archivo_excel}")
        return
    
    # Conectar a la BD
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        # Importar datos
        datos = importar_desde_excel(archivo_excel, conn)
        if not datos:
            print("❌ No se pudieron procesar los datos")
            return
        
        # Insertar en BD
        if insertar_datos(datos, conn):
            print("✅ Importación completada exitosamente")
            verificar_importacion(conn)
        else:
            print("❌ Error en la importación")
            
    finally:
        conn.close()
        print("🔌 Conexión cerrada")

if __name__ == "__main__":
    main()
