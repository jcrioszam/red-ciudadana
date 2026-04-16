from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import unicodedata
import re
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..models import (
    ProbableDuplicado as DupModel,
    Persona as PersonaModel,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/duplicados", tags=["duplicados"])


# ── Utilidades de comparación ─────────────────────────────────────────────────

def _normalizar(texto: str) -> str:
    """Lowercase, elimina acentos, espacios múltiples."""
    if not texto:
        return ""
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"\s+", " ", texto)
    return texto


def _similitud_nombre(n1: str, n2: str) -> float:
    """
    Retorna 0.0-1.0. Compara palabras en común / total palabras únicas.
    """
    w1 = set(_normalizar(n1).split())
    w2 = set(_normalizar(n2).split())
    if not w1 or not w2:
        return 0.0
    interseccion = w1 & w2
    union = w1 | w2
    return len(interseccion) / len(union)


def detectar_duplicados(persona_nueva: PersonaModel, db: Session) -> list[dict]:
    """
    Compara persona_nueva contra todas las activas y retorna lista de
    {'persona': PersonaModel, 'tipo': str, 'similitud': float}
    """
    encontrados = []
    personas = db.query(PersonaModel).filter(
        PersonaModel.activo == True,
        PersonaModel.id != persona_nueva.id,
    ).all()

    for p in personas:
        # 1. Clave elector exacta
        if (persona_nueva.clave_elector and p.clave_elector
                and _normalizar(persona_nueva.clave_elector) == _normalizar(p.clave_elector)):
            encontrados.append({"persona": p, "tipo": "clave_elector", "similitud": 1.0})
            continue

        # 2. CURP exacta
        if (persona_nueva.curp and p.curp
                and _normalizar(persona_nueva.curp) == _normalizar(p.curp)):
            encontrados.append({"persona": p, "tipo": "curp", "similitud": 1.0})
            continue

        # 3. Nombre muy similar + misma sección
        sim = _similitud_nombre(persona_nueva.nombre, p.nombre)
        if sim >= 0.80:
            if (persona_nueva.seccion_electoral and p.seccion_electoral
                    and persona_nueva.seccion_electoral == p.seccion_electoral):
                encontrados.append({"persona": p, "tipo": "nombre_seccion", "similitud": sim})
                continue
            # 4. Nombre muy similar + mismo municipio + misma colonia
            if (persona_nueva.municipio and p.municipio
                    and _normalizar(persona_nueva.municipio) == _normalizar(p.municipio)
                    and persona_nueva.colonia and p.colonia
                    and _normalizar(persona_nueva.colonia) == _normalizar(p.colonia)):
                encontrados.append({"persona": p, "tipo": "nombre_municipio_colonia", "similitud": sim})

    return encontrados


def registrar_duplicados(persona_nueva: PersonaModel, db: Session):
    """Llama a detectar_duplicados y persiste los registros nuevos."""
    candidatos = detectar_duplicados(persona_nueva, db)
    for c in candidatos:
        # Evitar duplicar el registro
        ya_existe = db.query(DupModel).filter(
            ((DupModel.id_persona_1 == persona_nueva.id) & (DupModel.id_persona_2 == c["persona"].id))
            | ((DupModel.id_persona_1 == c["persona"].id) & (DupModel.id_persona_2 == persona_nueva.id))
        ).first()
        if not ya_existe:
            db.add(DupModel(
                id_persona_1=persona_nueva.id,
                id_persona_2=c["persona"].id,
                tipo_coincidencia=c["tipo"],
                similitud=c["similitud"],
                estado="pendiente",
            ))
    if candidatos:
        db.commit()
    return len(candidatos)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
