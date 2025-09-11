#!/usr/bin/env python3
"""
Script para importar datos del padrón electoral via API
Usando los endpoints corregidos del backend
"""

import pandas as pd
import requests
import json
import time
from datetime import datetime

# Configuración de la API
API_BASE = "https://red-ciudadana-production.up.railway.app"
USERNAME = "admin@redciudadana.com"
PASSWORD = "admin123"

def login():
    """Iniciar sesión y obtener token"""
    print("🔐 Iniciando sesión...")
    
    login_data = {
        "identificador": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{API_BASE}/login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login exitoso")
            return token
        else:
            print(f"❌ Error en login: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        return None

def procesar_archivo_excel(archivo_excel):
    """Procesar archivo Excel y preparar datos para la API"""
    try:
        print(f"📊 Leyendo archivo: {archivo_excel}")
        df = pd.read_excel(archivo_excel)
        print(f"📊 Archivo leído: {len(df)} registros, {len(df.columns)} columnas")
        print(f"🔍 Columnas: {list(df.columns)}")
        
        # Mapear datos del Excel a la estructura esperada por la API
        datos_mapeados = []
        
        for index, row in df.iterrows():
            registro = {
                'consecutivo': int(row.get('CONSECUTIV', 0)) if pd.notna(row.get('CONSECUTIV')) else 0,
                'cedula': str(row.get('ELECTOR', '')).strip(),
                'nombre': str(row.get('NOMBRE', '')).strip(),
                'apellido_paterno': str(row.get('APE_PAT', '')).strip(),
                'apellido_materno': str(row.get('APE_MAT', '')).strip(),
                'fecha_nacimiento': row.get('FNAC') if pd.notna(row.get('FNAC')) else None,
                'sexo': str(row.get('SEXO', '')).strip(),
                'estado': str(row.get('ENTIDAD', '')).strip(),
                'municipio': str(row.get('MUNICIPIO', '')).strip(),
                'seccion': str(row.get('SECCION', '')).strip(),
                'localidad': str(row.get('LOCALIDAD', '')).strip(),
                'casilla': str(row.get('MANZANA', '')).strip(),
                'tipo_casilla': str(row.get('EN_LN', '')).strip(),
                'domicilio': str(row.get('CALLE', '')).strip(),
                'colonia': str(row.get('COLONIA', '')).strip(),
                'codigo_postal': str(row.get('CODPOSTAL', '')).strip(),
                'telefono': str(row.get('TIEMPRES', '')).strip(),
                'email': str(row.get('EMISIONCRE', '')).strip()
            }
            
            datos_mapeados.append(registro)
            
            # Mostrar progreso cada 10000 registros
            if (index + 1) % 10000 == 0:
                print(f"📊 Procesados {index + 1} registros...")
        
        print(f"✅ Datos mapeados: {len(datos_mapeados)} registros")
        return datos_mapeados
        
    except Exception as e:
        print(f"❌ Error procesando archivo: {str(e)}")
        return None

def importar_datos_via_api(datos, token):
    """Importar datos via API en lotes"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    batch_size = 1000
    total_enviados = 0
    total_guardados = 0
    
    print(f"📤 Enviando {len(datos)} registros en lotes de {batch_size}...")
    
    for i in range(0, len(datos), batch_size):
        batch = datos[i:i + batch_size]
        lote_num = i // batch_size + 1
        
        print(f"📤 Enviando lote {lote_num}: {len(batch)} registros...")
        
        try:
            response = requests.post(
                f"{API_BASE}/api/padron/confirmar-importacion",
                headers=headers,
                json=batch,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                guardados = data.get('total_guardados', 0)
                total_guardados += guardados
                total_enviados += len(batch)
                
                print(f"✅ Lote {lote_num} enviado: {guardados} registros guardados")
                
                # Pequeña pausa entre lotes para no sobrecargar el servidor
                time.sleep(0.5)
                
            else:
                print(f"❌ Error en lote {lote_num}: {response.status_code} - {response.text}")
                # Continuar con el siguiente lote
                total_enviados += len(batch)
                
        except Exception as e:
            print(f"❌ Error enviando lote {lote_num}: {str(e)}")
            total_enviados += len(batch)
            continue
    
    return total_enviados, total_guardados

def verificar_importacion(token):
    """Verificar cuántos registros se importaron"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/api/padron/estadisticas",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            total_registros = data.get('total_registros', 0)
            print(f"📊 Total de registros en la base de datos: {total_registros}")
            return total_registros
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code}")
            return 0
            
    except Exception as e:
        print(f"❌ Error verificando importación: {str(e)}")
        return 0

def main():
    """Función principal"""
    print("🚀 IMPORTACIÓN DEL PADRÓN VIA API")
    print("=" * 50)
    
    # Solicitar archivo
    archivo_excel = input("📁 Ingresa la ruta del archivo Excel: ").strip()
    
    if not archivo_excel:
        print("❌ No se proporcionó archivo")
        return
    
    # Login
    token = login()
    if not token:
        print("❌ No se pudo iniciar sesión")
        return
    
    # Procesar archivo
    datos = procesar_archivo_excel(archivo_excel)
    if not datos:
        print("❌ Error procesando archivo")
        return
    
    # Importar datos
    print(f"\n💾 Iniciando importación de {len(datos)} registros...")
    total_enviados, total_guardados = importar_datos_via_api(datos, token)
    
    # Verificar resultado
    print(f"\n📊 RESUMEN DE IMPORTACIÓN:")
    print(f"📤 Registros enviados: {total_enviados}")
    print(f"💾 Registros guardados: {total_guardados}")
    
    # Verificar en la base de datos
    print(f"\n🔍 Verificando base de datos...")
    total_bd = verificar_importacion(token)
    
    if total_guardados > 0:
        print(f"🎉 Importación completada exitosamente!")
        print(f"📊 Total en BD: {total_bd} registros")
    else:
        print(f"❌ No se guardaron registros. Revisa los logs del servidor.")

if __name__ == "__main__":
    main()
