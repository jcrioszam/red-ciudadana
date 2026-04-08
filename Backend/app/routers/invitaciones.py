from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
import logging

from jose import jwt

from ..database import get_db
from ..auth import get_current_active_user, get_password_hash
from ..schemas import Usuario, Persona
from ..models import Usuario as UsuarioModel, Persona as PersonaModel
from ..config import INVITATION_SECRET, INVITATION_EXP_MINUTES

logger = logging.getLogger(__name__)
router = APIRouter(tags=["invitaciones"])


class InvitacionCreate(BaseModel):
    rol: str
    id_lider_superior: Optional[int] = None


class InvitacionRegistro(BaseModel):
    token: str
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    email: str
    password: str


class InvitacionDecode(BaseModel):
    token: str


class InvitacionPersonaDecode(BaseModel):
    token: str


class PersonaInvitacionRegistro(BaseModel):
    token: str
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    clave_elector: Optional[str] = None
    curp: Optional[str] = None
    num_emision: Optional[str] = None
    seccion_electoral: Optional[str] = None
    distrito: Optional[str] = None
    municipio: Optional[str] = None
    estado: Optional[str] = None
    colonia: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    acepta_politica: bool = False


@router.post("/invitaciones/", response_model=dict)
async def generar_invitacion(
    data: InvitacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para invitar lideres")

    if current_user.rol in ["admin", "presidente"]:
        if data.id_lider_superior:
            lider_superior = db.query(UsuarioModel).filter(
                UsuarioModel.id == data.id_lider_superior, UsuarioModel.activo == True
            ).first()
            if not lider_superior:
                raise HTTPException(status_code=400, detail="Lider superior no valido")
            id_lider_superior = data.id_lider_superior
        else:
            presidente = db.query(UsuarioModel).filter(UsuarioModel.rol == "presidente", UsuarioModel.activo == True).first()
            id_lider_superior = presidente.id if presidente else current_user.id
    else:
        id_lider_superior = current_user.id

    payload = {
        "id_lider_superior": id_lider_superior,
        "rol": data.rol,
        "exp": datetime.utcnow() + timedelta(minutes=INVITATION_EXP_MINUTES)
    }
    token = jwt.encode(payload, INVITATION_SECRET, algorithm="HS256")
    return {"token": str(token)}


@router.post("/invitaciones/decode", response_model=dict)
async def decode_invitacion(data: InvitacionDecode, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == payload["id_lider_superior"]).first()
        return {"rol": payload["rol"], "nombre_lider": lider.nombre if lider else ""}
    except Exception:
        raise HTTPException(status_code=400, detail="Invitacion invalida o expirada")


@router.post("/registro-invitacion", response_model=Usuario)
async def registro_invitacion(data: InvitacionRegistro, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invitacion invalida o expirada")

    db_user = db.query(UsuarioModel).filter(UsuarioModel.email == data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    try:
        base = (data.email.split("@")[0] if data.email else "usuario").lower()
        candidate = base
        suffix = 1
        while db.query(UsuarioModel).filter(UsuarioModel.username == candidate).first() is not None:
            suffix += 1
            candidate = f"{base}{suffix}"

        hashed_password = get_password_hash(data.password)
        db_user = UsuarioModel(
            username=candidate,
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
        logger.info(f"Usuario registrado por invitacion: {db_user.email}")
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registrando usuario: {str(e)}")


@router.post("/invitaciones-personas/", response_model=dict)
async def generar_invitacion_persona(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para generar invitaciones de personas")
    payload = {
        "id_lider_responsable": current_user.id,
        "tipo": "registro_persona",
        "exp": datetime.utcnow() + timedelta(minutes=INVITATION_EXP_MINUTES)
    }
    token = jwt.encode(payload, INVITATION_SECRET, algorithm="HS256")
    return {"token": str(token)}


@router.post("/invitaciones-personas/decode", response_model=dict)
async def decode_invitacion_persona(data: InvitacionPersonaDecode, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == payload["id_lider_responsable"]).first()
        return {"tipo": payload["tipo"], "nombre_lider": lider.nombre if lider else ""}
    except Exception:
        raise HTTPException(status_code=400, detail="Invitacion invalida o expirada")


@router.post("/registro-persona-invitacion", response_model=Persona)
async def registro_persona_invitacion(data: PersonaInvitacionRegistro, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, INVITATION_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invitacion invalida o expirada")

    persona_data = data.dict()
    persona_data["id_lider_responsable"] = payload["id_lider_responsable"]
    del persona_data["token"]

    db_persona = PersonaModel(**persona_data)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona
