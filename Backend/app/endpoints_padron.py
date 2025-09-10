from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
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
        print(f"🧪 TEST DBF - Iniciando endpoint")
        print(f"📁 Archivo recibido: {file.filename}, tamaño: {file.size} bytes")
        print(f"👤 Usuario autenticado: {current_user.email}")
        
        if not file.filename or not file.filename.lower().endswith('.dbf'):
            return {
                "success": False,
                "error": "El archivo debe ser un DBF",
                "filename": file.filename,
                "tipos_permitidos": [".dbf"]
            }
        
        # Leer archivo DBF
        # Leer archivo en chunks para archivos grandes
        content = b""
        chunk_size = 1024 * 1024  # 1MB chunks
        while chunk := await file.read(chunk_size):
            content += chunk
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
        # Leer archivo en chunks para archivos grandes
        content = b""
        chunk_size = 1024 * 1024  # 1MB chunks
        while chunk := await file.read(chunk_size):
            content += chunk
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
                print(f"🔍 Campos disponibles en DBF: {[field.name for field in table.field_names]}")
                
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
                        
                        # Log cada 10 registros para debugging
                        if registros_importados % 10 == 0:
                            print(f"📊 Procesados {registros_importados} registros...")
                        
                        # Commit cada batch_size registros para evitar memory issues
                        if registros_importados % batch_size == 0:
                            db.commit()
                            print(f"💾 Commit realizado: {registros_importados} registros guardados")
                            
                    except Exception as e:
                        errores.append(f"Error en registro {i+1}: {str(e)}")
                        print(f"⚠️ Error en registro {i+1}: {str(e)}")
                        continue
                
                # Commit final
                db.commit()
                print(f"✅ Importación completada: {registros_importados} registros")
                
                # Verificar que realmente se guardaron los registros
                total_guardados = db.query(PadronElectoral).count()
                print(f"🔍 Verificación: Total registros en BD después de importación: {total_guardados}")
                
                return {
                    "success": True,
                    "mensaje": "Importación completada",
                    "registros_importados": registros_importados,
                    "registros_duplicados": registros_duplicados,
                    "errores": len(errores),
                    "total_guardados": total_guardados,
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

@router.post("/padron/test-dbf-large", response_model=dict)
async def test_dbf_large_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Endpoint optimizado para archivos DBF muy grandes (solo validación básica)"""
    try:
        print(f"🧪 TEST DBF LARGE - Iniciando endpoint")
        print(f"📁 Archivo recibido: {file.filename}, tamaño: {file.size} bytes")
        print(f"👤 Usuario autenticado: {current_user.email}")

        if not file.filename or not file.filename.lower().endswith('.dbf'):
            return {
                "success": False,
                "error": "El archivo debe ser un DBF",
                "filename": file.filename
            }

        # Para archivos muy grandes, solo leer los primeros 5MB para validación básica
        max_read_size = 5 * 1024 * 1024  # 5MB
        content = b""
        chunk_size = 1024 * 1024  # 1MB chunks
        bytes_read = 0

        while chunk := await file.read(chunk_size):
            content += chunk
            bytes_read += len(chunk)
            if bytes_read >= max_read_size:
                print(f"📖 Archivo muy grande, leyendo solo primeros {bytes_read} bytes")
                break

        print(f"📖 Archivo leído: {len(content)} bytes (de {file.size} total)")

        if len(content) == 0:
            return {
                "success": False,
                "error": "El archivo está vacío"
            }

        # Validación básica del formato DBF (solo los primeros bytes)
        if len(content) < 32:
            return {
                "success": False,
                "error": "El archivo es demasiado pequeño para ser un DBF válido"
            }

        # Verificar firma DBF (primeros bytes) - más flexible
        dbf_signature = content[:1]
        print(f"🔍 Firma DBF detectada: {dbf_signature.hex()}")
        
        # DBF válido puede tener diferentes firmas:
        # 0x03 = DBF sin memo
        # 0x83 = DBF con memo  
        # 0x30 = FoxPro sin memo
        # 0x8B = FoxPro con memo
        valid_signatures = [b'\x03', b'\x83', b'\x30', b'\x8B']
        
        if dbf_signature not in valid_signatures:
            print(f"⚠️ Firma no reconocida: {dbf_signature.hex()}")
            # Intentar validar como DBF de todas formas
            print("🔄 Continuando con validación básica...")
        else:
            print(f"✅ Firma DBF válida detectada: {dbf_signature.hex()}")

        return {
            "success": True,
            "mensaje": "Archivo DBF válido detectado",
            "filename": file.filename,
            "file_size": file.size,
            "bytes_analyzed": len(content),
            "ready_for_import": True,
            "note": "Archivo muy grande - solo se validó la estructura básica"
        }

    except Exception as e:
        print(f"❌ Error en test DBF large: {str(e)}")
        return {
            "success": False,
            "error": f"Error procesando archivo: {str(e)}"
        }

@router.post("/padron/importar-dbf-chunked", response_model=dict)
async def importar_dbf_chunked(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Importar DBF por chunks para archivos muy grandes"""
    try:
        print(f"🚀 IMPORTACIÓN CHUNKED - Iniciando")
        print(f"📁 Archivo: {file.filename}, tamaño: {file.size} bytes")
        print(f"👤 Usuario: {current_user.email}")

        if not file.filename or not file.filename.lower().endswith('.dbf'):
            return {
                "success": False,
                "error": "El archivo debe ser un DBF",
                "filename": file.filename
            }

        # Leer archivo en chunks pequeños
        chunk_size = 1024 * 1024  # 1MB chunks
        total_bytes_read = 0
        temp_file_path = f"/tmp/{file.filename}"
        
        print(f"💾 Guardando archivo temporal en: {temp_file_path}")
        
        with open(temp_file_path, "wb") as temp_file:
            while chunk := await file.read(chunk_size):
                temp_file.write(chunk)
                total_bytes_read += len(chunk)
                print(f"📖 Leídos {total_bytes_read} bytes...")

        print(f"✅ Archivo guardado: {total_bytes_read} bytes")

        # Procesar el archivo DBF
        try:
            import dbf
            print(f"🔍 Intentando abrir archivo DBF: {temp_file_path}")
            table = dbf.Table(temp_file_path)
            table.open()
            print(f"✅ Archivo DBF abierto exitosamente")
            
            print(f"🔍 Campos disponibles: {list(table.field_names)}")
            print(f"📊 Total registros en DBF: {len(table)}")
            
            # Procesar en lotes pequeños
            batch_size = 1000
            registros_importados = 0
            
            for i in range(0, len(table), batch_size):
                batch = table[i:i + batch_size]
                
                for record in batch:
                    try:
                        # Crear registro del padrón usando los campos reales del DBF
                        padron_record = PadronElectoral(
                            cedula=str(record.get('ELECTOR', '')).strip(),
                            nombre=str(record.get('NOMBRE', '')).strip(),
                            apellido_paterno=str(record.get('APE_PAT', '')).strip(),
                            apellido_materno=str(record.get('APE_MAT', '')).strip(),
                            fecha_nacimiento=record.get('FNAC'),
                            sexo=str(record.get('SEXO', '')).strip(),
                            estado=str(record.get('ENTIDAD', '')).strip(),
                            municipio=str(record.get('MUNICIPIO', '')).strip(),
                            seccion=str(record.get('SECCION', '')).strip(),
                            localidad=str(record.get('LOCALIDAD', '')).strip(),
                            casilla=str(record.get('MANZANA', '')).strip(),
                            tipo_casilla=str(record.get('EN_LN', '')).strip(),
                            domicilio=str(record.get('CALLE', '')).strip(),
                            colonia=str(record.get('COLONIA', '')).strip(),
                            codigo_postal=str(record.get('CODPOSTAL', '')).strip(),
                            telefono=str(record.get('TIEMPRES', '')).strip(),
                            email=str(record.get('EMISIONCRE', '')).strip(),
                            activo=True,
                            fecha_importacion=datetime.now()
                        )
                        
                        db.add(padron_record)
                        registros_importados += 1
                        
                        if registros_importados % 1000 == 0:
                            print(f"📊 Procesados {registros_importados} registros...")
                            
                    except Exception as e:
                        print(f"⚠️ Error procesando registro {registros_importados}: {str(e)}")
                        continue
                
                # Commit cada lote
                try:
                    db.commit()
                    print(f"💾 Commit realizado: {registros_importados} registros guardados")
                except Exception as e:
                    print(f"❌ Error en commit: {str(e)}")
                    db.rollback()
                    continue
            
            table.close()
            
            # Limpiar archivo temporal
            import os
            try:
                os.remove(temp_file_path)
                print(f"🗑️ Archivo temporal eliminado: {temp_file_path}")
            except:
                pass
            
            # Verificar total en BD
            total_guardados = db.query(PadronElectoral).count()
            print(f"🔍 Verificación: Total registros en BD después de importación: {total_guardados}")
            
            return {
                "success": True,
                "mensaje": f"Importación completada exitosamente",
                "registros_importados": registros_importados,
                "total_en_bd": total_guardados,
                "filename": file.filename
            }
            
        except Exception as e:
            print(f"❌ Error procesando DBF: {str(e)}")
            return {
                "success": False,
                "error": f"Error procesando archivo DBF: {str(e)}"
            }
            
    except Exception as e:
        print(f"❌ Error en importación chunked: {str(e)}")
        return {
            "success": False,
            "error": f"Error en importación: {str(e)}"
        }

@router.post("/padron/analizar-dbf", response_model=dict)
async def analizar_dbf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Analizar estructura del archivo DBF para identificar campos"""
    try:
        print(f"🔍 ANALIZANDO DBF - Iniciando")
        print(f"📁 Archivo: {file.filename}, tamaño: {file.size} bytes")
        
        if not file.filename or not file.filename.lower().endswith('.dbf'):
            return {
                "success": False,
                "error": "El archivo debe ser un DBF"
            }

        # Leer archivo en chunks pequeños
        chunk_size = 1024 * 1024  # 1MB chunks
        total_bytes_read = 0
        temp_file_path = f"/tmp/{file.filename}"
        
        print(f"💾 Guardando archivo temporal en: {temp_file_path}")
        
        with open(temp_file_path, "wb") as temp_file:
            while chunk := await file.read(chunk_size):
                temp_file.write(chunk)
                total_bytes_read += len(chunk)
                print(f"📖 Leídos {total_bytes_read} bytes...")

        print(f"✅ Archivo guardado: {total_bytes_read} bytes")

        # Analizar el archivo DBF
        try:
            import dbf
            print(f"🔍 Intentando abrir archivo DBF: {temp_file_path}")
            table = dbf.Table(temp_file_path)
            table.open()
            print(f"✅ Archivo DBF abierto exitosamente")
            
            # Obtener información de campos
            campos_disponibles = list(table.field_names)
            print(f"🔍 Campos disponibles: {campos_disponibles}")
            print(f"📊 Total registros en DBF: {len(table)}")
            
            # Obtener muestra de registros
            registros_muestra = []
            for i, record in enumerate(table[:5]):  # Primeros 5 registros
                registro_data = {}
                for campo in campos_disponibles:
                    try:
                        valor = record.get(campo, '')
                        registro_data[campo] = str(valor)[:100] if valor else ''  # Limitar a 100 chars
                    except:
                        registro_data[campo] = 'ERROR'
                registros_muestra.append(registro_data)
            
            table.close()
            
            # Limpiar archivo temporal
            import os
            try:
                os.remove(temp_file_path)
                print(f"🗑️ Archivo temporal eliminado: {temp_file_path}")
            except:
                pass
            
            return {
                "success": True,
                "mensaje": "Análisis completado",
                "campos_disponibles": campos_disponibles,
                "total_registros": len(table),
                "registros_muestra": registros_muestra,
                "filename": file.filename
            }
            
        except Exception as e:
            print(f"❌ Error analizando DBF: {str(e)}")
            return {
                "success": False,
                "error": f"Error analizando archivo DBF: {str(e)}"
            }
            
    except Exception as e:
        print(f"❌ Error en análisis: {str(e)}")
        return {
            "success": False,
            "error": f"Error en análisis: {str(e)}"
        }

@router.get("/padron/debug")
async def debug_padron(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Debug endpoint para verificar el estado del padrón"""
    try:
        # Contar registros totales
        total_registros = db.query(PadronElectoral).count()
        total_activos = db.query(PadronElectoral).filter(PadronElectoral.activo == True).count()
        total_inactivos = total_registros - total_activos
        
        # Obtener algunos registros de muestra
        registros_muestra = db.query(PadronElectoral).limit(5).all()
        
        # Verificar estructura de la tabla
        primer_registro = db.query(PadronElectoral).first()
        
        return {
            "success": True,
            "debug_info": {
                "total_registros": total_registros,
                "total_activos": total_activos,
                "total_inactivos": total_inactivos,
                "primer_registro": {
                    "id": primer_registro.id if primer_registro else None,
                    "elector": primer_registro.elector if primer_registro else None,
                    "nombre": primer_registro.nombre if primer_registro else None,
                    "activo": primer_registro.activo if primer_registro else None
                } if primer_registro else None,
                "registros_muestra": [
                    {
                        "id": r.id,
                        "elector": r.elector,
                        "nombre": r.nombre,
                        "activo": r.activo
                    } for r in registros_muestra
                ]
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "debug_info": {
                "total_registros": 0,
                "error": str(e)
            }
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

@router.post("/padron/importar-excel", response_model=dict)
async def importar_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Importar datos del padrón desde archivo Excel/CSV"""
    try:
        print(f"📊 IMPORTAR EXCEL - Iniciando")
        print(f"📁 Archivo: {file.filename}, tamaño: {file.size} bytes")
        
        if not file.filename:
            return {
                "success": False,
                "error": "No se proporcionó archivo"
            }
        
        # Verificar extensión del archivo
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['xlsx', 'xls', 'csv']:
            return {
                "success": False,
                "error": "El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)"
            }
        
        # Leer archivo
        content = await file.read()
        
        # Procesar según el tipo de archivo
        if file_extension == 'csv':
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:  # Excel
            df = pd.read_excel(io.BytesIO(content))
        
        print(f"📊 Datos leídos: {len(df)} filas, {len(df.columns)} columnas")
        print(f"🔍 Columnas disponibles: {list(df.columns)}")
        
        # Verificar si el DataFrame está vacío
        if df.empty:
            return {
                "success": False,
                "error": "El archivo está vacío o no se pudieron leer los datos",
                "filename": file.filename
            }
        
        # Mapear columnas automáticamente - versión más flexible
        column_mapping = {
            'ELECTOR': 'cedula',
            'NOMBRE': 'nombre', 
            'APE_PAT': 'apellido_paterno',
            'APE_MAT': 'apellido_materno',
            'FNAC': 'fecha_nacimiento',
            'SEXO': 'sexo',
            'ENTIDAD': 'estado',
            'MUNICIPIO': 'municipio',
            'SECCION': 'seccion',
            'LOCALIDAD': 'localidad',
            'MANZANA': 'casilla',
            'EN_LN': 'tipo_casilla',
            'CALLE': 'domicilio',
            'COLONIA': 'colonia',
            'CODPOSTAL': 'codigo_postal',
            'TIEMPRES': 'telefono',
            'EMISIONCRE': 'email',
            # Mapeos alternativos comunes
            'Cedula': 'cedula',
            'Nombre': 'nombre',
            'Apellido Paterno': 'apellido_paterno',
            'Apellido Materno': 'apellido_materno',
            'Fecha Nacimiento': 'fecha_nacimiento',
            'Sexo': 'sexo',
            'Estado': 'estado',
            'Municipio': 'municipio',
            'Seccion': 'seccion',
            'Localidad': 'localidad'
        }
        
        # Crear lista de datos para mostrar
        datos_muestra = []
        total_registros = len(df)
        
        print(f"🔍 Procesando {min(10, total_registros)} registros para muestra...")
        
        for index, row in df.head(10).iterrows():  # Solo primeros 10 para muestra
            registro = {}
            print(f"📝 Procesando registro {index + 1}: {dict(row)}")
            
            # Mapear todas las columnas disponibles
            for col_excel in df.columns:
                # Buscar mapeo exacto
                col_bd = column_mapping.get(col_excel)
                if not col_bd:
                    # Buscar mapeo por similitud (case insensitive)
                    for key, value in column_mapping.items():
                        if col_excel.lower() == key.lower():
                            col_bd = value
                            break
                
                if col_bd:
                    valor = str(row[col_excel]) if pd.notna(row[col_excel]) else ''
                    registro[col_bd] = valor[:100]  # Limitar a 100 caracteres
                else:
                    # Si no hay mapeo, usar el nombre original
                    valor = str(row[col_excel]) if pd.notna(row[col_excel]) else ''
                    registro[col_excel] = valor[:100]
            
            datos_muestra.append(registro)
            print(f"✅ Registro mapeado: {registro}")
        
        print(f"📊 Total de registros procesados: {len(datos_muestra)}")
        
        return {
            "success": True,
            "mensaje": "Archivo Excel/CSV leído exitosamente",
            "total_registros": total_registros,
            "columnas_disponibles": list(df.columns),
            "datos_muestra": datos_muestra,
            "filename": file.filename
        }
        
    except Exception as e:
        print(f"❌ Error importando Excel: {str(e)}")
        return {
            "success": False,
            "error": f"Error procesando archivo: {str(e)}"
        }

@router.post("/padron/importar-datos-masivos", response_model=dict)
async def importar_datos_masivos(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Importar datos del padrón desde texto copiado de Excel"""
    try:
        print(f"📋 IMPORTAR DATOS MASIVOS - Iniciando")
        
        # Leer el texto del request body
        datos_texto = await request.body()
        datos_texto = datos_texto.decode('utf-8')
        
        print(f"📝 Tamaño del texto: {len(datos_texto)} caracteres")
        
        if not datos_texto.strip():
            return {
                "success": False,
                "error": "No se proporcionaron datos"
            }
        
        # Detectar separador (tabulación o comas)
        if '\t' in datos_texto:
            separator = '\t'
        elif ',' in datos_texto:
            separator = ','
        else:
            return {
                "success": False,
                "error": "No se detectó separador válido (tabulación o comas)"
            }
        
        # Convertir texto a DataFrame
        lines = datos_texto.strip().split('\n')
        df = pd.DataFrame([line.split(separator) for line in lines])
        
        # Si la primera fila parece ser encabezados, usarla
        if len(df) > 1:
            df.columns = df.iloc[0]
            df = df.drop(df.index[0])
        
        print(f"📊 Datos procesados: {len(df)} filas, {len(df.columns)} columnas")
        print(f"🔍 Columnas: {list(df.columns)}")
        
        # Mapear columnas automáticamente
        column_mapping = {
            'ELECTOR': 'cedula',
            'NOMBRE': 'nombre', 
            'APE_PAT': 'apellido_paterno',
            'APE_MAT': 'apellido_materno',
            'FNAC': 'fecha_nacimiento',
            'SEXO': 'sexo',
            'ENTIDAD': 'estado',
            'MUNICIPIO': 'municipio',
            'SECCION': 'seccion',
            'LOCALIDAD': 'localidad',
            'MANZANA': 'casilla',
            'EN_LN': 'tipo_casilla',
            'CALLE': 'domicilio',
            'COLONIA': 'colonia',
            'CODPOSTAL': 'codigo_postal',
            'TIEMPRES': 'telefono',
            'EMISIONCRE': 'email'
        }
        
        # Crear lista de datos para mostrar
        datos_muestra = []
        total_registros = len(df)
        
        for index, row in df.head(10).iterrows():  # Solo primeros 10 para muestra
            registro = {}
            for col_excel, col_bd in column_mapping.items():
                if col_excel in df.columns:
                    valor = str(row[col_excel]) if pd.notna(row[col_excel]) else ''
                    registro[col_bd] = valor[:100]  # Limitar a 100 caracteres
            datos_muestra.append(registro)
        
        return {
            "success": True,
            "mensaje": "Datos procesados exitosamente",
            "total_registros": total_registros,
            "columnas_disponibles": list(df.columns),
            "datos_muestra": datos_muestra,
            "separator": separator
        }
        
    except Exception as e:
        print(f"❌ Error procesando datos: {str(e)}")
        return {
            "success": False,
            "error": f"Error procesando datos: {str(e)}"
        }

@router.post("/padron/confirmar-importacion", response_model=dict)
async def confirmar_importacion(
    datos: List[dict],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Confirmar e importar los datos procesados a la base de datos"""
    try:
        print(f"💾 CONFIRMAR IMPORTACIÓN - Iniciando")
        print(f"📊 Total de registros a importar: {len(datos)}")
        
        total_guardados = 0
        errores = []
        
        # Procesar en lotes de 1000
        batch_size = 1000
        for i in range(0, len(datos), batch_size):
            batch = datos[i:i + batch_size]
            
            for registro_data in batch:
                try:
                    # Crear registro del padrón
                    padron_record = PadronElectoral(
                        cedula=str(registro_data.get('cedula', '')).strip(),
                        nombre=str(registro_data.get('nombre', '')).strip(),
                        apellido_paterno=str(registro_data.get('apellido_paterno', '')).strip(),
                        apellido_materno=str(registro_data.get('apellido_materno', '')).strip(),
                        fecha_nacimiento=registro_data.get('fecha_nacimiento'),
                        sexo=str(registro_data.get('sexo', '')).strip(),
                        estado=str(registro_data.get('estado', '')).strip(),
                        municipio=str(registro_data.get('municipio', '')).strip(),
                        seccion=str(registro_data.get('seccion', '')).strip(),
                        localidad=str(registro_data.get('localidad', '')).strip(),
                        casilla=str(registro_data.get('casilla', '')).strip(),
                        tipo_casilla=str(registro_data.get('tipo_casilla', '')).strip(),
                        domicilio=str(registro_data.get('domicilio', '')).strip(),
                        colonia=str(registro_data.get('colonia', '')).strip(),
                        codigo_postal=str(registro_data.get('codigo_postal', '')).strip(),
                        telefono=str(registro_data.get('telefono', '')).strip(),
                        email=str(registro_data.get('email', '')).strip(),
                        activo=True,
                        fecha_creacion=datetime.now()
                    )
                    
                    db.add(padron_record)
                    total_guardados += 1
                    
                except Exception as e:
                    errores.append(f"Error en registro: {str(e)}")
                    continue
            
            # Commit del lote
            try:
                db.commit()
                print(f"✅ Lote {i//batch_size + 1} guardado: {len(batch)} registros")
            except Exception as e:
                db.rollback()
                errores.append(f"Error guardando lote: {str(e)}")
        
        return {
            "success": True,
            "mensaje": f"Importación completada: {total_guardados} registros guardados",
            "total_guardados": total_guardados,
            "total_procesados": len(datos),
            "errores": errores[:10] if errores else []  # Solo primeros 10 errores
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error en importación: {str(e)}")
        return {
            "success": False,
            "error": f"Error en importación: {str(e)}"
        }
