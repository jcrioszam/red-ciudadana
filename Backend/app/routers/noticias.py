from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..auth import get_current_active_user, require_admin
from ..schemas import Usuario
from ..schemas_noticias import NoticiaResponse as Noticia, NoticiaCreate, NoticiaUpdate
from ..models_noticias import Noticia as NoticiaModel
from ..models import Comentario as ComentarioModel
from ..schemas import Comentario, ComentarioCreate, ComentarioUpdate

logger = logging.getLogger(__name__)
router = APIRouter(tags=["noticias"])


@router.post("/noticias/", response_model=Noticia)
async def create_noticia(
    noticia: NoticiaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
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
    db_noticia.autor_nombre = current_user.nombre
    return db_noticia


@router.get("/noticias/", response_model=List[Noticia])
async def list_noticias(
    skip: int = 0,
    limit: int = 50,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(NoticiaModel).filter(NoticiaModel.activa == True)
    if tipo:
        query = query.filter(NoticiaModel.tipo == tipo)
    noticias = query.order_by(NoticiaModel.fecha_publicacion.desc()).offset(skip).limit(limit).all()
    for noticia in noticias:
        noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
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
        data = [
            {
                "id": n.id,
                "titulo": n.titulo,
                "descripcion_corta": getattr(n, 'descripcion_corta', None) or (n.contenido[:100] if n.contenido else ""),
                "imagen_url": getattr(n, 'imagen_url', None),
                "categoria": getattr(n, 'categoria', None) or n.tipo,
                "destacada": getattr(n, 'destacada', False),
                "prioridad": getattr(n, 'prioridad', None),
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
    noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
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
    for field, value in noticia_update.dict(exclude_unset=True).items():
        setattr(noticia, field, value)
    db.commit()
    db.refresh(noticia)
    noticia.autor_nombre = noticia.autor.nombre if noticia.autor else "Usuario"
    return noticia


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
    noticia.likes += 1
    db.commit()
    return {"message": "Like agregado", "likes": noticia.likes}


@router.post("/noticias/{noticia_id}/compartir")
async def compartir_noticia(
    noticia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    noticia = db.query(NoticiaModel).filter(NoticiaModel.id == noticia_id, NoticiaModel.activa == True).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    noticia.compartidos += 1
    db.commit()
    return {"message": "Noticia compartida", "compartidos": noticia.compartidos}


@router.get("/admin/noticias/estadisticas/")
async def obtener_estadisticas_noticias(
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        from ..crud_noticias import crud_noticias
        estadisticas = crud_noticias.get_estadisticas_noticias(db)
        return {"success": True, "data": estadisticas}
    except Exception as e:
        logger.error(f"Error al obtener estadisticas de noticias: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


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
