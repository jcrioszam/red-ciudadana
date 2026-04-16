from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from .models import AsignacionMovilizacion as AsignacionMovilizacionModel, Vehiculo as VehiculoModel
from .models import Evento as EventoModel
from .schemas import AsignacionMovilizacion, AsignacionMovilizacionCreate, AsignacionMovilizacionUpdate
from .database import get_db
from .auth import get_current_active_user
from fastapi import Body
from .models import Persona
from .models import Asistencia as AsistenciaModel
from .schemas import Asistencia
from datetime import datetime, timedelta

router = APIRouter(prefix="/movilizaciones", tags=["movilizaciones"])

print("Cargando router de movilizaciones")

@router.post("/", response_model=AsignacionMovilizacion)
async def create_asignacion_movilizacion(asignacion: AsignacionMovilizacionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol not in ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para asignar movilización")
    vehiculo = db.query(VehiculoModel).filter(VehiculoModel.id == asignacion.id_vehiculo, VehiculoModel.activo == True).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado o inactivo")
    ocupados = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id_vehiculo == asignacion.id_vehiculo,
        AsignacionMovilizacionModel.id_evento == asignacion.id_evento
    ).count()
    if ocupados >= vehiculo.capacidad:
        raise HTTPException(status_code=400, detail=f"El vehículo ya está lleno (capacidad: {vehiculo.capacidad})")
    existe = db.query(AsignacionMovilizacionModel).filter(
        AsignacionMovilizacionModel.id_vehiculo == asignacion.id_vehiculo,
        AsignacionMovilizacionModel.id_evento == asignacion.id_evento,
        AsignacionMovilizacionModel.id_persona == asignacion.id_persona
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="La persona ya está asignada a este vehículo para este evento")
    db_asignacion = AsignacionMovilizacionModel(**asignacion.dict())
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    return db_asignacion

