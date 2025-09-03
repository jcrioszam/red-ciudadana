from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    return [
        {"id": 1, "value": "bache", "label": "Bache en la calle", "icon": "🕳️"},
        {"id": 2, "value": "alumbrado", "label": "Problema de alumbrado", "icon": "💡"},
        {"id": 3, "value": "basura", "label": "Acumulación de basura", "icon": "🗑️"},
        {"id": 4, "value": "agua", "label": "Fuga de agua", "icon": "💧"},
        {"id": 5, "value": "seguridad", "label": "Problema de seguridad", "icon": "🚨"}
    ]

@app.get("/noticias/banner/")
async def get_noticias_banner(limit: int = 5):
    return [
        {
            "id": 1,
            "titulo": "Bienvenidos a Red Ciudadana",
            "contenido": "Sistema de reportes ciudadanos funcionando",
            "fecha_creacion": "2025-09-03T20:30:00Z",
            "activo": True,
            "mostrar_en_banner": True
        }
    ]

@app.post("/reportes-ciudadanos/publico")
async def crear_reporte_ciudadano_publico(
    titulo: str,
    descripcion: str,
    tipo: str,
    latitud: float = None,
    longitud: float = None,
    direccion: str = None,
    prioridad: str = "normal"
):
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
            "prioridad": prioridad
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
