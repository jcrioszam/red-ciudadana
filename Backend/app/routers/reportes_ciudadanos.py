from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os
import shutil
import uuid

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


@router.post("/publico")
async def create_reporte_publico(
    titulo: Optional[str] = Form(None),
    descripcion: str = Form(...),
    tipo: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    direccion: Optional[str] = Form(None),
    prioridad: Optional[str] = Form("normal"),
    es_publico: Optional[bool] = Form(True),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        titulo_final = titulo or tipo.replace("_", " ").title() or "Reporte Ciudadano"

        if latitud < -90 or latitud > 90:
            raise HTTPException(status_code=400, detail="Latitud inválida")
        if longitud < -180 or longitud > 180:
            raise HTTPException(status_code=400, detail="Longitud inválida")

        db_reporte = ReporteCiudadanoModel(
            titulo=titulo_final,
            descripcion=descripcion,
            tipo=tipo,
            latitud=latitud,
            longitud=longitud,
            direccion=direccion or "",
            prioridad=prioridad or "normal",
            es_publico=True,
            ciudadano_id=None,
            estado="pendiente",
            activo=True,
        )
        db.add(db_reporte)
        db.commit()
        db.refresh(db_reporte)

        # Guardar foto si viene adjunta
        if foto and foto.filename:
            try:
                from ..cloudinary_utils import upload_image as _upload_cloud
                foto_bytes_data = await foto.read()
                cloud_url = _upload_cloud(foto_bytes_data, folder="reportes")
                if cloud_url:
                    # Cloudinary disponible: guardar URL permanente
                    foto_url_final = cloud_url
                    foto_size = len(foto_bytes_data)
                else:
                    # Fallback: guardar en disco local
                    upload_dir = "uploads/reportes"
                    os.makedirs(upload_dir, exist_ok=True)
                    ext = os.path.splitext(foto.filename)[1] or ".jpg"
                    filename = f"{uuid.uuid4().hex}{ext}"
                    filepath = os.path.join(upload_dir, filename)
                    with open(filepath, "wb") as f:
                        f.write(foto_bytes_data)
                    foto_url_final = f"/uploads/reportes/{filename}"
                    foto_size = len(foto_bytes_data)

                ext = os.path.splitext(foto.filename)[1] or ".jpg"
                filename = f"{uuid.uuid4().hex}{ext}"
                db_foto = FotoReporteModel(
                    id_reporte=db_reporte.id,
                    nombre_archivo=filename,
                    url=foto_url_final,
                    tipo=foto.content_type or "image/jpeg",
                    tamaño=foto_size,
                    activo=True,
                )
                db.add(db_foto)
                db_reporte.foto_url = foto_url_final
                db.commit()
            except Exception as fe:
                logger.warning(f"Error guardando foto del reporte público: {fe}")

        logger.info(f"Reporte público creado: {db_reporte.id}")
        return {"success": True, "id": db_reporte.id, "mensaje": "Reporte enviado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear reporte público: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear reporte: {str(e)}")


@router.get("/publico/{reporte_id}")
async def get_reporte_publico(reporte_id: int, db: Session = Depends(get_db)):
    reporte = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.id == reporte_id,
        ReporteCiudadanoModel.activo == True,
        ReporteCiudadanoModel.es_publico == True,
    ).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    _safe_set_nombres(reporte)
    return {
        "id": reporte.id,
        "folio": reporte.folio or f"RC-{reporte.id}",
        "titulo": reporte.titulo,
        "descripcion": reporte.descripcion,
        "tipo": reporte.tipo,
        "estado": reporte.estado,
        "prioridad": reporte.prioridad,
        "latitud": reporte.latitud,
        "longitud": reporte.longitud,
        "fecha_creacion": str(reporte.fecha_creacion),
        "fecha_actualizacion": str(reporte.fecha_actualizacion) if reporte.fecha_actualizacion else None,
        "ciudadano_nombre": reporte.ciudadano_nombre,
    }


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
    base_url = os.getenv("BASE_URL", "https://red-ciudadana.onrender.com")
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


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS ALERTA CIUDADANA (deben ir ANTES de /{reporte_id})
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/mapa/pins")
async def get_mapa_pins(
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Coordenadas livianas para Leaflet MarkerCluster."""
    from sqlalchemy import text as _text
    q = db.query(
        ReporteCiudadanoModel.id,
        ReporteCiudadanoModel.tipo,
        ReporteCiudadanoModel.subtipo,
        ReporteCiudadanoModel.estado,
        ReporteCiudadanoModel.prioridad,
        ReporteCiudadanoModel.latitud,
        ReporteCiudadanoModel.longitud,
        ReporteCiudadanoModel.foto_url,
        ReporteCiudadanoModel.folio,
        ReporteCiudadanoModel.fecha_creacion,
        ReporteCiudadanoModel.votos,
        ReporteCiudadanoModel.descripcion,
        ReporteCiudadanoModel.resuelto_en,
    ).filter(ReporteCiudadanoModel.activo == True, ReporteCiudadanoModel.es_publico == True)
    if tipo:
        q = q.filter(ReporteCiudadanoModel.tipo == tipo)
    if estado:
        q = q.filter(ReporteCiudadanoModel.estado == estado)
    rows = q.order_by(ReporteCiudadanoModel.fecha_creacion.desc()).limit(2000).all()
    base_url = os.getenv("BASE_URL", "https://red-ciudadana.onrender.com")

    # Obtener fotos de fotos_reportes para reportes sin foto_url
    ids_sin_foto = [r.id for r in rows if not r.foto_url]
    fotos_extra = {}
    if ids_sin_foto:
        from sqlalchemy import text as _text
        for rid in ids_sin_foto:
            f = db.query(FotoReporteModel.url).filter(
                FotoReporteModel.id_reporte == rid,
                FotoReporteModel.activo == True
            ).first()
            if f and f.url:
                fotos_extra[rid] = f.url

    result = []
    for r in rows:
        foto = None
        raw = r.foto_url or fotos_extra.get(r.id)
        if raw:
            if raw.startswith("http") or raw.startswith("data:"):
                foto = raw
            else:
                foto = f"{base_url}{raw}"
        result.append({
            "id": r.id, "tipo": r.tipo, "subtipo": r.subtipo,
            "estado": r.estado, "prioridad": r.prioridad,
            "latitud": r.latitud, "longitud": r.longitud,
            "foto_url": foto,
            "folio": r.folio or f"RC-{r.id}",
            "fecha_creacion": r.fecha_creacion.isoformat() if r.fecha_creacion else None,
            "votos": r.votos or 0,
            "descripcion": r.descripcion,
            "resuelto_en": r.resuelto_en.isoformat() if r.resuelto_en else None,
        })
    return result


@router.get("/estadisticas-mapa")
async def get_estadisticas_mapa(db: Session = Depends(get_db)):
    """Stats para el panel de estadísticas del mapa."""
    from sqlalchemy import func as _func, case as _case
    total = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.activo == True).count()
    por_tipo = db.execute(
        __import__('sqlalchemy').text(
            "SELECT tipo, COUNT(*) as total, "
            "SUM(CASE WHEN estado='resuelto' THEN 1 ELSE 0 END) as solucionados "
            "FROM reportes_ciudadanos WHERE activo=true GROUP BY tipo ORDER BY total DESC"
        )
    ).fetchall()
    por_estado = db.execute(
        __import__('sqlalchemy').text(
            "SELECT estado, COUNT(*) as total FROM reportes_ciudadanos WHERE activo=true GROUP BY estado"
        )
    ).fetchall()
    resumen = db.execute(
        __import__('sqlalchemy').text(
            "SELECT COUNT(*) as total,"
            " SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) as pendientes,"
            " SUM(CASE WHEN estado='en_revision' THEN 1 ELSE 0 END) as en_revision,"
            " SUM(CASE WHEN estado='en_progreso' THEN 1 ELSE 0 END) as en_progreso,"
            " SUM(CASE WHEN estado='resuelto' THEN 1 ELSE 0 END) as resueltos,"
            " SUM(CASE WHEN estado='rechazado' THEN 1 ELSE 0 END) as rechazados"
            " FROM reportes_ciudadanos WHERE activo=true"
        )
    ).fetchone()
    return {
        "resumen": dict(resumen._mapping) if resumen else {"total": 0},
        "porTipo": [dict(r._mapping) for r in por_tipo],
        "porEstado": [dict(r._mapping) for r in por_estado],
    }


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


@router.post("/{reporte_id}/voto")
async def votar_reporte(
    reporte_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    from sqlalchemy import text as _text
    ip = request.client.host if request.client else "unknown"
    reporte = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.id == reporte_id, ReporteCiudadanoModel.activo == True
    ).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    ya_voto = db.execute(
        _text("SELECT id FROM votos_reportes WHERE reporte_id=:rid AND ip=:ip"),
        {"rid": reporte_id, "ip": ip}
    ).fetchone()
    if ya_voto:
        raise HTTPException(status_code=409, detail="Ya votaste por este reporte")
    db.execute(
        _text("INSERT INTO votos_reportes (reporte_id, ip) VALUES (:rid, :ip)"),
        {"rid": reporte_id, "ip": ip}
    )
    db.execute(
        _text("UPDATE reportes_ciudadanos SET votos = COALESCE(votos,0) + 1 WHERE id=:id"),
        {"id": reporte_id}
    )
    db.commit()
    db.refresh(reporte)
    return {"votos": reporte.votos or 0}


@router.post("/{reporte_id}/comentario")
async def agregar_comentario_reporte(
    reporte_id: int,
    body: dict,
    db: Session = Depends(get_db)
):
    from sqlalchemy import text as _text
    texto = (body.get("texto") or "").strip()
    if not texto:
        raise HTTPException(status_code=400, detail="Texto requerido")
    reporte = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.id == reporte_id, ReporteCiudadanoModel.activo == True
    ).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    result = db.execute(
        _text("INSERT INTO comentarios_reportes (reporte_id, texto, es_publico) VALUES (:rid, :txt, 1)"),
        {"rid": reporte_id, "txt": texto}
    )
    db.commit()
    return {"id": result.lastrowid, "texto": texto, "es_publico": 1}


@router.get("/{reporte_id}/historial")
async def get_historial_reporte(reporte_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import text as _text
    reporte = db.query(ReporteCiudadanoModel).filter(
        ReporteCiudadanoModel.id == reporte_id, ReporteCiudadanoModel.activo == True
    ).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    base_url = os.getenv("BASE_URL", "https://red-ciudadana.onrender.com")
    foto_url = None
    if reporte.foto_url:
        foto_url = reporte.foto_url if reporte.foto_url.startswith("http") else f"{base_url}{reporte.foto_url}"

    acts = db.execute(_text("""
        SELECT a.id, a.estado_nuevo, a.comentario, a.es_publico, a.creado_en,
               u.nombre as operador_nombre
        FROM actualizaciones_reportes a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.reporte_id = :rid
        ORDER BY a.creado_en ASC
    """), {"rid": reporte_id}).fetchall()

    actualizaciones = []
    for act in acts:
        evs = db.execute(_text(
            "SELECT id, url FROM evidencias_actualizaciones WHERE actualizacion_id=:aid"
        ), {"aid": act.id}).fetchall()
        evidencias = [{"id": e.id, "url": f"{base_url}{e.url}" if not e.url.startswith("http") else e.url} for e in evs]
        actualizaciones.append({
            "id": act.id,
            "estado_nuevo": act.estado_nuevo,
            "comentario": act.comentario,
            "es_publico": act.es_publico,
            "creado_en": act.creado_en,
            "operador_nombre": act.operador_nombre,
            "evidencias": evidencias,
        })

    # métricas simples
    from datetime import datetime as _dt
    creado = reporte.fecha_creacion or _dt.utcnow()
    ahora = _dt.utcnow()
    horas = round((ahora - creado).total_seconds() / 3600)
    dias = round(horas / 24, 1)
    metricas = {
        "horas_abierto": horas,
        "dias_abierto": dias,
        "resuelto": reporte.estado == "resuelto",
        "num_actualizaciones": len(actualizaciones),
    }

    return {
        "reporte": {
            "id": reporte.id,
            "folio": reporte.folio or f"RC-{reporte.id}",
            "titulo": reporte.titulo,
            "descripcion": reporte.descripcion,
            "tipo": reporte.tipo,
            "subtipo": reporte.subtipo,
            "estado": reporte.estado,
            "prioridad": reporte.prioridad,
            "latitud": reporte.latitud,
            "longitud": reporte.longitud,
            "colonia": reporte.colonia,
            "calle": reporte.calle,
            "direccion": reporte.direccion,
            "foto_url": foto_url,
            "votos": reporte.votos or 0,
            "fecha_creacion": reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
            "resuelto_en": reporte.resuelto_en.isoformat() if reporte.resuelto_en else None,
        },
        "actualizaciones": actualizaciones,
        "metricas": metricas,
    }


@router.post("/{reporte_id}/actualizar")
async def actualizar_reporte(
    reporte_id: int,
    estado_nuevo: str = Form(...),
    comentario: Optional[str] = Form(None),
    es_publico: Optional[int] = Form(1),
    evidencias: Optional[list] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    from sqlalchemy import text as _text
    if current_user.rol not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores")
    ESTADOS_VALIDOS = ["pendiente", "en_revision", "en_progreso", "resuelto", "rechazado"]
    if estado_nuevo not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido")
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    result = db.execute(_text("""
        INSERT INTO actualizaciones_reportes (reporte_id, usuario_id, estado_nuevo, comentario, es_publico)
        VALUES (:rid, :uid, :est, :com, :pub)
    """), {"rid": reporte_id, "uid": current_user.id, "est": estado_nuevo,
           "com": (comentario or "").strip() or None, "pub": es_publico})
    act_id = result.lastrowid

    reporte.estado = estado_nuevo
    if estado_nuevo == "resuelto":
        from datetime import datetime as _dt
        reporte.resuelto_en = _dt.utcnow()
    db.commit()

    return {"success": True, "actualizacion_id": act_id, "estado": estado_nuevo}


@router.post("/{reporte_id}/actualizar-con-fotos")
async def actualizar_reporte_con_fotos(
    reporte_id: int,
    estado_nuevo: str = Form(...),
    comentario: Optional[str] = Form(None),
    es_publico: Optional[int] = Form(1),
    evidencias: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    from sqlalchemy import text as _text
    if current_user.rol not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Solo administradores")
    ESTADOS_VALIDOS = ["pendiente", "en_revision", "en_progreso", "resuelto", "rechazado"]
    if estado_nuevo not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido")
    reporte = db.query(ReporteCiudadanoModel).filter(ReporteCiudadanoModel.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    result = db.execute(_text("""
        INSERT INTO actualizaciones_reportes (reporte_id, usuario_id, estado_nuevo, comentario, es_publico)
        VALUES (:rid, :uid, :est, :com, :pub)
    """), {"rid": reporte_id, "uid": current_user.id, "est": estado_nuevo,
           "com": (comentario or "").strip() or None, "pub": es_publico})
    act_id = result.lastrowid

    ev_guardadas = []
    upload_dir = "uploads/evidencias"
    os.makedirs(upload_dir, exist_ok=True)
    for ev_file in evidencias:
        if ev_file and ev_file.filename:
            try:
                ext = os.path.splitext(ev_file.filename)[1] or ".jpg"
                fname = f"ev_{uuid.uuid4().hex}{ext}"
                fpath = os.path.join(upload_dir, fname)
                with open(fpath, "wb") as f:
                    shutil.copyfileobj(ev_file.file, f)
                url = f"/uploads/evidencias/{fname}"
                db.execute(_text(
                    "INSERT INTO evidencias_actualizaciones (actualizacion_id, reporte_id, url) VALUES (:aid, :rid, :url)"
                ), {"aid": act_id, "rid": reporte_id, "url": url})
                ev_guardadas.append(url)
            except Exception as fe:
                logger.warning(f"Error guardando evidencia: {fe}")

    reporte.estado = estado_nuevo
    if estado_nuevo == "resuelto":
        from datetime import datetime as _dt
        reporte.resuelto_en = _dt.utcnow()
    db.commit()
    return {"success": True, "actualizacion_id": act_id, "estado": estado_nuevo, "evidencias": ev_guardadas}
