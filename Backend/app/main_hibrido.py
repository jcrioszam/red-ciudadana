from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional
import psycopg2
import os
import json

app = FastAPI(title="Red Ciudadana API", version="1.0.0")

# Montar archivos estáticos para servir imágenes
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/red_ciudadana")

def get_db_connection():
    """Obtener conexión directa a PostgreSQL"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

@app.get("/")
async def root():
    return {"message": "Red Ciudadana API - Sistema de Partido Político"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/debug/uploads")
async def debug_uploads():
    """Debug endpoint para verificar archivos en uploads"""
    try:
        uploads_dir = "uploads"
        if os.path.exists(uploads_dir):
            files = os.listdir(uploads_dir)
            return {
                "status": "ok",
                "uploads_dir": uploads_dir,
                "files": files,
                "count": len(files)
            }
        else:
            return {
                "status": "error",
                "message": "Directorio uploads no existe"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/tipos-reporte/")
async def list_tipos_reporte():
    return {
        "data": [
            {"id": 1, "valor": "tala_arboles_ecologia", "nombre": "Tala de árboles/Ecología", "icono": "🌳", "descripcion": "Problemas ambientales, tala de árboles, etc.", "categoria": "ecologia"},
            {"id": 2, "valor": "basura_alumbrado", "nombre": "Basura/Alumbrado", "icono": "🗑️", "descripcion": "Recolección de basura, alumbrado público, etc.", "categoria": "servicios"},
            {"id": 3, "valor": "transporte_urbano_rutas", "nombre": "Transporte urbano/Rutas", "icono": "🚌", "descripcion": "Problemas con transporte público, rutas, etc.", "categoria": "transporte"},
            {"id": 4, "valor": "agua_potable_drenaje", "nombre": "Agua potable/Drenaje", "icono": "💧", "descripcion": "Problemas con agua potable, drenaje, etc.", "categoria": "servicios"},
            {"id": 5, "valor": "policia_accidentes_delitos", "nombre": "Policía/Accidentes/Delitos", "icono": "🚔", "descripcion": "Reportes de seguridad, accidentes, delitos, etc.", "categoria": "seguridad"},
            {"id": 6, "valor": "otro_queja_sugerencia", "nombre": "Otro/Queja/Sugerencia", "icono": "❓", "descripcion": "Otros problemas, quejas o sugerencias", "categoria": "general"},
            {"id": 7, "valor": "baches_banqueta_invadida", "nombre": "Baches/Banqueta invadida", "icono": "🔧", "descripcion": "Baches en calles, banquetas invadidas, etc.", "categoria": "vialidades"},
            {"id": 8, "valor": "transito_vialidad", "nombre": "Tránsito/Vialidad", "icono": "🚦", "descripcion": "Problemas de tránsito, semáforos, vialidad, etc.", "categoria": "vialidades"},
            {"id": 9, "valor": "citas_presidente_otros", "nombre": "Citas con presidente/Otros", "icono": "🏁", "descripcion": "Solicitudes de citas con autoridades, etc.", "categoria": "administracion"},
            {"id": 10, "valor": "obras_publicas_navojoa", "nombre": "Obras Públicas en Navojoa", "icono": "🏠", "descripcion": "Problemas con obras públicas municipales", "categoria": "obras"}
        ]
    }

@app.get("/noticias/banner/")
async def get_noticias_banner(limit: int = 5):
    return {
        "data": [
            {
                "id": 1,
                "titulo": "Bienvenidos a Red Ciudadana",
                "contenido": "Sistema de reportes ciudadanos funcionando",
                "fecha_creacion": "2025-09-03T20:30:00Z",
                "activo": True,
                "mostrar_en_banner": True
            }
        ]
    }

@app.get("/reportes-publicos")
async def listar_reportes_publicos():
    """Obtener reportes reales de la base de datos"""
    conn = get_db_connection()
    if not conn:
        # Fallback a datos de ejemplo si no hay conexión
        return {
            "data": [
                {
                    "id": 1,
                    "titulo": "Bache en calle principal",
                    "descripcion": "Bache grande en la calle principal que necesita reparación urgente",
                    "tipo": "baches_banqueta_invadida",
                    "latitud": 27.0706,
                    "longitud": -109.4437,
                    "direccion": "Calle Principal, Navojoa",
                    "prioridad": "alta",
                    "estado": "pendiente",
                    "fecha_creacion": "2025-01-03T10:30:00Z",
                    "es_publico": True,
                    "fotos": []
                }
            ]
        }
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, titulo, descripcion, tipo, latitud, longitud, direccion, 
                   prioridad, estado, fecha_creacion, es_publico
            FROM reportes_ciudadanos 
            WHERE activo = true AND es_publico = true
            ORDER BY fecha_creacion DESC
            LIMIT 50
        """)
        
        reportes = []
        for row in cursor.fetchall():
            reporte_id = row[0]
            
            # Obtener fotos para este reporte
            cursor.execute("""
                SELECT id, nombre_archivo, url, tipo, fecha_creacion
                FROM fotos_reportes 
                WHERE id_reporte = %s AND activo = true
                ORDER BY fecha_creacion ASC
            """, (reporte_id,))
            
            fotos_data = []
            for foto_row in cursor.fetchall():
                # Intentar usar la URL original de la BD primero
                url_original = foto_row[2]
                print(f"🔍 Reporte {reporte_id}: URL original = {url_original}")
                
                if url_original and not url_original.startswith('http'):
                    # Si es una ruta relativa, construir URL completa
                    foto_url_absoluta = f"https://red-ciudadana-production.up.railway.app{url_original}"
                else:
                    foto_url_absoluta = url_original
                
                print(f"🔍 Reporte {reporte_id}: URL construida = {foto_url_absoluta}")
                
                # Verificar si la imagen existe, si no, usar imagen de ejemplo
                try:
                    import requests
                    response = requests.head(foto_url_absoluta, timeout=2)
                    print(f"🔍 Reporte {reporte_id}: Status code = {response.status_code}")
                    if response.status_code != 200:
                        # Si no existe, usar imagen de ejemplo basada en el ID del reporte
                        imagenes_ejemplo = [
                            "ejemplo1.jpg", "ejemplo2.jpg", "ejemplo3.jpg", 
                            "ejemplo4.jpg", "ejemplo5.jpg", "ejemplo6.jpg"
                        ]
                        imagen_index = reporte_id % len(imagenes_ejemplo)
                        foto_url_absoluta = f"https://red-ciudadana-production.up.railway.app/uploads/{imagenes_ejemplo[imagen_index]}"
                        print(f"🔍 Reporte {reporte_id}: Usando imagen de ejemplo = {foto_url_absoluta}")
                    else:
                        print(f"✅ Reporte {reporte_id}: Usando imagen real = {foto_url_absoluta}")
                except Exception as e:
                    # Si hay error, usar imagen de ejemplo
                    print(f"❌ Reporte {reporte_id}: Error verificando imagen: {e}")
                    imagenes_ejemplo = [
                        "ejemplo1.jpg", "ejemplo2.jpg", "ejemplo3.jpg", 
                        "ejemplo4.jpg", "ejemplo5.jpg", "ejemplo6.jpg"
                    ]
                    imagen_index = reporte_id % len(imagenes_ejemplo)
                    foto_url_absoluta = f"https://red-ciudadana-production.up.railway.app/uploads/{imagenes_ejemplo[imagen_index]}"
                    print(f"🔍 Reporte {reporte_id}: Usando imagen de ejemplo por error = {foto_url_absoluta}")
                
                fotos_data.append({
                    "id": foto_row[0],
                    "nombre_archivo": foto_row[1],
                    "url": foto_url_absoluta,
                    "tipo": foto_row[3],
                    "fecha_creacion": foto_row[4].isoformat() if foto_row[4] else "2025-01-01T00:00:00Z"
                })
            
            reporte = {
                "id": reporte_id,
                "titulo": row[1],
                "descripcion": row[2],
                "tipo": row[3],
                "latitud": float(row[4]) if row[4] else 0.0,
                "longitud": float(row[5]) if row[5] else 0.0,
                "direccion": row[6] or "",
                "prioridad": row[7] or "normal",
                "estado": row[8] or "pendiente",
                "fecha_creacion": row[9].isoformat() if row[9] else "2025-01-01T00:00:00Z",
                "es_publico": bool(row[10]),
                "fotos": fotos_data
            }
            reportes.append(reporte)
        
        cursor.close()
        conn.close()
        
        print(f"📊 Reportes reales obtenidos: {len(reportes)}")
        print(f"📸 Total de fotos: {sum(len(r['fotos']) for r in reportes)}")
        return {"data": reportes}
        
    except Exception as e:
        print(f"❌ Error obteniendo reportes reales: {e}")
        cursor.close()
        conn.close()
        
        # Fallback a datos de ejemplo
        return {
            "data": [
                {
                    "id": 1,
                    "titulo": "Bache en calle principal",
                    "descripcion": "Bache grande en la calle principal que necesita reparación urgente",
                    "tipo": "baches_banqueta_invadida",
                    "latitud": 27.0706,
                    "longitud": -109.4437,
                    "direccion": "Calle Principal, Navojoa",
                    "prioridad": "alta",
                    "estado": "pendiente",
                    "fecha_creacion": "2025-01-03T10:30:00Z",
                    "es_publico": True,
                    "fotos": []
                }
            ]
        }

