from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
import pandas as pd
import io
import dbf
from datetime import datetime

from .database import get_db
from .models_padron import PadronElectoral
from .schemas_padron import (
    PadronElectoral as PadronElectoralSchema,
    PadronSearchRequest,
    PadronSearchResponse,
    AsignacionPadronRequest,
    AsignacionPadronResponse,
    EstadisticasPadron
)
from .auth import get_current_active_user, require_admin
from .models import Usuario

router = APIRouter()

@router.post("/padron/importar-dbf", response_model=dict)
async def importar_padron_dbf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Importar archivo DBF del padrón electoral"""
    try:
        if not file.filename.endswith('.dbf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser un DBF"
            )
        
        # Leer archivo DBF en chunks para archivos grandes
        content = await file.read()
        
        # Procesar DBF
        with io.BytesIO(content) as f:
            table = dbf.Table(f)
            
            registros_importados = 0
            registros_duplicados = 0
            errores = []
            batch_size = 500  # Reducir tamaño de lote para archivos grandes
            
            print(f"🚀 Iniciando importación de {len(table)} registros...")
            
            for i, record in enumerate(table):
                try:
                    # Verificar si ya existe
                    existing = db.query(PadronElectoral).filter(
                        PadronElectoral.elector == record.ELECTOR
                    ).first()
                    
                    if existing:
                        registros_duplicados += 1
                        continue
                    
                    # Crear nuevo registro
                    padron_record = PadronElectoral(
                        consecutivo=record.CONSECUTIV,
                        elector=record.ELECTOR,
                        fol_nac=record.FOL_NAC,
                        ocr=record.OCR,
                        ape_pat=record.APE_PAT,
                        ape_mat=record.APE_MAT,
                        nombre=record.NOMBRE,
                        fnac=record.FNAC,
                        edad=record.EDAD,
                        sexo=record.SEXO,
                        curp=record.CURP,
                        ocupacion=record.OCUPACION,
                        calle=record.CALLE,
                        num_ext=record.NUM_EXT,
                        num_int=record.NUM_INT,
                        colonia=record.COLONIA,
                        codpostal=record.CODPOSTAL,
                        tiempres=record.TIEMPRES,
                        entidad=record.ENTIDAD,
                        distrito=record.DISTRITO,
                        municipio=record.MUNICIPIO,
                        seccion=record.SECCION,
                        localidad=record.LOCALIDAD,
                        manzana=record.MANZANA,
                        en_ln=record.EN_LN,
                        misioncr=record.MISIONCR
                    )
                    
                    db.add(padron_record)
                    registros_importados += 1
                    
                    # Commit cada batch_size registros para evitar memory issues
                    if registros_importados % batch_size == 0:
                        db.commit()
                        print(f"📊 Procesados {registros_importados} registros...")
                        
                except Exception as e:
                    errores.append(f"Error en registro {record.CONSECUTIV}: {str(e)}")
                    continue
            
            # Commit final
            db.commit()
            print(f"✅ Importación completada: {registros_importados} registros")
            
            return {
                "success": True,
                "mensaje": "Importación completada",
                "registros_importados": registros_importados,
                "registros_duplicados": registros_duplicados,
                "errores": len(errores),
                "fecha_importacion": datetime.now().isoformat()
            }
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error importando padrón: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importando padrón: {str(e)}"
        )

@router.post("/padron/buscar", response_model=PadronSearchResponse)
async def buscar_padron(
    request: PadronSearchRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Buscar en el padrón electoral"""
    try:
        query = db.query(PadronElectoral).filter(PadronElectoral.activo == True)
        
        # Aplicar filtros
        if request.elector:
            query = query.filter(PadronElectoral.elector.ilike(f"%{request.elector}%"))
        
        if request.curp:
            query = query.filter(PadronElectoral.curp.ilike(f"%{request.curp}%"))
        
        if request.nombre:
            query = query.filter(PadronElectoral.nombre.ilike(f"%{request.nombre}%"))
        
        if request.ape_pat:
            query = query.filter(PadronElectoral.ape_pat.ilike(f"%{request.ape_pat}%"))
        
        if request.ape_mat:
            query = query.filter(PadronElectoral.ape_mat.ilike(f"%{request.ape_mat}%"))
        
        if request.seccion:
            query = query.filter(PadronElectoral.seccion == request.seccion)
        
        if request.municipio:
            query = query.filter(PadronElectoral.municipio.ilike(f"%{request.municipio}%"))
        
        if request.distrito:
            query = query.filter(PadronElectoral.distrito == request.distrito)
        
        # Contar total
        total = query.count()
        
        # Aplicar paginación
        registros = query.offset(request.offset).limit(request.limit).all()
        
        total_paginas = (total + request.limit - 1) // request.limit
        pagina_actual = (request.offset // request.limit) + 1
        
        return PadronSearchResponse(
            registros=registros,
            total=total,
            pagina_actual=pagina_actual,
            total_paginas=total_paginas
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error buscando en padrón: {str(e)}"
        )

@router.get("/padron/verificar-elector/{elector}")
async def verificar_elector(
    elector: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Verificar si una clave de elector existe en el padrón"""
    try:
        registro = db.query(PadronElectoral).filter(
            and_(
                PadronElectoral.elector == elector,
                PadronElectoral.activo == True
            )
        ).first()
        
        if not registro:
            return {
                "existe": False,
                "mensaje": "Clave de elector no encontrada en el padrón"
            }
        
        if registro.id_lider_asignado:
            return {
                "existe": True,
                "ya_asignado": True,
                "lider_asignado": registro.lider_asignado.nombre if registro.lider_asignado else "Desconocido",
                "fecha_asignacion": registro.fecha_asignacion,
                "mensaje": f"Ya está asignado a {registro.lider_asignado.nombre if registro.lider_asignado else 'otro líder'}"
            }
        
        return {
            "existe": True,
            "ya_asignado": False,
            "registro": registro,
            "mensaje": "Clave de elector disponible para asignación"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verificando elector: {str(e)}"
        )

@router.post("/padron/asignar", response_model=AsignacionPadronResponse)
async def asignar_padron(
    request: AsignacionPadronRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Asignar un registro del padrón a un líder"""
    try:
        # Verificar que el registro existe
        registro = db.query(PadronElectoral).filter(
            and_(
                PadronElectoral.id == request.id_padron,
                PadronElectoral.activo == True
            )
        ).first()
        
        if not registro:
            return AsignacionPadronResponse(
                success=False,
                message="Registro no encontrado en el padrón"
            )
        
        # Verificar que no esté ya asignado
        if registro.id_lider_asignado:
            return AsignacionPadronResponse(
                success=False,
                message=f"Ya está asignado a {registro.lider_asignado.nombre if registro.lider_asignado else 'otro líder'}"
            )
        
        # Verificar que el líder existe
        lider = db.query(Usuario).filter(Usuario.id == request.id_lider).first()
        if not lider:
            return AsignacionPadronResponse(
                success=False,
                message="Líder no encontrado"
            )
        
        # Asignar
        registro.id_lider_asignado = request.id_lider
        registro.fecha_asignacion = datetime.now()
        registro.id_usuario_asignacion = current_user.id
        
        db.commit()
        
        return AsignacionPadronResponse(
            success=True,
            message=f"Registro asignado exitosamente a {lider.nombre}",
            registro=registro
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error asignando padrón: {str(e)}"
        )

@router.get("/padron/estadisticas", response_model=EstadisticasPadron)
async def obtener_estadisticas_padron(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener estadísticas del padrón electoral"""
    try:
        # Estadísticas generales
        total_registros = db.query(PadronElectoral).filter(PadronElectoral.activo == True).count()
        registros_asignados = db.query(PadronElectoral).filter(
            and_(
                PadronElectoral.activo == True,
                PadronElectoral.id_lider_asignado.isnot(None)
            )
        ).count()
        registros_disponibles = total_registros - registros_asignados
        
        # Estadísticas por líder
        asignaciones_por_lider = db.query(
            Usuario.nombre,
            func.count(PadronElectoral.id).label('total_asignaciones')
        ).join(
            PadronElectoral, Usuario.id == PadronElectoral.id_lider_asignado
        ).filter(
            PadronElectoral.activo == True
        ).group_by(Usuario.id, Usuario.nombre).all()
        
        total_lideres = len(asignaciones_por_lider)
        
        return EstadisticasPadron(
            total_registros=total_registros,
            registros_asignados=registros_asignados,
            registros_disponibles=registros_disponibles,
            total_lideres=total_lideres,
            asignaciones_por_lider=[
                {
                    "lider": lider.nombre,
                    "asignaciones": lider.total_asignaciones
                }
                for lider in asignaciones_por_lider
            ]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas: {str(e)}"
        )

@router.delete("/padron/limpiar")
async def limpiar_padron(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Limpiar todos los registros del padrón (solo admin)"""
    try:
        # Eliminar todos los registros
        db.query(PadronElectoral).delete()
        db.commit()
        
        return {
            "success": True,
            "mensaje": "Padrón electoral limpiado exitosamente"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando padrón: {str(e)}"
        )
