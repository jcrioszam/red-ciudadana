print('🚨🚨🚨 LOGS SUPER AGRESIVOS AGREGADOS AL ENDPOINT /reportes-ciudadanos/ 🚨🚨🚨')
print('🚨🚨🚨 LOGS SUPER AGRESIVOS AGREGADOS AL ENDPOINT /reportes-ciudadanos/ 🚨🚨🚨')
print('🚨🚨🚨 LOGS SUPER AGRESIVOS AGREGADOS AL ENDPOINT /reportes-ciudadanos/ 🚨🚨🚨')
from fastapi import FastAPI, Depends, HTTPException, status, Body, UploadFile, File, Form, Request, Query
from sqlalchemy import text
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import case
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
from .models import Vehiculo as VehiculoModel, AsignacionMovilizacion as AsignacionMovilizacionModel, ConfiguracionPerfil as ConfiguracionPerfilModel, UbicacionTiempoReal as UbicacionTiempoRealModel, ConfiguracionDashboard as ConfiguracionDashboardModel
from . import vehiculos, movilizaciones
from sqlalchemy import func
from .models import Comentario as ComentarioModel, ReporteCiudadano as ReporteCiudadanoModel, FotoReporte as FotoReporteModel
from .models_noticias import Noticia as NoticiaModel
from .schemas import Comentario, ComentarioCreate, ComentarioUpdate
from .schemas_noticias import Noticia, NoticiaCreate, NoticiaUpdate
from .schemas_reportes import ReporteCiudadano, ReporteCiudadanoCreate, ReporteCiudadanoUpdate

# Crear las tablas en la base de datos
try:
    print("🚀 Creando tablas de base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas principales creadas")
except Exception as e:
    print(f"❌ Error al crear tablas principales: {e}")
    # Continuar aunque haya error en las tablas

# Crear directorio para imágenes si no existe
UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Montar archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Función para verificar y crear columnas faltantes
def verificar_y_crear_columnas():
    """Verificar si existen las columnas necesarias y crearlas si no existen"""
    
    # Verificar columna es_publico
    try:
        db = SessionLocal()
        db.execute(text("SELECT es_publico FROM reportes_ciudadanos LIMIT 1"))
        print("✅ Columna es_publico ya existe")
        db.close()
    except Exception:
        print("🔧 Creando columna es_publico...")
        try:
            db = SessionLocal()
            db.execute(text("ALTER TABLE reportes_ciudadanos ADD COLUMN es_publico BOOLEAN DEFAULT true"))
            db.commit()
            print("✅ Columna es_publico creada exitosamente")
            db.close()
        except Exception as e:
            print(f"❌ Error al crear columna es_publico: {str(e)}")
            if db:
                db.rollback()
                db.close()
    
    # Verificar columna contacto_email
    try:
        db = SessionLocal()
        db.execute(text("SELECT contacto_email FROM reportes_ciudadanos LIMIT 1"))
        print("✅ Columna contacto_email ya existe")
        db.close()
    except Exception:
        print("🔧 Creando columna contacto_email...")
        try:
            db = SessionLocal()
            db.execute(text("ALTER TABLE reportes_ciudadanos ADD COLUMN contacto_email VARCHAR(255)"))
            db.commit()
            print("✅ Columna contacto_email creada exitosamente")
            db.close()
        except Exception as e:
            print(f"❌ Error al crear columna contacto_email: {str(e)}")
            if db:
                db.rollback()
                db.close()
    
    print("🎯 Verificación de columnas completada")

# Ejecutar verificación de columnas
verificar_y_crear_columnas()

# Crear usuarios iniciales
def create_initial_users():
    """Crear usuarios iniciales si no existen"""
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(UsuarioModel).filter(UsuarioModel.rol == "admin").first()
        if existing_admin:
            print(f"✅ Admin ya existe: {existing_admin.email}")
            return
        
        print("🚀 Creando usuarios iniciales...")
        
        # Crear usuario administrador
        admin_password = "admin123"
        hashed_password = get_password_hash(admin_password)
        
        admin_user = UsuarioModel(
            nombre="Administrador",
            telefono="1234567890",
            direccion="Oficina Central",
            edad=35,
            sexo="M",
            email="admin@redciudadana.com",
            password_hash=hashed_password,
            rol="admin",
            activo=True,
            id_lider_superior=None
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Admin creado: admin@redciudadana.com / admin123")
        
        # Crear usuario líder
        lider_password = "lider123"
        hashed_lider_password = get_password_hash(lider_password)
        
        lider_user = UsuarioModel(
            nombre="Juan Pérez",
            telefono="0987654321",
            direccion="Zona Centro",
            edad=45,
            sexo="M",
            email="lider@redciudadana.com",
            password_hash=hashed_lider_password,
            rol="lider",
            activo=True,
            id_lider_superior=admin_user.id
        )
        
        db.add(lider_user)
        db.commit()
        db.refresh(lider_user)
        
        print(f"✅ Líder creado: lider@redciudadana.com / lider123")
        
    except Exception as e:
        print(f"❌ Error creando usuarios: {e}")
        db.rollback()
    finally:
        db.close()

# 🔧 NUEVO: Función para migrar campo foto_url
def migrate_foto_url_auto():
    """Migrar campo foto_url automáticamente al iniciar"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL no encontrada para migración automática")
            return False
        
        print("🔧 Iniciando migración automática de foto_url...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Verificar si la tabla existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'reportes_ciudadanos'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("❌ Tabla reportes_ciudadanos no existe")
            return False
        
        # Verificar el tipo actual del campo foto_url
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'reportes_ciudadanos' 
            AND column_name = 'foto_url';
        """)
        
        column_info = cursor.fetchone()
        if not column_info:
            print("❌ Campo foto_url no encontrado")
            return False
        
        current_length = column_info[2]
        print(f"📏 Campo foto_url actual: {column_info[1]}({current_length})")
        
        # Si ya tiene el tamaño correcto, no hacer nada
        if current_length and current_length >= 50000:
            print("✅ Campo foto_url ya tiene el tamaño correcto")
        else:
            # Alterar el campo para aumentar el límite
            print("🔧 Alterando campo foto_url...")
            cursor.execute("""
                ALTER TABLE reportes_ciudadanos 
                ALTER COLUMN foto_url TYPE VARCHAR(50000);
            """)
            print("✅ Campo foto_url alterado exitosamente")
        
        # 🔧 NUEVA MIGRACIÓN: Hacer nullable ciudadano_id
        print("🔧 Iniciando migración automática de ciudadano_id...")
        cursor.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'reportes_ciudadanos' 
            AND column_name = 'ciudadano_id';
        """)
        
        ciudadano_info = cursor.fetchone()
        if ciudadano_info:
            is_nullable = ciudadano_info[1]
            print(f"📏 Campo ciudadano_id actual - nullable: {is_nullable}")
            
            if is_nullable == 'NO':
                print("🔧 Haciendo nullable la columna ciudadano_id...")
                cursor.execute("""
                    ALTER TABLE reportes_ciudadanos 
                    ALTER COLUMN ciudadano_id DROP NOT NULL;
                """)
                print("✅ Campo ciudadano_id ahora es nullable")
            else:
                print("✅ Campo ciudadano_id ya es nullable")
        else:
            print("⚠️ Columna ciudadano_id no encontrada")
        
        cursor.close()
        conn.close()
        
        print("🎉 Migración automática completada")
        return True
        
    except Exception as e:
        print(f"❌ Error durante migración automática: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando aplicación Red Ciudadana...")
    # Inicialización simplificada para evitar bloqueos
    yield
    print("🛑 Cerrando aplicación Red Ciudadana...")

# Crear usuarios iniciales al iniciar (en background para no bloquear startup)
try:
    create_initial_users()
except Exception as e:
    print(f"⚠️ Error creando usuarios iniciales: {e}")
    print("⚠️ Continuando sin usuarios iniciales...")

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
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=False,  # False para evitar problemas con credenciales
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los headers
)

# 🔧 NUEVO: Montar directorio de archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 🔧 NUEVO: Endpoint para servir imágenes específicas
@app.get("/uploads/{filename}")
async def get_image(filename: str):
    """Servir imágenes desde el directorio uploads"""
    file_path = f"uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

print('🔧 CORS SIMPLIFICADO - TODOS LOS MÉTODOS Y HEADERS PERMITIDOS')
print('🚀 FORZANDO DESPLIEGUE - Último commit: 7555c01ae')
print('🔥🔥🔥 CORS FIX APLICADO - Último commit: 208bd1d5f 🔥🔥🔥')
print('🎯 POST /reportes-ciudadanos/ DEBERÍA FUNCIONAR AHORA 🎯')
print('🔍 DEBUG: Logs detallados agregados para investigar problema de coordenadas')
print('📊 Ahora veremos exactamente qué datos se reciben y se guardan')
print('🚨🚨🚨 FORZANDO NUEVO DEPLOY - Último commit: 33f32502b 🚨🚨🚨')
print('🔥🔥🔥 ESTE DEPLOY DEBE INCLUIR LOGS DE DEBUG 🔥🔥🔥')
print('⚡⚡⚡ SI NO VES ESTOS MENSAJES, EL DEPLOY NO FUNCIONÓ ⚡⚡⚡')
print('🚨🚨🚨 CORS PROBLEM DETECTED - FORCING NEW DEPLOY 🚨🚨🚨')
print('🔥🔥🔥 CORS CONFIGURATION VERIFICATION REQUIRED 🔥🔥🔥')
print('⚡⚡⚡ DEPLOY MUST INCLUDE CORS FIX ⚡⚡⚡')

# 🆕 NUEVO: Endpoint de prueba para forzar despliegue
@app.get("/test-deployment")
async def test_deployment():
    return {
        "message": "Backend actualizado correctamente",
        "cors": "simplificado",
        "foto_url_limit": "50000",
        "endpoint_duplicado": "eliminado",
        "timestamp": "2024-12-28"
    }

# 🆕 NUEVO: Endpoint de prueba CORS
@app.get("/test-cors")
async def test_cors():
    return {
        "message": "CORS TEST - Si ves esto, el backend está actualizado",
        "cors_status": "verificando",
        "deploy_version": "b34282a10",
        "timestamp": "2024-12-28"
    }

# 🆕 NUEVO: Endpoint de prueba COMPLETAMENTE PÚBLICO
@app.get("/test-public")
async def test_public():
    return {
        "message": "ENDPOINT PÚBLICO FUNCIONANDO",
        "status": "public",
        "timestamp": "2024-12-28"
    }

# 🆕 NUEVO: Endpoint de prueba COMPLETAMENTE PÚBLICO 2
@app.get("/test-public-2")
async def test_public_2():
    return {
        "message": "ENDPOINT PÚBLICO 2 FUNCIONANDO",
        "status": "public",
        "timestamp": "2024-12-28"
    }

# 🆕 NUEVO: Endpoint de prueba IDÉNTICO al que falla
@app.get("/test-reportes-publicos")
async def test_reportes_publicos():
    return {
        "message": "ENDPOINT DE PRUEBA IDÉNTICO AL QUE FALLA",
        "status": "public",
        "timestamp": "2024-12-28"
    }

app.include_router(vehiculos.router)
app.include_router(movilizaciones.router)

LOGO_PATH = "static/logo.png"

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    print(f"Login attempt: {form_data.username}")
    # Usar form_data.username como identificador (puede ser email o teléfono)
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        print(f"Authentication failed for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    print(f"Login successful for: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint OPTIONS para CORS preflight
@app.options("/login")
async def login_options():
    return {"message": "OK"}

# Endpoint adicional para login con JSON
@app.post("/login", response_model=Token)
async def login_json(
    login_data: Login,
    db: Session = Depends(get_db)
):
    print(f"JSON Login attempt: {login_data.identificador}")
    user = authenticate_user(db, login_data.identificador, login_data.password)
    if not user:
        print(f"JSON Authentication failed for: {login_data.identificador}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    print(f"JSON Login successful for: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=Usuario)
@app.get("/users/me", response_model=Usuario)
async def read_users_me(current_user: Usuario = Depends(get_current_active_user)):
    print(f"Endpoint /users/me called for user: {current_user.email if current_user else 'None'}")
    return current_user

@app.post("/users/", response_model=Usuario)
async def create_user(user: UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    db_user = db.query(UsuarioModel).filter(UsuarioModel.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user.password)
    db_user = UsuarioModel(
        nombre=user.nombre,
        telefono=user.telefono,
        direccion=user.direccion,
        edad=user.edad,
        sexo=user.sexo,
        email=user.email,
        password_hash=hashed_password,
        rol=user.rol,
        id_lider_superior=user.id_lider_superior
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/")
async def root():
    return {"message": "Red Ciudadana API - Sistema de Partido Político"}

@app.get("/health")
async def health_check():
    try:
        return {
            "status": "healthy", 
            "service": "Red Ciudadana API", 
            "platform": "Railway", 
            "cors": "working", 
            "timestamp": "2024-12-28", 
            "version": "1.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "Red Ciudadana API"
        }

@app.options("/login")
async def login_options():
    return {"message": "CORS preflight OK", "cors_test": "working"}

@app.get("/cors-test")
async def cors_test():
    return {"cors": "working", "timestamp": "2024", "status": "OK"}

@app.get("/users/", response_model=List[Usuario])
async def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Admin ve todos, líderes ven subordinados, capturista solo a sí mismo
    if current_user.rol == "admin":
        users = db.query(UsuarioModel).offset(skip).limit(limit).all()
    elif current_user.rol in ["presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        # Ver subordinados directos e indirectos
        def get_subordinates(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            all_subs = []
            for sub in subs:
                all_subs.append(sub)
                all_subs.extend(get_subordinates(sub.id))
            return all_subs
        users = [current_user] + get_subordinates(current_user.id)
    else:
        users = [current_user]
    return users

@app.get("/users/{user_id}", response_model=Usuario)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not can_access_user(user_id, current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este usuario")
    return user

@app.put("/users/{user_id}", response_model=Usuario)
async def update_user(user_id: int, user_update: UsuarioUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not can_access_user(user_id, current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar este usuario")
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@app.delete("/users/{user_id}", response_model=Usuario)
async def deactivate_user(user_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(require_admin)):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = False
    db.commit()
    db.refresh(user)
    return user

@app.get("/users/{user_id}/subordinates", response_model=List[Usuario])
async def get_subordinates(user_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if not can_access_user(current_user, user_id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver los subordinados de este usuario")
    def get_subs(uid):
        subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == uid, UsuarioModel.activo == True).all()
        all_subs = []
        for sub in subs:
            all_subs.append(sub)
            all_subs.extend(get_subs(sub.id))
        return all_subs
    return get_subs(user_id)

class PasswordUpdate(BaseModel):
    new_password: str

@app.put("/users/{user_id}/password", response_model=Usuario)
async def update_user_password(user_id: int, password_update: PasswordUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(require_admin)):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password_hash = bcrypt.hash(password_update.new_password)
    db.commit()
    db.refresh(user)
    return user

@app.get("/personas/", response_model=List[Persona])
async def list_personas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Admin ve todas, líderes ven las de sus subordinados, capturista solo las que registró
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    if current_user.rol == "admin":
        personas = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        # Ver personas registradas por el líder y sus subordinados
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        personas = query.filter(PersonaModel.id_lider_responsable.in_(ids)).offset(skip).limit(limit).all()
    else:
        personas = query.filter(PersonaModel.id_lider_responsable == current_user.id).offset(skip).limit(limit).all()
    return personas

@app.get("/personas/con-usuario-registro/", response_model=List[dict])
async def list_personas_con_usuario_registro(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Lista personas con información del usuario que las registró"""
    # Filtros por rol:
    # - admin y presidente: ven todas las personas
    # - otros roles: solo ven las de su jerarquía hacia abajo
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    
    if current_user.rol in ["admin", "presidente"]:
        # Admin y presidente ven todas las personas
        personas = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        # Líderes ven personas de su jerarquía hacia abajo
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        personas = query.filter(PersonaModel.id_lider_responsable.in_(ids)).offset(skip).limit(limit).all()
    else:
        # Capturistas y otros roles solo ven las personas que registraron
        personas = query.filter(PersonaModel.id_usuario_registro == current_user.id).offset(skip).limit(limit).all()
    
    # Incluir información del usuario que registró cada persona
    resultado = []
    for persona in personas:
        usuario_registro = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_usuario_registro).first()
        persona_data = {
            "id": persona.id,
            "nombre": persona.nombre,
            "telefono": persona.telefono,
            "direccion": persona.direccion,
            "edad": persona.edad,
            "sexo": persona.sexo,
            "clave_elector": persona.clave_elector,
            "curp": persona.curp,
            "num_emision": persona.num_emision,
            "seccion_electoral": persona.seccion_electoral,
            "distrito": persona.distrito,
            "municipio": persona.municipio,
            "estado": persona.estado,
            "colonia": persona.colonia,
            "codigo_postal": persona.codigo_postal,
            "fecha_registro": persona.fecha_registro,
            "activo": persona.activo,
            "usuario_registro": {
                "id": usuario_registro.id if usuario_registro else None,
                "nombre": usuario_registro.nombre if usuario_registro else "N/A",
                "rol": usuario_registro.rol if usuario_registro else "N/A"
            } if usuario_registro else None
        }
        resultado.append(persona_data)
    
    return resultado

@app.get("/personas/ubicaciones", response_model=List[PersonaUbicacion])
async def obtener_ubicaciones_personas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    personas = db.query(PersonaModel).filter(
        PersonaModel.activo == True,
        PersonaModel.latitud.isnot(None),
        PersonaModel.longitud.isnot(None)
    ).all()
    return [PersonaUbicacion(id=p.id, nombre=p.nombre, latitud=p.latitud, longitud=p.longitud) for p in personas]

class GeocodificarRequest(BaseModel):
    direccion: str
    colonia: str = None
    municipio: str = None
    estado: str = None
    codigo_postal: str = None

class GeocodificarResponse(BaseModel):
    latitud: float
    longitud: float
    direccion_formateada: str

