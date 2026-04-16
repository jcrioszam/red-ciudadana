import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Depends, HTTPException, status, Request, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import uvicorn
import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from .database import engine, get_db, SessionLocal
from .models import Base
from .auth import get_password_hash
from .models import Usuario as UsuarioModel
from .models_noticias import Noticia as _NoticiaRegistro  # registra tabla noticias en Base.metadata
from . import vehiculos, movilizaciones
from . import endpoints_padron


# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

def verificar_y_crear_columnas():
    """Ensure required columns exist."""
    for tabla, col, ddl in [
        ("reportes_ciudadanos", "es_publico", "ALTER TABLE reportes_ciudadanos ADD COLUMN es_publico BOOLEAN DEFAULT true"),
        ("reportes_ciudadanos", "contacto_email", "ALTER TABLE reportes_ciudadanos ADD COLUMN contacto_email VARCHAR(255)"),
        ("noticias", "imagenes", "ALTER TABLE noticias ADD COLUMN imagenes TEXT"),
        ("fotos_reportes", "contenido_base64", "ALTER TABLE fotos_reportes ADD COLUMN contenido_base64 TEXT"),
        ("reportes_ciudadanos", "folio",       "ALTER TABLE reportes_ciudadanos ADD COLUMN folio TEXT"),
        ("reportes_ciudadanos", "votos",       "ALTER TABLE reportes_ciudadanos ADD COLUMN votos INTEGER DEFAULT 0"),
        ("reportes_ciudadanos", "vistas",      "ALTER TABLE reportes_ciudadanos ADD COLUMN vistas INTEGER DEFAULT 0"),
        ("reportes_ciudadanos", "colonia",     "ALTER TABLE reportes_ciudadanos ADD COLUMN colonia TEXT"),
        ("reportes_ciudadanos", "calle",       "ALTER TABLE reportes_ciudadanos ADD COLUMN calle TEXT"),
        ("reportes_ciudadanos", "subtipo",     "ALTER TABLE reportes_ciudadanos ADD COLUMN subtipo TEXT"),
        ("reportes_ciudadanos", "resuelto_en", "ALTER TABLE reportes_ciudadanos ADD COLUMN resuelto_en TIMESTAMP"),
        ("usuarios", "opciones_app_usuario",  "ALTER TABLE usuarios ADD COLUMN opciones_app_usuario TEXT"),
    ]:
        db = SessionLocal()
        try:
            db.execute(text(f"SELECT {col} FROM {tabla} LIMIT 1"))
        except Exception:
            db.rollback()
            try:
                db.execute(text(ddl))
                db.commit()
                logger.info(f"Columna {tabla}.{col} creada")
            except Exception as e:
                logger.error(f"Error creando columna {tabla}.{col}: {e}")
                db.rollback()
        finally:
            db.close()



