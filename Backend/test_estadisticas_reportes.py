#!/usr/bin/env python3
"""
Script para probar las estadísticas de reportes ciudadanos
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@redciudadana.com"
ADMIN_PASSWORD = "admin123"

def get_token():
    """Obtener token de autenticación"""
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Error al obtener token: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def get_reportes(token):
    """Obtener todos los reportes"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/reportes-ciudadanos", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error al obtener reportes: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return []

def calcular_estadisticas(reportes):
    """Calcular estadísticas manualmente"""
    stats = {
        "total": len(reportes),
        "pendientes": len([r for r in reportes if r.get("estado") == "pendiente"]),
        "en_revision": len([r for r in reportes if r.get("estado") == "en_revision"]),
        "en_progreso": len([r for r in reportes if r.get("estado") == "en_progreso"]),
        "resueltos": len([r for r in reportes if r.get("estado") == "resuelto"]),
        "rechazados": len([r for r in reportes if r.get("estado") == "rechazado"]),
        "urgentes": len([r for r in reportes if r.get("prioridad") == "urgente"])
    }
    return stats

def mostrar_estados_individuales(reportes):
    """Mostrar cada reporte con su estado"""
    print("\n📋 Reportes individuales:")
    for reporte in reportes:
        print(f"  - ID: {reporte.get('id')}")
        print(f"    Título: {reporte.get('titulo')}")
        print(f"    Estado: {reporte.get('estado')}")
        print(f"    Prioridad: {reporte.get('prioridad')}")
        print()

def main():
    print("🔍 Probando estadísticas de reportes ciudadanos...")
    
    # Obtener token
    token = get_token()
    if not token:
        print("❌ No se pudo obtener el token")
        return
    
    print("✅ Token obtenido exitosamente")
    
    # Obtener reportes
    reportes = get_reportes(token)
    if not reportes:
        print("❌ No se pudieron obtener reportes")
        return
    
    print(f"✅ Se obtuvieron {len(reportes)} reportes")
    
    # Calcular estadísticas
    stats = calcular_estadisticas(reportes)
    
    print("\n📊 Estadísticas calculadas:")
    print(f"  - Total: {stats['total']}")
    print(f"  - Pendientes: {stats['pendientes']}")
    print(f"  - En Revisión: {stats['en_revision']}")
    print(f"  - En Proceso: {stats['en_progreso']}")
    print(f"  - Resueltos: {stats['resueltos']}")
    print(f"  - Rechazados: {stats['rechazados']}")
    print(f"  - Urgentes: {stats['urgentes']}")
    
    # Mostrar reportes individuales
    mostrar_estados_individuales(reportes)
    
    print("✅ Prueba completada")

if __name__ == "__main__":
    main() 