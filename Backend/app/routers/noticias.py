from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..auth import get_current_active_user, require_admin
from ..schemas import Usuario
from ..schemas_noticias import NoticiaResponse as Noticia, NoticiaCreate, NoticiaUpdate
from ..models_noticias import Noticia as NoticiaModel
from ..models import Comentario as ComentarioModel, Usuario as UsuarioModel
from ..schemas import Comentario, ComentarioCreate, ComentarioUpdate

logger = logging.getLogger(__name__)
router = APIRouter(tags=["noticias"])


def _nombre_autor(db: Session, autor_id) -> str:
    """Busca el nombre del autor por ID, sin depender de relación ORM."""
    if not autor_id:
        return "Usuario"
    u = db.query(UsuarioModel).filter(UsuarioModel.id == autor_id).first()
    return u.nombre if u else "Usuario"


@router.post("/noticias/", response_model=Noticia)
async def create_noticia(
    noticia: NoticiaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in ['admin', 'lider_estatal', 'lider_municipal', 'lider_zona']:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear noticias")
    try:
        desc_corta = noticia.descripcion_corta
        if not desc_corta:
            fuente = noticia.contenido_completo or noticia.titulo
            desc_corta = (fuente[:200].strip()) if fuente else noticia.titulo

        db_noticia = NoticiaModel(
            titulo=noticia.titulo,
            descripcion_corta=desc_corta,
            contenido_completo=noticia.contenido_completo,
            imagen_url=noticia.imagen_url,
            imagen_alt=noticia.imagen_alt,
            fecha_publicacion=noticia.fecha_publicacion,
            fecha_expiracion=noticia.fecha_expiracion,
            activa=noticia.activa,
            destacada=noticia.destacada,
            prioridad=noticia.prioridad,
            categoria=noticia.categoria,
            tags=noticia.tags,
            imagenes=noticia.imagenes,
            enlace_externo=noticia.enlace_externo,
            boton_texto=noticia.boton_texto,
            autor_id=current_user.id
        )
        db.add(db_noticia)
        db.commit()
        db.refresh(db_noticia)
        db_noticia.autor_nombre = current_user.nombre
        return db_noticia
    except Exception as e:
        db.rollback()
        logger.error(f"Error creando noticia: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear noticia: {str(e)}")


@router.get("/noticias/", response_model=List[Noticia])
async def list_noticias(
    skip: int = 0,
    limit: int = 50,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(NoticiaModel).filter(NoticiaModel.activa == True)
    noticias = query.order_by(NoticiaModel.fecha_publicacion.desc()).offset(skip).limit(limit).all()
    for noticia in noticias:
        noticia.autor_nombre = _nombre_autor(db, noticia.autor_id)
    return noticias


@router.get("/noticias/banner/")
async def obtener_noticias_banner(
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    try:
        noticias = db.query(NoticiaModel).filter(
            NoticiaModel.activa == True
        ).order_by(NoticiaModel.fecha_publicacion.desc()).limit(limit).all()
        import json as _json
        data = [
            {
                "id": n.id,
                "titulo": n.titulo,
                "descripcion_corta": n.descripcion_corta or "",
                "imagen_url": n.imagen_url,
                "imagenes": _json.loads(n.imagenes) if n.imagenes else [],
                "categoria": n.categoria or "general",
                "destacada": n.destacada or False,
                "prioridad": n.prioridad,
                "enlace_externo": n.enlace_externo,
                "boton_texto": n.boton_texto,
                "fecha_publicacion": n.fecha_publicacion.isoformat() if n.fecha_publicacion else None,
            }
            for n in noticias
        ]
        return {"success": True, "data": data, "total": len(data)}
    except Exception as e:
        logger.error(f"Error al obtener noticias del banner: {e}")
        return {"success": True, "data": [], "total": 0}


@router.get("/noticias/{noticia_id}", response_model=Noticia)
async def get_noticia(
    noticia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activa == True).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    noticia.autor_nombre = _nombre_autor(db, noticia.autor_id)
    return noticia


@router.put("/noticias/{noticia_id}", response_model=Noticia)
async def update_noticia(
    noticia_id: int,
    noticia_update: NoticiaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    if noticia.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes editar esta noticia")
    try:
        for field, value in noticia_update.dict(exclude_unset=True).items():
            setattr(noticia, field, value)
        db.commit()
        db.refresh(noticia)
        noticia.autor_nombre = _nombre_autor(db, noticia.autor_id)
        return noticia
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando noticia {noticia_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")


@router.delete("/noticias/{noticia_id}")
async def delete_noticia(
    noticia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    if noticia.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes eliminar esta noticia")
    noticia.activa = False
    db.commit()
    return {"message": "Noticia eliminada exitosamente"}


@router.post("/noticias/{noticia_id}/like")
async def like_noticia(
    noticia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activa == True).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    noticia.vistas += 1
    db.commit()
    return {"message": "Like agregado", "likes": noticia.vistas}


@router.post("/noticias/{noticia_id}/compartir")
async def compartir_noticia(
    noticia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activa == True).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    noticia.clicks += 1
    db.commit()
    return {"message": "Noticia compartida", "compartidos": noticia.clicks}


@router.get("/admin/noticias/")
async def list_todas_noticias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    noticias = db.query(NoticiaModel).order_by(NoticiaModel.fecha_publicacion.desc()).offset(skip).limit(limit).all()
    for n in noticias:
        n.autor_nombre = _nombre_autor(db, n.autor_id)
    return noticias


@router.get("/admin/noticias/estadisticas/")
async def obtener_estadisticas_noticias(
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total = db.query(NoticiaModel).count()
    activas = db.query(NoticiaModel).filter(NoticiaModel.activa == True).count()
    destacadas = db.query(NoticiaModel).filter(NoticiaModel.destacada == True).count()
    return {"success": True, "data": {"total": total, "activas": activas, "destacadas": destacadas}}


# ---- Comentarios ----

@router.post("/comentarios/", response_model=Comentario)
async def create_comentario(
    comentario: ComentarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_comentario = ComentarioModel(
        contenido=comentario.contenido,
        autor_id=current_user.id,
        noticia_id=comentario.noticia_id
    )
    db.add(db_comentario)
    db.commit()
    db.refresh(db_comentario)
    return db_comentario


@router.get("/comentarios/", response_model=List[Comentario])
async def list_comentarios(
    noticia_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(ComentarioModel)
    if noticia_id:
        query = query.filter(ComentarioModel.noticia_id == noticia_id)
    return query.offset(skip).limit(limit).all()


@router.delete("/comentarios/{comentario_id}")
async def delete_comentario(
    comentario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    comentario = db.query(ComentarioModel).filter(ComentarioModel.id == comentario_id).first()
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if comentario.autor_id != current_user.id and current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="No puedes eliminar este comentario")
    db.delete(comentario)
    db.commit()
    return {"message": "Comentario eliminado"}
