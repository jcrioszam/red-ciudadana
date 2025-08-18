#!/usr/bin/env python3
"""
Script para verificar las coordenadas de los reportes ciudadanos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def verificar_coordenadas():
    db = SessionLocal()
    
    try:
        # Obtener todos los reportes
        reportes = db.query(ReporteCiudadano).all()
        
        print(f"📊 Total de reportes: {len(reportes)}")
        print("\n📍 Coordenadas de los reportes:")
        
        for reporte in reportes:
            print(f"  - ID: {reporte.id}")
            print(f"    Título: {reporte.titulo}")
            print(f"    Latitud: {reporte.latitud}")
            print(f"    Longitud: {reporte.longitud}")
            print(f"    Dirección: {reporte.direccion or 'No especificada'}")
            print(f"    Estado: {reporte.estado}")
            print()
        
        # Verificar coordenadas válidas
        coordenadas_validas = []
        coordenadas_invalidas = []
        
        for reporte in reportes:
            if reporte.latitud != 0 and reporte.longitud != 0:
                coordenadas_validas.append(reporte)
            else:
                coordenadas_invalidas.append(reporte)
        
        print(f"✅ Reportes con coordenadas válidas: {len(coordenadas_validas)}")
        print(f"❌ Reportes con coordenadas inválidas: {len(coordenadas_invalidas)}")
        
        if coordenadas_invalidas:
            print("\n⚠️ Reportes con coordenadas (0,0):")
            for reporte in coordenadas_invalidas:
                print(f"  - ID: {reporte.id} - {reporte.titulo}")
        
        # Calcular centro del mapa
        if coordenadas_validas:
            lats = [r.latitud for r in coordenadas_validas]
            lngs = [r.longitud for r in coordenadas_validas]
            
            center_lat = sum(lats) / len(lats)
            center_lng = sum(lngs) / len(lngs)
            
            print(f"\n🗺️ Centro del mapa calculado:")
            print(f"  Latitud: {center_lat}")
            print(f"  Longitud: {center_lng}")
            
            # Verificar si las coordenadas están muy cerca
            print(f"\n📏 Distancia entre reportes:")
            for i, reporte1 in enumerate(coordenadas_validas):
                for j, reporte2 in enumerate(coordenadas_validas):
                    if i < j:
                        # Cálculo aproximado de distancia
                        lat_diff = abs(reporte1.latitud - reporte2.latitud)
                        lng_diff = abs(reporte1.longitud - reporte2.longitud)
                        distance_approx = (lat_diff + lng_diff) * 111000  # metros aproximados
                        
                        print(f"  {reporte1.titulo} ↔ {reporte2.titulo}: {distance_approx:.0f}m")
        
    except Exception as e:
        print(f"❌ Error al verificar coordenadas: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("📍 Verificando coordenadas de reportes...")
    verificar_coordenadas()
    print("✅ Verificación completada.") 