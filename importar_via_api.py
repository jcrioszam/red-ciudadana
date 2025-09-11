#!/usr/bin/env python3
"""
Script para importar datos del padrón usando la API de Railway
"""

import requests
import pandas as pd
import json
import time
import os

# Configuración de la API
API_BASE = "https://red-ciudadana-production.up.railway.app"
LOGIN_URL = f"{API_BASE}/login"
IMPORT_URL = f"{API_BASE}/api/padron/importar-datos-masivos"
CONFIRM_URL = f"{API_BASE}/api/padron/confirmar-importacion"

def login():
    """Iniciar sesión en la API"""
    print("🔐 Iniciando sesión...")
    
    login_data = {
        "identificador": "admin@redciudadana.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login exitoso")
            return token
        else:
            print(f"❌ Error en login: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error conectando: {e}")
        return None

def procesar_archivo_excel(archivo_excel, token):
    """Procesar archivo Excel y enviar datos a la API"""
    print(f"📊 Procesando archivo: {archivo_excel}")
    
    try:
        # Leer archivo Excel
        df = pd.read_excel(archivo_excel)
        print(f"📊 Archivo leído: {len(df)} registros, {len(df.columns)} columnas")
        print(f"🔍 Columnas: {list(df.columns)}")
        
        # Mapeo de columnas
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

def enviar_datos_a_api(datos, token):
    """Enviar datos procesados a la API"""
    print(f"📤 Enviando {len(datos)} registros a la API...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Enviar datos en lotes de 1000
        batch_size = 1000
        total_enviados = 0
        
        for i in range(0, len(datos), batch_size):
            batch = datos[i:i + batch_size]
            
            print(f"📤 Enviando lote {i//batch_size + 1}: {len(batch)} registros")
            
            response = requests.post(
                CONFIRM_URL, 
                json=batch, 
                headers=headers, 
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                enviados = result.get('total_guardados', 0)
                total_enviados += enviados
                print(f"✅ Lote {i//batch_size + 1} enviado: {enviados} registros")
            else:
                print(f"❌ Error en lote {i//batch_size + 1}: {response.status_code} - {response.text}")
                return False
            
            # Pausa entre lotes
            time.sleep(1)
        
        print(f"✅ Total enviados: {total_enviados} registros")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando datos: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando importación del padrón via API")
    
    # Obtener archivo
    archivo_excel = input("📁 Ingresa la ruta del archivo Excel: ").strip()
    if not os.path.exists(archivo_excel):
        print(f"❌ Archivo no encontrado: {archivo_excel}")
        return
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo iniciar sesión")
        return
    
    # Procesar archivo
    datos = procesar_archivo_excel(archivo_excel, token)
    if not datos:
        print("❌ No se pudieron procesar los datos")
        return
    
    # Enviar a API
    if enviar_datos_a_api(datos, token):
        print("✅ Importación completada exitosamente")
    else:
        print("❌ Error en la importación")

if __name__ == "__main__":
    main()
