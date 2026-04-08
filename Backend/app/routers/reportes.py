from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..schemas import ReportePersonas, ReporteEventos, Usuario
from ..models import (
    Usuario as UsuarioModel,
    Persona as PersonaModel,
    Evento as EventoModel,
    Asistencia as AsistenciaModel,
    AsignacionMovilizacion as AsignacionMovilizacionModel,
    Vehiculo as VehiculoModel,
)
from ..models_padron import PadronElectoral

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reportes", tags=["reportes"])


def get_subordinate_ids(user_id: int, db: Session):
    subs = db.query(UsuarioModel).filter(
        UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True
    ).all()
    ids = [user_id]
    for sub in subs:
        ids.extend(get_subordinate_ids(sub.id, db))
    return ids


@router.get("/personas", response_model=ReportePersonas)
async def reporte_personas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol == "admin":
        personas = db.query(PersonaModel).filter(PersonaModel.activo == True).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        ids = get_subordinate_ids(current_user.id, db)
        personas = db.query(PersonaModel).filter(
            PersonaModel.id_lider_responsable.in_(ids), PersonaModel.activo == True
        ).all()
    else:
        personas = db.query(PersonaModel).filter(
            PersonaModel.id_lider_responsable == current_user.id, PersonaModel.activo == True
        ).all()

    personas_por_seccion = {}
    personas_por_colonia = {}
    personas_por_lider = {}

    for persona in personas:
        if persona.seccion_electoral:
            personas_por_seccion[persona.seccion_electoral] = personas_por_seccion.get(persona.seccion_electoral, 0) + 1
        if persona.colonia:
            personas_por_colonia[persona.colonia] = personas_por_colonia.get(persona.colonia, 0) + 1
        lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
        if lider:
            personas_por_lider[lider.nombre] = personas_por_lider.get(lider.nombre, 0) + 1

    return ReportePersonas(
        total_personas=len(personas),
        personas_por_seccion=personas_por_seccion,
        personas_por_colonia=personas_por_colonia,
        personas_por_lider=personas_por_lider
    )


@router.get("/eventos", response_model=ReporteEventos)
async def reporte_eventos(
    historicos: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(EventoModel).filter(EventoModel.activo == True)

    if current_user.rol == "admin":
        pass
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        ids = get_subordinate_ids(current_user.id, db)
        query = query.filter(EventoModel.id_lider_organizador.in_(ids))
    else:
        query = query.filter(EventoModel.id_lider_organizador == current_user.id)

    ahora = datetime.utcnow()
    if historicos:
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.desc()).all()
    else:
        query = query.filter(EventoModel.fecha >= ahora - timedelta(hours=24))
        eventos = query.order_by(EventoModel.fecha.asc()).all()

    eventos_por_tipo = {}
    asistencias_por_evento = {}
    eficiencia_movilizacion = {}

    for evento in eventos:
        if evento.tipo:
            eventos_por_tipo[evento.tipo] = eventos_por_tipo.get(evento.tipo, 0) + 1
        asistencias = db.query(AsistenciaModel).filter(AsistenciaModel.id_evento == evento.id).all()
        asistencias_por_evento[evento.nombre] = len(asistencias)
        movilizados = sum(1 for a in asistencias if a.movilizado)
        eficiencia_movilizacion[evento.nombre] = {
            "total": len(asistencias),
            "movilizados": movilizados,
            "porcentaje": (movilizados / len(asistencias) * 100) if asistencias else 0
        }

    return ReporteEventos(
        total_eventos=len(eventos),
        eventos_por_tipo=eventos_por_tipo,
        asistencias_por_evento=asistencias_por_evento,
        eficiencia_movilizacion=eficiencia_movilizacion
    )


