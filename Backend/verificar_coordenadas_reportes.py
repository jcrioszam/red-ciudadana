#!/usr/bin/env python3
"""
Script para verificar las coordenadas de los reportes ciudadanos
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano

def verificar_coordenadas_reportes():
    print("🔍 Verificando coordenadas de reportes ciudadanos...")
    
    db = SessionLocal()
    try:
        # Obtener todos los reportes
        reportes = db.query(ReporteCiudadano).filter(ReporteCiudadano.activo == True).all()
        
        if not reportes:
            print("❌ No hay reportes disponibles")
            return
        
        print(f"📊 Total de reportes: {len(reportes)}")
        print()
        
        # Analizar coordenadas
        coordenadas = []
        for reporte in reportes:
            print(f"📋 Reporte ID: {reporte.id}")
            print(f"   Título: {reporte.titulo}")
            print(f"   Latitud: {reporte.latitud}")
            print(f"   Longitud: {reporte.longitud}")
            print(f"   Dirección: {reporte.direccion}")
            print()
            
            if reporte.latitud and reporte.longitud:
                coordenadas.append({
                    'lat': reporte.latitud,
                    'lng': reporte.longitud,
                    'titulo': reporte.titulo
                })
        
        if coordenadas:
            # Calcular centro del mapa
            latitudes = [coord['lat'] for coord in coordenadas]
            longitudes = [coord['lng'] for coord in coordenadas]
            
            centro_lat = sum(latitudes) / len(latitudes)
            centro_lng = sum(longitudes) / len(longitudes)
            
            print("📍 Centro calculado del mapa:")
            print(f"   Latitud: {centro_lat}")
            print(f"   Longitud: {centro_lng}")
            print()
            
            # Calcular rango para el zoom
            lat_min = min(latitudes)
            lat_max = max(latitudes)
            lng_min = min(longitudes)
            lng_max = max(longitudes)
            
            lat_delta = lat_max - lat_min
            lng_delta = lng_max - lng_min
            
            # Ajustar delta para un zoom apropiado
            max_delta = max(lat_delta, lng_delta)
            if max_delta < 0.01:  # Si los reportes están muy cerca
                zoom_delta = 0.01
            elif max_delta < 0.1:  # Zoom medio
                zoom_delta = max_delta * 2
            else:  # Zoom amplio
                zoom_delta = max_delta * 1.5
            
            print("🗺️ Configuración recomendada para el mapa:")
            print(f"   Centro: {centro_lat}, {centro_lng}")
            print(f"   Delta: {zoom_delta}")
            print(f"   Zoom aproximado: {int(16 - (zoom_delta * 1000))}")
            print()
            
            print("📱 Para la app móvil, usar:")
            print(f"   mapRegion = {{")
            print(f"     latitude: {centro_lat},")
            print(f"     longitude: {centro_lng},")
            print(f"     latitudeDelta: {zoom_delta},")
            print(f"     longitudeDelta: {zoom_delta}")
            print(f"   }}")
            print()
            
            print("🌐 Para la web, usar:")
            print(f"   center: [{centro_lat}, {centro_lng}]")
            print(f"   zoom: {int(16 - (zoom_delta * 1000))}")
            
        else:
            print("❌ No hay reportes con coordenadas válidas")
            
    except Exception as e:
        print(f"❌ Error consultando la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verificar_coordenadas_reportes() 