import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Depends, HTTPException, status, Request
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
from . import vehiculos, movilizaciones
from . import endpoints_padron


# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

def verificar_y_crear_columnas():
    """Ensure required columns exist in reportes_ciudadanos."""
    for col, ddl in [
        ("es_publico", "ALTER TABLE reportes_ciudadanos ADD COLUMN es_publico BOOLEAN DEFAULT true"),
        ("contacto_email", "ALTER TABLE reportes_ciudadanos ADD COLUMN contacto_email VARCHAR(255)"),
    ]:
        db = SessionLocal()
        try:
            db.execute(text(f"SELECT {col} FROM reportes_ciudadanos LIMIT 1"))
        except Exception:
            try:
                db.execute(text(ddl))
                db.commit()
                logger.info(f"Columna {col} creada")
            except Exception as e:
                logger.error(f"Error creando columna {col}: {e}")
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
    allow_origins=[
        "https://red-ciudadana.vercel.app",
        "https://red-ciudadana-574v-iakbeuaab-juan-carlos-projects-ba06dd79.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    invitaciones, uploads,
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

# Admin database routes
try:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from admin_database import register_admin_routes
    register_admin_routes(app)
except Exception as e:
    logger.warning(f"admin_database no disponible: {e}")

# /reportes-publicos alias — served by reportes_ciudadanos router as /reportes-ciudadanos/publicos/

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