def migrate_foto_url_auto():
    """Increase foto_url column size and make ciudadano_id nullable."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return
    try:
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        cur.execute("""
            SELECT character_maximum_length FROM information_schema.columns
            WHERE table_name='reportes_ciudadanos' AND column_name='foto_url'
        """)
        row = cur.fetchone()
        if row and (row[0] is None or row[0] < 50000):
            cur.execute("ALTER TABLE reportes_ciudadanos ALTER COLUMN foto_url TYPE VARCHAR(50000)")
            logger.info("foto_url ampliado a 50000")

        cur.execute("""
            SELECT is_nullable FROM information_schema.columns
            WHERE table_name='reportes_ciudadanos' AND column_name='ciudadano_id'
        """)
        row = cur.fetchone()
        if row and row[0] == "NO":
            cur.execute("ALTER TABLE reportes_ciudadanos ALTER COLUMN ciudadano_id DROP NOT NULL")
            logger.info("ciudadano_id ahora es nullable")

        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error en migrate_foto_url_auto: {e}")


def create_initial_users():
    """Create default admin user if none exists."""
    db = SessionLocal()
    try:
        if db.query(UsuarioModel).filter(UsuarioModel.rol == "admin").first():
            return
        logger.info("Creando usuario admin inicial...")
        db.add(UsuarioModel(
            username="admin",
            nombre="Administrador",
            telefono="1234567890",
            direccion="Oficina Central",
            edad=35,
            sexo="M",
            email="admin@redciudadana.com",
            password_hash=get_password_hash("admin123"),
            rol="admin",
            activo=True,
        ))
        db.commit()
        logger.info("Admin creado: admin@redciudadana.com / admin123")
    except Exception as e:
        logger.error(f"Error creando usuarios iniciales: {e}")
        db.rollback()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando aplicacion Red Ciudadana...")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.error(f"Error creando tablas: {e}")
    verificar_y_crear_columnas()
    migrate_foto_url_auto()
    create_initial_users()
    yield
    logger.info("Cerrando aplicacion Red Ciudadana...")


app = FastAPI(
    title="Red Ciudadana API",
    description="Sistema de gestion para partido politico",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting (optional)
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("Rate limiting activado")
except ImportError:
    pass

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para permitir Private Network Access (Radmin VPN / IPs externas hacia localhost)
@app.middleware("http")
async def add_private_network_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Static files
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(vehiculos.router)
app.include_router(movilizaciones.router)
app.include_router(endpoints_padron.router, prefix="/api", tags=["padron"])

from .routers import (
    auth_routes, usuarios, perfiles, ubicaciones,
    eventos, asistencias, personas, reportes,
    noticias, reportes_ciudadanos, tipos_reporte,
    invitaciones, uploads, incentivos, duplicados,
)
app.include_router(auth_routes.router)
app.include_router(usuarios.router)
app.include_router(perfiles.router)
app.include_router(ubicaciones.router)
app.include_router(eventos.router)
app.include_router(asistencias.router)
app.include_router(personas.router)
app.include_router(reportes.router)
app.include_router(noticias.router)
app.include_router(reportes_ciudadanos.router)
app.include_router(tipos_reporte.router)
app.include_router(invitaciones.router)
app.include_router(uploads.router)
app.include_router(incentivos.router)
app.include_router(duplicados.router)

# Admin database routes
try:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from admin_database import register_admin_routes
    register_admin_routes(app)
except Exception as e:
    logger.warning(f"admin_database no disponible: {e}")

# /reportes-publicos alias
from .routers.reportes_ciudadanos import (
    obtener_reportes_publicos_con_fotos as _rp_handler,
    create_reporte_publico as _rp_create_handler,
)
from typing import Optional as _Optional

@app.get("/reportes-publicos")
async def reportes_publicos_alias(
    skip: int = 0,
    limit: int = 100,
    tipo: _Optional[str] = None,
    estado: _Optional[str] = None,
    fecha_inicio: _Optional[str] = None,
    fecha_fin: _Optional[str] = None,
    db=Depends(get_db)
):
    return await _rp_handler(skip=skip, limit=limit, tipo=tipo, estado=estado, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, db=db)

@app.post("/reporte-publico")
async def reporte_publico_create_alias(
    titulo: _Optional[str] = Form(None),
    descripcion: str = Form(...),
    tipo: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    direccion: _Optional[str] = Form(None),
    prioridad: _Optional[str] = Form("normal"),
    foto: _Optional[UploadFile] = File(None),
    db=Depends(get_db)
):
    return await _rp_create_handler(
        titulo=titulo, descripcion=descripcion, tipo=tipo,
        latitud=latitud, longitud=longitud, direccion=direccion,
        prioridad=prioridad, es_publico=True, foto=foto, db=db,
    )

# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "Red Ciudadana API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/health-detailed")
async def health_check_detailed():
    return {
        "status": "healthy",
        "service": "Red Ciudadana API",
        "version": "1.0.0",
    }


@app.get("/cors-test")
async def cors_test():
    return {"cors": "working", "status": "OK"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