@router.get("/", response_model=List[AsignacionMovilizacion])
async def list_asignaciones_movilizacion(evento_id: int = None, vehiculo_id: int = None, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    query = db.query(AsignacionMovilizacionModel).options(
        joinedload(AsignacionMovilizacionModel.persona).joinedload(Persona.lider_responsable)
    )
    if evento_id:
        query = query.filter(AsignacionMovilizacionModel.id_evento == evento_id)
    if vehiculo_id:
        query = query.filter(AsignacionMovilizacionModel.id_vehiculo == vehiculo_id)
    asignaciones = query.all()
    # Sincronizar el campo 'asistio' con la tabla de asistencias
    for asignacion in asignaciones:
        asistencia = db.query(AsistenciaModel).filter(
            AsistenciaModel.id_evento == asignacion.id_evento,
            AsistenciaModel.id_persona == asignacion.id_persona,
            AsistenciaModel.asistio == True
        ).first()
        asignacion.asistio = bool(asistencia)
        if asistencia:
            asignacion.hora_checkin = asistencia.hora_checkin
    return asignaciones

@router.get("/mis-vehiculos", response_model=List[dict])
async def get_mis_vehiculos_asignados(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Devuelve los vehículos donde el usuario actual es el movilizador responsable,
    junto con la info del evento activo y estadísticas de asistencia.
    """
    ahora = datetime.utcnow()
    ventana_inicio = ahora - timedelta(hours=8)

    # Vehículos donde soy el responsable
    vehiculos = db.query(VehiculoModel).filter(
        VehiculoModel.id_movilizador == current_user.id,
        VehiculoModel.activo == True
    ).all()

    resultado = []
    for v in vehiculos:
        # Buscar eventos activos (ventana ±8h) que tengan asignaciones para este vehículo
        asigs_vehiculo = db.query(AsignacionMovilizacionModel).filter(
            AsignacionMovilizacionModel.id_vehiculo == v.id
        ).all()

        event_ids = list({a.id_evento for a in asigs_vehiculo})

        for ev_id in event_ids:
            evento = db.query(EventoModel).filter(
                EventoModel.id == ev_id,
                EventoModel.activo == True,
                EventoModel.fecha >= ventana_inicio
            ).first()
            if not evento:
                continue

            asigs = [a for a in asigs_vehiculo if a.id_evento == ev_id]
            total = len(asigs)
            presentes = sum(1 for a in asigs if a.asistio)

            # También verificar en tabla asistencias
            if not any(a.asistio for a in asigs):
                for a in asigs:
                    tiene = db.query(AsistenciaModel).filter(
                        AsistenciaModel.id_evento == ev_id,
                        AsistenciaModel.id_persona == a.id_persona,
                        AsistenciaModel.asistio == True
                    ).first()
                    if tiene:
                        presentes += 1

            resultado.append({
                "vehiculo_id": v.id,
                "vehiculo_tipo": v.tipo,
                "vehiculo_placas": v.placas or "",
                "vehiculo_capacidad": v.capacidad,
                "evento_id": evento.id,
                "evento_nombre": evento.nombre,
                "evento_fecha": evento.fecha.isoformat(),
                "evento_lugar": evento.lugar or "",
                "evento_tipo": evento.tipo,
                "total_personas": total,
                "presentes": presentes,
                "porcentaje": round((presentes / total * 100) if total > 0 else 0),
                "en_curso": ventana_inicio <= evento.fecha <= ahora,
                "proximo": evento.fecha > ahora,
            })

    return resultado


@router.get("/{asignacion_id}", response_model=AsignacionMovilizacion)
async def get_asignacion_movilizacion(asignacion_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion

@router.put("/{asignacion_id}", response_model=AsignacionMovilizacion)
async def update_asignacion_movilizacion(asignacion_id: int, asignacion_update: AsignacionMovilizacionUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user.rol not in ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para editar asignaciones")
    for field, value in asignacion_update.dict(exclude_unset=True).items():
        setattr(asignacion, field, value)
    db.commit()
    db.refresh(asignacion)
    return asignacion

@router.delete("/{asignacion_id}", response_model=AsignacionMovilizacion)
async def delete_asignacion_movilizacion(asignacion_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if current_user.rol not in ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar asignaciones")
    db.delete(asignacion)
    db.commit()
    return asignacion

@router.post("/masivo", response_model=List[AsignacionMovilizacion])
def asignar_movilizacion_masivo(
    id_evento: int = Body(...),
    id_vehiculo: int = Body(...),
    ids_persona: List[int] = Body(...),
    db: Session = Depends(get_db)
):
    asignaciones = []
    for id_persona in ids_persona:
        asignacion = AsignacionMovilizacionModel(
            id_evento=id_evento,
            id_vehiculo=id_vehiculo,
            id_persona=id_persona,
            asistio=False,
            requiere_transporte=False,
            observaciones=''
        )
        db.add(asignacion)
        asignaciones.append(asignacion)
    db.commit()
    for a in asignaciones:
        db.refresh(a)
    return asignaciones

@router.post("/{asignacion_id}/checkin", response_model=Asistencia)
async def checkin_asignacion_movilizacion(asignacion_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    asignacion = db.query(AsignacionMovilizacionModel).filter(AsignacionMovilizacionModel.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    # Buscar o crear asistencia
    asistencia = db.query(AsistenciaModel).filter(
        AsistenciaModel.id_evento == asignacion.id_evento,
        AsistenciaModel.id_persona == asignacion.id_persona
    ).first()
    if not asistencia:
        asistencia = AsistenciaModel(
            id_evento=asignacion.id_evento,
            id_persona=asignacion.id_persona,
            asistio=True,
            movilizado=True,
            hora_checkin=datetime.utcnow(),
            usuario_checkin=current_user.id
        )
        db.add(asistencia)
    else:
        asistencia.asistio = True
        asistencia.movilizado = True
        asistencia.hora_checkin = datetime.utcnow()
        asistencia.usuario_checkin = current_user.id
    db.commit()
    db.refresh(asistencia)
    return asistencia