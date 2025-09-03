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
