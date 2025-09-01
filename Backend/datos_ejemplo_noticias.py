#!/usr/bin/env python3
"""
Script para insertar noticias de ejemplo en la base de datos
Ejecutar desde el directorio Backend: python datos_ejemplo_noticias.py
"""

import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from database import SessionLocal
from models_noticias import Noticia

def crear_noticias_ejemplo():
    """Crear noticias de ejemplo para probar el sistema"""
    
    # Datos de noticias de ejemplo
    noticias_ejemplo = [
        {
            "titulo": "Nueva Plaza Central en Navojoa",
            "descripcion_corta": "Se inaugura la nueva plaza central con áreas verdes y espacios de recreación para toda la familia.",
            "contenido_completo": """
            La nueva Plaza Central de Navojoa representa un hito importante en el desarrollo urbano de nuestra ciudad. 
            Con una inversión de más de 5 millones de pesos, esta plaza incluye:
            
            • Áreas verdes con más de 100 árboles nativos
            • Fuentes ornamentales y espacios de recreación
            • Pistas para caminar y ejercitarse
            • Áreas de descanso con bancas y sombra
            • Iluminación LED de bajo consumo
            
            La plaza estará abierta al público las 24 horas y contará con vigilancia permanente para garantizar la seguridad de todos los visitantes.
            """,
            "imagen_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
            "imagen_alt": "Plaza central moderna con áreas verdes y fuentes",
            "fecha_publicacion": datetime.now() - timedelta(days=2),
            "fecha_expiracion": None,
            "activa": True,
            "destacada": True,
            "prioridad": 1,
            "categoria": "obras",
            "tags": "plaza, obras públicas, recreación, desarrollo urbano",
            "enlace_externo": "https://navojoa.gob.mx/plaza-central",
            "boton_texto": "Ver más detalles"
        },
        {
            "titulo": "Programa de Recolección de Basura Mejorado",
            "descripcion_corta": "Nuevo horario y rutas optimizadas para la recolección de basura en toda la ciudad.",
            "contenido_completo": """
            A partir de la próxima semana, el servicio de recolección de basura tendrá importantes mejoras:
            
            🕐 Nuevos horarios:
            • Zona Norte: Lunes, Miércoles y Viernes de 6:00 AM a 10:00 AM
            • Zona Sur: Martes, Jueves y Sábado de 6:00 AM a 10:00 AM
            • Zona Centro: Todos los días de 7:00 PM a 11:00 PM
            
            🚛 Nuevas rutas optimizadas para reducir tiempos de espera
            📱 App móvil para reportar problemas del servicio
            ♻️ Separación de residuos reciclables
            
            Para más información, contacta al departamento de servicios públicos.
            """,
            "imagen_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
            "imagen_alt": "Camión de recolección de basura en la ciudad",
            "fecha_publicacion": datetime.now() - timedelta(days=1),
            "fecha_expiracion": None,
            "activa": True,
            "destacada": False,
            "prioridad": 2,
            "categoria": "servicios",
            "tags": "basura, recolección, servicios públicos, horarios",
            "enlace_externo": None,
            "boton_texto": None
        },
        {
            "titulo": "Festival Cultural Navojoa 2024",
            "descripcion_corta": "Gran celebración cultural con música, danza, arte y gastronomía local del 15 al 20 de marzo.",
            "contenido_completo": """
            El Festival Cultural Navojoa 2024 promete ser el evento cultural más importante del año con:
            
            🎵 Música en vivo con artistas locales y nacionales
            💃 Presentaciones de danza folclórica y contemporánea
            🎨 Exposiciones de arte y artesanías locales
            🍽️ Feria gastronómica con los mejores restaurantes de la región
            🎭 Teatro callejero y presentaciones infantiles
            🎪 Talleres de arte y manualidades para toda la familia
            
            📍 Ubicación: Plaza Principal y Centro Cultural
            🕐 Horario: 10:00 AM a 11:00 PM
            💰 Entrada: Gratuita para todos los eventos
            
            ¡No te pierdas esta gran celebración de nuestra cultura!
            """,
            "imagen_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
            "imagen_alt": "Festival cultural con música y danza",
            "fecha_publicacion": datetime.now() - timedelta(hours=6),
            "fecha_expiracion": datetime.now() + timedelta(days=30),
            "activa": True,
            "destacada": True,
            "prioridad": 1,
            "categoria": "eventos",
            "tags": "festival, cultura, música, danza, arte, gastronomía",
            "enlace_externo": "https://navojoa.gob.mx/festival-cultural-2024",
            "boton_texto": "Ver programa completo"
        },
        {
            "titulo": "Mantenimiento Programado del Alumbrado Público",
            "descripcion_corta": "Trabajos de mantenimiento en el sistema de alumbrado público del 10 al 15 de marzo.",
            "contenido_completo": """
            Se realizarán trabajos de mantenimiento preventivo en el sistema de alumbrado público:
            
            🔧 Trabajos a realizar:
            • Reemplazo de lámparas LED dañadas
            • Reparación de postes y cables
            • Optimización del sistema de control
            • Limpieza de luminarias
            
            📍 Zonas afectadas:
            • Avenida Principal (km 0 al km 5)
            • Colonia Centro
            • Colonia Norte
            
            ⚠️ Durante los trabajos, algunas calles pueden tener iluminación reducida
            🕐 Horario de trabajos: 8:00 AM a 6:00 PM
            
            Agradecemos su comprensión y paciencia durante estos trabajos necesarios.
            """,
            "imagen_url": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
            "imagen_alt": "Trabajos de mantenimiento en alumbrado público",
            "fecha_publicacion": datetime.now() - timedelta(hours=12),
            "fecha_expiracion": datetime.now() + timedelta(days=7),
            "activa": True,
            "destacada": False,
            "prioridad": 2,
            "categoria": "obras",
            "tags": "alumbrado, mantenimiento, obras, iluminación",
            "enlace_externo": None,
            "boton_texto": None
        },
        {
            "titulo": "Nuevo Centro de Atención Ciudadana",
            "descripcion_corta": "Inauguración del nuevo centro para trámites y servicios municipales con atención personalizada.",
            "contenido_completo": """
            El nuevo Centro de Atención Ciudadana (CAC) abre sus puertas para brindar un servicio más eficiente:
            
            🏢 Servicios disponibles:
            • Trámites municipales (licencias, permisos, pagos)
            • Atención ciudadana y quejas
            • Información sobre programas sociales
            • Orientación legal básica
            • Servicios de notaría
            
            📍 Ubicación: Calle Principal #123, Colonia Centro
            🕐 Horario: Lunes a Viernes 8:00 AM a 6:00 PM, Sábados 9:00 AM a 2:00 PM
            📱 Teléfono: (644) 123-4567
            💻 Trámites en línea: cac.navojoa.gob.mx
            
            El CAC cuenta con personal capacitado y tecnología moderna para brindar la mejor atención posible.
            """,
            "imagen_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
            "imagen_alt": "Centro de atención ciudadana moderno",
            "fecha_publicacion": datetime.now() - timedelta(hours=3),
            "fecha_expiracion": None,
            "activa": True,
            "destacada": False,
            "prioridad": 3,
            "categoria": "servicios",
            "tags": "centro atención, trámites, servicios municipales, CAC",
            "enlace_externo": "https://cac.navojoa.gob.mx",
            "boton_texto": "Visitar sitio web"
        }
    ]
    
    db = SessionLocal()
    
    try:
        print("🚀 Iniciando inserción de noticias de ejemplo...")
        
        # Verificar si ya existen noticias
        noticias_existentes = db.query(Noticia).count()
        if noticias_existentes > 0:
            print(f"⚠️ Ya existen {noticias_existentes} noticias en la base de datos")
            respuesta = input("¿Desea continuar e insertar las noticias de ejemplo? (s/n): ")
            if respuesta.lower() != 's':
                print("❌ Operación cancelada")
                return
        
        # Insertar cada noticia
        for i, datos_noticia in enumerate(noticias_ejemplo, 1):
            try:
                # Crear objeto Noticia
                noticia = Noticia(
                    titulo=datos_noticia["titulo"],
                    descripcion_corta=datos_noticia["descripcion_corta"],
                    contenido_completo=datos_noticia["contenido_completo"],
                    imagen_url=datos_noticia["imagen_url"],
                    imagen_alt=datos_noticia["imagen_alt"],
                    fecha_publicacion=datos_noticia["fecha_publicacion"],
                    fecha_expiracion=datos_noticia["fecha_expiracion"],
                    activa=datos_noticia["activa"],
                    destacada=datos_noticia["destacada"],
                    prioridad=datos_noticia["prioridad"],
                    categoria=datos_noticia["categoria"],
                    tags=datos_noticia["tags"],
                    enlace_externo=datos_noticia["enlace_externo"],
                    boton_texto=datos_noticia["boton_texto"],
                    autor_id=1  # ID del usuario administrador
                )
                
                db.add(noticia)
                db.commit()
                db.refresh(noticia)
                
                print(f"✅ Noticia {i}/{len(noticias_ejemplo)} creada: {noticia.titulo}")
                
            except Exception as e:
                print(f"❌ Error al crear noticia {i}: {str(e)}")
                db.rollback()
                continue
        
        # Verificar noticias creadas
        total_noticias = db.query(Noticia).count()
        print(f"\n🎉 Proceso completado. Total de noticias en la base de datos: {total_noticias}")
        
        # Mostrar resumen
        noticias_activas = db.query(Noticia).filter(Noticia.activa == True).count()
        noticias_destacadas = db.query(Noticia).filter(Noticia.destacada == True).count()
        
        print(f"📊 Resumen:")
        print(f"   • Noticias activas: {noticias_activas}")
        print(f"   • Noticias destacadas: {noticias_destacadas}")
        print(f"   • Total en base de datos: {total_noticias}")
        
    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        db.rollback()
    
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("📰 SCRIPT DE NOTICIAS DE EJEMPLO - RED CIUDADANA")
    print("=" * 60)
    
    crear_noticias_ejemplo()
    
    print("\n" + "=" * 60)
    print("🏁 Script finalizado")
    print("=" * 60)
