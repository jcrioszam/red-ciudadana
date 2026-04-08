from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import requests
import logging

from ..database import get_db
from ..auth import get_current_active_user
from ..models import Usuario as UsuarioModel
from ..models import Persona as PersonaModel
from ..models_padron import PadronElectoral
from ..schemas import Persona, PersonaCreate, PersonaUpdate, PersonaUbicacion, Usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/personas", tags=["personas"])


class GeocodificarRequest(BaseModel):
    direccion: str
    colonia: str = None
    municipio: str = None
    estado: str = None
    codigo_postal: str = None


class GeocodificarResponse(BaseModel):
    latitud: float
    longitud: float
    direccion_formateada: str


def _get_subordinate_ids(user_id, db):
    subs = db.query(UsuarioModel).filter(
        UsuarioModel.id_lider_superior == user_id, UsuarioModel.activo == True
    ).all()
    ids = [user_id]
    for sub in subs:
        ids.extend(_get_subordinate_ids(sub.id, db))
    return ids


def _is_in_hierarchy(persona, lider_id, db):
    if persona.id_lider_responsable == lider_id:
        return True
    lider = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_lider_responsable).first()
    if lider and lider.id_lider_superior:
        return _is_in_hierarchy(persona, lider.id_lider_superior, db)
    return False


@router.get("/", response_model=List[Persona])
async def list_personas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    if current_user.rol == "admin":
        personas = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        ids = _get_subordinate_ids(current_user.id, db)
        personas = query.filter(PersonaModel.id_lider_responsable.in_(ids)).offset(skip).limit(limit).all()
    else:
        personas = query.filter(PersonaModel.id_lider_responsable == current_user.id).offset(skip).limit(limit).all()
    return personas


