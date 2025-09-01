# Constantes para el sistema de reportes ciudadanos

# Tipos de reporte disponibles
TIPOS_REPORTE = [
    "tala_arboles_ecologia",      # 🌳 Tala de árboles/ecología
    "basura_alumbrado",           # 🗑️ Basura/alumbrado
    "transporte_urbano_rutas",    # 🚌 Transporte urbano/rutas
    "agua_potable_drenaje",       # 💧 Agua potable/drenaje
    "policia_accidentes_delitos", # 🚔 Policía/accidentes/delitos
    "otro_queja_sugerencia",      # ❓ Otro/queja/sugerencia
    "baches_banqueta_invadida",   # 🔧 Baches/banqueta invadida
    "transito_vialidad",          # 🚦 Tránsito, vialidad
    "citas_presidente_otros",     # 🏁 Citas con presidente/otros
    "obras_publicas_navojoa"      # 🏠 Obras Públicas en Navojoa
]

# Mapeo de tipos a nombres legibles
TIPOS_REPORTE_NAMES = {
    "tala_arboles_ecologia": "Tala de árboles/Ecología",
    "basura_alumbrado": "Basura/Alumbrado",
    "transporte_urbano_rutas": "Transporte urbano/Rutas",
    "agua_potable_drenaje": "Agua potable/Drenaje",
    "policia_accidentes_delitos": "Policía/Accidentes/Delitos",
    "otro_queja_sugerencia": "Otro/Queja/Sugerencia",
    "baches_banqueta_invadida": "Baches/Banqueta invadida",
    "transito_vialidad": "Tránsito/Vialidad",
    "citas_presidente_otros": "Citas con presidente/Otros",
    "obras_publicas_navojoa": "Obras Públicas en Navojoa"
}

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
    """Verifica si un tipo de reporte es válido"""
    return tipo in TIPOS_REPORTE

def obtener_nombre_tipo_reporte(tipo: str) -> str:
    """Obtiene el nombre legible de un tipo de reporte"""
    return TIPOS_REPORTE_NAMES.get(tipo, tipo)

def obtener_tipos_reporte_formateados():
    """Retorna los tipos de reporte con formato para el frontend"""
    return [
        {
            "valor": tipo,
            "nombre": nombre,
            "icono": obtener_icono_tipo(tipo)
        }
        for tipo, nombre in TIPOS_REPORTE_NAMES.items()
    ]

def obtener_icono_tipo(tipo: str) -> str:
    """Retorna el emoji/icono correspondiente al tipo de reporte"""
    iconos = {
        "tala_arboles_ecologia": "🌳",
        "basura_alumbrado": "🗑️",
        "transporte_urbano_rutas": "🚌",
        "agua_potable_drenaje": "💧",
        "policia_accidentes_delitos": "🚔",
        "otro_queja_sugerencia": "❓",
        "baches_banqueta_invadida": "🔧",
        "transito_vialidad": "🚦",
        "citas_presidente_otros": "🏁",
        "obras_publicas_navojoa": "🏠"
    }
    return iconos.get(tipo, "📋")