async def list_duplicados(
    estado: Optional[str] = "pendiente",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    query = db.query(DupModel)
    if estado:
        query = query.filter(DupModel.estado == estado)
    total = query.count()
    items = query.order_by(DupModel.similitud.desc(), DupModel.fecha_deteccion.desc()).offset(skip).limit(limit).all()

    def _fmt_persona(p):
        if not p:
            return None
        return {
            "id": p.id,
            "nombre": p.nombre,
            "clave_elector": p.clave_elector,
            "curp": p.curp,
            "telefono": p.telefono,
            "direccion": p.direccion,
            "seccion_electoral": p.seccion_electoral,
            "municipio": p.municipio,
            "colonia": p.colonia,
            "edad": p.edad,
            "sexo": p.sexo,
            "fecha_registro": p.fecha_registro,
            "id_lider_responsable": p.id_lider_responsable,
        }

    return {
        "total": total,
        "items": [
            {
                "id": d.id,
                "tipo_coincidencia": d.tipo_coincidencia,
                "similitud": round(d.similitud * 100),
                "estado": d.estado,
                "fecha_deteccion": d.fecha_deteccion,
                "notas": d.notas,
                "persona_1": _fmt_persona(d.persona_1),
                "persona_2": _fmt_persona(d.persona_2),
            }
            for d in items
        ],
    }


@router.get("/stats")
async def stats_duplicados(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    pendientes = db.query(DupModel).filter(DupModel.estado == "pendiente").count()
    confirmados = db.query(DupModel).filter(DupModel.estado == "mismo").count()
    descartados = db.query(DupModel).filter(DupModel.estado == "diferente").count()
    return {"pendientes": pendientes, "confirmados": confirmados, "descartados": descartados}


@router.put("/{dup_id}/resolver")
async def resolver_duplicado(
    dup_id: int,
    decision: str,           # 'mismo' | 'diferente'
    id_persona_ganadora: Optional[int] = None,
    notas: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """
    decision='diferente': son personas distintas, se descarta la alerta.
    decision='mismo' + id_persona_ganadora: se elimina la persona perdedora (soft-delete).
    """
    if decision not in ("mismo", "diferente"):
        raise HTTPException(status_code=400, detail="decision debe ser 'mismo' o 'diferente'")

    dup = db.query(DupModel).filter(DupModel.id == dup_id).first()
    if not dup:
        raise HTTPException(status_code=404, detail="Duplicado no encontrado")

    dup.estado = decision
    dup.resuelto_por = current_user.id
    dup.fecha_resolucion = datetime.utcnow()
    dup.notas = notas

    if decision == "mismo":
        if not id_persona_ganadora:
            raise HTTPException(status_code=400, detail="Debes indicar cuál persona conservar (id_persona_ganadora)")
        if id_persona_ganadora not in (dup.id_persona_1, dup.id_persona_2):
            raise HTTPException(status_code=400, detail="id_persona_ganadora debe ser una de las dos personas del par")
        dup.id_persona_ganadora = id_persona_ganadora

        # Soft-delete a la persona perdedora
        id_perdedora = dup.id_persona_2 if id_persona_ganadora == dup.id_persona_1 else dup.id_persona_1
        perdedora = db.query(PersonaModel).filter(PersonaModel.id == id_perdedora).first()
        if perdedora:
            perdedora.activo = False

        # Marcar otros pares pendientes con la misma perdedora como descartados
        db.query(DupModel).filter(
            DupModel.estado == "pendiente",
            (DupModel.id_persona_1 == id_perdedora) | (DupModel.id_persona_2 == id_perdedora),
        ).update({"estado": "diferente"}, synchronize_session=False)

    db.commit()
    return {"mensaje": "Duplicado resuelto", "estado": decision}


@router.post("/escanear")
async def escanear_todas(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Escanea TODAS las personas activas y genera alertas de duplicados pendientes."""
    if current_user.rol not in ["admin", "presidente"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ejecutar el escaneo completo")

    personas = db.query(PersonaModel).filter(PersonaModel.activo == True).all()
    total_nuevos = 0
    for persona in personas:
        nuevos = registrar_duplicados(persona, db)
        total_nuevos += nuevos

    return {"mensaje": f"Escaneo completado. {total_nuevos} nuevas alertas generadas."}
