from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os

from ..database import get_db
from ..auth import get_current_active_user
from ..schemas import Usuario
from ..schemas_reportes import ReporteCiudadano, ReporteCiudadanoCreate, ReporteCiudadanoUpdate
from ..models import ReporteCiudadano as ReporteCiudadanoModel, FotoReporte as FotoReporteModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reportes-ciudadanos", tags=["reportes-ciudadanos"])

ADMIN_ROLES = ['admin', 'presidente', 'lider_estatal', 'lider_regional', 'lider_municipal']


def _safe_set_nombres(reporte):
    try:
        reporte.ciudadano_nombre = reporte.ciudadano.nombre if reporte.ciudadano else "Ciudadano"
    except Exception:
        reporte.ciudadano_nombre = "Ciudadano"
    try:
        if reporte.administrador:
            reporte.administrador_nombre = reporte.administrador.nombre
    except Exception:
        reporte.administrador_nombre = None


@router.post("/", response_model=ReporteCiudadano)
async def create_reporte_ciudadano(
    reporte: ReporteCiudadanoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    try:
        if reporte.latitud is not None and (reporte.latitud < -90 or reporte.latitud > 90):
            raise HTTPException(status_code=400, detail="Latitud debe estar entre -90 y 90")
        if reporte.longitud is not None and (reporte.longitud < -180 or reporte.longitud > 180):
            raise HTTPException(status_code=400, detail="Longitud debe estar entre -180 y 180")

        foto_url_processed = reporte.foto_url
        if reporte.foto_url and reporte.foto_url.startswith('file://'):
            foto_url_processed = None

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
        db.add(db_reporte)
        db.commit()
        db.refresh(db_reporte)
        _safe_set_nombres(db_reporte)
        logger.info(f"Reporte ciudadano creado: {db_reporte.id} por usuario {current_user.id}")
        return db_reporte
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear reporte ciudadano: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear reporte: {str(e)}")


@router.get("/", response_model=List[ReporteCiudadano])
async def list_reportes_ciudadanos(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True)
    if estado:
        query = query.filter(ReporteCiudadanoModel.estado == estado)
    if tipo:
        query = query.filter(ReporteCiudadanoModel.tipo == tipo)
    if current_user.rol not in ADMIN_ROLES + ['ciudadano']:
        query = query.filter(ReporteCiudadanoModel.ciudadano_id == current_user.id)
    reportes = query.order_by(ReporteCiudadanoModel.fecha_creacion.desc()).offset(skip).limit(limit).all()
    for reporte in reportes:
        _safe_set_nombres(reporte)
    return reportes


@router.get("/estados/")
async def get_estados_reportes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True)
    if current_user.rol not in ADMIN_ROLES:
        query = query.filter(ReporteCiudadanoModel.ciudadano_id == current_user.id)
    pendientes = query.filter(ReporteCiudadanoModel.estado == "pendiente").count()
    en_proceso = query.filter(ReporteCiudadanoModel.estado == "en_proceso").count()
    resueltos = query.filter(ReporteCiudadanoModel.estado == "resuelto").count()
    return {"pendiente": pendientes, "en_proceso": en_proceso, "resuelto": resueltos}


@router.get("/publicos/", response_model=List[ReporteCiudadano])
async def obtener_reportes_publicos(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.activo == True,
        ReporteCiudadanoModel.es_publico == True
    )
    if estado:
        query = query.filter(ReporteCiudadanoModel.estado == estado)
    if tipo:
        query = query.filter(ReporteCiudadanoModel.tipo == tipo)
    reportes = query.order_by(ReporteCiudadanoModel.fecha_creacion.desc()).offset(skip).limit(limit).all()
    for reporte in reportes:
        _safe_set_nombres(reporte)
    return reportes


@router.get("/publicos-con-fotos/")
async def obtener_reportes_publicos_con_fotos(
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    base_url = os.getenv("BASE_URL", "https://red-ciudadana-production.up.railway.app")
    query = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.activo == True,
        ReporteCiudadanoModel.es_publico == True
    )
    if tipo:
        query = query.filter(ReporteCiudadanoModel.tipo == tipo)
    if estado:
        query = query.filter(ReporteCiudadanoModel.estado == estado)
    if fecha_inicio:
        query = query.filter(ReporteCiudadanoModel.fecha_creacion >= fecha_inicio)
    if fecha_fin:
        query = query.filter(ReporteCiudadanoModel.fecha_creacion <= fecha_fin)
    reportes = query.offset(skip).limit(limit).all()
    resultado = []
    for reporte in reportes:
        fotos = db.query(FotoReporteModel).filter(
            FotoReporteModel.id_reporte == reporte.id,
            FotoReporteModel.activo == True
        ).all()
        fotos_data = []
        for foto in fotos:
            if foto.contenido_base64:
                foto_url = f"data:{foto.tipo};base64,{foto.contenido_base64}"
            elif foto.url:
                foto_url = f"{base_url}{foto.url}"
            else:
                foto_url = None
            fotos_data.append({
                "id": foto.id,
                "nombre_archivo": foto.nombre_archivo,
                "url": foto_url,
                "tipo": foto.tipo,
                "tamanio": foto.tamaño
            })
        resultado.append({
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
            "es_publico": reporte.es_publico,
            "fotos": fotos_data,
            "tiene_foto": len(fotos_data) > 0
        })
    return resultado


@router.get("/{reporte_id}", response_model=ReporteCiudadano)
async def get_reporte_ciudadano(
    reporte_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    reporte = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.id == reporte_id, ReporteCiudadanoModel.activo == True
    ).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if current_user.rol not in ADMIN_ROLES and reporte.ciudadano_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este reporte")
    _safe_set_nombres(reporte)
    return reporte


@router.put("/{reporte_id}", response_model=ReporteCiudadano)
async def update_reporte_ciudadano(
    reporte_id: int,
    reporte_update: ReporteCiudadanoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if current_user.rol not in ADMIN_ROLES and reporte.ciudadano_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes editar este reporte")
    for field, value in reporte_update.dict(exclude_unset=True).items():
        setattr(reporte, field, value)
    db.commit()
    db.refresh(reporte)
    _safe_set_nombres(reporte)
    return reporte


@router.delete("/{reporte_id}")
async def delete_reporte_ciudadano(
    reporte_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if current_user.rol not in ADMIN_ROLES and reporte.ciudadano_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes eliminar este reporte")
    reporte.activo = False
    db.commit()
    return {"message": "Reporte eliminado exitosamente"}
