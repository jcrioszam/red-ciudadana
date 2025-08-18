from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .models import Vehiculo as VehiculoModel
from .schemas import Vehiculo, VehiculoCreate, VehiculoUpdate
from .database import get_db
from .auth import get_current_active_user

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])

print("Cargando router de vehículos")

@router.post("/", response_model=Vehiculo)
async def create_vehiculo(vehiculo: VehiculoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para crear vehículos")
    db_vehiculo = VehiculoModel(**vehiculo.dict())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.get("/", response_model=List[Vehiculo])
async def list_vehiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    return db.query(VehiculoModel).offset(skip).limit(limit).all()

@router.get("/{vehiculo_id}", response_model=Vehiculo)
async def get_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo

@router.put("/{vehiculo_id}", response_model=Vehiculo)
async def update_vehiculo(vehiculo_id: int, vehiculo_update: VehiculoUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para editar vehículos")
    for field, value in vehiculo_update.dict(exclude_unset=True).items():
        setattr(vehiculo, field, value)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo

@router.delete("/{vehiculo_id}", response_model=Vehiculo)
async def delete_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar vehículos")
    db.delete(vehiculo)
    db.commit()
    return vehiculo 