@router.get("/eventos-historicos")
async def reporte_eventos_historicos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ahora = datetime.utcnow()
    query = db.query(EventoModel).filter(EventoModel.activo == True)

    if current_user.rol == "admin":
        query = query.filter(EventoModel.fecha < ahora - timedelta(hours=24))
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        ids_jerarquia = get_subordinate_ids(current_user.id, db)
        personas_lider = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable.in_(ids_jerarquia)).all()
        ids_personas_lider = [p.id for p in personas_lider]
        asistencias_lider = db.query(AsistenciaModel).filter(AsistenciaModel.id_persona.in_(ids_personas_lider)).all()
        ids_eventos = list(set(a.id_evento for a in asistencias_lider))
        if ids_eventos:
            query = query.filter(EventoModel.id.in_(ids_eventos), EventoModel.fecha < ahora - timedelta(hours=24))
        else:
            query = query.filter(EventoModel.id == -1)
    else:
        personas_usuario = db.query(PersonaModel).filter(PersonaModel.id_lider_responsable == current_user.id).all()
        ids_personas = [p.id for p in personas_usuario]
        asistencias_usuario = db.query(AsistenciaModel).filter(AsistenciaModel.id_persona.in_(ids_personas)).all()
        ids_eventos = list(set(a.id_evento for a in asistencias_usuario))
        if ids_eventos:
            query = query.filter(EventoModel.id.in_(ids_eventos), EventoModel.fecha < ahora - timedelta(hours=24))
        else:
            query = query.filter(EventoModel.id == -1)

    eventos = query.order_by(EventoModel.fecha.desc()).all()
    eventos_por_tipo = {}
    eventos_por_mes = {}
    eventos_detallados = []

    for evento in eventos:
        tipo = evento.tipo or "Sin tipo"
        eventos_por_tipo[tipo] = eventos_por_tipo.get(tipo, 0) + 1
        mes = evento.fecha.strftime("%Y-%m")
        eventos_por_mes[mes] = eventos_por_mes.get(mes, 0) + 1

        asistencias = db.query(AsistenciaModel).filter(AsistenciaModel.id_evento == evento.id).all()
        asignaciones = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id_evento == evento.id).all()
        total_asignados = len(asignaciones)
        asistencias_confirmadas = sum(1 for a in asistencias if a.asistio)
        movilizados = sum(1 for a in asistencias if a.movilizado)

        eventos_detallados.append({
            "id": evento.id,
            "nombre": evento.nombre,
            "fecha": evento.fecha.isoformat(),
            "tipo": evento.tipo,
            "lugar": evento.lugar,
            "total_asignados": total_asignados,
            "total_asistencias": len(asistencias),
            "asistencias_confirmadas": asistencias_confirmadas,
            "movilizados": movilizados,
            "porcentaje_asistencia": round((asistencias_confirmadas / total_asignados * 100) if total_asignados > 0 else 0, 1),
            "porcentaje_movilizacion": round((movilizados / asistencias_confirmadas * 100) if asistencias_confirmadas > 0 else 0, 1)
        })

    return {
        "total_eventos": len(eventos),
        "eventos_por_tipo": eventos_por_tipo,
        "eventos_por_mes": eventos_por_mes,
        "eventos_detallados": eventos_detallados,
        "resumen": {
            "promedio_asistencia": round(sum(e["porcentaje_asistencia"] for e in eventos_detallados) / len(eventos_detallados) if eventos_detallados else 0, 1),
            "promedio_movilizacion": round(sum(e["porcentaje_movilizacion"] for e in eventos_detallados) / len(eventos_detallados) if eventos_detallados else 0, 1),
            "total_asignados": sum(e["total_asignados"] for e in eventos_detallados),
            "total_asistencias": sum(e["asistencias_confirmadas"] for e in eventos_detallados),
            "total_movilizados": sum(e["movilizados"] for e in eventos_detallados)
        }
    }


@router.get("/asistencias-tiempo-real")
async def reporte_asistencias_tiempo_real(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol == "admin":
        eventos = db.query(EventoModel).filter(EventoModel.activo == True).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        ids = get_subordinate_ids(current_user.id, db)
        eventos = db.query(EventoModel).filter(
            EventoModel.id_lider_organizador.in_(ids), EventoModel.activo == True
        ).all()
    else:
        eventos = db.query(EventoModel).filter(
            EventoModel.id_lider_organizador == current_user.id, EventoModel.activo == True
        ).all()

    reporte_eventos = []
    for evento in eventos:
        asignaciones = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id_evento == evento.id).all()
        asistencias = db.query(AsistenciaModel).filter(
            AsistenciaModel.id_evento == evento.id, AsistenciaModel.asistio == True
        ).all()
        total_asignados = len(asignaciones)
        total_asistencias = len(asistencias)
        movilizados = sum(1 for a in asistencias if a.movilizado)
        ultimas = db.query(AsistenciaModel).filter(
            AsistenciaModel.id_evento == evento.id, AsistenciaModel.asistio == True
        ).order_by(AsistenciaModel.hora_checkin.desc()).limit(5).all()

        reporte_eventos.append({
            "id": evento.id,
            "nombre": evento.nombre,
            "fecha": evento.fecha.isoformat(),
            "tipo": evento.tipo,
            "total_asignados": total_asignados,
            "total_asistencias": total_asistencias,
            "porcentaje_asistencia": round((total_asistencias / total_asignados * 100) if total_asignados > 0 else 0, 1),
            "movilizados": movilizados,
            "porcentaje_movilizacion": round((movilizados / total_asistencias * 100) if total_asistencias > 0 else 0, 1),
            "ultimas_asistencias": [
                {"id": a.id, "hora_checkin": a.hora_checkin.isoformat() if a.hora_checkin else None, "movilizado": a.movilizado}
                for a in ultimas
            ]
        })

    reporte_eventos.sort(key=lambda x: x["fecha"], reverse=True)
    return {
        "eventos": reporte_eventos,
        "total_eventos": len(reporte_eventos),
        "total_asistencias": sum(e["total_asistencias"] for e in reporte_eventos),
        "resumen_global": {
            "total_asignados": sum(e["total_asignados"] for e in reporte_eventos),
            "total_asistencias": sum(e["total_asistencias"] for e in reporte_eventos),
            "promedio_asistencia": round(
                sum(e["porcentaje_asistencia"] for e in reporte_eventos) / len(reporte_eventos) if reporte_eventos else 0, 1
            )
        }
    }


