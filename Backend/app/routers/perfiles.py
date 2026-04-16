from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
import json
from datetime import datetime

from ..database import get_db
from ..auth import get_current_active_user, require_admin
from ..models import ConfiguracionPerfil as ConfiguracionPerfilModel
from ..models import ConfiguracionDashboard as ConfiguracionDashboardModel
from ..models import Usuario as UsuarioModel
from ..schemas import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(tags=["perfiles"])


@router.get("/perfiles/roles")
async def obtener_roles_disponibles():
    """Obtener todos los roles disponibles en el sistema"""
    return {
        "roles": [
            {"id": "admin", "nombre": "Administrador", "descripcion": "Acceso completo al sistema"},
            {"id": "presidente", "nombre": "Presidente", "descripcion": "Acceso de alto nivel"},
            {"id": "lider_estatal", "nombre": "Líder Estatal", "descripcion": "Gestión a nivel estatal"},
            {"id": "lider_regional", "nombre": "Líder Regional", "descripcion": "Gestión a nivel regional"},
            {"id": "lider_municipal", "nombre": "Líder Municipal", "descripcion": "Gestión a nivel municipal"},
            {"id": "lider_zona", "nombre": "Líder de Zona", "descripcion": "Gestión a nivel de zona"},
            {"id": "capturista", "nombre": "Capturista", "descripcion": "Captura de datos básica"},
            {"id": "ciudadano", "nombre": "Ciudadano", "descripcion": "Usuario general para ver noticias y crear reportes"}
        ]
    }


@router.get("/perfiles/opciones-menu")
async def obtener_opciones_menu():
    """Obtener todas las opciones disponibles para el menú"""
    return {
        "opciones_web": [
            {"id": "dashboard", "nombre": "Dashboard", "descripcion": "Panel principal", "ruta": "/"},
            {"id": "usuarios", "nombre": "Usuarios", "descripcion": "Gestión de usuarios", "ruta": "/usuarios"},
            {"id": "personas", "nombre": "Personas", "descripcion": "Gestión de personas", "ruta": "/personas"},
            {"id": "eventos", "nombre": "Eventos", "descripcion": "Gestión de eventos", "ruta": "/eventos"},
            {"id": "eventos-historicos", "nombre": "Eventos Históricos", "descripcion": "Reportes de eventos pasados", "ruta": "/eventos-historicos"},
            {"id": "movilizacion", "nombre": "Movilización", "descripcion": "Gestión de movilización", "ruta": "/movilizacion"},
            {"id": "reportes", "nombre": "Reportes", "descripcion": "Reportes generales", "ruta": "/reportes"},
            {"id": "estructura-red", "nombre": "Estructura Red", "descripcion": "Estructura organizacional", "ruta": "/estructura-red"},
            {"id": "checkin", "nombre": "Check-in", "descripcion": "Registro de asistencia", "ruta": "/checkin"},
            {"id": "perfil", "nombre": "Perfil", "descripcion": "Configuración de perfil", "ruta": "/perfil"},
            {"id": "admin-perfiles", "nombre": "Administrar Perfiles", "descripcion": "Gestión de perfiles y permisos", "ruta": "/admin-perfiles"},
            {"id": "admin-database", "nombre": "Administración BD", "descripcion": "Administración de base de datos", "ruta": "/admin-database"},
            {"id": "seguimiento", "nombre": "Seguimiento", "descripcion": "Seguimiento en tiempo real de vehículos", "ruta": "/seguimiento"},
            {"id": "noticias", "nombre": "Noticias", "descripcion": "Noticias y avisos", "ruta": "/noticias"},
            {"id": "reportes_ciudadanos", "nombre": "Reportes Ciudadanos", "descripcion": "Sistema de reportes comunitarios", "ruta": "/reportes-ciudadanos"}
        ],
        "opciones_app": [
            {"id": "dashboard", "nombre": "Dashboard", "descripcion": "Panel principal", "ruta": "/(tabs)/dashboard"},
            {"id": "register", "nombre": "Registrar Persona", "descripcion": "Registrar nueva persona", "ruta": "/register"},
            {"id": "reassign", "nombre": "Redireccionar Persona", "descripcion": "Reasignar persona", "ruta": "/reassign"},
            {"id": "estructura-red", "nombre": "Estructura de la Red", "descripcion": "Estructura organizacional", "ruta": "/estructura-red"},
            {"id": "pase-lista", "nombre": "Pase de Lista", "descripcion": "Registro de asistencia", "ruta": "/pase-lista"},
            {"id": "eventos-historicos", "nombre": "Eventos Históricos", "descripcion": "Reportes de eventos pasados", "ruta": "/eventos-historicos"},
            {"id": "movilizacion", "nombre": "Movilización", "descripcion": "Gestión de movilización", "ruta": "/movilizacion"},
            {"id": "reportes", "nombre": "Reportes", "descripcion": "Reportes generales", "ruta": "/reportes"},
            {"id": "seguimiento", "nombre": "Seguimiento", "descripcion": "Seguimiento en tiempo real", "ruta": "/ubicacion"},
            {"id": "movilizador-seguimiento", "nombre": "Movilizador", "descripcion": "Activar seguimiento como movilizador", "ruta": "/movilizador-seguimiento"},
            {"id": "noticias", "nombre": "Noticias", "descripcion": "Noticias y avisos", "ruta": "/(tabs)/noticias"},
            {"id": "reportes_ciudadanos", "nombre": "Reportes Ciudadanos", "descripcion": "Sistema de reportes comunitarios", "ruta": "/(tabs)/reportes-ciudadanos"},
            {"id": "perfil", "nombre": "Perfil", "descripcion": "Configuración de perfil", "ruta": "/perfil"}
        ]
    }


