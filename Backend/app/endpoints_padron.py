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

@router.post("/padron/test-dbf", response_model=dict)
async def test_dbf_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Endpoint de prueba para diagnosticar problemas con archivos DBF"""
    try:
        print(f"📁 Archivo recibido: {file.filename}, tamaño: {file.size} bytes")
        
        if not file.filename or not file.filename.lower().endswith('.dbf'):
            return {
                "success": False,
                "error": "El archivo debe ser un DBF",
                "filename": file.filename
            }
        
        # Leer archivo DBF
        content = await file.read()
        print(f"📖 Archivo leído: {len(content)} bytes")
        
        if len(content) == 0:
            return {
                "success": False,
                "error": "El archivo está vacío"
            }
        
        # Procesar DBF con manejo de errores mejorado
        try:
            with io.BytesIO(content) as f:
                table = dbf.Table(f)
                print(f"🗂️ Tabla DBF abierta: {len(table)} registros")
                
                # Obtener información de la estructura
                field_names = [field.name for field in table.field_names]
                print(f"📋 Campos disponibles: {field_names}")
                
                # Leer solo el primer registro para verificar estructura
                first_record = None
                if len(table) > 0:
                    first_record = table[0]
                    print(f"📄 Primer registro: {dict(first_record)}")
                
                return {
                    "success": True,
                    "total_records": len(table),
                    "field_names": field_names,
                    "first_record": dict(first_record) if first_record else None,
                    "file_size": len(content)
                }
                
        except Exception as dbf_error:
            print(f"❌ Error procesando DBF: {str(dbf_error)}")
            return {
                "success": False,
                "error": f"Error procesando archivo DBF: {str(dbf_error)}",
                "error_type": type(dbf_error).__name__
            }
            
    except Exception as e:
        print(f"❌ Error general: {str(e)}")
        return {
            "success": False,
            "error": f"Error general: {str(e)}",
            "error_type": type(e).__name__
        }

@router.post("/padron/importar-dbf", response_model=dict)
async def importar_padron_dbf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Importar archivo DBF del padrón electoral"""
    try:
        print(f"📁 Archivo recibido: {file.filename}, tamaño: {file.size} bytes")
        
        if not file.filename or not file.filename.lower().endswith('.dbf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser un DBF"
            )
        
        # Leer archivo DBF
        content = await file.read()
        print(f"📖 Archivo leído: {len(content)} bytes")
        
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo está vacío"
            )
        
        # Procesar DBF con manejo de errores mejorado
        try:
            with io.BytesIO(content) as f:
                table = dbf.Table(f)
                print(f"🗂️ Tabla DBF abierta: {len(table)} registros")
                
                registros_importados = 0
                registros_duplicados = 0
                errores = []
                batch_size = 100  # Reducir aún más el batch size
                
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
                        
                        # Crear nuevo registro con validación de campos
                        padron_record = PadronElectoral(
                            consecutivo=getattr(record, 'CONSECUTIV', None),
                            elector=getattr(record, 'ELECTOR', ''),
                            fol_nac=getattr(record, 'FOL_NAC', None),
                            ocr=getattr(record, 'OCR', None),
                            ape_pat=getattr(record, 'APE_PAT', None),
                            ape_mat=getattr(record, 'APE_MAT', None),
                            nombre=getattr(record, 'NOMBRE', None),
                            fnac=str(getattr(record, 'FNAC', '')) if getattr(record, 'FNAC', None) else None,
                            edad=getattr(record, 'EDAD', None),
                            sexo=getattr(record, 'SEXO', None),
                            curp=getattr(record, 'CURP', None),
                            ocupacion=getattr(record, 'OCUPACION', None),
                            calle=getattr(record, 'CALLE', None),
                            num_ext=getattr(record, 'NUM_EXT', None),
                            num_int=getattr(record, 'NUM_INT', None),
                            colonia=getattr(record, 'COLONIA', None),
                            codpostal=getattr(record, 'CODPOSTAL', None),
                            tiempres=getattr(record, 'TIEMPRES', None),
                            entidad=getattr(record, 'ENTIDAD', None),
                            distrito=getattr(record, 'DISTRITO', None),
                            municipio=getattr(record, 'MUNICIPIO', None),
                            seccion=getattr(record, 'SECCION', None),
                            localidad=getattr(record, 'LOCALIDAD', None),
                            manzana=getattr(record, 'MANZANA', None),
                            en_ln=getattr(record, 'EN_LN', None),
                            misioncr=getattr(record, 'MISIONCR', None)
                        )
                        
                        db.add(padron_record)
                        registros_importados += 1
                        
                        # Commit cada batch_size registros para evitar memory issues
                        if registros_importados % batch_size == 0:
                            db.commit()
                            print(f"📊 Procesados {registros_importados} registros...")
                            
                    except Exception as e:
                        errores.append(f"Error en registro {i+1}: {str(e)}")
                        print(f"⚠️ Error en registro {i+1}: {str(e)}")
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
                
        except Exception as dbf_error:
            print(f"❌ Error procesando DBF: {str(dbf_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error procesando archivo DBF: {str(dbf_error)}"
            )
            
    except HTTPException:
        raise
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
