from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import logging

from ..database import get_db
from ..auth import get_current_active_user, require_admin, can_access_user, get_password_hash
from ..models import Usuario as UsuarioModel
from ..schemas import Usuario, UsuarioCreate, UsuarioUpdate
from passlib.hash import bcrypt

logger = logging.getLogger(__name__)
router = APIRouter(tags=["usuarios"])


class PasswordUpdate(BaseModel):
    new_password: str


@router.get("/users/me/", response_model=Usuario)
@router.get("/users/me", response_model=Usuario)
async def read_users_me(current_user: Usuario = Depends(get_current_active_user)):
    logger.info(f"Endpoint /users/me called for user: {current_user.email if current_user else 'None'}")
    return current_user


@router.post("/users/", response_model=Usuario)
async def create_user(user: UsuarioCreate, db: Session = Depends(get_db)):
    db_user = db.query(UsuarioModel).filter(UsuarioModel.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.id_lider_superior is not None:
        lider = db.query(UsuarioModel).filter(
            UsuarioModel.id == user.id_lider_superior, UsuarioModel.activo == True
        ).first()
        if not lider:
            raise HTTPException(status_code=400, detail="Lider superior no existe o esta inactivo")

    try:
        generated_username = None
        if not user.username or not user.username.strip():
            base = (user.email.split("@")[0] if user.email else "usuario").lower()
            candidate = base
            suffix = 1
            while db.query(UsuarioModel).filter(UsuarioModel.username == candidate).first() is not None:
                suffix += 1
                candidate = f"{base}{suffix}"
            generated_username = candidate

        hashed_password = get_password_hash(user.password)
        db_user = UsuarioModel(
            username=(user.username or generated_username),
            nombre=user.nombre,
            telefono=user.telefono,
            direccion=user.direccion,
            edad=user.edad,
            sexo=user.sexo,
            email=user.email,
            password_hash=hashed_password,
            rol=user.rol,
            id_lider_superior=user.id_lider_superior
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Error creando usuario: {str(e)}")


@router.get("/users/", response_model=List[Usuario])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol == "admin":
        users = db.query(UsuarioModel).offset(skip).limit(limit).all()
    elif current_user.rol in ["presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        def get_subordinates(user_id):
            subs = db.query(UsuarioModel).filter(
                UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True
            ).all()
            all_subs = []
            for sub in subs:
                all_subs.append(sub)
                all_subs.extend(get_subordinates(sub.id))
            return all_subs
        users = [current_user] + get_subordinates(current_user.id)
    else:
        users = [current_user]
    return users


@router.get("/users/{user_id}", response_model=Usuario)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not can_access_user(user_id, current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este usuario")
    return user


@router.put("/users/{user_id}", response_model=Usuario)
async def update_user(
    user_id: int,
    user_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not can_access_user(user_id, current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar este usuario")
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", response_model=Usuario)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = False
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}/subordinates", response_model=List[Usuario])
async def get_subordinates(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    def get_subs(uid):
        subs = db.query(UsuarioModel).filter(
            UsuarioModel.id_lider_superior == uid, UsuarioModel.activo == True
        ).all()
        all_subs = []
        for sub in subs:
            all_subs.append(sub)
            all_subs.extend(get_subs(sub.id))
        return all_subs
    return get_subs(user_id)


@router.put("/users/{user_id}/password", response_model=Usuario)
async def update_user_password(
    user_id: int,
    password_update: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password_hash = bcrypt.hash(password_update.new_password)
    db.commit()
    db.refresh(user)
    return user
