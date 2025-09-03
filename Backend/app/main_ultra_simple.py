from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="Red Ciudadana API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Red Ciudadana API - Sistema de Partido Político"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/tipos-reporte/")
async def list_tipos_reporte():
    return {
        "data": [
            {"id": 1, "valor": "tala_arboles_ecologia", "nombre": "Tala de árboles/Ecología", "icono": "🌳", "descripcion": "Problemas ambientales, tala de árboles, etc.", "categoria": "ecologia"},
            {"id": 2, "valor": "basura_alumbrado", "nombre": "Basura/Alumbrado", "icono": "🗑️", "descripcion": "Recolección de basura, alumbrado público, etc.", "categoria": "servicios"},
            {"id": 3, "valor": "transporte_urbano_rutas", "nombre": "Transporte urbano/Rutas", "icono": "🚌", "descripcion": "Problemas con transporte público, rutas, etc.", "categoria": "transporte"},
            {"id": 4, "valor": "agua_drenaje", "nombre": "Agua/Drenaje", "icono": "💧", "descripcion": "Fugas de agua, problemas de drenaje, etc.", "categoria": "servicios"},
            {"id": 5, "valor": "seguridad_publica", "nombre": "Seguridad Pública", "icono": "🚨", "descripcion": "Problemas de seguridad, iluminación, etc.", "categoria": "seguridad"},
            {"id": 6, "valor": "vialidades_baches", "nombre": "Vialidades/Baches", "icono": "🕳️", "descripcion": "Baches, semáforos, señalización, etc.", "categoria": "vialidades"}
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
    
    return {
        "message": "Reporte creado exitosamente",
        "reporte_id": 12345,
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
            "foto": "adjunta" if foto else "sin_foto"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
