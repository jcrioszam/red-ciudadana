#!/usr/bin/env python3
"""
Script para importar datos del padrón electoral directamente en Railway
Este script se ejecuta dentro del contenedor de Railway
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
from datetime import datetime
import sys

def conectar_bd():
    """Conectar a la base de datos usando DATABASE_URL de Railway"""
    try:
        # Usar DATABASE_URL de Railway
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL no encontrada")
            return None
        
        conn = psycopg2.connect(database_url)
        print("✅ Conectado a la base de datos")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la BD: {e}")
        return None

def mapear_datos_excel(df):
    """Mapear datos del Excel a la estructura de la tabla PadronElectoral"""
    datos_mapeados = []
    
    for index, row in df.iterrows():
        # Mapear campos del Excel a la estructura de la BD
        registro = {
            'consecutivo': int(row.get('CONSECUTIV', 0)) if pd.notna(row.get('CONSECUTIV')) else 0,
            'elector': str(row.get('ELECTOR', '')).strip(),
            'fol_nac': str(row.get('FOL_NAC', '')).strip() if pd.notna(row.get('FOL_NAC')) else None,
            'ocr': str(row.get('OCR', '')).strip() if pd.notna(row.get('OCR')) else None,
            'ape_pat': str(row.get('APE_PAT', '')).strip(),
            'ape_mat': str(row.get('APE_MAT', '')).strip(),
            'nombre': str(row.get('NOMBRE', '')).strip(),
            'fnac': row.get('FNAC') if pd.notna(row.get('FNAC')) else None,
            'edad': int(row.get('EDAD', 0)) if pd.notna(row.get('EDAD')) else None,
            'sexo': str(row.get('SEXO', '')).strip(),
            'curp': str(row.get('CURP', '')).strip() if pd.notna(row.get('CURP')) else None,
            'ocupacion': str(row.get('OCUPACION', '')).strip() if pd.notna(row.get('OCUPACION')) else None,
            'calle': str(row.get('CALLE', '')).strip() if pd.notna(row.get('CALLE')) else None,
            'num_ext': str(row.get('NUM_EXT', '')).strip() if pd.notna(row.get('NUM_EXT')) else None,
            'num_int': str(row.get('NUM_INT', '')).strip() if pd.notna(row.get('NUM_INT')) else None,
            'colonia': str(row.get('COLONIA', '')).strip() if pd.notna(row.get('COLONIA')) else None,
            'codpostal': str(row.get('CODPOSTAL', '')).strip() if pd.notna(row.get('CODPOSTAL')) else None,
            'tiempres': str(row.get('TIEMPRES', '')).strip() if pd.notna(row.get('TIEMPRES')) else None,
            'entidad': str(row.get('ENTIDAD', '')).strip() if pd.notna(row.get('ENTIDAD')) else None,
            'distrito': str(row.get('DISTRITO', '')).strip() if pd.notna(row.get('DISTRITO')) else None,
            'municipio': str(row.get('MUNICIPIO', '')).strip() if pd.notna(row.get('MUNICIPIO')) else None,
            'seccion': str(row.get('SECCION', '')).strip() if pd.notna(row.get('SECCION')) else None,
            'localidad': str(row.get('LOCALIDAD', '')).strip() if pd.notna(row.get('LOCALIDAD')) else None,
            'manzana': str(row.get('MANZANA', '')).strip() if pd.notna(row.get('MANZANA')) else None,
            'en_ln': str(row.get('EN_LN', '')).strip() if pd.notna(row.get('EN_LN')) else None,
            'misioncr': str(row.get('EMISIONCRE', '')).strip() if pd.notna(row.get('EMISIONCRE')) else None,
            'fecha_importacion': datetime.now(),
            'activo': True
        }
        
        datos_mapeados.append(registro)
        
        # Mostrar progreso cada 10000 registros
        if (index + 1) % 10000 == 0:
            print(f"📊 Procesados {index + 1} registros...")
    
    return datos_mapeados

def importar_desde_excel(archivo_excel, conn):
    """Importar datos desde archivo Excel"""
    try:
        print(f"📊 Leyendo archivo: {archivo_excel}")
        df = pd.read_excel(archivo_excel)
        print(f"📊 Archivo leído: {len(df)} registros, {len(df.columns)} columnas")
        print(f"🔍 Columnas: {list(df.columns)}")
        
        # Mapear datos
        print("🔄 Mapeando datos...")
        datos_mapeados = mapear_datos_excel(df)
        print(f"✅ Datos mapeados: {len(datos_mapeados)} registros")
        
        # Preparar datos para inserción
        cursor = conn.cursor()
        
        # Verificar si ya existen registros
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        count_antes = cursor.fetchone()[0]
        print(f"📊 Registros existentes antes: {count_antes}")
        
        # Insertar datos en lotes
        batch_size = 1000
        total_insertados = 0
        
        print(f"💾 Insertando datos en lotes de {batch_size}...")
        
        for i in range(0, len(datos_mapeados), batch_size):
            batch = datos_mapeados[i:i + batch_size]
            
            # Preparar datos para execute_values
            valores = []
            for registro in batch:
                valores.append((
                    registro['consecutivo'],
                    registro['elector'],
                    registro['fol_nac'],
                    registro['ocr'],
                    registro['ape_pat'],
                    registro['ape_mat'],
                    registro['nombre'],
                    registro['fnac'],
                    registro['edad'],
                    registro['sexo'],
                    registro['curp'],
                    registro['ocupacion'],
                    registro['calle'],
                    registro['num_ext'],
                    registro['num_int'],
                    registro['colonia'],
                    registro['codpostal'],
                    registro['tiempres'],
                    registro['entidad'],
                    registro['distrito'],
                    registro['municipio'],
                    registro['seccion'],
                    registro['localidad'],
                    registro['manzana'],
                    registro['en_ln'],
                    registro['misioncr'],
                    registro['fecha_importacion'],
                    registro['activo']
                ))
            
            # Insertar lote
            insert_query = """
                INSERT INTO padron_electoral (
                    consecutivo, elector, fol_nac, ocr, ape_pat, ape_mat, nombre,
                    fnac, edad, sexo, curp, ocupacion, calle, num_ext, num_int,
                    colonia, codpostal, tiempres, entidad, distrito, municipio,
                    seccion, localidad, manzana, en_ln, misioncr, fecha_importacion, activo
                ) VALUES %s
            """
            
            execute_values(
                cursor, insert_query, valores,
                template=None, page_size=batch_size
            )
            
            total_insertados += len(batch)
            print(f"✅ Lote {i//batch_size + 1}: {len(batch)} registros insertados")
        
        # Confirmar transacción
        conn.commit()
        
        # Verificar inserción
        cursor.execute("SELECT COUNT(*) FROM padron_electoral")
        count_despues = cursor.fetchone()[0]
        print(f"📊 Registros existentes después: {count_despues}")
        print(f"✅ Total insertados: {count_despues - count_antes}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Error importando: {e}")
        conn.rollback()
        return False

def main():
    """Función principal"""
    print("🚀 IMPORTACIÓN DIRECTA DEL PADRÓN EN RAILWAY")
    print("=" * 60)
    
    # Verificar argumentos
    if len(sys.argv) != 2:
        print("❌ Uso: python importar_padron_directo.py <archivo_excel>")
        print("   Ejemplo: python importar_padron_directo.py /tmp/padron.xlsx")
        return
    
    archivo_excel = sys.argv[1]
    
    if not os.path.exists(archivo_excel):
        print(f"❌ El archivo {archivo_excel} no existe")
        return
    
    # Conectar a la base de datos
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        # Importar datos
        if importar_desde_excel(archivo_excel, conn):
            print("🎉 Importación completada exitosamente")
        else:
            print("❌ Error en la importación")
    
    finally:
        conn.close()
        print("🔌 Conexión cerrada")

if __name__ == "__main__":
    main()