@router.get("/estructura-jerarquica")
async def reporte_estructura_jerarquica(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    def build_node(user):
        subordinados = db.query(UsuarioModel).filter(
            UsuarioModel.id_lider_superior == user.id, UsuarioModel.activo == True
        ).all()
        total_personas = db.query(PersonaModel).filter(
            PersonaModel.id_lider_responsable == user.id, PersonaModel.activo == True
        ).count()
        children = [build_node(sub) for sub in subordinados]
        total_sub_personas = sum(c["total_personas"] for c in children)
        return {
            "id": user.id,
            "nombre": user.nombre,
            "rol": user.rol,
            "total_personas": total_personas,
            "total_subordinados": len(subordinados),
            "total_personas_red": total_personas + total_sub_personas,
            "subordinados": children
        }

    if current_user.rol == "admin":
        raiz_users = db.query(UsuarioModel).filter(
            UsuarioModel.activo == True, UsuarioModel.id_lider_superior == None
        ).all()
        estructura = [build_node(u) for u in raiz_users]
    else:
        estructura = [build_node(current_user)]

    return {"estructura": estructura, "total_niveles": len(estructura)}


@router.get("/metricas-movilizacion/", response_model=dict)
async def obtener_metricas_movilizacion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    try:
        total_padron = db.query(PadronElectoral).filter(PadronElectoral.activo == True).count()
        padron_asignado = db.query(PadronElectoral).filter(
            and_(PadronElectoral.activo == True, PadronElectoral.id_lider_asignado.isnot(None))
        ).count()
        total_personas = db.query(PersonaModel).filter(PersonaModel.activo == True).count()
        metricas_lideres = db.query(
            UsuarioModel.nombre,
            UsuarioModel.rol,
            func.count(PersonaModel.id).label('personas_registradas'),
            func.count(PadronElectoral.id).label('personas_padron_asignadas')
        ).outerjoin(
            PersonaModel, UsuarioModel.id == PersonaModel.id_lider_responsable
        ).outerjoin(
            PadronElectoral, UsuarioModel.id == PadronElectoral.id_lider_asignado
        ).filter(
            UsuarioModel.activo == True,
            UsuarioModel.rol.in_(["lider_estatal", "lider_regional", "lider_municipal", "lider_zona"])
        ).group_by(UsuarioModel.id, UsuarioModel.nombre, UsuarioModel.rol).all()
        return {
            "resumen_general": {
                "total_padron_electoral": total_padron,
                "padron_asignado": padron_asignado,
                "padron_disponible": total_padron - padron_asignado,
                "total_personas_registradas": total_personas,
                "total_lideres_activos": len(metricas_lideres)
            },
            "metricas_por_lider": [
                {
                    "lider": m.nombre, "rol": m.rol,
                    "personas_registradas": m.personas_registradas,
                    "personas_padron_asignadas": m.personas_padron_asignadas,
                    "total_movilizacion": m.personas_registradas + m.personas_padron_asignadas
                }
                for m in metricas_lideres
            ],
            "ranking_movilizacion": sorted(
                [
                    {"lider": m.nombre, "rol": m.rol,
                     "total_movilizacion": m.personas_registradas + m.personas_padron_asignadas}
                    for m in metricas_lideres
                ],
                key=lambda x: x["total_movilizacion"], reverse=True
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo metricas: {str(e)}")
