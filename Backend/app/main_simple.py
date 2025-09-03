from fastapi import FastAPI, Depends, HTTPException, status, Body, UploadFile, File, Form, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import uvicorn
import requests
import shutil
import os
import uuid
import psycopg2
import json
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from contextlib import asynccontextmanager

from .database import engine, get_db, SessionLocal
from .models import Base
from .schemas import Token, Login, Usuario, UsuarioCreate, UsuarioUpdate, Persona, PersonaCreate, PersonaUpdate, Evento, EventoCreate, EventoUpdate, Asistencia, AsistenciaCreate, AsistenciaUpdate, ReportePersonas, ReporteEventos, EstructuraJerarquica, NodoJerarquico, PersonaUbicacion, Vehiculo, VehiculoCreate, VehiculoUpdate, AsignacionMovilizacion, AsignacionMovilizacionCreate, AsignacionMovilizacionUpdate
from .auth import (
    authenticate_user, 
    create_access_token, 
    get_current_active_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    require_admin,
    require_lider_or_admin,
    can_access_user
)

from typing import List, Optional
from .models import Usuario as UsuarioModel
from .models import Persona as PersonaModel
from .models import Evento as EventoModel
from .models import Asistencia as AsistenciaModel
from passlib.hash import bcrypt
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import base64
from io import BytesIO
from PIL import Image
import googlemaps

# Configurar Google Maps
gmaps = googlemaps.Client(key=os.getenv('GOOGLE_MAPS_API_KEY'))

# Importar modelos adicionales
from .models import (
    ReporteCiudadano, ReporteCiudadanoCreate, ReporteCiudadanoUpdate,
    ReporteCiudadanoModel, FotoReporte, FotoReporteCreate, FotoReporteModel,
    Noticia, NoticiaCreate, NoticiaUpdate, NoticiaModel,
    TipoReporte, TipoReporteCreate, TipoReporteUpdate, TipoReporteModel
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando aplicación Red Ciudadana...")
    # Crear tablas si no existen
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas de base de datos creadas/verificadas")
    except Exception as e:
        print(f"⚠️ Error creando tablas: {e}")
    yield
    print("🛑 Cerrando aplicación Red Ciudadana...")

app = FastAPI(
    title="Red Ciudadana API",
    description="Sistema de gestión para partido político",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS - Permitir frontend y backend de Railway
origins = [
    "http://localhost:3000",  # Desarrollo local
    "https://red-ciudadana.vercel.app",  # Frontend Vercel
    "https://red-ciudadana-production.up.railway.app",  # Backend Railway
    "*"  # Temporal para debug
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Red Ciudadana API - Sistema de Partido Político"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Endpoints básicos para reportes ciudadanos
@app.post("/reportes-ciudadanos/publico", response_model=dict)
async def crear_reporte_ciudadano_publico(
    titulo: str = Form(...),
    descripcion: str = Form(...),
    tipo: str = Form(...),
    latitud: Optional[float] = Form(None),
    longitud: Optional[float] = Form(None),
    direccion: Optional[str] = Form(None),
    prioridad: Optional[str] = Form("normal"),
    foto: Optional[UploadFile] = File(None),
    es_publico: bool = Form(True),
    db: Session = Depends(get_db)
):
    try:
        # Crear el reporte
        reporte_data = {
            "titulo": titulo,
            "descripcion": descripcion,
            "tipo": tipo,
            "latitud": latitud,
            "longitud": longitud,
            "direccion": direccion,
            "prioridad": prioridad,
            "es_publico": es_publico,
            "estado": "pendiente",
            "fecha_creacion": datetime.now(),
            "activo": True,
            "ciudadano_id": None,
            "administrador_id": None,
            "observaciones_admin": None,
            "contacto_email": None
        }
        
        # Crear el reporte en la base de datos
        db_reporte = ReporteCiudadanoModel(**reporte_data)
        db.add(db_reporte)
        db.commit()
        db.refresh(db_reporte)
        
        return {
            "message": "Reporte creado exitosamente",
            "reporte_id": db_reporte.id,
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear reporte: {str(e)}")

@app.get("/tipos-reporte/", response_model=List[TipoReporte])
async def list_tipos_reporte(db: Session = Depends(get_db)):
    try:
        tipos = db.query(TipoReporteModel).filter(TipoReporteModel.activo == True).all()
        return tipos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos de reporte: {str(e)}")

@app.get("/noticias/banner/", response_model=List[Noticia])
async def get_noticias_banner(limit: int = 5, db: Session = Depends(get_db)):
    try:
        noticias = db.query(NoticiaModel).filter(
            NoticiaModel.activo == True,
            NoticiaModel.mostrar_en_banner == True
        ).order_by(NoticiaModel.fecha_creacion.desc()).limit(limit).all()
        return noticias
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener noticias: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
