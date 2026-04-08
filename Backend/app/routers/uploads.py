from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import logging

from ..database import get_db
from ..auth import get_current_active_user, require_admin
from ..schemas import Usuario
from ..config import LOGO_PATH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["uploads"])

ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES + [
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]


@router.get("/logo")
def get_logo():
    if os.path.exists(LOGO_PATH):
        return FileResponse(LOGO_PATH)
    raise HTTPException(status_code=404, detail="Logo no encontrado")


@router.post("/admin/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(require_admin)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo es demasiado grande (maximo 2MB)")
    os.makedirs("static", exist_ok=True)
    with open(LOGO_PATH, "wb") as f:
        f.write(content)
    logger.info(f"Logo actualizado: {file.filename} ({len(content)} bytes)")
    return {"success": True, "message": "Logo actualizado exitosamente", "filename": file.filename, "size": len(content)}


@router.post("/upload-foto-reporte")
async def upload_foto_reporte(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_active_user)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo es demasiado grande (maximo 10MB)")
    os.makedirs("static/reportes", exist_ok=True)
    ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
    file_name = f"{uuid.uuid4()}.{ext}"
    with open(f"static/reportes/{file_name}", "wb") as f:
        f.write(content)
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    logger.info(f"Foto de reporte subida: {file_name} ({len(content)} bytes)")
    return {"success": True, "url": f"{base_url}/static/reportes/{file_name}", "filename": file_name, "size": len(content)}


@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    current_user: Usuario = Depends(get_current_active_user)
):
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo es demasiado grande (maximo 20MB)")
    upload_dir = f"uploads/{folder}"
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'bin'
    file_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, file_name)
    with open(file_path, "wb") as f:
        f.write(content)
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    logger.info(f"Archivo subido: {file_name} en {folder} ({len(content)} bytes)")
    return {
        "success": True,
        "message": "Archivo subido exitosamente",
        "data": {
            "filename": file_name,
            "original_name": file.filename,
            "url": f"{base_url}/uploads/{folder}/{file_name}",
            "size": len(content),
            "content_type": file.content_type,
            "folder": folder
        }
    }


@router.get("/static/{path:path}")
def serve_static_files(path: str):
    file_path = f"static/{path}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Archivo no encontrado")
