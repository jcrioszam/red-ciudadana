from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel

from ..database import get_db
from ..auth import get_current_active_user
from ..models import UbicacionTiempoReal as UbicacionTiempoRealModel
from ..models import Vehiculo as VehiculoModel
from ..models import AsignacionMovilizacion as AsignacionMovilizacionModel
from ..models import Usuario as UsuarioModel
from ..schemas import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ubicaciones"])


class UbicacionUpdate(BaseModel):
    latitud: float
    longitud: float
    velocidad: float | None = None
    direccion: str | None = None
    precision: float | None = None
    bateria: int | None = None
    evento_id: int | None = None
    vehiculo_id: int | None = None
    evento_nombre: str | None = None
    vehiculo_tipo: str | None = None
    vehiculo_placas: str | None = None
    vehiculo_capacidad: int | None = None
    total_personas: int | None = None
    is_movilizador: bool = False
    seguimiento_activo: bool = True


@router.post("/ubicacion/actualizar")
async def actualizar_ubicacion(
    ubicacion: UbicacionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar ubicación en tiempo real del usuario"""
    try:
        # Si seguimiento_activo es False, desactivar seguimiento específico o todas las ubicaciones
        if not ubicacion.seguimiento_activo:
            if ubicacion.evento_id and ubicacion.vehiculo_id:
                # Detener seguimiento específico
                db.query(UbicacionTiempoRealModel).filter(
                    UbicacionTiempoRealModel.id_usuario == current_user.id,
                    UbicacionTiempoRealModel.evento_id == ubicacion.evento_id,
                    UbicacionTiempoRealModel.vehiculo_id == ubicacion.vehiculo_id,
                    UbicacionTiempoRealModel.activo == True
                ).update({"activo": False})
                db.commit()
                return {"success": True, "message": f"Seguimiento detenido para evento {ubicacion.evento_id} y vehículo {ubicacion.vehiculo_id}"}
            else:
                # Detener todos los seguimientos del usuario
                db.query(UbicacionTiempoRealModel).filter(
                    UbicacionTiempoRealModel.id_usuario == current_user.id,
                    UbicacionTiempoRealModel.activo == True
                ).update({"activo": False})
                db.commit()
                return {"success": True, "message": "Todos los seguimientos detenidos"}

        # Desactivar ubicación anterior del mismo usuario + evento + vehículo (si existe)
        if ubicacion.evento_id and ubicacion.vehiculo_id:
            db.query(UbicacionTiempoRealModel).filter(
                UbicacionTiempoRealModel.id_usuario == current_user.id,
                UbicacionTiempoRealModel.evento_id == ubicacion.evento_id,
                UbicacionTiempoRealModel.vehiculo_id == ubicacion.vehiculo_id,
                UbicacionTiempoRealModel.activo == True
            ).update({"activo": False})
        else:
            # Si no hay evento/vehículo específico, desactivar todas las ubicaciones del usuario
            db.query(UbicacionTiempoRealModel).filter(
                UbicacionTiempoRealModel.id_usuario == current_user.id,
                UbicacionTiempoRealModel.activo == True
            ).update({"activo": False})

        # Crear nueva ubicación
        nueva_ubicacion = UbicacionTiempoRealModel(
            id_usuario=current_user.id,
            latitud=ubicacion.latitud,
            longitud=ubicacion.longitud,
            velocidad=ubicacion.velocidad,
            direccion=ubicacion.direccion,
            precision=ubicacion.precision,
            bateria=ubicacion.bateria,
            evento_id=ubicacion.evento_id,
            vehiculo_id=ubicacion.vehiculo_id,
            evento_nombre=ubicacion.evento_nombre,
            vehiculo_tipo=ubicacion.vehiculo_tipo,
            vehiculo_placas=ubicacion.vehiculo_placas,
            vehiculo_capacidad=ubicacion.vehiculo_capacidad,
            total_personas=ubicacion.total_personas
        )

        db.add(nueva_ubicacion)
        db.commit()
        db.refresh(nueva_ubicacion)

        return {"success": True, "message": "Ubicación actualizada"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar ubicación: {str(e)}")


@router.get("/ubicacion/vehiculos")
async def obtener_ubicaciones_vehiculos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener ubicaciones en tiempo real de vehículos/líderes"""
    try:
        # Obtener usuarios con roles de líderes/choferes (ajustar según tus roles)
        roles_vehiculos = ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "admin"]

        # Obtener ubicaciones activas de estos roles
        ubicaciones = db.query(UbicacionTiempoRealModel).join(
            UsuarioModel, UbicacionTiempoRealModel.id_usuario == UsuarioModel.id
        ).filter(
            UbicacionTiempoRealModel.activo == True,
            UsuarioModel.rol.in_(roles_vehiculos),
            UsuarioModel.activo == True
        ).all()

        # Formatear respuesta
        ubicaciones_formateadas = []
        for ubicacion in ubicaciones:
            ubicacion_data = {
                "id_usuario": ubicacion.id_usuario,
                "nombre": ubicacion.usuario.nombre,
                "rol": ubicacion.usuario.rol,
                "latitud": ubicacion.latitud,
                "longitud": ubicacion.longitud,
                "velocidad": ubicacion.velocidad,
                "direccion": ubicacion.direccion,
                "timestamp": ubicacion.timestamp.isoformat(),
                "bateria": ubicacion.bateria
            }

            # Agregar información de movilización si está disponible
            if ubicacion.evento_id:
                ubicacion_data.update({
                    "evento_id": ubicacion.evento_id,
                    "evento_nombre": ubicacion.evento_nombre,
                    "vehiculo_id": ubicacion.vehiculo_id,
                    "vehiculo_tipo": ubicacion.vehiculo_tipo,
                    "vehiculo_placas": ubicacion.vehiculo_placas,
                    "vehiculo_capacidad": ubicacion.vehiculo_capacidad,
                    "total_personas": ubicacion.total_personas
                })

            ubicaciones_formateadas.append(ubicacion_data)

        return {
            "ubicaciones": ubicaciones_formateadas,
            "total": len(ubicaciones_formateadas)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicaciones: {str(e)}")


@router.get("/ubicacion/mi-ubicacion")
async def obtener_mi_ubicacion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener mis ubicaciones activas"""
    try:
        ubicaciones = db.query(UbicacionTiempoRealModel).filter(
            UbicacionTiempoRealModel.id_usuario == current_user.id,
            UbicacionTiempoRealModel.activo == True
        ).all()

        if not ubicaciones:
            return {"ubicacion": None, "ubicaciones": []}

        # Para compatibilidad con código existente, mantener la primera ubicación como "ubicacion"
        primera_ubicacion = ubicaciones[0] if ubicaciones else None

        # Formatear todas las ubicaciones activas
        ubicaciones_formateadas = []
        for ubicacion in ubicaciones:
            ubicacion_data = {
                "id": ubicacion.id,
                "latitud": ubicacion.latitud,
                "longitud": ubicacion.longitud,
                "velocidad": ubicacion.velocidad,
                "direccion": ubicacion.direccion,
                "timestamp": ubicacion.timestamp.isoformat(),
                "bateria": ubicacion.bateria,
                "evento_id": ubicacion.evento_id,
                "evento_nombre": ubicacion.evento_nombre,
                "vehiculo_id": ubicacion.vehiculo_id,
                "vehiculo_tipo": ubicacion.vehiculo_tipo,
                "vehiculo_placas": ubicacion.vehiculo_placas,
                "vehiculo_capacidad": ubicacion.vehiculo_capacidad,
                "total_personas": ubicacion.total_personas
            }
            ubicaciones_formateadas.append(ubicacion_data)

        return {
            "ubicacion": {
                "latitud": primera_ubicacion.latitud,
                "longitud": primera_ubicacion.longitud,
                "velocidad": primera_ubicacion.velocidad,
                "direccion": primera_ubicacion.direccion,
                "timestamp": primera_ubicacion.timestamp.isoformat(),
                "bateria": primera_ubicacion.bateria
            } if primera_ubicacion else None,
            "ubicaciones": ubicaciones_formateadas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicación: {str(e)}")
