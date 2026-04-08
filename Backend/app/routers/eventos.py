from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..models import Usuario as UsuarioModel
from ..models import Evento as EventoModel
from ..schemas import Evento, EventoCreate, EventoUpdate, Usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/eventos", tags=["eventos"])


@router.get("/", response_model=List[Evento])
async def list_eventos(
    skip: int = 0,
    limit: int = 100,
    activos: bool = True,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(EventoModel).filter(EventoModel.activo == True)

    if current_user.rol == "admin":
        pass
    elif current_user.rol in ["presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        pass
    else:
        query = query.filter(EventoModel.id_lider_organizador == current_user.id)

    ahora = datetime.utcnow()
    if activos:
        query = query.filter(EventoModel.fecha >= ahora)
        eventos = query.order_by(EventoModel.fecha.asc()).offset(skip).limit(limit).all()
    else:
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.desc()).offset(skip).limit(limit).all()
    return eventos


@router.get("/buscar/", response_model=List[Evento])
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


def _is_in_hierarchy(evento, lider_id, db):
    if evento.id_lider_organizador == lider_id:
        return True
    lider = db.query(UsuarioModel).filter(UsuarioModel.id == evento.id_lider_organizador).first()
    if lider and lider.id_lider_superior:
        return _is_in_hierarchy(evento, lider.id_lider_superior, db)
    return False


@router.get("/{evento_id}", response_model=Evento)
async def get_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if current_user.rol != "admin" and not _is_in_hierarchy(evento, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este evento")
    return evento


@router.post("/", response_model=Evento)
async def create_evento(
    evento: EventoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para crear eventos")
    db_evento = EventoModel(**evento.dict())
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    return db_evento


@router.put("/{evento_id}", response_model=Evento)
async def update_evento(
    evento_id: int,
    evento_update: EventoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if current_user.rol != "admin" and not _is_in_hierarchy(evento, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar este evento")
    for field, value in evento_update.dict(exclude_unset=True).items():
        setattr(evento, field, value)
    db.commit()
    db.refresh(evento)
    return evento


@router.delete("/{evento_id}", response_model=Evento)
async def deactivate_evento(
    evento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    evento = db.query(EventoModel).filter(EventoModel.id == evento_id, EventoModel.activo == True).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if current_user.rol != "admin" and not _is_in_hierarchy(evento, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para desactivar este evento")
    evento.activo = False
    db.commit()
    db.refresh(evento)
    return evento