@router.get("/con-usuario-registro/", response_model=List[dict])
async def list_personas_con_usuario_registro(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    if current_user.rol in ["admin", "presidente"]:
        personas = query.offset(skip).limit(limit).all()
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        ids = _get_subordinate_ids(current_user.id, db)
        personas = query.filter(PersonaModel.id_lider_responsable.in_(ids)).offset(skip).limit(limit).all()
    else:
        personas = query.filter(PersonaModel.id_usuario_registro == current_user.id).offset(skip).limit(limit).all()

    resultado = []
    for persona in personas:
        usuario_registro = db.query(UsuarioModel).filter(UsuarioModel.id == persona.id_usuario_registro).first()
        resultado.append({
            "id": persona.id,
            "nombre": persona.nombre,
            "telefono": persona.telefono,
            "direccion": persona.direccion,
            "edad": persona.edad,
            "sexo": persona.sexo,
            "clave_elector": persona.clave_elector,
            "curp": persona.curp,
            "num_emision": persona.num_emision,
            "seccion_electoral": persona.seccion_electoral,
            "distrito": persona.distrito,
            "municipio": persona.municipio,
            "estado": persona.estado,
            "colonia": persona.colonia,
            "codigo_postal": persona.codigo_postal,
            "fecha_registro": persona.fecha_registro,
            "activo": persona.activo,
            "usuario_registro": {
                "id": usuario_registro.id if usuario_registro else None,
                "nombre": usuario_registro.nombre if usuario_registro else "N/A",
                "rol": usuario_registro.rol if usuario_registro else "N/A"
            } if usuario_registro else None
        })
    return resultado


@router.get("/ubicaciones", response_model=List[PersonaUbicacion])
async def obtener_ubicaciones_personas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    personas = db.query(PersonaModel).filter(
        PersonaModel.activo == True,
        PersonaModel.latitud.isnot(None),
        PersonaModel.longitud.isnot(None)
    ).all()
    return [PersonaUbicacion(id=p.id, nombre=p.nombre, latitud=p.latitud, longitud=p.longitud) for p in personas]


@router.get("/buscar/", response_model=List[Persona])
async def buscar_personas(
    clave_elector: str = None,
    seccion_electoral: str = None,
    colonia: str = None,
    id_lider_responsable: int = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    query = db.query(PersonaModel).filter(PersonaModel.activo == True)
    if current_user.rol in ["admin", "presidente"]:
        pass
    elif current_user.rol in ["lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "lider"]:
        ids = _get_subordinate_ids(current_user.id, db)
        query = query.filter(PersonaModel.id_lider_responsable.in_(ids))
    else:
        query = query.filter(PersonaModel.id_usuario_registro == current_user.id)

    if clave_elector:
        query = query.filter(PersonaModel.clave_elector == clave_elector)
    if seccion_electoral:
        query = query.filter(PersonaModel.seccion_electoral == seccion_electoral)
    if colonia:
        query = query.filter(PersonaModel.colonia == colonia)
    if id_lider_responsable:
        query = query.filter(PersonaModel.id_lider_responsable == id_lider_responsable)
    return query.all()


@router.get("/{persona_id}", response_model=Persona)
async def get_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    if current_user.rol != "admin" and not _is_in_hierarchy(persona, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta persona")
    return persona


@router.post("/", response_model=Persona)
async def create_persona(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in ["admin", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para registrar personas")

    if persona.clave_elector:
        exists = db.query(PersonaModel).filter(PersonaModel.clave_elector == persona.clave_elector).first()
        if exists:
            raise HTTPException(status_code=400, detail="Clave de elector ya registrada")

        padron_record = db.query(PadronElectoral).filter(
            and_(PadronElectoral.elector == persona.clave_elector, PadronElectoral.activo == True)
        ).first()

        if padron_record:
            if padron_record.id_lider_asignado:
                raise HTTPException(
                    status_code=400,
                    detail=f"Esta clave de elector ya esta asignada a {padron_record.lider_asignado.nombre if padron_record.lider_asignado else 'otro lider'}"
                )
            padron_record.id_lider_asignado = current_user.id
            padron_record.fecha_asignacion = datetime.now()
            padron_record.id_usuario_asignacion = current_user.id

            if not persona.nombre and padron_record.nombre:
                persona.nombre = padron_record.nombre
            if not persona.curp and padron_record.curp:
                persona.curp = padron_record.curp
            if not persona.seccion_electoral and padron_record.seccion:
                persona.seccion_electoral = padron_record.seccion
            if not persona.municipio and padron_record.municipio:
                persona.municipio = padron_record.municipio
            if not persona.estado and padron_record.entidad:
                persona.estado = padron_record.entidad
            if not persona.colonia and padron_record.colonia:
                persona.colonia = padron_record.colonia
            if not persona.codigo_postal and padron_record.codpostal:
                persona.codigo_postal = padron_record.codpostal
            if not persona.distrito and padron_record.distrito:
                persona.distrito = padron_record.distrito

    persona_data = persona.dict()
    persona_data['id_usuario_registro'] = current_user.id
    db_persona = PersonaModel(**persona_data)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona


@router.put("/{persona_id}", response_model=Persona)
async def update_persona(
    persona_id: int,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    if current_user.rol != "admin" and not _is_in_hierarchy(persona, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar esta persona")
    for field, value in persona_update.dict(exclude_unset=True).items():
        setattr(persona, field, value)
    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}", response_model=Persona)
async def deactivate_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    persona = db.query(PersonaModel).filter(PersonaModel.id == persona_id, PersonaModel.activo == True).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    if current_user.rol != "admin" and not _is_in_hierarchy(persona, current_user.id, db):
        raise HTTPException(status_code=403, detail="No tiene permisos para desactivar esta persona")
    persona.activo = False
    db.commit()
    db.refresh(persona)
    return persona


@router.post("/geocodificar", response_model=GeocodificarResponse)
async def geocodificar_direccion(request: GeocodificarRequest):
    """Geocodifica una direccion usando OpenStreetMap Nominatim o coordenadas por CP."""
    try:
        # Try OpenStreetMap Nominatim first
        try:
            direccion_completa = request.direccion
            if request.colonia:
                direccion_completa += f", {request.colonia}"
            if request.codigo_postal:
                direccion_completa += f", CP {request.codigo_postal}"
            if request.municipio:
                direccion_completa += f", {request.municipio}"
            if request.estado:
                direccion_completa += f", {request.estado}"
            direccion_completa += ", Mexico"

            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": direccion_completa, "format": "json", "limit": 1, "countrycodes": "mx"},
                headers={"User-Agent": "RedCiudadana/1.0"},
                timeout=10
            )
            data = response.json()
            if data:
                location = data[0]
                return GeocodificarResponse(
                    latitud=float(location["lat"]),
                    longitud=float(location["lon"]),
                    direccion_formateada=direccion_completa
                )
        except Exception as e:
            logger.error(f"Error con OpenStreetMap API: {e}")

        # Fallback: coordinates by postal code
        coordenadas_por_cp = {
            "85280": {"lat": 26.907442257864734, "lon": -109.62408211899701, "municipio": "Etchojoa"},
            "83000": {"lat": 29.0729, "lon": -110.9559, "municipio": "Hermosillo"},
            "85000": {"lat": 27.4864, "lon": -109.9408, "municipio": "Ciudad Obregon"},
            "06000": {"lat": 19.4326, "lon": -99.1332, "municipio": "Ciudad de Mexico"},
            "44100": {"lat": 20.6597, "lon": -103.3496, "municipio": "Guadalajara"},
            "64000": {"lat": 25.6866, "lon": -100.3161, "municipio": "Monterrey"},
            "22000": {"lat": 32.5149, "lon": -117.0382, "municipio": "Tijuana"},
            "91700": {"lat": 19.1738, "lon": -96.1342, "municipio": "Veracruz"},
            "72000": {"lat": 19.0413, "lon": -98.2062, "municipio": "Puebla"},
            "37000": {"lat": 21.1253, "lon": -101.6866, "municipio": "Leon"},
            "31000": {"lat": 28.6353, "lon": -106.0889, "municipio": "Chihuahua"},
            "85400": {"lat": 27.9194, "lon": -110.8978, "municipio": "Guaymas"},
            "84000": {"lat": 31.3189, "lon": -110.9458, "municipio": "Nogales"},
        }
        coordenadas_por_municipio = {
            "ETCHOJOA": {"lat": 27.0167, "lon": -109.6333},
            "HERMOSILLO": {"lat": 29.0729, "lon": -110.9559},
            "NOGALES": {"lat": 31.3189, "lon": -110.9458},
            "CIUDAD OBREGON": {"lat": 27.4864, "lon": -109.9408},
            "GUAYMAS": {"lat": 27.9194, "lon": -110.8978},
            "CIUDAD DE MEXICO": {"lat": 19.4326, "lon": -99.1332},
            "GUADALAJARA": {"lat": 20.6597, "lon": -103.3496},
            "MONTERREY": {"lat": 25.6866, "lon": -100.3161},
            "TIJUANA": {"lat": 32.5149, "lon": -117.0382},
            "VERACRUZ": {"lat": 19.1738, "lon": -96.1342},
            "PUEBLA": {"lat": 19.0413, "lon": -98.2062},
            "LEON": {"lat": 21.1253, "lon": -101.6866},
            "CHIHUAHUA": {"lat": 28.6353, "lon": -106.0889},
        }

        direccion_formateada = request.direccion
        if request.colonia:
            direccion_formateada += f", {request.colonia}"
        if request.municipio:
            direccion_formateada += f", {request.municipio}"
        if request.estado:
            direccion_formateada += f", {request.estado}"
        direccion_formateada += ", Mexico"

        coords = None
        if request.codigo_postal and request.codigo_postal in coordenadas_por_cp:
            coords = coordenadas_por_cp[request.codigo_postal]
        elif request.municipio and request.municipio.upper() in coordenadas_por_municipio:
            coords = coordenadas_por_municipio[request.municipio.upper()]

        if not coords:
            coords = {"lat": 19.4326, "lon": -99.1332}  # Default: CDMX

        return GeocodificarResponse(
            latitud=coords["lat"],
            longitud=coords["lon"],
            direccion_formateada=direccion_formateada
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al geocodificar: {str(e)}")
