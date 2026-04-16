from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..models import (
    ConfiguracionIncentivo as ConfigModel,
    CorteIncentivo as CorteModel,
    DetalleCorteIncentivo as DetalleModel,
    Persona as PersonaModel,
    Usuario as UsuarioModel,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/incentivos", tags=["incentivos"])

ROLES_ADMIN = ["admin", "presidente"]


# ── Configuración de monto ────────────────────────────────────────────────────

@router.get("/configuracion")
async def get_configuracion(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    cfg = db.query(ConfigModel).filter(ConfigModel.activo == True).order_by(ConfigModel.id.desc()).first()
    if not cfg:
        return {"monto_por_persona": 0.0, "descripcion": "", "id": None}
    return {
        "id": cfg.id,
        "monto_por_persona": cfg.monto_por_persona,
        "descripcion": cfg.descripcion,
        "fecha_actualizacion": cfg.fecha_actualizacion,
    }


@router.post("/configuracion")
async def set_configuracion(
    monto_por_persona: float,
    descripcion: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.rol not in ROLES_ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden cambiar el monto")
    # Desactivar configuración anterior
    db.query(ConfigModel).filter(ConfigModel.activo == True).update({"activo": False})
    cfg = ConfigModel(
        monto_por_persona=monto_por_persona,
        descripcion=descripcion,
        activo=True,
        creado_por=current_user.id,
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return {"id": cfg.id, "monto_por_persona": cfg.monto_por_persona, "descripcion": cfg.descripcion}


# ── Resumen por registrador ───────────────────────────────────────────────────

@router.get("/resumen")
async def get_resumen(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """
    Devuelve, para cada registrador activo:
    - total personas registradas
    - personas pendientes de pago (no incluidas en ningún corte)
    - total pagado (suma de cortes pagados)
    - total pendiente (suma de cortes no pagados)
    - deuda actual (personas sin corte * monto_por_persona)
    """
    cfg = db.query(ConfigModel).filter(ConfigModel.activo == True).order_by(ConfigModel.id.desc()).first()
    monto = cfg.monto_por_persona if cfg else 0.0

    # IDs de personas que ya tienen corte
    ids_en_corte = {d.id_persona for d in db.query(DetalleModel).all()}

    # Registradores que tienen personas
    registradores = (
        db.query(UsuarioModel)
        .join(PersonaModel, PersonaModel.id_usuario_registro == UsuarioModel.id)
        .filter(PersonaModel.activo == True)
        .distinct()
        .all()
    )

    resultado = []
    for u in registradores:
        personas = db.query(PersonaModel).filter(
            PersonaModel.id_usuario_registro == u.id,
            PersonaModel.activo == True,
        ).all()

        total_personas = len(personas)
        pendientes = [p for p in personas if p.id not in ids_en_corte]
        total_pendientes = len(pendientes)

        # Cortes del registrador
        cortes = db.query(CorteModel).filter(CorteModel.id_usuario == u.id).all()
        total_pagado = sum(c.monto_total for c in cortes if c.pagado)
        total_por_pagar = sum(c.monto_total for c in cortes if not c.pagado)
        deuda_sin_corte = total_pendientes * monto

        resultado.append({
            "id_usuario": u.id,
            "nombre": u.nombre,
            "username": u.username,
            "rol": u.rol,
            "total_personas": total_personas,
            "pendientes_sin_corte": total_pendientes,
            "total_pagado": total_pagado,
            "total_por_pagar": total_por_pagar,
            "deuda_actual": deuda_sin_corte,
            "monto_por_persona": monto,
        })

    return resultado


# ── Personas pendientes de un registrador ────────────────────────────────────

@router.get("/pendientes/{id_usuario}")
async def get_pendientes(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ids_en_corte = {d.id_persona for d in db.query(DetalleModel).all()}
    personas = db.query(PersonaModel).filter(
        PersonaModel.id_usuario_registro == id_usuario,
        PersonaModel.activo == True,
    ).all()
    return [
        {
            "id": p.id,
            "nombre": p.nombre,
            "seccion_electoral": p.seccion_electoral,
            "municipio": p.municipio,
            "fecha_registro": p.fecha_registro,
            "en_corte": p.id in ids_en_corte,
        }
        for p in personas
        if p.id not in ids_en_corte
    ]


# ── Cortes ────────────────────────────────────────────────────────────────────

@router.post("/cortes/{id_usuario}")
async def crear_corte(
    id_usuario: int,
    notas: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.rol not in ROLES_ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear cortes")

    cfg = db.query(ConfigModel).filter(ConfigModel.activo == True).order_by(ConfigModel.id.desc()).first()
    monto = cfg.monto_por_persona if cfg else 0.0

    ids_en_corte = {d.id_persona for d in db.query(DetalleModel).all()}
    personas_nuevas = db.query(PersonaModel).filter(
        PersonaModel.id_usuario_registro == id_usuario,
        PersonaModel.activo == True,
    ).all()
    personas_nuevas = [p for p in personas_nuevas if p.id not in ids_en_corte]

    if not personas_nuevas:
        raise HTTPException(status_code=400, detail="No hay personas pendientes para este registrador")

    total = len(personas_nuevas)
    monto_total = total * monto

    corte = CorteModel(
        id_usuario=id_usuario,
        total_personas=total,
        monto_por_persona=monto,
        monto_total=monto_total,
        pagado=False,
        notas=notas,
        creado_por=current_user.id,
    )
    db.add(corte)
    db.flush()

    for p in personas_nuevas:
        db.add(DetalleModel(id_corte=corte.id, id_persona=p.id))

    db.commit()
    db.refresh(corte)
    return {
        "id": corte.id,
        "total_personas": corte.total_personas,
        "monto_total": corte.monto_total,
        "pagado": corte.pagado,
        "fecha_corte": corte.fecha_corte,
    }


@router.get("/cortes/{id_usuario}")
async def get_cortes(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    cortes = db.query(CorteModel).filter(CorteModel.id_usuario == id_usuario).order_by(CorteModel.fecha_corte.desc()).all()
    return [
        {
            "id": c.id,
            "fecha_corte": c.fecha_corte,
            "total_personas": c.total_personas,
            "monto_por_persona": c.monto_por_persona,
            "monto_total": c.monto_total,
            "pagado": c.pagado,
            "fecha_pago": c.fecha_pago,
            "notas": c.notas,
        }
        for c in cortes
    ]


@router.put("/cortes/{corte_id}/pagar")
async def marcar_pagado(
    corte_id: int,
    notas: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.rol not in ROLES_ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden registrar pagos")
    corte = db.query(CorteModel).filter(CorteModel.id == corte_id).first()
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    if corte.pagado:
        raise HTTPException(status_code=400, detail="Este corte ya fue pagado")
    corte.pagado = True
    corte.fecha_pago = datetime.utcnow()
    if notas:
        corte.notas = notas
    db.commit()
    return {"mensaje": "Corte marcado como pagado", "fecha_pago": corte.fecha_pago}


@router.get("/cortes/{corte_id}/detalle")
async def get_detalle_corte(
    corte_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    corte = db.query(CorteModel).filter(CorteModel.id == corte_id).first()
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    detalles = db.query(DetalleModel).filter(DetalleModel.id_corte == corte_id).all()
    personas = []
    for d in detalles:
        p = d.persona
        personas.append({
            "id": p.id,
            "nombre": p.nombre,
            "seccion_electoral": p.seccion_electoral,
            "municipio": p.municipio,
            "fecha_registro": p.fecha_registro,
        })
    return {
        "corte": {
            "id": corte.id,
            "fecha_corte": corte.fecha_corte,
            "total_personas": corte.total_personas,
            "monto_total": corte.monto_total,
            "pagado": corte.pagado,
            "fecha_pago": corte.fecha_pago,
            "notas": corte.notas,
        },
        "personas": personas,
    }
