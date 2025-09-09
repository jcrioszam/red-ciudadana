from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
import pandas as pd
import io
import dbf
from datetime import datetime
import asyncio
import threading

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
                "filename": file.filename,
                "tipos_permitidos": [".dbf"]
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
                field_types = {field.name: str(field.type) for field in table.field_names}
                print(f"📋 Campos disponibles: {field_names}")
                
                # Leer algunos registros de muestra para verificar estructura
                sample_records = []
                if len(table) > 0:
                    # Leer hasta 3 registros de muestra
                    for i in range(min(3, len(table))):
                        try:
                            record = table[i]
                            sample_records.append(dict(record))
                        except Exception as e:
                            print(f"⚠️ Error leyendo registro {i}: {e}")
                            break
                
                # Verificar campos requeridos para el padrón
                required_fields = ['ELECTOR', 'CURP', 'NOMBRE', 'APE_PAT', 'APE_MAT', 'SECCION']
                missing_fields = [field for field in required_fields if field not in field_names]
                
                return {
                    "success": True,
                    "total_records": len(table),
                    "field_names": field_names,
                    "field_types": field_types,
                    "sample_records": sample_records,
                    "file_size": len(content),
                    "validation": {
                        "has_required_fields": len(missing_fields) == 0,
                        "missing_fields": missing_fields,
                        "required_fields": required_fields
                    },
                    "ready_for_import": len(missing_fields) == 0 and len(table) > 0
                }
                
        except Exception as dbf_error:
            print(f"❌ Error procesando DBF: {str(dbf_error)}")
            return {
                "success": False,
                "error": f"Error procesando archivo DBF: {str(dbf_error)}",
                "error_type": type(dbf_error).__name__,
                "suggestions": [
                    "Verificar que el archivo no esté corrupto",
                    "Asegurar que sea un archivo DBF válido",
                    "Verificar que el archivo no esté vacío"
                ]
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

@router.get("/padron/template")
async def descargar_template_padron():
    """Descargar template de ejemplo para el padrón electoral"""
    try:
        # Crear un archivo DBF de ejemplo con la estructura correcta
        import tempfile
        import os
        
        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(suffix='.dbf', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Crear tabla DBF de ejemplo
        table = dbf.Table(temp_path, 
            'CONSECUTIV N(10,0); ELECTOR C(18); FOL_NAC C(8); OCR C(8); '
            'APE_PAT C(50); APE_MAT C(50); NOMBRE C(50); FNAC C(8); '
            'EDAD N(3,0); SEXO C(1); CURP C(18); OCUPACION C(50); '
            'CALLE C(100); NUM_EXT C(10); NUM_INT C(10); COLONIA C(50); '
            'CODPOSTAL C(5); TIEMPRES C(50); ENTIDAD C(50); DISTRITO N(3,0); '
            'MUNICIPIO C(50); SECCION N(4,0); LOCALIDAD C(50); MANZANA C(10); '
            'EN_LN C(1); MISIONCR C(50)'
        )
        
        # Agregar registro de ejemplo
        table.open(dbf.READ_WRITE)
        table.append((
            1, 'ABC123456789012345', '12345678', '87654321',
            'GARCIA', 'LOPEZ', 'JUAN CARLOS', '19900101',
            34, 'H', 'GALJ900101HSPRPN01', 'EMPLEADO',
            'AV PRINCIPAL', '123', 'A', 'CENTRO',
            '85000', 'NAVOJOA', 'SONORA', 1,
            'NAVOJOA', 1234, 'NAVOJOA', '001',
            'N', 'MISION'
        ))
        table.close()
        
        # Leer el archivo y devolverlo
        with open(temp_path, 'rb') as f:
            content = f.read()
        
        # Limpiar archivo temporal
        os.unlink(temp_path)
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type='application/octet-stream',
            headers={
                'Content-Disposition': 'attachment; filename="template_padron_electoral.dbf"'
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando template: {str(e)}"
        )

@router.get("/padron/import-status")
async def obtener_estado_importacion():
    """Obtener el estado actual de la importación del padrón"""
    # En una implementación real, esto podría usar Redis o una base de datos
    # para almacenar el estado de importaciones en progreso
    return {
        "importando": False,
        "progreso": 0,
        "total_registros": 0,
        "registros_procesados": 0,
        "errores": 0,
        "mensaje": "No hay importación en progreso"
    }

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