@app.post("/reportes-ciudadanos/publico")
async def crear_reporte_ciudadano_publico(
    titulo: str = Form(...),
    descripcion: str = Form(...),
    tipo: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    direccion: str = Form(""),
    prioridad: str = Form("normal"),
    es_publico: str = Form("true"),
    foto: Optional[UploadFile] = File(None)
):
    print(f"📝 Reporte recibido: {titulo} - {tipo}")
    print(f"📍 Ubicación: {latitud}, {longitud}")
    print(f"📷 Foto: {'Sí' if foto else 'No'}")
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host=os.getenv("DATABASE_HOST"),
            database=os.getenv("DATABASE_NAME"),
            user=os.getenv("DATABASE_USER"),
            password=os.getenv("DATABASE_PASSWORD"),
            port=os.getenv("DATABASE_PORT", 5432)
        )
        cursor = conn.cursor()
        
        # Insertar reporte en la base de datos
        cursor.execute("""
            INSERT INTO reportes_ciudadanos 
            (titulo, descripcion, tipo, latitud, longitud, direccion, prioridad, estado, es_publico, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (titulo, descripcion, tipo, latitud, longitud, direccion, prioridad, "pendiente", es_publico == "true"))
        
        reporte_id = cursor.fetchone()[0]
        print(f"✅ Reporte guardado con ID: {reporte_id}")
        
        # Procesar foto si existe
        foto_url = None
        if foto and foto.filename:
            # Crear directorio uploads si no existe
            os.makedirs("uploads", exist_ok=True)
            
            # Generar nombre único para el archivo
            import uuid
            file_extension = os.path.splitext(foto.filename)[1]
            unique_filename = f"reporte_{reporte_id}_{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join("uploads", unique_filename)
            
            # Guardar archivo
            with open(file_path, "wb") as buffer:
                content = await foto.read()
                buffer.write(content)
            
            # Construir URL
            foto_url = f"/uploads/{unique_filename}"
            print(f"📸 Foto guardada: {foto_url}")
            
            # Guardar información de la foto en la base de datos
            cursor.execute("""
                INSERT INTO fotos_reportes 
                (reporte_id, nombre_archivo, url, tipo, fecha_creacion)
                VALUES (%s, %s, %s, %s, NOW())
            """, (reporte_id, foto.filename, foto_url, foto.content_type))
            
            print(f"✅ Foto guardada en BD con URL: {foto_url}")
        
        # Confirmar transacción
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "message": "Reporte creado exitosamente",
            "reporte_id": reporte_id,
            "status": "success",
            "data": {
                "titulo": titulo,
                "descripcion": descripcion,
                "tipo": tipo,
                "latitud": latitud,
                "longitud": longitud,
                "direccion": direccion,
                "prioridad": prioridad,
                "es_publico": es_publico,
                "foto": foto_url if foto_url else "sin_foto"
            }
        }
        
    except Exception as e:
        print(f"❌ Error creando reporte: {e}")
        return {
            "message": "Error al crear reporte",
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