@router.get("/perfiles/configuracion/{rol}")
async def obtener_configuracion_perfil(
    rol: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración de permisos para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver configuraciones de perfiles")

    # Buscar configuración en la base de datos
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == rol).first()

    if configuracion_db:
        return {
            "rol": rol,
            "configuracion": {
                "opciones_web": json.loads(configuracion_db.opciones_web),
                "opciones_app": json.loads(configuracion_db.opciones_app)
            }
        }

    # Configuraciones por defecto si no existe en BD
    configuraciones_por_defecto = {
        "admin": {
            "opciones_web": ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "admin-database", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["dashboard", "register", "reassign", "pase-lista", "movilizacion", "estructura-red", "eventos-historicos", "reportes", "noticias", "reportes_ciudadanos", "seguimiento_reportes", "seguimiento", "perfil"]
        },
        "presidente": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_estatal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_regional": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "lider_municipal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_zona": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }

    return {
        "rol": rol,
        "configuracion": configuraciones_por_defecto.get(rol, {
            "opciones_web": ["dashboard", "perfil"],
            "opciones_app": ["dashboard", "perfil"]
        })
    }


@router.get("/perfiles/mi-configuracion")
async def obtener_mi_configuracion(
    current_user: Usuario = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener la configuración de permisos del usuario actual"""
    # 1. Primero: override personal del usuario (opciones_app_usuario)
    if current_user.opciones_app_usuario:
        opciones_app_personales = json.loads(current_user.opciones_app_usuario)
        # Obtener opciones_web del rol
        config_rol = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == current_user.rol).first()
        opciones_web = json.loads(config_rol.opciones_web) if config_rol else []
        return {
            "rol": current_user.rol,
            "configuracion": {
                "opciones_web": opciones_web,
                "opciones_app": opciones_app_personales,
                "es_override_usuario": True
            }
        }

    # 2. Segundo: configuración guardada por rol en BD
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == current_user.rol).first()

    if configuracion_db:
        return {
            "rol": current_user.rol,
            "configuracion": {
                "opciones_web": json.loads(configuracion_db.opciones_web),
                "opciones_app": json.loads(configuracion_db.opciones_app)
            }
        }

    # Configuraciones por defecto si no existe en BD
    configuraciones_por_defecto = {
        "admin": {
            "opciones_web": ["dashboard", "usuarios", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "admin-perfiles", "admin-database", "seguimiento", "noticias", "reportes_ciudadanos", "seguimiento_reportes"],
            "opciones_app": ["dashboard", "register", "reassign", "pase-lista", "movilizacion", "estructura-red", "eventos-historicos", "reportes", "noticias", "reportes_ciudadanos", "seguimiento_reportes", "seguimiento", "perfil"]
        },
        "presidente": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_estatal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_regional": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "lider_municipal": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "seguimiento", "noticias", "reportes_ciudadanos"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "seguimiento", "movilizador-seguimiento", "noticias"]
        },
        "lider_zona": {
            "opciones_web": ["dashboard", "personas", "eventos", "eventos-historicos", "movilizacion", "reportes", "estructura-red", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "reassign", "estructura-red", "pase-lista", "eventos-historicos", "movilizacion", "reportes", "perfil", "movilizador-seguimiento", "noticias"]
        },
        "capturista": {
            "opciones_web": ["dashboard", "personas", "eventos", "checkin", "perfil", "noticias"],
            "opciones_app": ["dashboard", "register", "pase-lista", "perfil", "noticias"]
        },
        "ciudadano": {
            "opciones_web": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"],
            "opciones_app": ["dashboard", "noticias", "reportes_ciudadanos", "perfil"]
        }
    }

    return {
        "rol": current_user.rol,
        "configuracion": configuraciones_por_defecto.get(current_user.rol, {
            "opciones_web": ["dashboard", "perfil"],
            "opciones_app": ["dashboard", "perfil"]
        })
    }


@router.put("/perfiles/configuracion/{rol}")
async def actualizar_configuracion_perfil(
    rol: str,
    configuracion: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar la configuración de permisos para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden modificar configuraciones de perfiles")

    # Validar que el rol existe
    roles_validos = ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista", "ciudadano"]
    if rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol no válido")

    # Validar estructura de configuración
    if "opciones_web" not in configuracion or "opciones_app" not in configuracion:
        raise HTTPException(status_code=400, detail="Configuración debe incluir opciones_web y opciones_app")

    # Buscar configuración existente o crear nueva
    configuracion_db = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == rol).first()

    if configuracion_db:
        # Actualizar configuración existente
        configuracion_db.opciones_web = json.dumps(configuracion["opciones_web"])
        configuracion_db.opciones_app = json.dumps(configuracion["opciones_app"])
    else:
        # Crear nueva configuración
        configuracion_db = ConfiguracionPerfilModel(
            rol=rol,
            opciones_web=json.dumps(configuracion["opciones_web"]),
            opciones_app=json.dumps(configuracion["opciones_app"])
        )
        db.add(configuracion_db)

    db.commit()
    db.refresh(configuracion_db)

    return {
        "mensaje": f"Configuración actualizada para el rol {rol}",
        "rol": rol,
        "configuracion": configuracion
    }


@router.get("/perfiles/usuarios-por-rol")
async def obtener_usuarios_por_rol(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener estadísticas de usuarios por rol"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver estadísticas de usuarios")

    # Contar usuarios por rol
    usuarios_por_rol = db.query(
        UsuarioModel.rol,
        func.count(UsuarioModel.id).label('cantidad')
    ).filter(UsuarioModel.activo == True).group_by(UsuarioModel.rol).all()

    return {
        "estadisticas": [
            {"rol": item.rol, "cantidad": item.cantidad}
            for item in usuarios_por_rol
        ]
    }


@router.get("/perfiles/configuracion-dashboard")
async def obtener_configuracion_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración del dashboard para todos los roles"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver configuraciones del dashboard")

    try:
        # Obtener configuraciones desde la base de datos
        configuraciones_db = db.query(ConfiguracionDashboardModel).all()

        # Crear diccionario con las configuraciones
        configuraciones_dashboard = {}

        for config in configuraciones_db:
            # Parsear el JSON de widgets
            try:
                widgets = json.loads(config.widgets) if isinstance(config.widgets, str) else config.widgets
            except (json.JSONDecodeError, TypeError):
                widgets = []

            configuraciones_dashboard[config.rol] = {
                "widgets": widgets
            }

        # Si no hay configuraciones en la BD, usar configuraciones por defecto
        if not configuraciones_dashboard:
            configuraciones_dashboard = {
                "admin": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "presidente": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_estatal": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_regional": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_municipal": {
                    "widgets": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "lider_zona": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas",
                                "top-secciones", "top-lideres", "estructura-red"]
                },
                "capturista": {
                    "widgets": ["total-personas", "total-eventos", "secciones-cubiertas"]
                },
                "ciudadano": {
                    "widgets": ["total-eventos", "estructura-red"]
                }
            }

        logger.debug(f"Configuraciones del dashboard obtenidas: {configuraciones_dashboard}")
        return configuraciones_dashboard

    except Exception as e:
        logger.error(f"Error al obtener configuraciones del dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.put("/perfiles/configuracion-dashboard/{rol}")
async def actualizar_configuracion_dashboard(
    rol: str,
    configuracion: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar la configuración del dashboard para un rol específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden actualizar configuraciones del dashboard")

    # Validar que el rol existe
    roles_validos = ["admin", "presidente", "lider_estatal", "lider_regional", "lider_municipal", "lider_zona", "capturista", "ciudadano"]
    if rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol no válido")

    try:
        # Verificar si ya existe una configuración para este rol
        config_existente = db.query(ConfiguracionDashboardModel).filter(ConfiguracionDashboardModel.rol == rol).first()

        if config_existente:
            # Actualizar configuración existente
            config_existente.widgets = json.dumps(configuracion.get("widgets", []))
            config_existente.fecha_actualizacion = datetime.now()
            logger.debug(f"Configuración del dashboard actualizada para rol '{rol}': {configuracion}")
        else:
            # Crear nueva configuración
            nueva_config = ConfiguracionDashboardModel(
                rol=rol,
                widgets=json.dumps(configuracion.get("widgets", []))
            )
            db.add(nueva_config)
            logger.debug(f"Nueva configuración del dashboard creada para rol '{rol}': {configuracion}")

        db.commit()

        return {
            "mensaje": f"Configuración del dashboard actualizada para rol '{rol}'",
            "rol": rol,
            "configuracion": configuracion
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error al guardar configuración del dashboard: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/perfiles/mi-configuracion-dashboard")
async def obtener_mi_configuracion_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener la configuración del dashboard para el usuario actual"""
    try:
        # Obtener configuración desde la base de datos
        config_db = db.query(ConfiguracionDashboardModel).filter(ConfiguracionDashboardModel.rol == current_user.rol).first()

        if config_db:
            # Parsear el JSON de widgets
            try:
                widgets = json.loads(config_db.widgets) if isinstance(config_db.widgets, str) else config_db.widgets
            except (json.JSONDecodeError, TypeError):
                widgets = []

            configuracion = {
                "rol": current_user.rol,
                "widgets": widgets
            }
        else:
            # Si no hay configuración en la BD, usar configuración por defecto
            configuraciones_default = {
                "admin": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                          "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                          "top-secciones", "top-lideres", "estructura-red"],
                "presidente": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                               "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                               "top-secciones", "top-lideres", "estructura-red"],
                "lider_estatal": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                  "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                  "top-secciones", "top-lideres", "estructura-red"],
                "lider_regional": ["total-personas", "total-eventos", "secciones-cubiertas",
                                   "top-secciones", "top-lideres", "estructura-red"],
                "lider_municipal": ["total-personas", "total-eventos", "lideres-activos", "secciones-cubiertas",
                                    "movilizacion-vehiculos", "asistencias-tiempo-real", "eventos-historicos",
                                    "top-secciones", "top-lideres", "estructura-red"],
                "lider_zona": ["total-personas", "total-eventos", "secciones-cubiertas",
                               "top-secciones", "top-lideres", "estructura-red"],
                "capturista": ["total-personas", "total-eventos", "secciones-cubiertas"],
                "ciudadano": ["total-eventos", "estructura-red"]
            }

            widgets = configuraciones_default.get(current_user.rol, [])
            configuracion = {
                "rol": current_user.rol,
                "widgets": widgets
            }

        logger.debug(f"Configuración del dashboard para {current_user.rol}: {configuracion}")
        return configuracion

    except Exception as e:
        logger.error(f"Error al obtener configuración del dashboard para {current_user.rol}: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


# ── Opciones app por usuario (override personal) ──────────────────────────────

TODAS_OPCIONES_APP = [
    {"id": "dashboard",          "label": "Dashboard"},
    {"id": "register",           "label": "Registrar persona"},
    {"id": "reassign",           "label": "Reasignar"},
    {"id": "pase-lista",         "label": "Check-in / Pase de lista"},
    {"id": "movilizacion",       "label": "Movilización"},
    {"id": "estructura-red",     "label": "Estructura de Red"},
    {"id": "eventos-historicos", "label": "Eventos Históricos"},
    {"id": "reportes",           "label": "Reportes estadísticos"},
    {"id": "noticias",           "label": "Noticias"},
    {"id": "reportes_ciudadanos","label": "Reportes ciudadanos"},
    {"id": "seguimiento_reportes","label": "Seguimiento reportes"},
    {"id": "seguimiento",        "label": "Ubicación en tiempo real"},
    {"id": "perfil",             "label": "Perfil"},
]


@router.get("/perfiles/opciones-app-disponibles")
async def obtener_opciones_app_disponibles(
    current_user: Usuario = Depends(get_current_active_user)
):
    """Devuelve la lista de todas las opciones de app posibles"""
    return {"opciones": TODAS_OPCIONES_APP}


@router.get("/perfiles/usuario/{usuario_id}/opciones-app")
async def obtener_opciones_app_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener las opciones de app configuradas para un usuario específico"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Si tiene override personal, devolverlo; si no, devolver el del rol
    if usuario.opciones_app_usuario:
        opciones = json.loads(usuario.opciones_app_usuario)
        es_override = True
    else:
        config_rol = db.query(ConfiguracionPerfilModel).filter(ConfiguracionPerfilModel.rol == usuario.rol).first()
        if config_rol:
            opciones = json.loads(config_rol.opciones_app)
        else:
            opciones = ["dashboard", "perfil"]
        es_override = False

    return {
        "usuario_id": usuario_id,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "opciones_app": opciones,
        "es_override_personal": es_override
    }


@router.put("/perfiles/usuario/{usuario_id}/opciones-app")
async def actualizar_opciones_app_usuario(
    usuario_id: int,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Establecer opciones de app personalizadas para un usuario"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    opciones = body.get("opciones_app")
    if opciones is None:
        raise HTTPException(status_code=400, detail="Falta campo opciones_app")

    if opciones == []:
        # Lista vacía = resetear al default del rol
        usuario.opciones_app_usuario = None
    else:
        usuario.opciones_app_usuario = json.dumps(opciones)

    db.commit()
    return {"mensaje": "Opciones actualizadas", "usuario_id": usuario_id, "opciones_app": opciones}


@router.delete("/perfiles/usuario/{usuario_id}/opciones-app")
async def resetear_opciones_app_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Resetear opciones de app al default del rol"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.opciones_app_usuario = None
    db.commit()
    return {"mensaje": "Opciones reseteadas al default del rol"}