@app.post("/geocodificar", response_model=GeocodificarResponse)
async def geocodificar_direccion(request: GeocodificarRequest):
    """
    Geocodifica una dirección usando OpenStreetMap Nominatim o coordenadas específicas por código postal
    """
    try:
        # Intentar usar OpenStreetMap Nominatim primero (más preciso)
        try:
            import requests
            
            # Construir dirección completa
            direccion_completa = f"{request.direccion}"
            if request.colonia:
                direccion_completa += f", {request.colonia}"
            if request.codigo_postal:
                direccion_completa += f", CP {request.codigo_postal}"
            if request.municipio:
                direccion_completa += f", {request.municipio}"
            if request.estado:
                direccion_completa += f", {request.estado}"
            direccion_completa += ", México"
            
            # URL de OpenStreetMap Nominatim
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": direccion_completa,
                "format": "json",
                "limit": 1,
                "countrycodes": "mx"
            }
            
            headers = {
                "User-Agent": "RedCiudadana/1.0"
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            data = response.json()
            
            if data and len(data) > 0:
                location = data[0]
                return GeocodificarResponse(
                    latitud=float(location["lat"]),
                    longitud=float(location["lon"]),
                    direccion_formateada=direccion_completa
                )
        except Exception as e:
            print(f"Error con OpenStreetMap API: {e}")
            # Continuar con el sistema de fallback
        # Coordenadas específicas por código postal y municipio (más precisas)
        coordenadas_por_cp = {
            # Sonora - Etchojoa (coordenadas más específicas)
            "85280": {"lat": 26.907442257864734, "lon": -109.62408211899701, "municipio": "Etchojoa", "descripcion": "Centro de Etchojoa"},
            "85281": {"lat": 26.9085, "lon": -109.6250, "municipio": "Etchojoa", "descripcion": "Zona Norte de Etchojoa"},
            "85282": {"lat": 26.9065, "lon": -109.6235, "municipio": "Etchojoa", "descripcion": "Zona Sur de Etchojoa"},
            "85283": {"lat": 26.9078, "lon": -109.6245, "municipio": "Etchojoa", "descripcion": "Zona Este de Etchojoa"},
            "85284": {"lat": 26.9070, "lon": -109.6238, "municipio": "Etchojoa", "descripcion": "Zona Oeste de Etchojoa"},
            "85285": {"lat": 26.9075, "lon": -109.6242, "municipio": "Etchojoa", "descripcion": "Zona Central de Etchojoa"},
            "85286": {"lat": 26.9072, "lon": -109.6240, "municipio": "Etchojoa", "descripcion": "Zona Sur-Central de Etchojoa"},
            "85287": {"lat": 26.9078, "lon": -109.6243, "municipio": "Etchojoa", "descripcion": "Zona Norte-Central de Etchojoa"},
            "85288": {"lat": 26.9073, "lon": -109.6241, "municipio": "Etchojoa", "descripcion": "Zona Este-Central de Etchojoa"},
            "85289": {"lat": 26.9071, "lon": -109.6239, "municipio": "Etchojoa", "descripcion": "Zona Oeste-Central de Etchojoa"},
            
            # Sonora - Hermosillo (coordenadas más específicas)
            "83000": {"lat": 29.0729, "lon": -110.9559, "municipio": "Hermosillo", "descripcion": "Centro de Hermosillo"},
            "83010": {"lat": 29.0745, "lon": -110.9572, "municipio": "Hermosillo", "descripcion": "Zona Norte de Hermosillo"},
            "83020": {"lat": 29.0713, "lon": -110.9546, "municipio": "Hermosillo", "descripcion": "Zona Sur de Hermosillo"},
            "83030": {"lat": 29.0737, "lon": -110.9565, "municipio": "Hermosillo", "descripcion": "Zona Este de Hermosillo"},
            "83040": {"lat": 29.0721, "lon": -110.9553, "municipio": "Hermosillo", "descripcion": "Zona Oeste de Hermosillo"},
            
            # Sonora - Ciudad Obregón (coordenadas más específicas)
            "85000": {"lat": 27.4864, "lon": -109.9408, "municipio": "Ciudad Obregón", "descripcion": "Centro de Ciudad Obregón"},
            "85010": {"lat": 27.4880, "lon": -109.9421, "municipio": "Ciudad Obregón", "descripcion": "Zona Norte de Ciudad Obregón"},
            "85020": {"lat": 27.4848, "lon": -109.9395, "municipio": "Ciudad Obregón", "descripcion": "Zona Sur de Ciudad Obregón"},
            "85030": {"lat": 27.4872, "lon": -109.9414, "municipio": "Ciudad Obregón", "descripcion": "Zona Este de Ciudad Obregón"},
            "85040": {"lat": 27.4856, "lon": -109.9402, "municipio": "Ciudad Obregón", "descripcion": "Zona Oeste de Ciudad Obregón"},
            
            # CDMX - Centro (coordenadas más específicas)
            "06000": {"lat": 19.4326, "lon": -99.1332, "municipio": "Ciudad de México", "descripcion": "Centro Histórico"},
            "06010": {"lat": 19.4342, "lon": -99.1345, "municipio": "Ciudad de México", "descripcion": "Zona Norte del Centro"},
            "06020": {"lat": 19.4310, "lon": -99.1319, "municipio": "Ciudad de México", "descripcion": "Zona Sur del Centro"},
            "06030": {"lat": 19.4334, "lon": -99.1338, "municipio": "Ciudad de México", "descripcion": "Zona Este del Centro"},
            "06040": {"lat": 19.4318, "lon": -99.1326, "municipio": "Ciudad de México", "descripcion": "Zona Oeste del Centro"},
            
            # CDMX - Coyoacán (coordenadas más específicas)
            "04000": {"lat": 19.3550, "lon": -99.1626, "municipio": "Coyoacán", "descripcion": "Centro de Coyoacán"},
            "04010": {"lat": 19.3566, "lon": -99.1639, "municipio": "Coyoacán", "descripcion": "Zona Norte de Coyoacán"},
            "04020": {"lat": 19.3534, "lon": -99.1613, "municipio": "Coyoacán", "descripcion": "Zona Sur de Coyoacán"},
            "04030": {"lat": 19.3558, "lon": -99.1632, "municipio": "Coyoacán", "descripcion": "Zona Este de Coyoacán"},
            "04040": {"lat": 19.3542, "lon": -99.1620, "municipio": "Coyoacán", "descripcion": "Zona Oeste de Coyoacán"},
            
            # Jalisco - Guadalajara (coordenadas más específicas)
            "44100": {"lat": 20.6597, "lon": -103.3496, "municipio": "Guadalajara", "descripcion": "Centro de Guadalajara"},
            "44110": {"lat": 20.6613, "lon": -103.3509, "municipio": "Guadalajara", "descripcion": "Zona Norte de Guadalajara"},
            "44120": {"lat": 20.6581, "lon": -103.3483, "municipio": "Guadalajara", "descripcion": "Zona Sur de Guadalajara"},
            "44130": {"lat": 20.6605, "lon": -103.3502, "municipio": "Guadalajara", "descripcion": "Zona Este de Guadalajara"},
            "44140": {"lat": 20.6589, "lon": -103.3490, "municipio": "Guadalajara", "descripcion": "Zona Oeste de Guadalajara"},
            
            # Nuevo León - Monterrey (coordenadas más específicas)
            "64000": {"lat": 25.6866, "lon": -100.3161, "municipio": "Monterrey", "descripcion": "Centro de Monterrey"},
            "64010": {"lat": 25.6882, "lon": -100.3174, "municipio": "Monterrey", "descripcion": "Zona Norte de Monterrey"},
            "64020": {"lat": 25.6850, "lon": -100.3148, "municipio": "Monterrey", "descripcion": "Zona Sur de Monterrey"},
            "64030": {"lat": 25.6874, "lon": -100.3167, "municipio": "Monterrey", "descripcion": "Zona Este de Monterrey"},
            "64040": {"lat": 25.6858, "lon": -100.3155, "municipio": "Monterrey", "descripcion": "Zona Oeste de Monterrey"},
            
            # Baja California - Tijuana (coordenadas más específicas)
            "22000": {"lat": 32.5149, "lon": -117.0382, "municipio": "Tijuana", "descripcion": "Centro de Tijuana"},
            "22010": {"lat": 32.5165, "lon": -117.0395, "municipio": "Tijuana", "descripcion": "Zona Norte de Tijuana"},
            "22020": {"lat": 32.5133, "lon": -117.0369, "municipio": "Tijuana", "descripcion": "Zona Sur de Tijuana"},
            "22030": {"lat": 32.5157, "lon": -117.0388, "municipio": "Tijuana", "descripcion": "Zona Este de Tijuana"},
            "22040": {"lat": 32.5141, "lon": -117.0376, "municipio": "Tijuana", "descripcion": "Zona Oeste de Tijuana"},
            
            # Veracruz - Veracruz (coordenadas más específicas)
            "91700": {"lat": 19.1738, "lon": -96.1342, "municipio": "Veracruz", "descripcion": "Centro de Veracruz"},
            "91710": {"lat": 19.1754, "lon": -96.1355, "municipio": "Veracruz", "descripcion": "Zona Norte de Veracruz"},
            "91720": {"lat": 19.1722, "lon": -96.1329, "municipio": "Veracruz", "descripcion": "Zona Sur de Veracruz"},
            "91730": {"lat": 19.1746, "lon": -96.1348, "municipio": "Veracruz", "descripcion": "Zona Este de Veracruz"},
            "91740": {"lat": 19.1730, "lon": -96.1336, "municipio": "Veracruz", "descripcion": "Zona Oeste de Veracruz"},
            
            # Puebla - Puebla (coordenadas más específicas)
            "72000": {"lat": 19.0413, "lon": -98.2062, "municipio": "Puebla", "descripcion": "Centro de Puebla"},
            "72010": {"lat": 19.0429, "lon": -98.2075, "municipio": "Puebla", "descripcion": "Zona Norte de Puebla"},
            "72020": {"lat": 19.0397, "lon": -98.2049, "municipio": "Puebla", "descripcion": "Zona Sur de Puebla"},
            "72030": {"lat": 19.0421, "lon": -98.2068, "municipio": "Puebla", "descripcion": "Zona Este de Puebla"},
            "72040": {"lat": 19.0405, "lon": -98.2056, "municipio": "Puebla", "descripcion": "Zona Oeste de Puebla"},
            
            # Guanajuato - León (coordenadas más específicas)
            "37000": {"lat": 21.1253, "lon": -101.6866, "municipio": "León", "descripcion": "Centro de León"},
            "37010": {"lat": 21.1269, "lon": -101.6879, "municipio": "León", "descripcion": "Zona Norte de León"},
            "37020": {"lat": 21.1237, "lon": -101.6853, "municipio": "León", "descripcion": "Zona Sur de León"},
            "37030": {"lat": 21.1251, "lon": -101.6872, "municipio": "León", "descripcion": "Zona Este de León"},
            "37040": {"lat": 21.1245, "lon": -101.6860, "municipio": "León", "descripcion": "Zona Oeste de León"},
            
            # Chihuahua - Chihuahua (coordenadas más específicas)
            "31000": {"lat": 28.6353, "lon": -106.0889, "municipio": "Chihuahua", "descripcion": "Centro de Chihuahua"},
            "31010": {"lat": 28.6369, "lon": -106.0902, "municipio": "Chihuahua", "descripcion": "Zona Norte de Chihuahua"},
            "31020": {"lat": 28.6337, "lon": -106.0876, "municipio": "Chihuahua", "descripcion": "Zona Sur de Chihuahua"},
            "31030": {"lat": 28.6351, "lon": -106.0895, "municipio": "Chihuahua", "descripcion": "Zona Este de Chihuahua"},
            "31040": {"lat": 28.6345, "lon": -106.0883, "municipio": "Chihuahua", "descripcion": "Zona Oeste de Chihuahua"},
            
            # Coahuila - Saltillo (coordenadas más específicas)
            "25000": {"lat": 25.4232, "lon": -101.0053, "municipio": "Saltillo", "descripcion": "Centro de Saltillo"},
            "25010": {"lat": 25.4248, "lon": -101.0066, "municipio": "Saltillo", "descripcion": "Zona Norte de Saltillo"},
            "25020": {"lat": 25.4216, "lon": -101.0040, "municipio": "Saltillo", "descripcion": "Zona Sur de Saltillo"},
            "25030": {"lat": 25.4230, "lon": -101.0059, "municipio": "Saltillo", "descripcion": "Zona Este de Saltillo"},
            "25040": {"lat": 25.4224, "lon": -101.0047, "municipio": "Saltillo", "descripcion": "Zona Oeste de Saltillo"},
            
            # Más códigos postales específicos para mayor precisión
            # Sonora - Nogales
            "84000": {"lat": 31.3189, "lon": -110.9458, "municipio": "Nogales", "descripcion": "Centro de Nogales"},
            "84010": {"lat": 31.3205, "lon": -110.9471, "municipio": "Nogales", "descripcion": "Zona Norte de Nogales"},
            "84020": {"lat": 31.3173, "lon": -110.9445, "municipio": "Nogales", "descripcion": "Zona Sur de Nogales"},
            
            # Sonora - Guaymas
            "85400": {"lat": 27.9194, "lon": -110.8978, "municipio": "Guaymas", "descripcion": "Centro de Guaymas"},
            "85410": {"lat": 27.9210, "lon": -110.8991, "municipio": "Guaymas", "descripcion": "Zona Norte de Guaymas"},
            "85420": {"lat": 27.9178, "lon": -110.8965, "municipio": "Guaymas", "descripcion": "Zona Sur de Guaymas"},
            
            # Jalisco - Zapopan
            "45000": {"lat": 20.7236, "lon": -103.3848, "municipio": "Zapopan", "descripcion": "Centro de Zapopan"},
            "45010": {"lat": 20.7252, "lon": -103.3861, "municipio": "Zapopan", "descripcion": "Zona Norte de Zapopan"},
            "45020": {"lat": 20.7220, "lon": -103.3835, "municipio": "Zapopan", "descripcion": "Zona Sur de Zapopan"},
            
            # Nuevo León - San Nicolás
            "66400": {"lat": 25.7474, "lon": -100.3027, "municipio": "San Nicolás", "descripcion": "Centro de San Nicolás"},
            "66410": {"lat": 25.7490, "lon": -100.3040, "municipio": "San Nicolás", "descripcion": "Zona Norte de San Nicolás"},
            "66420": {"lat": 25.7458, "lon": -100.3014, "municipio": "San Nicolás", "descripcion": "Zona Sur de San Nicolás"},
            
            # Baja California - Mexicali
            "21000": {"lat": 32.6275, "lon": -115.4544, "municipio": "Mexicali", "descripcion": "Centro de Mexicali"},
            "21010": {"lat": 32.6291, "lon": -115.4557, "municipio": "Mexicali", "descripcion": "Zona Norte de Mexicali"},
            "21020": {"lat": 32.6259, "lon": -115.4531, "municipio": "Mexicali", "descripcion": "Zona Sur de Mexicali"},
            
            # Veracruz - Xalapa
            "91000": {"lat": 19.5312, "lon": -96.9159, "municipio": "Xalapa", "descripcion": "Centro de Xalapa"},
            "91010": {"lat": 19.5328, "lon": -96.9172, "municipio": "Xalapa", "descripcion": "Zona Norte de Xalapa"},
            "91020": {"lat": 19.5296, "lon": -96.9146, "municipio": "Xalapa", "descripcion": "Zona Sur de Xalapa"},
            
            # Guanajuato - Irapuato
            "36500": {"lat": 20.6767, "lon": -101.3563, "municipio": "Irapuato", "descripcion": "Centro de Irapuato"},
            "36510": {"lat": 20.6783, "lon": -101.3576, "municipio": "Irapuato", "descripcion": "Zona Norte de Irapuato"},
            "36520": {"lat": 20.6751, "lon": -101.3550, "municipio": "Irapuato", "descripcion": "Zona Sur de Irapuato"},
            
            # Chihuahua - Juárez
            "32000": {"lat": 31.7385, "lon": -106.4874, "municipio": "Juárez", "descripcion": "Centro de Juárez"},
            "32010": {"lat": 31.7401, "lon": -106.4887, "municipio": "Juárez", "descripcion": "Zona Norte de Juárez"},
            "32020": {"lat": 31.7369, "lon": -106.4861, "municipio": "Juárez", "descripcion": "Zona Sur de Juárez"},
            
            # Coahuila - Torreón
            "27000": {"lat": 25.5428, "lon": -103.4068, "municipio": "Torreón", "descripcion": "Centro de Torreón"},
            "27010": {"lat": 25.5444, "lon": -103.4081, "municipio": "Torreón", "descripcion": "Zona Norte de Torreón"},
            "27020": {"lat": 25.5412, "lon": -103.4055, "municipio": "Torreón", "descripcion": "Zona Sur de Torreón"}
        }
        
        # Coordenadas específicas por municipio (fallback)
        coordenadas_por_municipio = {
            # Sonora
            "ETCHOJOA": {"lat": 27.0167, "lon": -109.6333},
            "HERMOSILLO": {"lat": 29.0729, "lon": -110.9559},
            "NOGALES": {"lat": 31.3189, "lon": -110.9458},
            "CIUDAD OBREGON": {"lat": 27.4864, "lon": -109.9408},
            "GUAYMAS": {"lat": 27.9194, "lon": -110.8978},
            
            # CDMX
            "CIUDAD DE MEXICO": {"lat": 19.4326, "lon": -99.1332},
            "MEXICO": {"lat": 19.4326, "lon": -99.1332},
            
            # Jalisco
            "GUADALAJARA": {"lat": 20.6597, "lon": -103.3496},
            "ZAPOPAN": {"lat": 20.7236, "lon": -103.3848},
            
            # Nuevo León
            "MONTERREY": {"lat": 25.6866, "lon": -100.3161},
            "SAN NICOLAS": {"lat": 25.7474, "lon": -100.3027},
            
            # Baja California
            "TIJUANA": {"lat": 32.5149, "lon": -117.0382},
            "MEXICALI": {"lat": 32.6275, "lon": -115.4544},
            
            # Veracruz
            "VERACRUZ": {"lat": 19.1738, "lon": -96.1342},
            "XALAPA": {"lat": 19.5312, "lon": -96.9159},
            
            # Puebla
            "PUEBLA": {"lat": 19.0413, "lon": -98.2062, "descripcion": "Centro de Puebla"},
            
            # Guanajuato
            "LEON": {"lat": 21.1253, "lon": -101.6866, "descripcion": "Centro de León"},
            "IRAPUATO": {"lat": 20.6767, "lon": -101.3563, "descripcion": "Centro de Irapuato"},
            
            # Chihuahua
            "CHIHUAHUA": {"lat": 28.6353, "lon": -106.0889, "descripcion": "Centro de Chihuahua"},
            "JUAREZ": {"lat": 31.7385, "lon": -106.4874, "descripcion": "Centro de Juárez"},
            
            # Coahuila
            "SALTILLO": {"lat": 25.4232, "lon": -101.0053, "descripcion": "Centro de Saltillo"},
            "TORREON": {"lat": 25.5428, "lon": -103.4068, "descripcion": "Centro de Torreón"}
        }
        
        # Construir dirección formateada
        direccion_formateada = request.direccion
        if request.colonia:
            direccion_formateada += f", {request.colonia}"
        if request.codigo_postal:
            direccion_formateada += f", CP {request.codigo_postal}"
        if request.municipio:
            direccion_formateada += f", {request.municipio}"
        if request.estado:
            direccion_formateada += f", {request.estado}"
        direccion_formateada += ", México"
        
        # Función para calcular coordenadas más precisas basadas en el código postal
        def calcular_coordenadas_precisas(cp: str, municipio: str = None, estado: str = None):
            # Buscar coordenadas por código postal primero (más preciso)
            if cp and cp in coordenadas_por_cp:
                coords = coordenadas_por_cp[cp]
                # Si el municipio no está especificado, usar el del CP
                if not municipio:
                    municipio = coords["municipio"]
                return coords, municipio
            
            # Si no encuentra el CP específico, intentar con CPs similares
            if cp:
                # Buscar CPs que empiecen igual (misma zona)
                cp_base = cp[:3]  # Primeros 3 dígitos
                for cp_key, coords_data in coordenadas_por_cp.items():
                    if cp_key.startswith(cp_base):
                        coords = coords_data
                        if not municipio:
                            municipio = coords["municipio"]
                        return coords, municipio
            
            # Fallback: buscar por municipio
            municipio_key = municipio.upper() if municipio else ""
            if municipio_key in coordenadas_por_municipio:
                coords = coordenadas_por_municipio[municipio_key]
                return coords, municipio
            else:
                # Si no encuentra el municipio específico, usar coordenadas por estado
                coordenadas_estados = {
                    "CDMX": {"lat": 19.4326, "lon": -99.1332, "descripcion": "Centro de CDMX"},
                    "JAL": {"lat": 20.6597, "lon": -103.3496, "descripcion": "Centro de Jalisco"},
                    "NL": {"lat": 25.6866, "lon": -100.3161, "descripcion": "Centro de Nuevo León"},
                    "BCN": {"lat": 32.5149, "lon": -117.0382, "descripcion": "Centro de Baja California"},
                    "VER": {"lat": 19.1738, "lon": -96.1342, "descripcion": "Centro de Veracruz"},
                    "PUE": {"lat": 19.0413, "lon": -98.2062, "descripcion": "Centro de Puebla"},
                    "GTO": {"lat": 20.6597, "lon": -101.3550, "descripcion": "Centro de Guanajuato"},
                    "SON": {"lat": 29.0729, "lon": -110.9559, "descripcion": "Centro de Sonora"},
                    "CHH": {"lat": 28.6353, "lon": -106.0889, "descripcion": "Centro de Chihuahua"},
                    "COA": {"lat": 27.0586, "lon": -101.7063, "descripcion": "Centro de Coahuila"}
                }
                estado_key = estado.upper() if estado else "CDMX"
                coords = coordenadas_estados.get(estado_key, coordenadas_estados["CDMX"])
                return coords, municipio
        
        # Obtener coordenadas precisas
        coords, municipio_actualizado = calcular_coordenadas_precisas(
            request.codigo_postal, 
            request.municipio, 
            request.estado
        )
        
        # Debug: mostrar qué coordenadas se están usando
        print(f"CP: {request.codigo_postal}, Municipio: {request.municipio}, Estado: {request.estado}")
        print(f"Coordenadas obtenidas: {coords}")
        
        # Actualizar municipio si no estaba especificado
        if not request.municipio:
            request.municipio = municipio_actualizado
        
        return GeocodificarResponse(
            latitud=coords["lat"],
            longitud=coords["lon"],
            direccion_formateada=direccion_formateada
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al geocodificar: {str(e)}")

@app.get("/personas/{persona_id}", response_model=Persona)
async def get_persona(persona_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    # Control de acceso: solo líderes de la jerarquía o admin pueden ver
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if persona.id_lider_responsable == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para ver esta persona")
    return persona

@app.post("/personas/", response_model=Persona)
async def create_persona(persona: PersonaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Solo líderes y capturistas pueden registrar personas
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para registrar personas")
    # Validar clave de elector única
    if persona.clave_elector:
        exists = db.query(PersonaModel).filter(PersonaModel.clave_elector == persona.clave_elector).first()
        if exists:
            raise HTTPException(status_code=400, detail="Clave de elector ya registrada")
    
    # Crear la persona con el usuario que la registra
    persona_data = persona.dict()
    persona_data['id_usuario_registro'] = current_user.id
    
    db_persona = PersonaModel(**persona_data)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@app.put("/personas/{persona_id}", response_model=Persona)
async def update_persona(persona_id: int, persona_update: PersonaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    # Control de acceso: solo líderes de la jerarquía o admin pueden editar
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if persona.id_lider_responsable == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para modificar esta persona")
    for field, value in persona_update.dict(exclude_unset=True).items():
        setattr(persona, field, value)
    db.commit()
    db.refresh(persona)
    return persona

@app.delete("/personas/{persona_id}", response_model=Persona)
async def deactivate_persona(persona_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    # Solo admin o líder jerárquico puede desactivar
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if persona.id_lider_responsable == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para desactivar esta persona")
    persona.activo = False
    db.commit()
    db.refresh(persona)
    return persona

@app.get("/personas/buscar/", response_model=List[Persona])
async def buscar_personas(
    clave_elector: str = None,
    seccion_electoral: str = None,
    colonia: str = None,
    id_lider_responsable: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    # Filtros por rol:
    # - admin y presidente: ven todas las personas
    # - otros roles: solo ven las de su jerarquía hacia abajo
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    
    if current_user.rol in ["admin", "presidente"]:
        # Admin y presidente ven todas las personas
        pass
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        # Líderes ven personas de su jerarquía hacia abajo
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        query = query.filter(PersonaModel.id_lider_responsable.in_(ids))
    else:
        # Capturistas y otros roles solo ven las personas que registraron
        query = query.filter(PersonaModel.id_usuario_registro == current_user.id)
    
    # Aplicar filtros adicionales
    if clave_elector:
        query = query.filter(PersonaModel.clave_elector == clave_elector)
    if seccion_electoral:
        query = query.filter(PersonaModel.seccion_electoral == seccion_electoral)
    if colonia:
        query = query.filter(PersonaModel.colonia == colonia)
    if id_lider_responsable:
        query = query.filter(PersonaModel.id_lider_responsable == id_lider_responsable)
    
    return query.all()

@app.get("/eventos/", response_model=List[Evento])
async def list_eventos(
    skip: int = 0, 
    limit: int = 100, 
    activos: bool = True,
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(EventoModel).filter(EventoModel.activo == True)
    
    # Permitir que todos los líderes vean todos los eventos activos
    if current_user.rol == "admin":
        pass  # Admin ve todos los eventos
    elif current_user.rol in ["presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        # Todos los líderes pueden ver todos los eventos activos para movilización
        pass
    else:
        # Otros usuarios solo ven sus propios eventos
        query = query.filter(EventoModel.id_lider_organizador == current_user.id)
    
    # Filtrar por estado (activos o históricos)
    ahora = datetime.utcnow()
    if activos:
        query = query.filter(EventoModel.fecha >= ahora)
        eventos = query.order_by(EventoModel.fecha.asc()).offset(skip).limit(limit).all()
    else:
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.desc()).offset(skip).limit(limit).all()
    
    return eventos

@app.get("/eventos/{evento_id}", response_model=Evento)
async def get_evento(evento_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    # Control de acceso: solo líderes de la jerarquía o admin pueden ver
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if evento.id_lider_organizador == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para ver este evento")
    return evento

@app.post("/eventos/", response_model=Evento)
async def create_evento(evento: EventoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Solo líderes pueden crear eventos
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para crear eventos")
    db_evento = EventoModel(**evento.dict())
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    return db_evento

@app.put("/eventos/{evento_id}", response_model=Evento)
async def update_evento(evento_id: int, evento_update: EventoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    # Control de acceso: solo líderes de la jerarquía o admin pueden editar
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if evento.id_lider_organizador == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para modificar este evento")
    for field, value in evento_update.dict(exclude_unset=True).items():
        setattr(evento, field, value)
    db.commit()
    db.refresh(evento)
    return evento

@app.delete("/eventos/{evento_id}", response_model=Evento)
async def deactivate_evento(evento_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    # Solo admin o líder jerárquico puede desactivar
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if evento.id_lider_organizador == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para desactivar este evento")
    evento.activo = False
    db.commit()
    db.refresh(evento)
    return evento

@app.get("/eventos/buscar/", response_model=List[Evento])
async def buscar_eventos(
    seccion_electoral: str = None,
    colonia: str = None,
    tipo: str = None,
    id_lider_organizador: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(EventoModel).filter(EventoModel.activo == True)
    if seccion_electoral:
        query = query.filter(EventoModel.seccion_electoral == seccion_electoral)
    if colonia:
        query = query.filter(EventoModel.colonia == colonia)
    if tipo:
        query = query.filter(EventoModel.tipo == tipo)
    if id_lider_organizador:
        query = query.filter(EventoModel.id_lider_organizador == id_lider_organizador)
    return query.all()

@app.get("/asistencias/", response_model=List[Asistencia])
async def list_asistencias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    query = db.query(AsistenciaModel)
    if current_user.rol == "admin":
        asistencias = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        # Ver asistencias de eventos organizados por el líder y sus subordinados
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        eventos_ids = db.query(EventoModel.id).filter(EventoModel.id_lider_organizador.in_(ids)).all()
        eventos_ids = [e[0] for e in eventos_ids]
        asistencias = query.filter(AsistenciaModel.id_evento.in_(eventos_ids)).offset(skip).limit(limit).all()
    else:
        # Capturista ve solo asistencias de eventos que organizó
        eventos_ids = db.query(EventoModel.id).filter(EventoModel.id_lider_organizador == current_user.id).all()
        eventos_ids = [e[0] for e in eventos_ids]
        asistencias = query.filter(AsistenciaModel.id_evento.in_(eventos_ids)).offset(skip).limit(limit).all()
    return asistencias

@app.post("/asistencias/", response_model=Asistencia)
async def create_asistencia(asistencia: AsistenciaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Verificar que el evento existe y el usuario tiene permisos
    evento = db.query(EventoModel).filter(EventoModel.id == asistencia.id_evento, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    # Verificar que la persona existe
    persona = db.query(PersonaModel).filter(PersonaModel.id == asistencia.id_persona, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    # Verificar permisos: solo líderes de la jerarquía o admin pueden registrar asistencias
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if evento.id_lider_organizador == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para registrar asistencias en este evento")
    # Verificar que no existe ya una asistencia para esta persona en este evento
    existing = db.query(AsistenciaModel).filter(
        AsistenciaModel.id_evento == asistencia.id_evento,
        AsistenciaModel.id_persona == asistencia.id_persona
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una asistencia registrada para esta persona en este evento")
    db_asistencia = AsistenciaModel(**asistencia.dict())
    db.add(db_asistencia)
    db.commit()
    db.refresh(db_asistencia)
    return db_asistencia

@app.put("/asistencias/{asistencia_id}", response_model=Asistencia)
async def update_asistencia(asistencia_id: int, asistencia_update: AsistenciaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    asistencia = db.query(AsistenciaModel).filter(AsistenciaModel.id == asistencia_id).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    # Verificar permisos: solo líderes de la jerarquía o admin pueden editar
    evento = db.query(EventoModel).filter(EventoModel.id == asistencia.id_evento).first()
    if current_user.rol != "admin":
        def is_in_hierarchy(lider_id):
            if evento.id_lider_organizador == lider_id:
                return True
            lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
            if lider and lider.id_lider_superior:
                return is_in_hierarchy(lider.id_lider_superior)
            return False
        if not is_in_hierarchy(current_user.id):
            raise HTTPException(status_code=403, detail="No tiene permisos para modificar esta asistencia")
    # Guardar el valor anterior de asistio para comparar
    asistio_anterior = asistencia.asistio
    
    for field, value in asistencia_update.dict(exclude_unset=True).items():
        setattr(asistencia, field, value)
    
    # Si se cambió el estado de asistencia, actualizar también la asignación de movilización
    if 'asistio' in asistencia_update.dict(exclude_unset=True) and asistio_anterior != asistencia.asistio:
        asignacion_movilizacion = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_evento == asistencia.id_evento,
            AsignacionMovilizacionModel.id_persona == asistencia.id_persona
        ).first()
        
        if asignacion_movilizacion:
            asignacion_movilizacion.asistio = asistencia.asistio
    
    db.commit()
    db.refresh(asistencia)
    return asistencia

@app.get("/asistencias/buscar/", response_model=List[Asistencia])
async def buscar_asistencias(
    id_evento: int = None,
    id_persona: int = None,
    asistio: bool = None,
    movilizado: bool = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(AsistenciaModel)
    if id_evento:
        query = query.filter(AsistenciaModel.id_evento == id_evento)
    if id_persona:
        query = query.filter(AsistenciaModel.id_persona == id_persona)
    if asistio is not None:
        query = query.filter(AsistenciaModel.asistio == asistio)
    if movilizado is not None:
        query = query.filter(AsistenciaModel.movilizado == movilizado)
    return query.all()

@app.get("/reportes/personas", response_model=ReportePersonas)
async def reporte_personas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Obtener datos según jerarquía
    if current_user.rol == "admin":
        personas = db.query(PersonaModel).filter(PersonaModel.activo == True).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        personas = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable.in_(ids), PersonaModel.activo == True).all()
    else:
        personas = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable == current_user.id, PersonaModel.activo == True).all()
    
    # Calcular estadísticas
    total_personas = len(personas)
    personas_por_seccion = {}
    personas_por_colonia = {}
    personas_por_lider = {}
    
    for persona in personas:
        if persona.seccion_electoral:
            personas_por_seccion[persona.seccion_electoral] = personas_por_seccion.get(persona.seccion_electoral, 0) + 1
        if persona.colonia:
            personas_por_colonia[persona.colonia] = personas_por_colonia.get(persona.colonia, 0) + 1
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
        if lider:
            personas_por_lider[lider.nombre] = personas_por_lider.get(lider.nombre, 0) + 1
    
    return ReportePersonas(
        total_personas=total_personas,
        personas_por_seccion=personas_por_seccion,
        personas_por_colonia=personas_por_colonia,
        personas_por_lider=personas_por_lider
    )

@app.get("/reportes/eventos", response_model=ReporteEventos)
async def reporte_eventos(
    historicos: bool = False,  # True para eventos históricos, False para activos
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    # Obtener datos según jerarquía
    query = db.query(EventoModel).filter(EventoModel.activo == True)
    
    if current_user.rol == "admin":
        pass  # Admin ve todos los eventos
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        query = query.filter(EventoModel.id_lider_organizador.in_(ids))
    else:
        query = query.filter(EventoModel.id_lider_organizador == current_user.id)
    
    # Filtrar por estado (activos o históricos)
    ahora = datetime.utcnow()
    if historicos:
        # Eventos históricos: fecha pasada (más de 24 horas)
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.desc()).all()  # Más recientes primero
    else:
        # Eventos activos: fecha futura o en curso (hasta 24 horas después)
        query = query.filter(EventoModel.fecha >= ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.asc()).all()  # Próximos primero
    
    # Calcular estadísticas
    total_eventos = len(eventos)
    eventos_por_tipo = {}
    asistencias_por_evento = {}
    eficiencia_movilizacion = {}
    
    for evento in eventos:
        if evento.tipo:
            eventos_por_tipo[evento.tipo] = eventos_por_tipo.get(evento.tipo, 0) + 1
        
        # Contar asistencias por evento
        asistencias = db.query(AsistenciaModel).filter(AsistenciaModel.id_evento == evento.id).all()
        asistencias_por_evento[evento.nombre] = len(asistencias)
        
        # Calcular eficiencia de movilización
        movilizados = sum(1 for a in asistencias if a.movilizado)
        eficiencia_movilizacion[evento.nombre] = {
            "total": len(asistencias),
            "movilizados": movilizados,
            "porcentaje": (movilizados / len(asistencias) * 100) if asistencias else 0
        }
    
    return ReporteEventos(
        total_eventos=total_eventos,
        eventos_por_tipo=eventos_por_tipo,
        asistencias_por_evento=asistencias_por_evento,
        eficiencia_movilizacion=eficiencia_movilizacion
    )

@app.get("/reportes/eventos-historicos")
async def reporte_eventos_historicos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Reporte específico de eventos históricos con estadísticas detalladas"""
    # Solo eventos históricos (más de 24 horas de antigüedad)
    ahora = datetime.utcnow()
    
    # Obtener eventos históricos según jerarquía
    query = db.query(EventoModel).filter(EventoModel.activo == True)
    
    if current_user.rol == "admin":
        # Admin ve todos los eventos históricos
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        # Obtener IDs de la jerarquía del líder
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids_jerarquia = get_subordinate_ids(current_user.id)
        
        # Obtener personas asignadas al líder y su jerarquía
        personas_lider = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable.in_(ids_jerarquia)).all()
        ids_personas_lider = [p.id for p in personas_lider]
        
        # Obtener eventos donde participaron las personas del líder
        asistencias_lider = db.query(AsistenciaModel).filter(AsistenciaModel.id_persona.in_(ids_personas_lider)).all()
        ids_eventos_participacion = list(set([a.id_evento for a in asistencias_lider]))
        
        # Combinar eventos organizados por la jerarquía + eventos donde participaron sus personas
        ids_eventos_totales = list(set(ids_eventos_participacion))
        
        if ids_eventos_totales:
            query = query.filter(
                EventoModel.id.in_(ids_eventos_totales),
                EventoModel.fecha < ahora - timedelta(hours=24)
            )
        else:
            # Si no hay eventos, devolver lista vacía
            query = query.filter(EventoModel.id == -1)  # Condición imposible
    else:
        # Obtener personas asignadas al usuario
        personas_usuario = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable == current_user.id).all()
        ids_personas_usuario = [p.id for p in personas_usuario]
        
        # Obtener eventos donde participaron las personas del usuario
        asistencias_usuario = db.query(AsistenciaModel).filter(AsistenciaModel.id_persona.in_(ids_personas_usuario)).all()
        ids_eventos_usuario = list(set([a.id_evento for a in asistencias_usuario]))
        
        if ids_eventos_usuario:
            query = query.filter(
                EventoModel.id.in_(ids_eventos_usuario),
                EventoModel.fecha < ahora - timedelta(hours=24)
            )
        else:
            # Si no hay eventos, devolver lista vacía
            query = query.filter(EventoModel.id == -1)  # Condición imposible
    
    eventos = query.order_by(EventoModel.fecha.desc()).all()
    

    
    # Calcular estadísticas detalladas
    total_eventos = len(eventos)
    eventos_por_tipo = {}
    eventos_por_mes = {}
    eventos_detallados = []
    
    for evento in eventos:
        # Estadísticas por tipo
        tipo = evento.tipo or "Sin tipo"
        eventos_por_tipo[tipo] = eventos_por_tipo.get(tipo, 0) + 1
        
        # Estadísticas por mes
        mes = evento.fecha.strftime("%Y-%m")
        eventos_por_mes[mes] = eventos_por_mes.get(mes, 0) + 1
        
        # Obtener asistencias para este evento
        asistencias = db.query(AsistenciaModel).filter(AsistenciaModel.id_evento == evento.id).all()
        total_asistencias = len(asistencias)
        asistencias_confirmadas = sum(1 for a in asistencias if a.asistio)
        movilizados = sum(1 for a in asistencias if a.movilizado)
        
        # Obtener asignaciones de movilización
        asignaciones = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_evento == evento.id
        ).all()
        total_asignados = len(asignaciones)
        
        eventos_detallados.append({
            "id": evento.id,
            "nombre": evento.nombre,
            "fecha": evento.fecha.isoformat(),
            "tipo": evento.tipo,
            "lugar": evento.lugar,
            "total_asignados": total_asignados,
            "total_asistencias": total_asistencias,
            "asistencias_confirmadas": asistencias_confirmadas,
            "movilizados": movilizados,
            "porcentaje_asistencia": round((asistencias_confirmadas / total_asignados * 100) if total_asignados > 0 else 0, 1),
            "porcentaje_movilizacion": round((movilizados / asistencias_confirmadas * 100) if asistencias_confirmadas > 0 else 0, 1)
        })
    
    return {
        "total_eventos": total_eventos,
        "eventos_por_tipo": eventos_por_tipo,
        "eventos_por_mes": eventos_por_mes,
        "eventos_detallados": eventos_detallados,
        "resumen": {
            "promedio_asistencia": round(
                sum(e["porcentaje_asistencia"] for e in eventos_detallados) / len(eventos_detallados) if eventos_detallados else 0, 1
            ),
            "promedio_movilizacion": round(
                sum(e["porcentaje_movilizacion"] for e in eventos_detallados) / len(eventos_detallados) if eventos_detallados else 0, 1
            ),
            "total_asignados": sum(e["total_asignados"] for e in eventos_detallados),
            "total_asistencias": sum(e["asistencias_confirmadas"] for e in eventos_detallados),
            "total_movilizados": sum(e["movilizados"] for e in eventos_detallados)
        }
    }



@app.get("/reportes/asistencias-tiempo-real")
async def reporte_asistencias_tiempo_real(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Reporte de asistencias en tiempo real para el dashboard"""
    # Obtener eventos según jerarquía
    if current_user.rol == "admin":
        eventos = db.query(EventoModel).filter(EventoModel.activo == True).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        eventos = db.query(EventoModel).filter(EventoModel.id_lider_organizador.in_(ids), EventoModel.activo == True).all()
    else:
        eventos = db.query(EventoModel).filter(EventoModel.id_lider_organizador == current_user.id, EventoModel.activo == True).all()
    
    # Obtener datos de asistencias para cada evento
    reporte_eventos = []
    
    for evento in eventos:
        # Obtener asignaciones de movilización para este evento
        asignaciones = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_evento == evento.id
        ).all()
        
        # Obtener asistencias registradas para este evento
        asistencias = db.query(AsistenciaModel).filter(
            AsistenciaModel.id_evento == evento.id,
            AsistenciaModel.asistio == True
        ).all()
        
        # Calcular estadísticas
        total_asignados = len(asignaciones)
        total_asistencias = len(asistencias)
        porcentaje_asistencia = (total_asistencias / total_asignados * 100) if total_asignados > 0 else 0
        
        # Obtener datos de movilización
        movilizados = sum(1 for a in asistencias if a.movilizado)
        porcentaje_movilizacion = (movilizados / total_asistencias * 100) if total_asistencias > 0 else 0
        
        # Obtener últimas asistencias (últimas 5)
        ultimas_asistencias = db.query(AsistenciaModel).filter(
            AsistenciaModel.id_evento == evento.id,
            AsistenciaModel.asistio == True
        ).order_by(AsistenciaModel.hora_checkin.desc()).limit(5).all()
        
        reporte_eventos.append({
            "id": evento.id,
            "nombre": evento.nombre,
            "fecha": evento.fecha.isoformat(),
            "tipo": evento.tipo,
            "total_asignados": total_asignados,
            "total_asistencias": total_asistencias,
            "porcentaje_asistencia": round(porcentaje_asistencia, 1),
            "movilizados": movilizados,
            "porcentaje_movilizacion": round(porcentaje_movilizacion, 1),
            "ultimas_asistencias": [
                {
                    "id": a.id,
                    "hora_checkin": a.hora_checkin.isoformat() if a.hora_checkin else None,
                    "movilizado": a.movilizado
                } for a in ultimas_asistencias
            ]
        })
    
    # Ordenar por fecha (más recientes primero)
    reporte_eventos.sort(key=lambda x: x["fecha"], reverse=True)
    
    return {
        "eventos": reporte_eventos,
        "total_eventos": len(reporte_eventos),
        "resumen_global": {
            "total_asignados": sum(e["total_asignados"] for e in reporte_eventos),
            "total_asistencias": sum(e["total_asistencias"] for e in reporte_eventos),
            "promedio_asistencia": round(
                sum(e["porcentaje_asistencia"] for e in reporte_eventos) / len(reporte_eventos) if reporte_eventos else 0, 1
            )
        }
    }

@app.get("/reportes/movilizacion-vehiculos")
async def reporte_movilizacion_vehiculos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Reporte de asistencias por movilización y vehículos"""
    # Obtener eventos según jerarquía
    if current_user.rol == "admin":
        eventos = db.query(EventoModel).filter(EventoModel.activo == True).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        def get_subordinate_ids(user_id):
            subs = db.query(UsuarioModel).filter(UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True).all()
            ids = [user_id]
            for sub in subs:
                ids.extend(get_subordinate_ids(sub.id))
            return ids
        ids = get_subordinate_ids(current_user.id)
        eventos = db.query(EventoModel).filter(EventoModel.id_lider_organizador.in_(ids), EventoModel.activo == True).all()
    else:
        eventos = db.query(EventoModel).filter(EventoModel.id_lider_organizador == current_user.id, EventoModel.activo == True).all()
    
    # Obtener todos los vehículos
    vehiculos = db.query(VehiculoModel).all()
    
    # Estadísticas por vehículo
    estadisticas_vehiculos = []
    
    for vehiculo in vehiculos:
        # Obtener asignaciones para este vehículo
        asignaciones = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_vehiculo == vehiculo.id
        ).all()
        
        # Obtener eventos donde participa este vehículo
        eventos_vehiculo = set(asig.id_evento for asig in asignaciones)
        
        # Calcular estadísticas usando solo la tabla de asignaciones
        total_asignados = len(asignaciones)
        total_asistencias = sum(1 for a in asignaciones if a.asistio)
        porcentaje_asistencia = (total_asistencias / total_asignados * 100) if total_asignados > 0 else 0
        
        # Obtener datos de movilización (asumiendo que si asistió y está asignado, fue movilizado)
        movilizados = total_asistencias  # Si está asignado y asistió, fue movilizado
        porcentaje_movilizacion = (movilizados / total_asistencias * 100) if total_asistencias > 0 else 0
        
        # Obtener eventos específicos donde participó
        eventos_participacion = []
        for evento_id in eventos_vehiculo:
            evento = db.query(EventoModel).filter(EventoModel.id == evento_id).first()
            if evento:
                asig_evento = [a for a in asignaciones if a.id_evento == evento_id]
                asis_evento = [a for a in asig_evento if a.asistio]
                
                eventos_participacion.append({
                    "id": evento.id,
                    "nombre": evento.nombre,
                    "fecha": evento.fecha.isoformat(),
                    "asignados": len(asig_evento),
                    "asistencias": len(asis_evento),
                    "porcentaje": round((len(asis_evento) / len(asig_evento) * 100) if len(asig_evento) > 0 else 0, 1)
                })
        
        estadisticas_vehiculos.append({
            "id": vehiculo.id,
            "tipo": vehiculo.tipo,
            "placas": vehiculo.placas,
            "capacidad": vehiculo.capacidad,
            "descripcion": vehiculo.descripcion,
            "total_asignados": total_asignados,
            "total_asistencias": total_asistencias,
            "porcentaje_asistencia": round(porcentaje_asistencia, 1),
            "movilizados": movilizados,
            "porcentaje_movilizacion": round(porcentaje_movilizacion, 1),
            "eventos_participacion": eventos_participacion
        })
    
    # Estadísticas generales de movilización
    total_asignaciones = sum(v["total_asignados"] for v in estadisticas_vehiculos)
    total_asistencias_vehiculos = sum(v["total_asistencias"] for v in estadisticas_vehiculos)
    total_movilizados = sum(v["movilizados"] for v in estadisticas_vehiculos)
    
    # Top vehículos por rendimiento
    vehiculos_ordenados = sorted(estadisticas_vehiculos, key=lambda x: x["porcentaje_asistencia"], reverse=True)
    top_vehiculos = vehiculos_ordenados[:5] if len(vehiculos_ordenados) > 5 else vehiculos_ordenados
    
    return {
        "estadisticas_vehiculos": estadisticas_vehiculos,
        "resumen_global": {
            "total_vehiculos": len(vehiculos),
            "total_asignaciones": total_asignaciones,
            "total_asistencias": total_asistencias_vehiculos,
            "total_movilizados": total_movilizados,
            "promedio_asistencia": round(
                sum(v["porcentaje_asistencia"] for v in estadisticas_vehiculos) / len(estadisticas_vehiculos) if estadisticas_vehiculos else 0, 1
            ),
            "promedio_movilizacion": round(
                (total_movilizados / total_asistencias_vehiculos * 100) if total_asistencias_vehiculos > 0 else 0, 1
            )
        },
        "top_vehiculos": top_vehiculos
    }

INVITATION_SECRET = "invitation_secret_key_cambiar"
INVITATION_EXP_MINUTES = 60

class InvitacionCreate(BaseModel):
    rol: str
    id_lider_superior: int = None  # Opcional, para que admin/presidente puedan elegir

@app.post("/invitaciones/", response_model=dict)
async def generar_invitacion(data: InvitacionCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Solo líderes y admin pueden invitar
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para invitar líderes")
    
    # Lógica para determinar el líder superior
    if current_user.rol in ["admin", "presidente"]:
        # Admin/Presidente pueden elegir bajo qué líder registrar
        if data.id_lider_superior:
            # Verificar que el líder superior existe y está activo
            lider_superior = db.query(UsuarioModel).filter(
                UsuarioModel.id == data.id_lider_superior,
                UsuarioModel.activo == True
            ).first()
            if not lider_superior:
                raise HTTPException(status_code=400, detail="Líder superior no válido")
            id_lider_superior = data.id_lider_superior
        else:
            # Si no especifica, buscar presidente como default
            presidente = db.query(UsuarioModel).filter(
                UsuarioModel.rol == "presidente",
                UsuarioModel.activo == True
            ).first()
            id_lider_superior = presidente.id if presidente else current_user.id
    else:
        # Otros líderes registran bajo ellos mismos
        id_lider_superior = current_user.id
    
    payload = {
        "id_lider_superior": id_lider_superior,
        "rol": data.rol,
        "exp": datetime.utcnow() + timedelta(minutes=INVITATION_EXP_MINUTES)
    }
    token = jwt.encode(payload, INVITATION_SECRET, algorithm="HS256")
    print(f"Token generado: {token}")
    print(f"Tipo de token: {type(token)}")
    return {"token": str(token)}

class InvitacionRegistro(BaseModel):
    token: str
    nombre: str
    telefono: str = None
    direccion: str = None
    edad: int = None
    sexo: str = None
    email: str
    password: str

@app.post("/registro-invitacion", response_model=Usuario)
async def registro_invitacion(data: InvitacionRegistro, db: Session = Depends(get_db)):
    # Validar token
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invitación inválida o expirada")
    # Verificar si el email ya existe
    db_user = db.query(UsuarioModel).filter(UsuarioModel.email == data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    # Crear usuario con datos del token
    hashed_password = get_password_hash(data.password)
    db_user = UsuarioModel(
        nombre=data.nombre,
        telefono=data.telefono,
        direccion=data.direccion,
        edad=data.edad,
        sexo=data.sexo,
        email=data.email,
        password_hash=hashed_password,
        rol=payload["rol"],
        id_lider_superior=payload["id_lider_superior"]
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

class InvitacionDecode(BaseModel):
    token: str

@app.post("/invitaciones/decode", response_model=dict)
async def decode_invitacion(data: InvitacionDecode, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == payload["id_lider_superior"]).first()
        return {
            "rol": payload["rol"],
            "nombre_lider": lider.nombre if lider else ""
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Invitación inválida o expirada")

# Invitaciones para registro de personas
@app.post("/invitaciones-personas/", response_model=dict)
async def generar_invitacion_persona(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Solo líderes y admin pueden invitar
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para generar invitaciones de personas")
    payload = {
        "id_lider_responsable": current_user.id,
        "tipo": "registro_persona",
        "exp": datetime.utcnow() + timedelta(minutes=INVITATION_EXP_MINUTES)
    }
    token = jwt.encode(payload, INVITATION_SECRET, algorithm="HS256")
    print(f"Token de persona generado: {token}")
    print(f"Tipo de token: {type(token)}")
    return {"token": str(token)}

class InvitacionPersonaDecode(BaseModel):
    token: str

@app.post("/invitaciones-personas/decode", response_model=dict)
async def decode_invitacion_persona(data: InvitacionPersonaDecode, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == payload["id_lider_responsable"]).first()
        return {
            "tipo": payload["tipo"],
            "nombre_lider": lider.nombre if lider else ""
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Invitación inválida o expirada")

class PersonaInvitacionRegistro(BaseModel):
    token: str
    nombre: str
    telefono: str = None
    direccion: str = None
    edad: int = None
    sexo: str = None
    clave_elector: str = None
    curp: str = None
    num_emision: str = None
    seccion_electoral: str = None
    distrito: str = None
    municipio: str = None
    estado: str = None
    colonia: str = None
    latitud: float = None
    longitud: float = None
    acepta_politica: bool = False

@app.post("/registro-persona-invitacion", response_model=Persona)
async def registro_persona_invitacion(data: PersonaInvitacionRegistro, db: Session = Depends(get_db)):
    # Validar token
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invitación inválida o expirada")
    
    # Crear persona con datos del token
    persona_data = data.dict()
    persona_data["id_lider_responsable"] = payload["id_lider_responsable"]
    del persona_data["token"]  # Remover el token de los datos
    
    db_persona = PersonaModel(**persona_data)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@app.get("/reportes/estructura-jerarquica", response_model=EstructuraJerarquica)
async def reporte_estructura_jerarquica(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Obtiene la estructura jerárquica completa de la red"""
    def construir_nodo(user_id: int) -> NodoJerarquico:
        user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id, UsuarioModel.activo == True).first()
        if not user:
            return None
        total_personas = db.query(PersonaModel).filter(
            PersonaModel.id_lider_responsable == user_id,
            PersonaModel.activo == True
        ).count()
        subordinados = db.query(UsuarioModel).filter(
            UsuarioModel.id_lider_superior == user_id,
            UsuarioModel.activo == True
        ).all()
        nodos_subordinados = []
        total_subordinados = 0
        for sub in subordinados:
            nodo_sub = construir_nodo(sub.id)
            if nodo_sub:
                nodos_subordinados.append(nodo_sub)
                total_subordinados += nodo_sub.total_subordinados + 1
        return NodoJerarquico(
            id=user.id,
            nombre=user.nombre,
            rol=user.rol,
            total_personas=total_personas,
            total_subordinados=total_subordinados,
            subordinados=nodos_subordinados
        )
    # Buscar PRESIDENTE como líder general del diagrama
    lider_general = db.query(UsuarioModel).filter(
        UsuarioModel.rol == "presidente",
        UsuarioModel.activo == True
    ).first()
    
    if not lider_general:
        # Si no hay presidente, buscar quien tenga más subordinados
        candidatos = db.query(UsuarioModel).filter(
            UsuarioModel.activo == True,
            UsuarioModel.rol.in_(["admin", "lider_estatal", "lider_regional"])
        ).all()
        
        max_subordinados = 0
        for candidato in candidatos:
            subordinados = db.query(UsuarioModel).filter(
                UsuarioModel.id_lider_superior == candidato.id,
                UsuarioModel.activo == True
            ).count()
            if subordinados > max_subordinados:
                max_subordinados = subordinados
                lider_general = candidato
        
        # Último fallback: usar el usuario actual
        if not lider_general:
            lider_general = current_user
    if not lider_general:
        raise HTTPException(status_code=404, detail="No se encontró líder general")
    
    # FIX: Mover líderes que reportan al admin hacia el presidente
    if lider_general.rol == "presidente":
        admin = db.query(UsuarioModel).filter(
            UsuarioModel.rol == "admin",
            UsuarioModel.activo == True
        ).first()
        if admin:
            # Mover subordinados del admin al presidente
            subordinados_admin = db.query(UsuarioModel).filter(
                UsuarioModel.id_lider_superior == admin.id,
                UsuarioModel.activo == True
            ).all()
            for subordinado in subordinados_admin:
                subordinado.id_lider_superior = lider_general.id
            db.commit()
    
    estructura = construir_nodo(lider_general.id)
    if not estructura:
        raise HTTPException(status_code=404, detail="Error al construir estructura jerárquica")
    def contar_total_personas(nodo: NodoJerarquico) -> int:
        total = nodo.total_personas
        for sub in nodo.subordinados:
            total += contar_total_personas(sub)
        return total
    def contar_total_lideres(nodo: NodoJerarquico) -> int:
        total = 1
        for sub in nodo.subordinados:
            total += contar_total_lideres(sub)
        return total
    def calcular_niveles(nodo: NodoJerarquico, nivel_actual: int = 1) -> int:
        max_nivel = nivel_actual
        for sub in nodo.subordinados:
            nivel_sub = calcular_niveles(sub, nivel_actual + 1)
            max_nivel = max(max_nivel, nivel_sub)
        return max_nivel
    total_personas_red = contar_total_personas(estructura)
    total_lideres_red = contar_total_lideres(estructura)
    niveles_jerarquia = calcular_niveles(estructura)
    return EstructuraJerarquica(
        lider_general=estructura,
        total_personas_red=total_personas_red,
        total_lideres_red=total_lideres_red,
        niveles_jerarquia=niveles_jerarquia
    )

# --- Endpoints para Vehículos ---
@app.post("/vehiculos/", response_model=Vehiculo)
async def create_vehiculo(vehiculo: VehiculoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para crear vehículos")
    db_vehiculo = VehiculoModel(**vehiculo.dict())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@app.get("/vehiculos/", response_model=List[Vehiculo])
async def list_vehiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    return db.query(VehiculoModel).offset(skip).limit(limit).all()

@app.get("/vehiculos/{vehiculo_id}", response_model=Vehiculo)
async def get_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo

@app.put("/vehiculos/{vehiculo_id}", response_model=Vehiculo)
async def update_vehiculo(vehiculo_id: int, vehiculo_update: VehiculoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para editar vehículos")
    for field, value in vehiculo_update.dict(exclude_unset=True).items():
        setattr(vehiculo, field, value)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo

@app.delete("/vehiculos/{vehiculo_id}", response_model=Vehiculo)
async def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar vehículos")
    db.delete(vehiculo)
    db.commit()
    return vehiculo

# --- Endpoints para Asignaciones de Movilización ---
@app.post("/movilizaciones/", response_model=AsignacionMovilizacion)
async def create_asignacion_movilizacion(asignacion: AsignacionMovilizacionCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para asignar movilización")
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == asignacion.id_vehiculo, VehiculoModel.activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado o inactivo")
    ocupados = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id_vehiculo == asignacion.id_vehiculo,
        AsignacionMovilizacionModel.id_evento == asignacion.id_evento
    ).count()
    if ocupados >= vehiculo.capacidad:
        raise HTTPException(status_code=400, detail=f"El vehículo ya está lleno (capacidad: {vehiculo.capacidad})")
    existe = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id_vehiculo == asignacion.id_vehiculo,
        AsignacionMovilizacionModel.id_evento == asignacion.id_evento,
        AsignacionMovilizacionModel.id_persona == asignacion.id_persona
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="La persona ya está asignada a este vehículo para este evento")
    db_asignacion = AsignacionMovilizacionModel(**asignacion.dict())
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    return db_asignacion

@app.get("/movilizaciones/", response_model=List[AsignacionMovilizacion])
async def list_asignaciones_movilizacion(evento_id: int = None, vehiculo_id: int = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    query = db.query(AsignacionMovilizacionModel)
    if evento_id:
        query = query.filter(AsignacionMovilizacionModel.id_evento == evento_id)
    if vehiculo_id:
        query = query.filter(AsignacionMovilizacionModel.id_vehiculo == vehiculo_id)
    return query.all()

@app.get("/movilizaciones/{asignacion_id}", response_model=AsignacionMovilizacion)
async def get_asignacion_movilizacion(asignacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion

@app.put("/movilizaciones/{asignacion_id}", response_model=AsignacionMovilizacion)
async def update_asignacion_movilizacion(asignacion_id: int, asignacion_update: AsignacionMovilizacionUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para editar asignaciones")
    for field, value in asignacion_update.dict(exclude_unset=True).items():
        setattr(asignacion, field, value)
    db.commit()
    db.refresh(asignacion)
    return asignacion

@app.delete("/movilizaciones/{asignacion_id}", response_model=AsignacionMovilizacion)
async def delete_asignacion_movilizacion(asignacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar asignaciones")
    db.delete(asignacion)
    db.commit()
    return asignacion

@app.post("/asistencias/{asistencia_id}/checkin", response_model=Asistencia)
async def checkin_asistencia(asistencia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    asistencia = db.query(AsistenciaModel).filter(AsistenciaModel.id == asistencia_id).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    
    # Actualizar la asistencia
    asistencia.asistio = True
    asistencia.hora_checkin = datetime.utcnow()
    asistencia.usuario_checkin = current_user.id
    
    # También actualizar la asignación de movilización si existe
    asignacion_movilizacion = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id_evento == asistencia.id_evento,
        AsignacionMovilizacionModel.id_persona == asistencia.id_persona
    ).first()
    
    if asignacion_movilizacion:
        asignacion_movilizacion.asistio = True
    
    db.commit()
    db.refresh(asistencia)
    return asistencia

@app.get("/asistencias/buscar-por-clave", response_model=Asistencia)
async def buscar_asistencia_por_clave(clave_elector: str, id_evento: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    persona = db.query(PersonaModel).filter(PersonaModel.clave_elector == clave_elector).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    asistencia = db.query(AsistenciaModel).filter(
        AsistenciaModel.id_evento == id_evento,
        AsistenciaModel.id_persona == persona.id
    ).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="No hay asistencia registrada para esta persona en este evento")
    return asistencia

@app.post("/admin/upload-logo")
async def upload_logo(file: UploadFile = File(...), current_user=Depends(get_current_active_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede cambiar el logo")
    os.makedirs("static", exist_ok=True)
    with open(LOGO_PATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "Logo actualizado"}

@app.post("/upload-foto-reporte")
async def upload_foto_reportes(file: UploadFile = File(...), current_user=Depends(get_current_active_user)):
    """Subir foto para reportes ciudadanos"""
    # Crear directorio si no existe
    import os
    os.makedirs("static/reportes", exist_ok=True)
    
    # Generar nombre único para el archivo
    import uuid
    file_extension = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/reportes/{file_name}"
    
    # Guardar el archivo
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Retornar la URL del archivo
    return {"url": f"http://localhost:8000/static/reportes/{file_name}"}

@app.get("/logo")
def get_logo():
    if os.path.exists(LOGO_PATH):
        return FileResponse(LOGO_PATH)
    else:
        raise HTTPException(status_code=404, detail="Logo no encontrado")

@app.get("/static/{path:path}")
def serve_static_files(path: str):
    """Servir archivos estáticos"""
    import os
    file_path = f"static/{path}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@app.get("/admin/sincronizar-asistencias")
async def sincronizar_asistencias(db: Session = Depends(get_db)):
    """Endpoint temporal para sincronizar asistencias con asignaciones de movilización"""
    
    # Obtener todas las asistencias que marcaron asistio = True
    asistencias = db.query(AsistenciaModel).filter(AsistenciaModel.asistio == True).all()
    
    actualizadas = 0
    for asistencia in asistencias:
        # Buscar si existe una asignación de movilización para esta persona y evento
        asignacion = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_evento == asistencia.id_evento,
            AsignacionMovilizacionModel.id_persona == asistencia.id_persona
        ).first()
        
        if asignacion:
            # Actualizar la asignación para marcar que asistió
            asignacion.asistio = True
            actualizadas += 1
    
    db.commit()
    
    return {
        "message": f"Sincronización completada. {actualizadas} asignaciones actualizadas.",
        "asistencias_revisadas": len(asistencias),
        "asignaciones_actualizadas": actualizadas
    }

# ============================================================================
# ADMINISTRACIÓN DE PERFILES Y PERMISOS
# ============================================================================

@app.get("/perfiles/roles")
async def obtener_roles_disponibles():
    """Obtener todos los roles disponibles en el sistema"""
    return {
        "roles": [
            {"id": "admin", "nombre": "Administrador", "descripcion": "Acceso completo al sistema"},
            {"id": "presidente", "nombre": "Presidente", "descripcion": "Acceso de alto nivel"},
            {"id": "lider_estatal", "nombre": "Líder Estatal", "descripcion": "Gestión a nivel estatal"},
            {"id": "lider_regional", "nombre": "Líder Regional", "descripcion": "Gestión a nivel regional"},
            {"id": "lider_municipal", "nombre": "Líder Municipal", "descripcion": "Gestión a nivel municipal"},
            {"id": "lider_zona", "nombre": "Líder de Zona", "descripcion": "Gestión a nivel de zona"},
            {"id": "capturista", "nombre": "Capturista", "descripcion": "Captura de datos básica"},
            {"id": "ciudadano", "nombre": "Ciudadano", "descripcion": "Usuario general para ver noticias y crear reportes"}
        ]
    }

@app.get("/perfiles/opciones-menu")
async def obtener_opciones_menu():
    """Obtener todas las opciones disponibles para el menú"""
    return {
        "opciones_web": [
            {"id": "dashboard", "nombre": "Dashboard", "descripcion": "Panel principal", "ruta": "/"},
            {"id": "usuarios", "nombre": "Usuarios", "descripcion": "Gestión de usuarios", "ruta": "/usuarios"},
            {"id": "personas", "nombre": "Personas", "descripcion": "Gestión de personas", "ruta": "/personas"},
            {"id": "eventos", "nombre": "Eventos", "descripcion": "Gestión de eventos", "ruta": "/eventos"},
            {"id": "eventos-historicos", "nombre": "Eventos Históricos", "descripcion": "Reportes de eventos pasados", "ruta": "/eventos-historicos"},
            {"id": "movilizacion", "nombre": "Movilización", "descripcion": "Gestión de movilización", "ruta": "/movilizacion"},
            {"id": "reportes", "nombre": "Reportes", "descripcion": "Reportes generales", "ruta": "/reportes"},
            {"id": "estructura-red", "nombre": "Estructura Red", "descripcion": "Estructura organizacional", "ruta": "/estructura-red"},
            {"id": "checkin", "nombre": "Check-in", "descripcion": "Registro de asistencia", "ruta": "/checkin"},
            {"id": "perfil", "nombre": "Perfil", "descripcion": "Configuración de perfil", "ruta": "/perfil"},
            {"id": "admin-perfiles", "nombre": "Administrar Perfiles", "descripcion": "Gestión de perfiles y permisos", "ruta": "/admin-perfiles"},
            {"id": "admin-database", "nombre": "Administración BD", "descripcion": "Administración de base de datos", "ruta": "/admin-database"},
            {"id": "seguimiento", "nombre": "Seguimiento", "descripcion": "Seguimiento en tiempo real de vehículos", "ruta": "/seguimiento"},
            {"id": "noticias", "nombre": "Noticias", "descripcion": "Noticias y avisos", "ruta": "/noticias"},
            {"id": "reportes_ciudadanos", "nombre": "Reportes Ciudadanos", "descripcion": "Sistema de reportes comunitarios", "ruta": "/reportes-ciudadanos"}
        ],
        "opciones_app": [
            {"id": "dashboard", "nombre": "Dashboard", "descripcion": "Panel principal", "ruta": "/(tabs)/dashboard"},
            {"id": "register", "nombre": "Registrar Persona", "descripcion": "Registrar nueva persona", "ruta": "/register"},
            {"id": "reassign", "nombre": "Redireccionar Persona", "descripcion": "Reasignar persona", "ruta": "/reassign"},
            {"id": "estructura-red", "nombre": "Estructura de la Red", "descripcion": "Estructura organizacional", "ruta": "/estructura-red"},
            {"id": "pase-lista", "nombre": "Pase de Lista", "descripcion": "Registro de asistencia", "ruta": "/pase-lista"},
            {"id": "eventos-historicos", "nombre": "Eventos Históricos", "descripcion": "Reportes de eventos pasados", "ruta": "/eventos-historicos"},
            {"id": "movilizacion", "nombre": "Movilización", "descripcion": "Gestión de movilización", "ruta": "/movilizacion"},
            {"id": "reportes", "nombre": "Reportes", "descripcion": "Reportes generales", "ruta": "/reportes"},
            {"id": "seguimiento", "nombre": "Seguimiento", "descripcion": "Seguimiento en tiempo real", "ruta": "/ubicacion"},
            {"id": "movilizador-seguimiento", "nombre": "Movilizador", "descripcion": "Activar seguimiento como movilizador", "ruta": "/movilizador-seguimiento"},
            {"id": "noticias", "nombre": "Noticias", "descripcion": "Noticias y avisos", "ruta": "/(tabs)/noticias"},
            {"id": "reportes_ciudadanos", "nombre": "Reportes Ciudadanos", "descripcion": "Sistema de reportes comunitarios", "ruta": "/(tabs)/reportes-ciudadanos"},
            {"id": "perfil", "nombre": "Perfil", "descripcion": "Configuración de perfil", "ruta": "/perfil"}
        ]
    }

@app.get("/perfiles/configuracion/{rol}")
async def obtener_configuracion_perfil(
    rol: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración de permisos para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver configuraciones de perfiles")
    
    # Buscar configuración en la base de datos
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == rol).first()
    
    if configuracion_db:
        import json
        return {
            "rol": rol,
            "configuracion": {
                "opciones_web": json.loads(configuracion_db.opciones_web),
                "opciones_app": json.loads(configuracion_db.opciones_app)
            }
        }
    
    # Configuraciones por defecto si no existe en BD
    configuraciones_por_defecto = {
        "admin": {
            "opciones_web": ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "admin-database", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["register", "perfil", "eventos-historicos", "dashboard", "seguimiento", "movilizador-seguimiento", "noticias", "reportes_ciudadanos"]
        },
        "presidente": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_estatal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_regional": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "lider_municipal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_zona": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }
    
    return {
        "rol": rol,
        "configuracion": configuraciones_por_defecto.get(rol, {
            "opciones_web": ["dashboard", "perfil"],
            "opciones_app": ["dashboard", "perfil"]
        })
    }

@app.get("/perfiles/mi-configuracion")
async def obtener_mi_configuracion(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener la configuración de permisos del usuario actual"""
    # Buscar configuración en la base de datos
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == current_user.rol).first()
    
    if configuracion_db:
        import json
        return {
            "rol": current_user.rol,
            "configuracion": {
                "opciones_web": json.loads(configuracion_db.opciones_web),
                "opciones_app": json.loads(configuracion_db.opciones_app)
            }
        }
    
    # Configuraciones por defecto si no existe en BD
    configuraciones_por_defecto = {
        "admin": {
            "opciones_web": ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "admin-database", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["register", "perfil", "eventos-historicos", "dashboard", "seguimiento", "movilizador-seguimiento", "noticias", "reportes_ciudadanos"]
        },
        "presidente": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_estatal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_regional": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "lider_municipal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_zona": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }
    
    return {
        "rol": current_user.rol,
        "configuracion": configuraciones_por_defecto.get(current_user.rol, {
            "opciones_web": ["dashboard", "perfil"],
            "opciones_app": ["dashboard", "perfil"]
        })
    }

@app.put("/perfiles/configuracion/{rol}")
async def actualizar_configuracion_perfil(
    rol: str,
    configuracion: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar la configuración de permisos para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden modificar configuraciones de perfiles")
    
    # Validar que el rol existe
    roles_validos = ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista", "ciudadano"]
    if rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    # Validar estructura de configuración
    if "opciones_web" not in configuracion or "opciones_app" not in configuracion:
        raise HTTPException(status_code=400, detail="Configuración debe incluir opciones_web y opciones_app")
    
    import json
    
    # Buscar configuración existente o crear nueva
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == rol).first()
    
    if configuracion_db:
        # Actualizar configuración existente
        configuracion_db.opciones_web = json.dumps(configuracion["opciones_web"])
        configuracion_db.opciones_app = json.dumps(configuracion["opciones_app"])
    else:
        # Crear nueva configuración
        configuracion_db = ConfiguracionPerfilModel(
            rol=rol,
            opciones_web=json.dumps(configuracion["opciones_web"]),
            opciones_app=json.dumps(configuracion["opciones_app"])
        )
        db.add(configuracion_db)
    
    db.commit()
    db.refresh(configuracion_db)
    
    return {
        "mensaje": f"Configuración actualizada para el rol {rol}",
        "rol": rol,
        "configuracion": configuracion
    }

@app.get("/perfiles/usuarios-por-rol")
async def obtener_usuarios_por_rol(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener estadísticas de usuarios por rol"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver estadísticas de usuarios")
    
    # Contar usuarios por rol
    usuarios_por_rol = db.query(
        UsuarioModel.rol,
        func.count(UsuarioModel.id).label('cantidad')
    ).filter(UsuarioModel.activo == True).group_by(UsuarioModel.rol).all()
    
    return {
        "estadisticas": [
            {"rol": item.rol, "cantidad": item.cantidad}
            for item in usuarios_por_rol
        ]
    }

class UbicacionUpdate(BaseModel):
    latitud: float
    longitud: float
    velocidad: float | None = None
    direccion: str | None = None
    precision: float | None = None
    bateria: int | None = None
    evento_id: int | None = None
    vehiculo_id: int | None = None
    evento_nombre: str | None = None
    vehiculo_tipo: str | None = None
    vehiculo_placas: str | None = None
    vehiculo_capacidad: int | None = None
    total_personas: int | None = None
    is_movilizador: bool = False
    seguimiento_activo: bool = True

@app.post("/ubicacion/actualizar")
async def actualizar_ubicacion(
    ubicacion: UbicacionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar ubicación en tiempo real del usuario"""
    try:
        # Si seguimiento_activo es False, desactivar seguimiento específico o todas las ubicaciones
        if not ubicacion.seguimiento_activo:
            if ubicacion.evento_id and ubicacion.vehiculo_id:
                # Detener seguimiento específico
                db.query(UbicacionTiempoRealModel).filter(
                    UbicacionTiempoRealModel.id_usuario == current_user.id,
                    UbicacionTiempoRealModel.evento_id == ubicacion.evento_id,
                    UbicacionTiempoRealModel.vehiculo_id == ubicacion.vehiculo_id,
                    UbicacionTiempoRealModel.activo == True
                ).update({"activo": False})
                db.commit()
                return {"success": True, "message": f"Seguimiento detenido para evento {ubicacion.evento_id} y vehículo {ubicacion.vehiculo_id}"}
            else:
                # Detener todos los seguimientos del usuario
                db.query(UbicacionTiempoRealModel).filter(
                    UbicacionTiempoRealModel.id_usuario == current_user.id,
                    UbicacionTiempoRealModel.activo == True
                ).update({"activo": False})
                db.commit()
                return {"success": True, "message": "Todos los seguimientos detenidos"}
        
        # Desactivar ubicación anterior del mismo usuario + evento + vehículo (si existe)
        if ubicacion.evento_id and ubicacion.vehiculo_id:
            db.query(UbicacionTiempoRealModel).filter(
                UbicacionTiempoRealModel.id_usuario == current_user.id,
                UbicacionTiempoRealModel.evento_id == ubicacion.evento_id,
                UbicacionTiempoRealModel.vehiculo_id == ubicacion.vehiculo_id,
                UbicacionTiempoRealModel.activo == True
            ).update({"activo": False})
        else:
            # Si no hay evento/vehículo específico, desactivar todas las ubicaciones del usuario
            db.query(UbicacionTiempoRealModel).filter(
                UbicacionTiempoRealModel.id_usuario == current_user.id,
                UbicacionTiempoRealModel.activo == True
            ).update({"activo": False})
        
        # Crear nueva ubicación
        nueva_ubicacion = UbicacionTiempoRealModel(
            id_usuario=current_user.id,
            latitud=ubicacion.latitud,
            longitud=ubicacion.longitud,
            velocidad=ubicacion.velocidad,
            direccion=ubicacion.direccion,
            precision=ubicacion.precision,
            bateria=ubicacion.bateria,
            evento_id=ubicacion.evento_id,
            vehiculo_id=ubicacion.vehiculo_id,
            evento_nombre=ubicacion.evento_nombre,
            vehiculo_tipo=ubicacion.vehiculo_tipo,
            vehiculo_placas=ubicacion.vehiculo_placas,
            vehiculo_capacidad=ubicacion.vehiculo_capacidad,
            total_personas=ubicacion.total_personas
        )
        
        db.add(nueva_ubicacion)
        db.commit()
        db.refresh(nueva_ubicacion)
        
        return {"success": True, "message": "Ubicación actualizada"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar ubicación: {str(e)}")

@app.get("/ubicacion/vehiculos")
async def obtener_ubicaciones_vehiculos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener ubicaciones en tiempo real de vehículos/líderes"""
    try:
        # Obtener usuarios con roles de líderes/choferes (ajustar según tus roles)
        roles_vehiculos = ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "admin"]
        
        # Obtener ubicaciones activas de estos roles
        ubicaciones = db.query(UbicacionTiempoRealModel).join(
            UsuarioModel, UbicacionTiempoRealModel.id_usuario == UsuarioModel.id
        ).filter(
            UbicacionTiempoRealModel.activo == True,
            UsuarioModel.rol.in_(roles_vehiculos),
            UsuarioModel.activo == True
        ).all()
        
        # Formatear respuesta
        ubicaciones_formateadas = []
        for ubicacion in ubicaciones:
            ubicacion_data = {
                "id_usuario": ubicacion.id_usuario,
                "nombre": ubicacion.usuario.nombre,
                "rol": ubicacion.usuario.rol,
                "latitud": ubicacion.latitud,
                "longitud": ubicacion.longitud,
                "velocidad": ubicacion.velocidad,
                "direccion": ubicacion.direccion,
                "timestamp": ubicacion.timestamp.isoformat(),
                "bateria": ubicacion.bateria
            }
            
            # Agregar información de movilización si está disponible
            if ubicacion.evento_id:
                ubicacion_data.update({
                    "evento_id": ubicacion.evento_id,
                    "evento_nombre": ubicacion.evento_nombre,
                    "vehiculo_id": ubicacion.vehiculo_id,
                    "vehiculo_tipo": ubicacion.vehiculo_tipo,
                    "vehiculo_placas": ubicacion.vehiculo_placas,
                    "vehiculo_capacidad": ubicacion.vehiculo_capacidad,
                    "total_personas": ubicacion.total_personas
                })
            
            ubicaciones_formateadas.append(ubicacion_data)
        
        return {
            "ubicaciones": ubicaciones_formateadas,
            "total": len(ubicaciones_formateadas)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicaciones: {str(e)}")

@app.get("/ubicacion/mi-ubicacion")
async def obtener_mi_ubicacion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener mis ubicaciones activas"""
    try:
        ubicaciones = db.query(UbicacionTiempoRealModel).filter(
            UbicacionTiempoRealModel.id_usuario == current_user.id,
            UbicacionTiempoRealModel.activo == True
        ).all()
        
        if not ubicaciones:
            return {"ubicacion": None, "ubicaciones": []}
        
        # Para compatibilidad con código existente, mantener la primera ubicación como "ubicacion"
        primera_ubicacion = ubicaciones[0] if ubicaciones else None
        
        # Formatear todas las ubicaciones activas
        ubicaciones_formateadas = []
        for ubicacion in ubicaciones:
            ubicacion_data = {
                "id": ubicacion.id,
                "latitud": ubicacion.latitud,
                "longitud": ubicacion.longitud,
                "velocidad": ubicacion.velocidad,
                "direccion": ubicacion.direccion,
                "timestamp": ubicacion.timestamp.isoformat(),
                "bateria": ubicacion.bateria,
                "evento_id": ubicacion.evento_id,
                "evento_nombre": ubicacion.evento_nombre,
                "vehiculo_id": ubicacion.vehiculo_id,
                "vehiculo_tipo": ubicacion.vehiculo_tipo,
                "vehiculo_placas": ubicacion.vehiculo_placas,
                "vehiculo_capacidad": ubicacion.vehiculo_capacidad,
                "total_personas": ubicacion.total_personas
            }
            ubicaciones_formateadas.append(ubicacion_data)
        
        return {
            "ubicacion": {
                "latitud": primera_ubicacion.latitud,
                "longitud": primera_ubicacion.longitud,
                "velocidad": primera_ubicacion.velocidad,
                "direccion": primera_ubicacion.direccion,
                "timestamp": primera_ubicacion.timestamp.isoformat(),
                "bateria": primera_ubicacion.bateria
            } if primera_ubicacion else None,
            "ubicaciones": ubicaciones_formateadas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicación: {str(e)}")

# Endpoints para noticias
@app.post("/noticias/", response_model=Noticia)
async def create_noticia(noticia: NoticiaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Crear una nueva noticia"""
    # Solo líderes y admin pueden crear noticias
    if current_user.rol not in ['admin', 'lider_estatal', 'lider_municipal', 'lider_zona']:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear noticias")
    
    db_noticia = NoticiaModel(
        titulo=noticia.titulo,
        contenido=noticia.contenido,
        imagen_url=noticia.imagen_url,
        tipo=noticia.tipo,
        autor_id=current_user.id
    )
    
    db.add(db_noticia)
    db.commit()
    db.refresh(db_noticia)
    
    # Agregar nombre del autor
    db_noticia.autor_nombre = current_user.nombre
    
    return db_noticia

@app.get("/noticias/", response_model=List[Noticia])
async def list_noticias(
    skip: int = 0, 
    limit: int = 50,
    tipo: str = None,
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener lista de noticias activas"""
    print(f"🔍 Listando noticias - Usuario: {current_user.nombre}, Tipo: {tipo}")
    
    query = db.query(NoticiaModel).filter(NoticiaModel.activo == True)
    
    if tipo:
        query = query.filter(NoticiaModel.tipo == tipo)
    
    noticias = query.order_by(NoticiaModel.fecha_publicacion.desc()).offset(skip).limit(limit).all()
    
    print(f"📰 Noticias encontradas: {len(noticias)}")
    
    # Agregar nombre del autor a cada noticia
    for noticia in noticias:
        noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
    
    return noticias

@app.get("/noticias/{noticia_id}", response_model=Noticia)
async def get_noticia(noticia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Obtener una noticia específica"""
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activo == True).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
    return noticia

@app.put("/noticias/{noticia_id}", response_model=Noticia)
async def update_noticia(
    noticia_id: int, 
    noticia_update: NoticiaUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar una noticia"""
    # Solo el autor o admin pueden editar
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    if noticia.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes editar esta noticia")
    
    update_data = noticia_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(noticia, field, value)
    
    noticia.fecha_actualizacion = datetime.now()
    db.commit()
    db.refresh(noticia)
    
    noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
    return noticia

@app.delete("/noticias/{noticia_id}")
async def delete_noticia(noticia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Eliminar una noticia (desactivar)"""
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    if noticia.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes eliminar esta noticia")
    
    noticia.activo = False
    db.commit()
    
    return {"message": "Noticia eliminada exitosamente"}

@app.post("/noticias/{noticia_id}/like")
async def like_noticia(noticia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Dar like a una noticia"""
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activo == True).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    noticia.likes += 1
    db.commit()
    
    return {"message": "Like agregado", "likes": noticia.likes}

@app.post("/noticias/{noticia_id}/compartir")
async def compartir_noticia(noticia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Compartir una noticia"""
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activo == True).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    noticia.compartidos += 1
    db.commit()
    
    return {"message": "Noticia compartida", "compartidos": noticia.compartidos}

# Endpoints para Comentarios
@app.post("/comentarios/", response_model=Comentario)
async def create_comentario(comentario: ComentarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Crear un nuevo comentario"""
    db_comentario = ComentarioModel(
        contenido=comentario.contenido,
        autor_id=current_user.id,
        noticia_id=comentario.noticia_id
    )
    db.add(db_comentario)
    db.commit()
    db.refresh(db_comentario)
    
    # Agregar nombre del autor
    db_comentario.autor_nombre = db_comentario.autor.nombre if db_comentario.autor else "Usuario"
    
    return db_comentario

@app.get("/comentarios/", response_model=List[Comentario])
async def list_comentarios(
    noticia_id: int,
    skip: int = 0, 
    limit: int = 50,
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener comentarios de una noticia"""
    comentarios = db.query(ComentarioModel).filter(
        ComentarioModel.noticia_id == noticia_id,
        ComentarioModel.activo == True
    ).order_by(ComentarioModel.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    # Agregar nombre del autor a cada comentario
    for comentario in comentarios:
        comentario.autor_nombre = comentario.autor.nombre if comentario.autor else "Usuario"
    
    return comentarios

@app.put("/comentarios/{comentario_id}", response_model=Comentario)
async def update_comentario(
    comentario_id: int, 
    comentario_update: ComentarioUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un comentario"""
    comentario = db.query(ComentarioModel).filter(ComentarioModel.id == comentario_id).first()
    
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    if comentario.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes editar este comentario")
    
    update_data = comentario_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comentario, field, value)
    
    comentario.fecha_actualizacion = datetime.now()
    db.commit()
    db.refresh(comentario)
    
    comentario.autor_nombre = comentario.autor.nombre if comentario.autor else "Usuario"
    return comentario

@app.delete("/comentarios/{comentario_id}")
async def delete_comentario(comentario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Eliminar un comentario (desactivar)"""
    comentario = db.query(ComentarioModel).filter(ComentarioModel.id == comentario_id).first()
    
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    if comentario.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes eliminar este comentario")
    
    comentario.activo = False
    db.commit()
    
    return {"message": "Comentario eliminado exitosamente"}

@app.post("/comentarios/{comentario_id}/like")
async def like_comentario(comentario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Dar like a un comentario"""
    comentario = db.query(ComentarioModel).filter(ComentarioModel.id == comentario_id, ComentarioModel.activo == True).first()
    
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    comentario.likes += 1
    db.commit()
    
    return {"message": "Like agregado", "likes": comentario.likes}

# Endpoints para Reportes Ciudadanos
@app.post("/reportes-ciudadanos/", response_model=ReporteCiudadano)
async def create_reporte_ciudadano(reporte: ReporteCiudadanoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Crear un nuevo reporte ciudadano"""
    
    # 🚨🚨🚨 LOGS SUPER AGRESIVOS PARA RAILWAY 🚨🚨🚨
    print("=" * 80)
    print("🚨🚨🚨 ENDPOINT /reportes-ciudadanos/ EJECUTÁNDOSE 🚨🚨🚨")
    print("🚨🚨🚨 ENDPOINT /reportes-ciudadanos/ EJECUTÁNDOSE 🚨🚨🚨")
    print("🚨🚨🚨 ENDPOINT /reportes-ciudadanos/ EJECUTÁNDOSE 🚨🚨🚨")
    print("=" * 80)
    
    # 🔍 DEBUG: Log detallado de los datos recibidos
    print(f"🚀 CREANDO REPORTE CIUDADANO - Usuario: {current_user.email}")
    print(f"📋 DATOS RECIBIDOS:")
    print(f"   - Título: {reporte.titulo}")
    print(f"   - Descripción: {reporte.descripcion}")
    print(f"   - Tipo: {reporte.tipo}")
    print(f"   - Latitud: {reporte.latitud} (tipo: {type(reporte.latitud)})")
    print(f"   - Longitud: {reporte.longitud} (tipo: {type(reporte.longitud)})")
    print(f"   - Dirección: {reporte.direccion}")
    print(f"   - Prioridad: {reporte.prioridad}")
    print(f"   - Foto URL: {reporte.foto_url}")
    
    # Procesar la foto_url si es una URL file://
    foto_url_processed = reporte.foto_url
    if reporte.foto_url and reporte.foto_url.startswith('file://'):
        # Si es una URL file://, asignar una imagen de ejemplo basada en el tipo
        if 'lámpara' in reporte.titulo.lower() or 'iluminación' in reporte.titulo.lower():
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo2.jpg"  # Iluminación
        elif 'bache' in reporte.titulo.lower() or 'pavimento' in reporte.titulo.lower():
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo1.jpg"  # Baches
        elif 'basura' in reporte.titulo.lower() or 'contenedor' in reporte.titulo.lower():
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo3.jpg"  # Basura
        elif 'árbol' in reporte.titulo.lower() or 'árbol' in reporte.titulo.lower():
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo4.jpg"  # Árboles
        elif 'semaforo' in reporte.titulo.lower() or 'semáforo' in reporte.titulo.lower():
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo5.jpg"  # Semáforos
        else:
            foto_url_processed = "http://localhost:8000/static/reportes/ejemplo1.jpg"  # Por defecto
    
    # 🔍 DEBUG: Log de los datos que se van a guardar
    print(f"💾 DATOS A GUARDAR EN BASE DE DATOS:")
    print(f"   - Título: {reporte.titulo}")
    print(f"   - Descripción: {reporte.descripcion}")
    print(f"   - Tipo: {reporte.tipo}")
    print(f"   - Latitud: {reporte.latitud}")
    print(f"   - Longitud: {reporte.longitud}")
    print(f"   - Dirección: {reporte.direccion}")
    print(f"   - Foto URL: {foto_url_processed}")
    print(f"   - Prioridad: {reporte.prioridad}")
    print(f"   - Ciudadano ID: {current_user.id}")
    
    db_reporte = ReporteCiudadanoModel(
        titulo=reporte.titulo,
        descripcion=reporte.descripcion,
        tipo=reporte.tipo,
        latitud=reporte.latitud,
        longitud=reporte.longitud,
        direccion=reporte.direccion,
        foto_url=foto_url_processed,
        prioridad=reporte.prioridad,
        ciudadano_id=current_user.id
    )
    
    print(f"🔧 OBJETO ReporteCiudadanoModel CREADO:")
    print(f"   - Latitud: {db_reporte.latitud}")
    print(f"   - Longitud: {db_reporte.longitud}")
    
    db.add(db_reporte)
    db.commit()
    db.refresh(db_reporte)
    
    print(f"✅ REPORTE GUARDADO EN BASE DE DATOS:")
    print(f"   - ID: {db_reporte.id}")
    print(f"   - Latitud: {db_reporte.latitud}")
    print(f"   - Longitud: {db_reporte.longitud}")
    print(f"   - Fecha: {db_reporte.fecha_creacion}")

    # 🔧 FIX: Manejar relación ciudadano de forma segura
    try:
        db_reporte.ciudadano_nombre = db_reporte.ciudadano.nombre if db_reporte.ciudadano else "Ciudadano"
    except Exception as e:
        print(f"⚠️ Error accediendo a ciudadano: {e}")
        db_reporte.ciudadano_nombre = "Ciudadano"

    # 🚨🚨🚨 LOGS SUPER AGRESIVOS AL FINAL 🚨🚨🚨
    print("=" * 80)
    print("🚨🚨🚨 REPORTE CIUDADANO CREADO EXITOSAMENTE 🚨🚨🚨")
    print(f"🚨🚨🚨 ID: {db_reporte.id} - Lat: {db_reporte.latitud} - Lng: {db_reporte.longitud} 🚨🚨🚨")
    print("🚨🚨🚨 REPORTE CIUDADANO CREADO EXITOSAMENTE 🚨🚨🚨")
    print("=" * 80)

    return db_reporte

@app.get("/reportes-ciudadanos/", response_model=List[ReporteCiudadano])
async def list_reportes_ciudadanos(
    skip: int = 0,
    limit: int = 100,
    estado: str = None,
    tipo: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener reportes ciudadanos"""
    query = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True)
    
    # Filtrar por estado si se especifica
    if estado:
        query = query.filter(ReporteCiudadanoModel.estado == estado)
    
    # Filtrar por tipo si se especifica
    if tipo:
        query = query.filter(ReporteCiudadanoModel.tipo == tipo)
    
    # Si no es admin, solo mostrar reportes del usuario
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_regional', 'lider_municipal', 'ciudadano']:
        query = query.filter(ReporteCiudadanoModel.ciudadano_id == current_user.id)
    
    reportes = query.order_by(ReporteCiudadanoModel.fecha_creacion.desc()).offset(skip).limit(limit).all()

    # 🔧 FIX: Manejar relaciones de forma segura
    for reporte in reportes:
        try:
            reporte.ciudadano_nombre = reporte.ciudadano.nombre if reporte.ciudadano else "Ciudadano"
        except Exception as e:
            print(f"⚠️ Error accediendo a ciudadano en GET: {e}")
            reporte.ciudadano_nombre = "Ciudadano"
        
        try:
            if reporte.administrador:
                reporte.administrador_nombre = reporte.administrador.nombre
        except Exception as e:
            print(f"⚠️ Error accediendo a administrador: {e}")
            reporte.administrador_nombre = None

    return reportes

@app.get("/admin/reportes-ciudadanos-debug/")
async def admin_debug_reportes_ciudadanos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Debug endpoint - Solo admin puede ver TODOS los reportes sin restricciones"""
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo admin puede acceder a este endpoint")
    
    # Obtener TODOS los reportes (incluso inactivos) para debug
    reportes = db.query(ReporteCiudadanoModel).order_by(ReporteCiudadanoModel.fecha_creacion.desc()).all()
    
    result = []
    for reporte in reportes:
        result.append({
            "id": reporte.id,
            "titulo": reporte.titulo,
            "estado": reporte.estado,
            "activo": reporte.activo,
            "ciudadano_id": reporte.ciudadano_id,
            "ciudadano_nombre": reporte.ciudadano.nombre if reporte.ciudadano else "Sin ciudadano",
            "fecha_creacion": reporte.fecha_creacion,
            "tipo": reporte.tipo,
            "latitud": reporte.latitud,
            "longitud": reporte.longitud,
            "direccion": reporte.direccion
        })
    
    return {
        "total_reportes": len(reportes),
        "usuario_actual": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "rol": current_user.rol
        },
        "reportes": result
    }

# 🚨🚨🚨 NUEVO: Endpoint de debug para líderes y ciudadanos 🚨🚨🚨
@app.get("/debug/reportes-ciudadanos/")
async def debug_reportes_ciudadanos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Endpoint de debug para líderes y ciudadanos - ver sus propios reportes"""
    
    print("🚨🚨🚨 DEBUG ENDPOINT EJECUTÁNDOSE PARA USUARIO:", current_user.email)
    print("🚨🚨🚨 ROL:", current_user.rol)
    
    # Obtener reportes según el rol del usuario
    if current_user.rol in ['admin', 'presidente', 'lider_estatal', 'lider_regional', 'lider_municipal']:
        # Líderes ven todos los reportes activos
        reportes = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True).order_by(ReporteCiudadanoModel.fecha_creacion.desc()).all()
        print("🚨🚨🚨 LÍDER - VIENDO TODOS LOS REPORTES:", len(reportes))
    else:
        # Ciudadanos ven solo sus propios reportes
        reportes = db.query(ReporteCiudadanoModel).filter(
            ReporteCiudadanoModel.activo == True,
            ReporteCiudadanoModel.ciudadano_id == current_user.id
        ).order_by(ReporteCiudadanoModel.fecha_creacion.desc()).all()
        print("🚨🚨🚨 CIUDADANO - VIENDO SUS REPORTES:", len(reportes))
    
    result = []
    for reporte in reportes:
        result.append({
            "id": reporte.id,
            "titulo": reporte.titulo,
            "estado": reporte.estado,
            "activo": reporte.activo,
            "ciudadano_id": reporte.ciudadano_id,
            "ciudadano_nombre": reporte.ciudadano.nombre if reporte.ciudadano else "Sin ciudadano",
            "fecha_creacion": reporte.fecha_creacion,
            "tipo": reporte.tipo,
            "latitud": reporte.latitud,
            "longitud": reporte.longitud,
            "direccion": reporte.direccion
        })
        print(f"🚨🚨🚨 REPORTE {reporte.id}: Lat {reporte.latitud}, Lng {reporte.longitud}")
    
    print("🚨🚨🚨 DEBUG ENDPOINT COMPLETADO - TOTAL REPORTES:", len(result))
    
    return {
        "total_reportes": len(reportes),
        "usuario_actual": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "rol": current_user.rol,
            "email": current_user.email
        },
        "reportes": result
    }

@app.get("/reportes-ciudadanos/{reporte_id}", response_model=ReporteCiudadano)
async def get_reporte_ciudadano(reporte_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Obtener un reporte ciudadano específico"""
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id, ReporteCiudadanoModel.activo == True).first()
    
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    # Verificar permisos
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_municipal'] and reporte.ciudadano_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este reporte")
    
    reporte.ciudadano_nombre = reporte.ciudadano.nombre if reporte.ciudadano else "Ciudadano"
    if reporte.administrador:
        reporte.administrador_nombre = reporte.administrador.nombre
    
    return reporte

@app.put("/reportes-ciudadanos/{reporte_id}", response_model=ReporteCiudadano)
async def update_reporte_ciudadano(
    reporte_id: int,
    reporte_update: ReporteCiudadanoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un reporte ciudadano"""
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()

    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Verificar permisos
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_municipal'] and reporte.ciudadano_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes editar este reporte")

    update_data = reporte_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reporte, field, value)

    reporte.fecha_actualizacion = datetime.now()
    
    # Si el estado cambia a resuelto, establecer fecha_resolucion
    if reporte_update.estado == "resuelto" and reporte.estado != "resuelto":
        reporte.fecha_resolucion = datetime.now()
    
    db.commit()
    db.refresh(reporte)

    reporte.ciudadano_nombre = reporte.ciudadano.nombre if reporte.ciudadano else "Ciudadano"
    if reporte.administrador:
        reporte.administrador_nombre = reporte.administrador.nombre
    
    return reporte

# Endpoint duplicado eliminado - se mantiene solo el de abajo

@app.get("/reportes-ciudadanos/estados/")
async def get_estados_reportes(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Obtener estadísticas de reportes por estado"""
    query = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True)
    
    # Si no es admin, solo contar reportes del usuario
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_municipal']:
        query = query.filter(ReporteCiudadanoModel.ciudadano_id == current_user.id)
    
    total = query.count()
    pendientes = query.filter(ReporteCiudadanoModel.estado == "pendiente").count()
    en_proceso = query.filter(ReporteCiudadanoModel.estado == "en_proceso").count()
    resueltos = query.filter(ReporteCiudadanoModel.estado == "resuelto").count()

    return {
        "pendiente": pendientes,
        "en_proceso": en_proceso,
        "resuelto": resueltos
    }

@app.patch("/reportes-ciudadanos/{reporte_id}", response_model=ReporteCiudadano)
async def update_reporte_ciudadano_estado(
    reporte_id: int,
    estado_update: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar solo el estado de un reporte ciudadano"""
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()

    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Verificar permisos - solo administradores pueden cambiar estados
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_municipal']:
        raise HTTPException(status_code=403, detail="No tienes permisos para cambiar el estado de reportes")

    # Validar estado
    estados_validos = ['pendiente', 'en_revision', 'en_progreso', 'resuelto', 'rechazado']
    nuevo_estado = estado_update.get('estado')
    
    if nuevo_estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Estados válidos: {estados_validos}")

    # Actualizar estado
    reporte.estado = nuevo_estado
    reporte.fecha_actualizacion = datetime.now()
    
    # Si el estado cambia a resuelto, establecer fecha_resolucion
    if nuevo_estado == "resuelto" and reporte.estado != "resuelto":
        reporte.fecha_resolucion = datetime.now()
    
    # Asignar administrador que actualizó
    reporte.administrador_id = current_user.id
    
    # Manejar observaciones según el rol del usuario
    observaciones = estado_update.get('observaciones_admin', '')
    if observaciones:
        # Crear un historial de observaciones con el rol del usuario
        observacion_con_rol = f"[{current_user.rol.upper()}] {current_user.nombre}: {observaciones}"
        
        # Si ya hay observaciones, agregar la nueva
        if reporte.observaciones_admin:
            reporte.observaciones_admin += f"\n\n{observacion_con_rol}"
        else:
            reporte.observaciones_admin = observacion_con_rol
    
    db.commit()
    db.refresh(reporte)

    reporte.ciudadano_nombre = reporte.ciudadano.nombre if reporte.ciudadano else "Ciudadano"
    if reporte.administrador:
        reporte.administrador_nombre = reporte.administrador.nombre
    
    return reporte

@app.delete("/reportes-ciudadanos/{reporte_id}")
async def delete_reporte_ciudadano(reporte_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    """Eliminar un reporte ciudadano"""
    print(f"🗑️ DELETE REPORTE: Usuario {current_user.id} ({current_user.rol}) intentando eliminar reporte {reporte_id}")
    
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()

    if not reporte:
        print(f"❌ DELETE REPORTE: Reporte {reporte_id} no encontrado")
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    print(f"✅ DELETE REPORTE: Reporte {reporte_id} encontrado, ciudadano_id: {reporte.ciudadano_id}")

    # Verificar permisos
    if current_user.rol not in ['admin', 'presidente', 'lider_estatal', 'lider_municipal'] and reporte.ciudadano_id != current_user.id:
        print(f"❌ DELETE REPORTE: Usuario {current_user.id} no tiene permisos para eliminar reporte {reporte_id}")
        raise HTTPException(status_code=403, detail="No puedes eliminar este reporte")

    print(f"✅ DELETE REPORTE: Permisos verificados, procediendo con eliminación")

    # Soft delete
    reporte.activo = False
    reporte.fecha_actualizacion = datetime.now()
    db.commit()

    print(f"✅ DELETE REPORTE: Reporte {reporte_id} eliminado exitosamente")
    return {"message": "Reporte eliminado exitosamente"}

# ✅ ELIMINADO: Endpoint duplicado /reportes-ciudadanos-con-foto/ que causaba conflicto CORS

@app.get("/perfiles/configuracion-dashboard")
async def obtener_configuracion_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración del dashboard para todos los roles"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver configuraciones del dashboard")
    
    try:
        # Obtener configuraciones desde la base de datos
        configuraciones_db = db.query(ConfiguracionDashboardModel).all()
        
        # Crear diccionario con las configuraciones
        configuraciones_dashboard = {}
        
        for config in configuraciones_db:
            # Parsear el JSON de widgets
            try:
                widgets = json.loads(config.widgets) if isinstance(config.widgets, str) else config.widgets
            except (json.JSONDecodeError, TypeError):
                widgets = []
            
            configuraciones_dashboard[config.rol] = {
                "widgets": widgets
            }
        
        # Si no hay configuraciones en la BD, usar configuraciones por defecto
        if not configuraciones_dashboard:
            configuraciones_dashboard = {
                "admin": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                               "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "presidente": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                               "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_estatal": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                               "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_regional": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_municipal": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                               "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_zona": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas", 
                               "top-secciones", "top-lideres", "estructura-red"]
                },
                "capturista": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas"]
                },
                "ciudadano": {
                    "widgets": ["total-eventos", "estructura-red"]
                }
            }
        
        print(f"🔧 Configuraciones del dashboard obtenidas: {configuraciones_dashboard}")
        return configuraciones_dashboard
        
    except Exception as e:
        print(f"❌ Error al obtener configuraciones del dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.put("/perfiles/configuracion-dashboard/{rol}")
async def actualizar_configuracion_dashboard(
    rol: str,
    configuracion: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar la configuración del dashboard para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden actualizar configuraciones del dashboard")
    
    # Validar que el rol existe
    roles_validos = ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista", "ciudadano"]
    if rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    try:
        # Verificar si ya existe una configuración para este rol
        config_existente = db.query(ConfiguracionDashboardModel).filter(ConfiguracionDashboardModel.rol == rol).first()
        
        if config_existente:
            # Actualizar configuración existente
            config_existente.widgets = json.dumps(configuracion.get("widgets", []))
            config_existente.fecha_actualizacion = datetime.now()
            print(f"🔧 Configuración del dashboard actualizada para rol '{rol}': {configuracion}")
        else:
            # Crear nueva configuración
            nueva_config = ConfiguracionDashboardModel(
                rol=rol,
                widgets=json.dumps(configuracion.get("widgets", []))
            )
            db.add(nueva_config)
            print(f"🔧 Nueva configuración del dashboard creada para rol '{rol}': {configuracion}")
        
        db.commit()
        
        return {
            "mensaje": f"Configuración del dashboard actualizada para rol '{rol}'",
            "rol": rol,
            "configuracion": configuracion
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al guardar configuración del dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/perfiles/mi-configuracion-dashboard")
async def obtener_mi_configuracion_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración del dashboard para el usuario actual"""
    try:
        # Obtener configuración desde la base de datos
        config_db = db.query(ConfiguracionDashboardModel).filter(ConfiguracionDashboardModel.rol == current_user.rol).first()
        
        if config_db:
            # Parsear el JSON de widgets
            try:
                widgets = json.loads(config_db.widgets) if isinstance(config_db.widgets, str) else config_db.widgets
            except (json.JSONDecodeError, TypeError):
                widgets = []
            
            configuracion = {
                "rol": current_user.rol,
                "widgets": widgets
            }
        else:
            # Si no hay configuración en la BD, usar configuración por defecto
            configuraciones_default = {
                "admin": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                         "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                         "top-secciones", "top-lideres", "estructura-red"],
                "presidente": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                              "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                              "top-secciones", "top-lideres", "estructura-red"],
                "lider_estatal": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                                  "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                                  "top-secciones", "top-lideres", "estructura-red"],
                "lider_regional": ["total-personas", "total-eventos", "secciones-cubiertas", 
                                   "top-secciones", "top-lideres", "estructura-red"],
                "lider_municipal": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas", 
                                    "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos", 
                                    "top-secciones", "top-lideres", "estructura-red"],
                "lider_zona": ["total-personas", "total-eventos", "secciones-cubiertas", 
                               "top-secciones", "top-lideres", "estructura-red"],
                "capturista": ["total-personas", "total-eventos", "secciones-cubiertas"],
                "ciudadano": ["total-eventos", "estructura-red"]
            }
            
            widgets = configuraciones_default.get(current_user.rol, [])
            configuracion = {
                "rol": current_user.rol,
                "widgets": widgets
            }
        
        print(f"🔧 Configuración del dashboard para {current_user.rol}: {configuracion}")
        return configuracion
        
    except Exception as e:
        print(f"❌ Error al obtener configuración del dashboard para {current_user.rol}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/reportes-ciudadanos/publicos/", response_model=List[ReporteCiudadano])
async def obtener_reportes_ciudadanos_publicos(
    skip: int = 0,
    limit: int = 100,
    estado: str = None,
    tipo: str = None,
    db: Session = Depends(get_db)
):
    """Obtener reportes ciudadanos públicos (sin autenticación)"""
    print(f"🚀🚀🚀 ENDPOINT PÚBLICO PARA OBTENER REPORTES 🚀🚀🚀")
    print(f"🔍 DEBUG: Parámetros recibidos - skip: {skip}, limit: {limit}, estado: {estado}, tipo: {tipo}")
    
    try:
        # Obtener solo reportes públicos activos
        query = db.query(ReporteCiudadanoModel).filter(
            ReporteCiudadanoModel.activo == True,
            ReporteCiudadanoModel.es_publico == True
        )
        
        print(f"🔍 DEBUG: Query base construida, total reportes activos: {query.count()}")
        
        # Filtrar por estado si se especifica
        if estado:
            query = query.filter(ReporteCiudadanoModel.estado == estado)
            print(f"🔍 DEBUG: Filtro estado aplicado: {estado}")
        
        # Filtrar por tipo si se especifica
        if tipo:
            query = query.filter(ReporteCiudadanoModel.tipo == tipo)
            print(f"🔍 DEBUG: Filtro tipo aplicado: {tipo}")
        
        reportes = query.order_by(ReporteCiudadanoModel.fecha_creacion.desc()).offset(skip).limit(limit).all()
        
        print(f"✅✅✅ REPORTES PÚBLICOS OBTENIDOS: {len(reportes)} ✅✅✅")
        print(f"🔍 DEBUG: Primeros 3 reportes: {[{'id': r.id, 'titulo': r.titulo, 'estado': r.estado} for r in reportes[:3]]}")
        
        return reportes
        
    except Exception as e:
        print(f"❌❌❌ ERROR AL OBTENER REPORTES PÚBLICOS: {e} ❌❌❌")
        print(f"❌ DEBUG: Tipo de error: {type(e)}")
        print(f"❌ DEBUG: Detalles completos: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# 🆕 NUEVO: Endpoint OPTIONS para CORS preflight del endpoint problemático
@app.options("/reportes-ciudadanos/publicos/")
async def options_reportes_publicos():
    """Endpoint OPTIONS para CORS preflight"""
    return {"message": "CORS preflight OK para reportes públicos"}

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
    """Crear reporte ciudadano público (sin autenticación)"""
    print(f"🚀🚀🚀 NUEVO DEPLOY DETECTADO - Endpoint corregido ejecutándose 🚀🚀🚀")
    print(f"🚀 DEBUG: Recibiendo reporte público - titulo: {titulo}, tipo: {tipo}")
    print(f"🚀 DEBUG: Datos recibidos - lat: {latitud}, lng: {longitud}, foto: {foto}")
    
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
            "ciudadano_id": None,  # 🔧 EXPLÍCITO: Para reportes públicos
            "administrador_id": None,  # 🔧 EXPLÍCITO: Sin administrador asignado
            "observaciones_admin": None,  # 🔧 EXPLÍCITO: Sin observaciones
            "contacto_email": None  # 🔧 EXPLÍCITO: Sin email de contacto
        }
        
        print(f"🚀 DEBUG: Creando reporte en BD con datos: {reporte_data}")
        print(f"🚀 DEBUG: ciudadano_id será: {reporte_data['ciudadano_id']}")
        print(f"🚀 DEBUG: Tipo de ciudadano_id: {type(reporte_data['ciudadano_id'])}")
        
        # Crear el reporte en la base de datos
        db_reporte = ReporteCiudadanoModel(**reporte_data)
        print(f"🚀 DEBUG: Modelo creado: {db_reporte}")
        print(f"🚀 DEBUG: ciudadano_id en modelo: {db_reporte.ciudadano_id}")
        
        db.add(db_reporte)
        print(f"🚀 DEBUG: Reporte agregado a sesión")
        
        try:
            db.commit()
            print(f"✅✅✅ COMMIT EXITOSO - ID: {db_reporte.id} ✅✅✅")
        except Exception as commit_error:
            print(f"❌❌❌ ERROR EN COMMIT: {commit_error} ❌❌❌")
            print(f"❌ TIPO DE ERROR: {type(commit_error)}")
            print(f"❌ DETALLES COMPLETOS: {str(commit_error)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error en commit: {str(commit_error)}")
        
        db.refresh(db_reporte)
        
        # Procesar foto si se proporcionó
        if foto and foto.size > 0:
            # 🔧 NUEVO: Crear directorio de uploads si no existe
            import os
            upload_dir = "uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # Guardar la foto físicamente
            contenido = await foto.read()
            nombre_archivo = f"reporte_{db_reporte.id}_{foto.filename}"
            file_path = os.path.join(upload_dir, nombre_archivo)
            
            # 🔧 NUEVO: Escribir archivo al sistema de archivos
            with open(file_path, "wb") as f:
                f.write(contenido)
            
            print(f"✅ Foto guardada físicamente en: {file_path}")
            
            # Crear registro de foto en la base de datos
            foto_data = {
                "id_reporte": db_reporte.id,
                "nombre_archivo": nombre_archivo,
                "tipo": foto.content_type,
                "tamaño": foto.size,
                "url": f"/uploads/{nombre_archivo}"  # URL relativa para la BD
            }
            
            # Crear registro de foto en la base de datos
            db_foto = FotoReporteModel(**foto_data)
            db.add(db_foto)
            db.commit()
            
            print(f"✅ Registro de foto guardado en BD: {foto_data}")
        
        return {
            "mensaje": "Reporte ciudadano creado exitosamente",
            "id": db_reporte.id,
            "estado": "pendiente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear reporte: {str(e)}")

@app.get("/reportes-publicos", response_model=List[dict])
async def obtener_reportes_ciudadanos_publicos(
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener reportes ciudadanos públicos (sin autenticación)"""
    print(f"🚀 DEBUG: Endpoint público llamado - skip: {skip}, limit: {limit}")
    print(f"🚀 DEBUG: Filtros - tipo: {tipo}, estado: {estado}, fecha_inicio: {fecha_inicio}, fecha_fin: {fecha_fin}")
    try:
        print(f"🚀 DEBUG: Construyendo query...")
        query = db.query(ReporteCiudadanoModel).filter(
            ReporteCiudadanoModel.activo == True,
            ReporteCiudadanoModel.es_publico == True
        )
        print(f"🚀 DEBUG: Query base construida")
        
        # Aplicar filtros si se proporcionan
        if tipo:
            query = query.filter(ReporteCiudadanoModel.tipo == tipo)
            print(f"🚀 DEBUG: Filtro tipo aplicado: {tipo}")
        if estado:
            query = query.filter(ReporteCiudadanoModel.estado == estado)
            print(f"🚀 DEBUG: Filtro estado aplicado: {estado}")
        if fecha_inicio:
            query = query.filter(ReporteCiudadanoModel.fecha_creacion >= fecha_inicio)
            print(f"🚀 DEBUG: Filtro fecha_inicio aplicado: {fecha_inicio}")
        if fecha_fin:
            query = query.filter(ReporteCiudadanoModel.fecha_creacion <= fecha_fin)
            print(f"🚀 DEBUG: Filtro fecha_fin aplicado: {fecha_fin}")
        
        print(f"🚀 DEBUG: Ejecutando query...")
        # Obtener reportes con paginación
        reportes = query.offset(skip).limit(limit).all()
        print(f"🚀 DEBUG: Query ejecutada, {len(reportes)} reportes encontrados")
        
        # Formatear respuesta incluyendo fotos
        resultado = []
        for reporte in reportes:
            # Buscar fotos asociadas al reporte
            fotos = db.query(FotoReporteModel).filter(
                FotoReporteModel.id_reporte == reporte.id,
                FotoReporteModel.activo == True
            ).all()
            
            # Formatear datos de fotos
            fotos_data = []
            for foto in fotos:
                # 🔧 CORREGIR: Generar URL absoluta en lugar de relativa
                foto_url_absoluta = f"https://red-ciudadana-production.up.railway.app{foto.url}"
                fotos_data.append({
                    "id": foto.id,
                    "nombre_archivo": foto.nombre_archivo,
                    "url": foto_url_absoluta,  # 🔧 URL absoluta
                    "tipo": foto.tipo,
                    "tamaño": foto.tamaño
                })
            
            reporte_data = {
                "id": reporte.id,
                "titulo": reporte.titulo,
                "descripcion": reporte.descripcion,
                "tipo": reporte.tipo,
                "latitud": reporte.latitud,
                "longitud": reporte.longitud,
                "direccion": reporte.direccion,
                "estado": reporte.estado,
                "prioridad": reporte.prioridad,
                "fecha_creacion": reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
                "fecha_actualizacion": reporte.fecha_actualizacion.isoformat() if reporte.fecha_actualizacion else None,
                "es_publico": reporte.es_publico,
                "fotos": fotos_data,  # 🔧 NUEVO: Incluir fotos asociadas
                "tiene_foto": len(fotos_data) > 0  # 🔧 NUEVO: Indicador de si tiene foto
            }
            resultado.append(reporte_data)
        
        print(f"🚀 DEBUG: Respuesta formateada, {len(resultado)} reportes en resultado")
        return resultado
        
    except Exception as e:
        print(f"❌ ERROR en endpoint público: {str(e)}")
        print(f"❌ TIPO DE ERROR: {type(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener reportes: {str(e)}")
# ============================================================================
# ENDPOINTS PARA TIPOS DE REPORTE
# ============================================================================

@app.get("/tipos-reporte/")
async def obtener_tipos_reporte():
    """Obtener todos los tipos de reporte activos disponibles"""
    try:
        from .constants import obtener_tipos_reporte_formateados
        tipos = obtener_tipos_reporte_formateados()
        return {
            "success": True,
            "data": tipos,
            "total": len(tipos)
        }
    except Exception as e:
        print(f"❌ ERROR al obtener tipos de reporte: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos de reporte: {str(e)}")

@app.get("/admin/tipos-reporte/")
async def obtener_todos_tipos_reporte():
    """Obtener TODOS los tipos de reporte (activos e inactivos) para administración"""
    try:
        from .constants import obtener_todos_tipos_reporte
        tipos = obtener_todos_tipos_reporte()
        return {
            "success": True,
            "data": tipos,
            "total": len(tipos)
        }
    except Exception as e:
        print(f"❌ ERROR al obtener todos los tipos de reporte: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener todos los tipos de reporte: {str(e)}")

@app.put("/admin/tipos-reporte/{tipo_valor}/activar")
async def activar_tipo_reporte(
    tipo_valor: str,
    activo: bool = True,
    db: Session = Depends(get_db)
):
    """Activar o desactivar un tipo de reporte"""
    try:
        from .constants import activar_tipo_reporte, obtener_todos_tipos_reporte
        
        # Verificar que el tipo existe
        tipos = obtener_todos_tipos_reporte()
        tipo_existe = any(tipo["valor"] == tipo_valor for tipo in tipos)
        
        if not tipo_existe:
            raise HTTPException(status_code=404, detail=f"Tipo de reporte '{tipo_valor}' no encontrado")
        
        # Activar/desactivar el tipo
        activar_tipo_reporte(tipo_valor, activo)
        
        # Obtener el tipo actualizado
        tipo_actualizado = next((tipo for tipo in tipos if tipo["valor"] == tipo_valor), None)
        
        return {
            "success": True,
            "message": f"Tipo de reporte '{tipo_valor}' {'activado' if activo else 'desactivado'} exitosamente",
            "data": tipo_actualizado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al activar/desactivar tipo de reporte: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al activar/desactivar tipo de reporte: {str(e)}")

@app.get("/tipos-reporte/categorias/")
async def obtener_tipos_por_categoria():
    """Obtener tipos de reporte agrupados por categoría"""
    try:
        from .constants import obtener_tipos_por_categoria
        categorias = obtener_tipos_por_categoria()
        return {
            "success": True,
            "data": categorias,
            "total_categorias": len(categorias)
        }
    except Exception as e:
        print(f"❌ ERROR al obtener tipos por categoría: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos por categoría: {str(e)}")

@app.get("/estados-reporte/")
async def obtener_estados_reporte():
    """Obtener todos los estados de reporte disponibles"""
    try:
        from .constants import ESTADOS_REPORTE
        return {
            "success": True,
            "data": ESTADOS_REPORTE,
            "total": len(ESTADOS_REPORTE)
        }
    except Exception as e:
        print(f"❌ ERROR al obtener estados de reporte: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener estados de reporte: {str(e)}")

@app.get("/prioridades-reporte/")
async def obtener_prioridades_reporte():
    """Obtener todas las prioridades de reporte disponibles"""
    try:
        from .constants import PRIORIDADES_REPORTE
        return {
            "success": True,
            "data": PRIORIDADES_REPORTE,
            "total": len(PRIORIDADES_REPORTE)
        }
    except Exception as e:
        print(f"❌ ERROR al obtener prioridades de reporte: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener prioridades de reporte: {str(e)}")

# ============================================================================
# SISTEMA DE NOTICIAS Y BANNER
# ============================================================================

@app.get("/noticias/banner/")
async def obtener_noticias_banner(
    limit: int = Query(5, ge=1, le=10, description="Número máximo de noticias a mostrar"),
    db: Session = Depends(get_db)
):
    """Obtener noticias para el banner principal"""
    try:
        from .crud_noticias import crud_noticias
        noticias = crud_noticias.get_noticias_banner(db, limit=limit)
        
        # Convertir a formato de respuesta
        noticias_banner = []
        for noticia in noticias:
            noticias_banner.append({
                "id": noticia.id,
                "titulo": noticia.titulo,
                "descripcion_corta": noticia.descripcion_corta,
                "imagen_url": noticia.imagen_url,
                "imagen_alt": noticia.imagen_alt,
                "categoria": noticia.categoria,
                "destacada": noticia.destacada,
                "prioridad": noticia.prioridad,
                "enlace_externo": noticia.enlace_externo,
                "boton_texto": noticia.boton_texto,
                "fecha_publicacion": noticia.fecha_publicacion.isoformat() if noticia.fecha_publicacion else None
            })
        
        return {
            "success": True,
            "data": noticias_banner,
            "total": len(noticias_banner)
        }
        
    except Exception as e:
        print(f"❌ ERROR al obtener noticias del banner: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener noticias del banner: {str(e)}")

@app.get("/noticias/")
async def obtener_noticias(
    skip: int = Query(0, ge=0, description="Número de noticias a omitir"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de noticias"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    destacadas: Optional[bool] = Query(None, description="Filtrar por destacadas"),
    activas_only: bool = Query(True, description="Solo noticias activas"),
    db: Session = Depends(get_db)
):
    """Obtener lista de noticias con filtros"""
    try:
        from .crud_noticias import crud_noticias
        noticias = crud_noticias.get_noticias(
            db, 
            skip=skip, 
            limit=limit,
            activas_only=activas_only,
            categoria=categoria,
            destacadas=destacadas
        )
        
        # Convertir a formato de respuesta
        noticias_list = []
        for noticia in noticias:
            noticias_list.append({
                "id": noticia.id,
                "titulo": noticia.titulo,
                "descripcion_corta": noticia.descripcion_corta,
                "contenido_completo": noticia.contenido_completo,
                "imagen_url": noticia.imagen_url,
                "imagen_alt": noticia.imagen_alt,
                "fecha_creacion": noticia.fecha_creacion.isoformat(),
                "fecha_publicacion": noticia.fecha_publicacion.isoformat() if noticia.fecha_publicacion else None,
                "fecha_expiracion": noticia.fecha_expiracion.isoformat() if noticia.fecha_expiracion else None,
                "activa": noticia.activa,
                "destacada": noticia.destacada,
                "prioridad": noticia.prioridad,
                "categoria": noticia.categoria,
                "tags": noticia.tags,
                "enlace_externo": noticia.enlace_externo,
                "boton_texto": noticia.boton_texto,
                "vistas": noticia.vistas,
                "clicks": noticia.clicks,
                "autor_id": noticia.autor_id,
                "fecha_modificacion": noticia.fecha_modificacion.isoformat()
            })
        
        return {
            "success": True,
            "data": noticias_list,
            "total": len(noticias_list),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        print(f"❌ ERROR al obtener noticias: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener noticias: {str(e)}")

@app.get("/noticias/{noticia_id}")
async def obtener_noticia(
    noticia_id: int,
    db: Session = Depends(get_db)
):
    """Obtener una noticia específica por ID"""
    try:
        from .crud_noticias import crud_noticias
        
        # Incrementar contador de vistas
        crud_noticias.incrementar_vistas(db, noticia_id)
        
        noticia = crud_noticias.get_noticia(db, noticia_id)
        if not noticia:
            raise HTTPException(status_code=404, detail="Noticia no encontrada")
        
        if not noticia.activa:
            raise HTTPException(status_code=404, detail="Noticia no disponible")
        
        return {
            "success": True,
            "data": {
                "id": noticia.id,
                "titulo": noticia.titulo,
                "descripcion_corta": noticia.descripcion_corta,
                "contenido_completo": noticia.contenido_completo,
                "imagen_url": noticia.imagen_url,
                "imagen_alt": noticia.imagen_alt,
                "fecha_creacion": noticia.fecha_creacion.isoformat(),
                "fecha_publicacion": noticia.fecha_publicacion.isoformat() if noticia.fecha_publicacion else None,
                "fecha_expiracion": noticia.fecha_expiracion.isoformat() if noticia.fecha_expiracion else None,
                "activa": noticia.activa,
                "destacada": noticia.destacada,
                "prioridad": noticia.prioridad,
                "categoria": noticia.categoria,
                "tags": noticia.tags,
                "enlace_externo": noticia.enlace_externo,
                "boton_texto": noticia.boton_texto,
                "vistas": noticia.vistas,
                "clicks": noticia.clicks,
                "autor_id": noticia.autor_id,
                "fecha_modificacion": noticia.fecha_modificacion.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al obtener noticia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener noticia: {str(e)}")

# ============================================================================
# ENDPOINTS ADMINISTRATIVOS DE NOTICIAS
# ============================================================================

@app.post("/admin/upload-image/")
async def upload_image(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(require_admin)
):
    """Subir imagen para noticias (solo administradores)"""
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
        
        # Validar tamaño (máximo 5MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="El archivo es demasiado grande (máximo 5MB)")
        
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Generar URL pública
        image_url = f"/uploads/images/{unique_filename}"
        
        return {
            "success": True,
            "message": "Imagen subida exitosamente",
            "data": {
                "filename": unique_filename,
                "url": image_url,
                "size": file_size,
                "content_type": file.content_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al subir imagen: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

@app.post("/admin/noticias/")
async def crear_noticia(
    noticia: NoticiaCreate,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Crear una nueva noticia (solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        db_noticia = crud_noticias.create_noticia(
            db, 
            noticia, 
            autor_id=current_user.id
        )
        
        return {
            "success": True,
            "message": "Noticia creada exitosamente",
            "data": {
                "id": db_noticia.id,
                "titulo": db_noticia.titulo,
                "descripcion_corta": db_noticia.descripcion_corta,
                "categoria": db_noticia.categoria,
                "activa": db_noticia.activa,
                "destacada": db_noticia.destacada,
                "prioridad": db_noticia.prioridad
            }
        }
        
    except Exception as e:
        print(f"❌ ERROR al crear noticia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear noticia: {str(e)}")

@app.put("/admin/noticias/{noticia_id}")
async def actualizar_noticia(
    noticia_id: int,
    noticia_update: NoticiaUpdate,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Actualizar una noticia existente (solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        db_noticia = crud_noticias.update_noticia(db, noticia_id, noticia_update)
        if not db_noticia:
            raise HTTPException(status_code=404, detail="Noticia no encontrada")
        
        return {
            "success": True,
            "message": "Noticia actualizada exitosamente",
            "data": {
                "id": db_noticia.id,
                "titulo": db_noticia.titulo,
                "descripcion_corta": db_noticia.descripcion_corta,
                "categoria": db_noticia.categoria,
                "activa": db_noticia.activa,
                "destacada": db_noticia.destacada,
                "prioridad": db_noticia.prioridad
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al actualizar noticia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar noticia: {str(e)}")

@app.delete("/admin/noticias/{noticia_id}")
async def eliminar_noticia(
    noticia_id: int,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Eliminar una noticia (soft delete, solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        success = crud_noticias.delete_noticia(db, noticia_id)
        if not success:
            raise HTTPException(status_code=404, detail="Noticia no encontrada")
        
        return {
            "success": True,
            "message": "Noticia eliminada exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al eliminar noticia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar noticia: {str(e)}")

@app.put("/admin/noticias/{noticia_id}/toggle-activa")
async def toggle_noticia_activa(
    noticia_id: int,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activar/desactivar una noticia (solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        db_noticia = crud_noticias.toggle_noticia_activa(db, noticia_id)
        if not db_noticia:
            raise HTTPException(status_code=404, detail="Noticia no encontrada")
        
        return {
            "success": True,
            "message": f"Noticia {'activada' if db_noticia.activa else 'desactivada'} exitosamente",
            "data": {
                "id": db_noticia.id,
                "titulo": db_noticia.titulo,
                "activa": db_noticia.activa
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al cambiar estado de noticia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado de noticia: {str(e)}")

@app.put("/admin/noticias/{noticia_id}/toggle-destacada")
async def toggle_noticia_destacada(
    noticia_id: int,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Marcar/desmarcar noticia como destacada (solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        db_noticia = crud_noticias.toggle_noticia_destacada(db, noticia_id)
        if not db_noticia:
            raise HTTPException(status_code=404, detail="Noticia no encontrada")
        
        return {
            "success": True,
            "message": f"Noticia {'marcada como destacada' if db_noticia.destacada else 'desmarcada como destacada'} exitosamente",
            "data": {
                "id": db_noticia.id,
                "titulo": db_noticia.titulo,
                "destacada": db_noticia.destacada
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR al cambiar estado destacada: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado destacada: {str(e)}")

@app.get("/admin/noticias/estadisticas/")
async def obtener_estadisticas_noticias(
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de noticias (solo administradores)"""
    try:
        from .crud_noticias import crud_noticias
        
        estadisticas = crud_noticias.get_estadisticas_noticias(db)
        
        return {
            "success": True,
            "data": estadisticas
        }
        
    except Exception as e:
        print(f"❌ ERROR al obtener estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

# ============================================================================
# SISTEMA DE ADMINISTRACIÓN DE BASE DE DATOS
# ============================================================================

# Importar el sistema de administración
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from admin_database import register_admin_routes

# Registrar las rutas de administración
register_admin_routes(app)

# ============================================================================
# FIN DEL ARCHIVO
# ============================================================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
