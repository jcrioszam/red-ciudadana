from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..models import Usuario as UsuarioModel
from ..models import Evento as EventoModel
from ..models import Persona as PersonaModel
from ..models import Asistencia as AsistenciaModel
from ..models import AsignacionMovilizacion as AsignacionMovilizacionModel
from ..schemas import Asistencia, AsistenciaCreate, AsistenciaUpdate, Usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/asistencias", tags=["asistencias"])


def _get_subordinate_ids(user_id, db):
    subs = db.query(UsuarioModel).filter(
        UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True
    ).all()
    ids = [user_id]
    for sub in subs:
        ids.extend(_get_subordinate_ids(sub.id, db))
    return ids


@router.get("/", response_model=List[Asistencia])
async def list_asistencias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(AsistenciaModel)
    if current_user.rol == "admin":
        asistencias = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        ids = _get_subordinate_ids(current_user.id, db)
        eventos_ids = db.query(EventoModel.id).filter(EventoModel.id_lider_organizador.in_(ids)).all()
        eventos_ids = [e[0] for e in eventos_ids]
        asistencias = query.filter(AsistenciaModel.id_evento.in_(eventos_ids)).offset(skip).limit(limit).all()
    else:
        eventos_ids = db.query(EventoModel.id).filter(EventoModel.id_lider_organizador == current_user.id).all()
        eventos_ids = [e[0] for e in eventos_ids]
        asistencias = query.filter(AsistenciaModel.id_evento.in_(eventos_ids)).offset(skip).limit(limit).all()
    return asistencias


@router.get("/buscar/", response_model=List[Asistencia])
async def buscar_asistencias(
    id_evento: int = None,
    id_persona: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(AsistenciaModel)
    if id_evento:
        query = query.filter(AsistenciaModel.id_evento == id_evento)
    if id_persona:
        query = query.filter(AsistenciaModel.id_persona == id_persona)
    return query.all()


@router.get("/buscar-por-clave/")
async def buscar_asistencia_por_clave(
    clave_elector: str,
    id_evento: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    persona = db.query(PersonaModel).filter(PersonaModel.clave_elector == clave_elector).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada con esa clave elector")
    asistencia = db.query(AsistenciaModel).filter(
        AsistenciaModel.id_evento == id_evento,
        AsistenciaModel.id_persona == persona.id
    ).first()
    return {
        "persona": {"id": persona.id, "nombre": persona.nombre, "clave_elector": persona.clave_elector},
        "asistencia": asistencia
    }


@router.get("/{asistencia_id}", response_model=Asistencia)
async def get_asistencia(
    asistencia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    asistencia = db.query(AsistenciaModel).filter(AsistenciaModel.id == asistencia_id).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    return asistencia


@router.post("/", response_model=Asistencia)
async def create_asistencia(
    asistencia: AsistenciaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    db_asistencia = AsistenciaModel(**asistencia.dict())
    db.add(db_asistencia)
    db.commit()
    db.refresh(db_asistencia)
    return db_asistencia


@router.put("/{asistencia_id}", response_model=Asistencia)
async def update_asistencia(
    asistencia_id: int,
    asistencia_update: AsistenciaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    asistencia = db.query(AsistenciaModel).filter(AsistenciaModel.id == asistencia_id).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    update_data = asistencia_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asistencia, field, value)
    # Sync to AsignacionMovilizacion
    if "asistio" in update_data:
        asignacion = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_evento == asistencia.id_evento,
            AsignacionMovilizacionModel.id_persona == asistencia.id_persona
        ).first()
        if asignacion:
            asignacion.asistio = update_data["asistio"]
    db.commit()
    db.refresh(asistencia)
    return asistencia


@router.delete("/{asistencia_id}", response_model=Asistencia)
async def delete_asistencia(
    asistencia_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    asistencia = db.query(AsistenciaModel).filter(AsistenciaModel.id == asistencia_id).first()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    db.delete(asistencia)
    db.commit()
    return asistencia


@router.post("/{asignacion_id}/checkin", response_model=Asistencia)
async def checkin_asistencia(
    asignacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    asignacion = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id == asignacion_id
    ).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")

    asistencia = db.query(AsistenciaModel).filter(
        AsistenciaModel.id_evento == asignacion.id_evento,
        AsistenciaModel.id_persona == asignacion.id_persona
    ).first()

    if asistencia:
        asistencia.asistio = True
        asistencia.movilizado = True
        asistencia.hora_checkin = datetime.utcnow()
    else:
        asistencia = AsistenciaModel(
            id_evento=asignacion.id_evento,
            id_persona=asignacion.id_persona,
            asistio=True,
            movilizado=True,
            hora_checkin=datetime.utcnow()
        )
        db.add(asistencia)

    asignacion.asistio = True
    db.commit()
    db.refresh(asistencia)
    return asistencia
