# Constantes para el sistema de reportes ciudadanos

# Tipos de reporte disponibles con estado activo
TIPOS_REPORTE_CONFIG = [
    {
        "valor": "tala_arboles_ecologia",
        "nombre": "Tala de árboles/Ecología",
        "icono": "🌳",
        "descripcion": "Problemas ambientales, tala de árboles, etc.",
        "activo": True,
        "categoria": "medio_ambiente"
    },
    {
        "valor": "basura_alumbrado",
        "nombre": "Basura/Alumbrado",
        "icono": "🗑️",
        "descripcion": "Recolección de basura, alumbrado público, etc.",
        "activo": True,
        "categoria": "servicios_publicos"
    },
    {
        "valor": "transporte_urbano_rutas",
        "nombre": "Transporte urbano/Rutas",
        "icono": "🚌",
        "descripcion": "Problemas con transporte público, rutas, etc.",
        "activo": True,
        "categoria": "transporte"
    },
    {
        "valor": "agua_potable_drenaje",
        "nombre": "Agua potable/Drenaje",
        "icono": "💧",
        "descripcion": "Problemas con agua potable, drenaje, etc.",
        "activo": True,
        "categoria": "servicios_publicos"
    },
    {
        "valor": "policia_accidentes_delitos",
        "nombre": "Policía/Accidentes/Delitos",
        "icono": "🚔",
        "descripcion": "Reportes de seguridad, accidentes, delitos, etc.",
        "activo": True,
        "categoria": "seguridad"
    },
    {
        "valor": "otro_queja_sugerencia",
        "nombre": "Otro/Queja/Sugerencia",
        "icono": "❓",
        "descripcion": "Otros problemas, quejas o sugerencias",
        "activo": True,
        "categoria": "general"
    },
    {
        "valor": "baches_banqueta_invadida",
        "nombre": "Baches/Banqueta invadida",
        "icono": "🔧",
        "descripcion": "Baches en calles, banquetas invadidas, etc.",
        "activo": True,
        "categoria": "vialidad"
    },
    {
        "valor": "transito_vialidad",
        "nombre": "Tránsito/Vialidad",
        "icono": "🚦",
        "descripcion": "Problemas de tránsito, semáforos, vialidad, etc.",
        "activo": True,
        "categoria": "vialidad"
    },
    {
        "valor": "citas_presidente_otros",
        "nombre": "Citas con presidente/Otros",
        "icono": "🏁",
        "descripcion": "Solicitudes de citas con autoridades, etc.",
        "activo": False,  # 🔧 DESACTIVADO por defecto
        "categoria": "administrativo"
    },
    {
        "valor": "obras_publicas_navojoa",
        "nombre": "Obras Públicas en Navojoa",
        "icono": "🏠",
        "descripcion": "Problemas con obras públicas municipales",
        "activo": True,
        "categoria": "obras_publicas"
    }
]

# Lista de tipos activos (para compatibilidad)
TIPOS_REPORTE = [tipo["valor"] for tipo in TIPOS_REPORTE_CONFIG if tipo["activo"]]

# Mapeo de tipos a nombres legibles (solo activos)
TIPOS_REPORTE_NAMES = {tipo["valor"]: tipo["nombre"] for tipo in TIPOS_REPORTE_CONFIG if tipo["activo"]}

# Estados de reporte
ESTADOS_REPORTE = [
    "pendiente",      # Pendiente de revisión
    "en_revision",    # En proceso de revisión
    "en_progreso",    # Trabajo en progreso
    "resuelto",       # Reporte resuelto
    "rechazado"       # Reporte rechazado
]

# Prioridades de reporte
PRIORIDADES_REPORTE = [
    "baja",      # Prioridad baja
    "normal",    # Prioridad normal
    "alta",      # Prioridad alta
    "urgente"    # Prioridad urgente
]

# Validación de tipos de reporte
def es_tipo_reporte_valido(tipo: str) -> bool:
    """Verifica si un tipo de reporte es válido y está activo"""
    return tipo in TIPOS_REPORTE

def obtener_nombre_tipo_reporte(tipo: str) -> str:
    """Obtiene el nombre legible de un tipo de reporte"""
    return TIPOS_REPORTE_NAMES.get(tipo, tipo)

def obtener_tipos_reporte_formateados():
    """Retorna los tipos de reporte activos con formato para el frontend"""
    return [
        {
            "valor": tipo["valor"],
            "nombre": tipo["nombre"],
            "icono": tipo["icono"],
            "categoria": tipo["categoria"],
            "descripcion": tipo["descripcion"]
        }
        for tipo in TIPOS_REPORTE_CONFIG if tipo["activo"]
    ]

def obtener_todos_tipos_reporte():
    """Retorna TODOS los tipos de reporte (activos e inactivos) para administración"""
    return TIPOS_REPORTE_CONFIG

def obtener_tipos_por_categoria():
    """Retorna los tipos agrupados por categoría"""
    categorias = {}
    for tipo in TIPOS_REPORTE_CONFIG:
        if tipo["activo"]:
            if tipo["categoria"] not in categorias:
                categorias[tipo["categoria"]] = []
            categorias[tipo["categoria"]].append(tipo)
    return categorias

def activar_tipo_reporte(valor: str, activo: bool = True):
    """Activa o desactiva un tipo de reporte"""
    for tipo in TIPOS_REPORTE_CONFIG:
        if tipo["valor"] == valor:
            tipo["activo"] = activo
            break
    
    # Actualizar listas derivadas
    global TIPOS_REPORTE, TIPOS_REPORTE_NAMES
    TIPOS_REPORTE = [tipo["valor"] for tipo in TIPOS_REPORTE_CONFIG if tipo["activo"]]
    TIPOS_REPORTE_NAMES = {tipo["valor"]: tipo["nombre"] for tipo in TIPOS_REPORTE_CONFIG if tipo["activo"]}

def obtener_icono_tipo(tipo: str) -> str:
    """Retorna el emoji/icono correspondiente al tipo de reporte"""
    for config in TIPOS_REPORTE_CONFIG:
        if config["valor"] == tipo:
            return config["icono"]
    return "📋"
