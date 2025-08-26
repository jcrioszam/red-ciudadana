 
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