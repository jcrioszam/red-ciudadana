from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..auth import get_current_active_user, require_admin
from ..schemas import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(tags=["tipos-reporte"])


@router.get("/tipos-reporte/")
async def obtener_tipos_reporte():
    try:
        from ..constants import obtener_tipos_reporte_formateados
        tipos = obtener_tipos_reporte_formateados()
        return {"success": True, "data": tipos, "total": len(tipos)}
    except Exception as e:
        logger.error(f"Error al obtener tipos de reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos de reporte: {str(e)}")


@router.get("/admin/tipos-reporte/")
async def obtener_todos_tipos_reporte(current_user: Usuario = Depends(require_admin)):
    try:
        from ..constants import obtener_todos_tipos_reporte
        tipos = obtener_todos_tipos_reporte()
        return {"success": True, "data": tipos, "total": len(tipos)}
    except Exception as e:
        logger.error(f"Error al obtener todos los tipos de reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/admin/tipos-reporte/{tipo_valor}/activar")
async def activar_tipo_reporte(
    tipo_valor: str,
    activo: bool = True,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    try:
        from ..constants import activar_tipo_reporte, obtener_todos_tipos_reporte
        tipos = obtener_todos_tipos_reporte()
        if not any(t["valor"] == tipo_valor for t in tipos):
            raise HTTPException(status_code=404, detail=f"Tipo '{tipo_valor}' no encontrado")
        activar_tipo_reporte(tipo_valor, activo)
        accion = "activado" if activo else "desactivado"
        return {"success": True, "mensaje": f"Tipo '{tipo_valor}' {accion} exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al activar tipo de reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/estados-reporte/")
async def obtener_estados_reporte():
    try:
        from ..constants import ESTADOS_REPORTE
        return {"success": True, "data": ESTADOS_REPORTE, "total": len(ESTADOS_REPORTE)}
    except Exception as e:
        logger.error(f"Error al obtener estados de reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/prioridades-reporte/")
async def obtener_prioridades_reporte():
    try:
        from ..constants import PRIORIDADES_REPORTE
        return {"success": True, "data": PRIORIDADES_REPORTE, "total": len(PRIORIDADES_REPORTE)}
    except Exception as e:
        logger.error(f"Error al obtener prioridades de reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
