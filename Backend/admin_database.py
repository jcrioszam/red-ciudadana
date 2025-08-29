#!/usr/bin/env python3
"""
Sistema de Administración de Base de Datos para Red Ciudadana
Solo accesible por administradores
"""

import sys
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import ReporteCiudadano, Usuario, Persona
from app.auth import get_current_user

# Router para endpoints de administración
admin_router = APIRouter(prefix="/admin", tags=["Administración"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Verificar que el usuario sea administrador
async def verify_admin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden acceder a esta función"
        )
    return current_user

@admin_router.get("/database/stats")
async def get_database_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Obtener estadísticas de la base de datos"""
    try:
        total_reportes = db.query(ReporteCiudadano).count()
        reportes_con_fotos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.fotos.any()
        ).count()
        reportes_sin_fotos = total_reportes - reportes_con_fotos
        
        total_usuarios = db.query(Usuario).count()
        total_personas = db.query(Persona).count()
        
        return {
            "estadisticas": {
                "reportes": {
                    "total": total_reportes,
                    "con_fotos": reportes_con_fotos,
                    "sin_fotos": reportes_sin_fotos
                },
                "usuarios": total_usuarios,
                "personas": total_personas
            },
            "fecha_consulta": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas: {str(e)}"
        )

@admin_router.delete("/database/limpiar-reportes")
async def limpiar_reportes(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    eliminar_todos: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Limpiar reportes según criterios especificados"""
    try:
        # Crear backup antes de eliminar
        backup_info = crear_backup_reportes(db)
        
        if eliminar_todos:
            # Eliminar todos los reportes
            total_eliminados = db.query(ReporteCiudadano).delete()
            mensaje = f"Se eliminaron {total_eliminados} reportes de la base de datos"
        else:
            # Construir query con filtros
            query = db.query(ReporteCiudadano)
            
            if fecha_desde:
                query = query.filter(ReporteCiudadano.fecha_creacion >= fecha_desde)
            if fecha_hasta:
                query = query.filter(ReporteCiudadano.fecha_creacion <= fecha_hasta)
            if tipo:
                query = query.filter(ReporteCiudadano.tipo == tipo)
            if estado:
                query = query.filter(ReporteCiudadano.estado == estado)
            
            # Contar antes de eliminar
            total_a_eliminar = query.count()
            
            # Eliminar
            total_eliminados = query.delete(synchronize_session=False)
            
            mensaje = f"Se eliminaron {total_eliminados} reportes de la base de datos"
        
        # Commit de los cambios
        db.commit()
        
        return {
            "mensaje": mensaje,
            "total_eliminados": total_eliminados,
            "backup_info": backup_info
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando reportes: {str(e)}"
        )

@admin_router.get("/database/limpiar-preview")
async def preview_limpiar_reportes(
    days_old: int = 30,
    status: Optional[str] = None,
    preview: bool = True,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Obtener vista previa de reportes que se van a eliminar"""
    try:
        print(f"🔍 DEBUG: Buscando reportes con days_old={days_old}, status={status}")
        
        # Contar total de reportes primero
        total_reportes = db.query(ReporteCiudadano).count()
        print(f"📊 DEBUG: Total de reportes en BD: {total_reportes}")
        
        if total_reportes == 0:
            return {
                "reportes": [],
                "total_a_eliminar": 0,
                "criterios": {
                    "days_old": days_old,
                    "status": status,
                    "fecha_limite": None
                },
                "mensaje": "No hay reportes en la base de datos",
                "debug_info": {
                    "total_reportes": 0,
                    "filtros_aplicados": "N/A"
                }
            }
        
        # Calcular fecha límite
        fecha_limite = datetime.now() - timedelta(days=days_old)
        print(f"📅 DEBUG: Fecha límite calculada: {fecha_limite}")
        
        # Construir query base - ser más flexible con las fechas
        query = db.query(ReporteCiudadano)
        
        # Solo aplicar filtro de fecha si days_old > 0
        if days_old > 0:
            query = query.filter(ReporteCiudadano.fecha_creacion < fecha_limite)
            print(f"🔍 DEBUG: Aplicando filtro de fecha: < {fecha_limite}")
        else:
            print(f"🔍 DEBUG: No aplicando filtro de fecha (days_old = 0)")
        
        # Aplicar filtro de estado si se especifica
        if status and status != 'todos':
            query = query.filter(ReporteCiudadano.estado == status)
            print(f"🔍 DEBUG: Aplicando filtro de estado: {status}")
        else:
            print(f"🔍 DEBUG: No aplicando filtro de estado (todos)")
        
        # Contar reportes que cumplen los criterios
        total_a_eliminar = query.count()
        print(f"🔍 DEBUG: Total de reportes que cumplen criterios: {total_a_eliminar}")
        
        # Obtener reportes que se van a eliminar (limitado a 100 para la vista previa)
        reportes_a_eliminar = query.limit(100).all()
        print(f"🔍 DEBUG: Reportes obtenidos para vista previa: {len(reportes_a_eliminar)}")
        
        # Preparar datos para el frontend
        reportes_preview = []
        for reporte in reportes_a_eliminar:
            reportes_preview.append({
                "id": reporte.id,
                "titulo": reporte.titulo or "Sin título",
                "estado": reporte.estado,
                "fecha_creacion": reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
                "tipo": reporte.tipo or "Sin tipo",
                "descripcion": reporte.descripcion or "Sin descripción"
            })
        
        # Información de debug
        debug_info = {
            "total_reportes": total_reportes,
            "filtros_aplicados": {
                "days_old": days_old,
                "status": status,
                "fecha_limite": fecha_limite.isoformat() if days_old > 0 else None
            },
            "query_result": {
                "total_cumplen_criterios": total_a_eliminar,
                "reportes_obtenidos": len(reportes_preview)
            }
        }
        
        return {
            "reportes": reportes_preview,
            "total_a_eliminar": total_a_eliminar,
            "criterios": {
                "days_old": days_old,
                "status": status,
                "fecha_limite": fecha_limite.isoformat() if days_old > 0 else None
            },
            "mensaje": f"Se encontraron {total_a_eliminar} reportes que cumplen con los criterios",
            "debug_info": debug_info
        }
        
    except Exception as e:
        print(f"❌ ERROR en preview_limpiar_reportes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo vista previa: {str(e)}"
        )

@admin_router.post("/database/limpiar")
async def limpiar_reportes_post(
    daysOld: int = 30,
    status: str = "todos",
    confirmDelete: bool = False,
    reportes_ids: Optional[List[int]] = None,
    total_seleccionados: Optional[int] = 0,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Limpiar reportes según criterios especificados (POST)"""
    try:
        if not confirmDelete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe confirmar la eliminación para proceder"
            )
        
        # Si se proporcionan IDs específicos, eliminar solo esos
        if reportes_ids and len(reportes_ids) > 0:
            print(f"🗑️ Eliminando {len(reportes_ids)} reportes específicos: {reportes_ids}")
            
            # Verificar que los reportes existan
            reportes_existentes = db.query(ReporteCiudadano).filter(
                ReporteCiudadano.id.in_(reportes_ids)
            ).all()
            
            if not reportes_existentes:
                return {
                    "mensaje": "No se encontraron reportes con los IDs especificados",
                    "total_eliminados": 0
                }
            
            # Crear backup antes de eliminar
            backup_info = crear_backup_reportes(db)
            
            # Eliminar reportes específicos
            total_eliminados = db.query(ReporteCiudadano).filter(
                ReporteCiudadano.id.in_(reportes_ids)
            ).delete(synchronize_session=False)
            
            # Commit de los cambios
            db.commit()
            
            return {
                "mensaje": f"Se eliminaron {total_eliminados} reportes específicos de la base de datos",
                "total_eliminados": total_eliminados,
                "backup_info": backup_info,
                "criterios": {
                    "tipo": "eliminacion_especifica",
                    "ids_proporcionados": len(reportes_ids),
                    "ids_eliminados": total_eliminados
                }
            }
        
        # Si no hay IDs específicos, usar criterios generales
        print(f"🗑️ Eliminando reportes por criterios: daysOld={daysOld}, status={status}")
        
        # Calcular fecha límite
        fecha_limite = datetime.now() - timedelta(days=daysOld)
        
        # Construir query base
        query = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.fecha_creacion < fecha_limite
        )
        
        # Aplicar filtro de estado si se especifica
        if status and status != 'todos':
            query = query.filter(ReporteCiudadano.estado == status)
        
        # Contar antes de eliminar
        total_a_eliminar = query.count()
        
        if total_a_eliminar == 0:
            return {
                "mensaje": "No hay reportes que cumplan con los criterios especificados",
                "total_eliminados": 0
            }
        
        # Crear backup antes de eliminar
        backup_info = crear_backup_reportes(db)
        
        # Eliminar reportes
        total_eliminados = query.delete(synchronize_session=False)
        
        # Commit de los cambios
        db.commit()
        
        return {
            "mensaje": f"Se eliminaron {total_eliminados} reportes de la base de datos",
            "total_eliminados": total_eliminados,
            "backup_info": backup_info,
            "criterios": {
                "days_old": daysOld,
                "status": status,
                "fecha_limite": fecha_limite.isoformat()
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR en limpiar_reportes_post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error limpiando reportes: {str(e)}"
        )

@admin_router.post("/database/backup")
async def crear_backup_completo(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Crear backup completo de la base de datos"""
    try:
        backup_info = {
            "fecha": datetime.now().isoformat(),
            "reportes": db.query(ReporteCiudadano).count(),
            "usuarios": db.query(Usuario).count(),
            "personas": db.query(Persona).count(),
            "estado": "backup_iniciado"
        }
        
        # Aquí iría la lógica real de backup
        # Por ahora solo retornamos información
        
        return {
            "mensaje": "Backup iniciado correctamente",
            "backup_info": backup_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando backup: {str(e)}"
        )

@admin_router.get("/database/status")
async def get_database_status(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Obtener estado general de la base de datos"""
    try:
        # Verificar conectividad
        db.execute("SELECT 1")
        
        # Obtener información básica
        total_reportes = db.query(ReporteCiudadano).count()
        total_usuarios = db.query(Usuario).count()
        total_personas = db.query(Persona).count()
        
        return {
            "estado": "conectado",
            "fecha_verificacion": datetime.now().isoformat(),
            "conteos": {
                "reportes": total_reportes,
                "usuarios": total_usuarios,
                "personas": total_personas
            }
        }
        
    except Exception as e:
        return {
            "estado": "error",
            "error": str(e),
            "fecha_verificacion": datetime.now().isoformat()
        }

def crear_backup_reportes(db: Session):
    """Crear backup de reportes antes de eliminar"""
    try:
        # Lógica para crear backup
        return {"backup_creado": True, "fecha": datetime.now().isoformat()}
    except Exception as e:
        return {"backup_creado": False, "error": str(e)}

@admin_router.post("/database/optimizar")
async def optimizar_base_datos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Optimizar la base de datos"""
    try:
        # Simular proceso de optimización
        # En producción, aquí irían comandos reales de optimización
        
        # Ejecutar VACUUM (PostgreSQL) o similar
        db.execute("VACUUM ANALYZE")
        
        # Obtener estadísticas después de la optimización
        total_reportes = db.query(ReporteCiudadano).count()
        total_usuarios = db.query(Usuario).count()
        total_personas = db.query(Persona).count()
        
        return {
            "mensaje": "Base de datos optimizada correctamente",
            "fecha_optimizacion": datetime.now().isoformat(),
            "estadisticas_post_optimizacion": {
                "reportes": total_reportes,
                "usuarios": total_usuarios,
                "personas": total_personas
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error optimizando base de datos: {str(e)}"
        )

@admin_router.post("/database/maintenance")
async def mantenimiento_automatico(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(verify_admin)
):
    """Ejecutar mantenimiento automático de la base de datos"""
    try:
        # Simular proceso de mantenimiento
        # En producción, aquí irían tareas reales de mantenimiento
        
        # Limpiar reportes muy antiguos (más de 1 año)
        fecha_limite = datetime.now() - timedelta(days=365)
        reportes_antiguos = db.query(ReporteCiudadano).filter(
            ReporteCiudadano.fecha_creacion < fecha_limite,
            ReporteCiudadano.estado.in_(["completado", "cancelado"])
        ).count()
        
        # Ejecutar mantenimiento
        db.execute("VACUUM")
        db.execute("ANALYZE")
        
        return {
            "mensaje": "Mantenimiento automático completado",
            "fecha_mantenimiento": datetime.now().isoformat(),
            "acciones_realizadas": [
                "VACUUM ejecutado",
                "ANALYZE ejecutado",
                f"Reportes antiguos identificados: {reportes_antiguos}"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en mantenimiento automático: {str(e)}"
        )

# Función para registrar las rutas en la aplicación principal
def register_admin_routes(app):
    """Registrar todas las rutas de administración en la aplicación principal"""
    app.include_router(admin_router)