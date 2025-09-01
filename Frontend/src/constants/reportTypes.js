// Constantes para tipos de reporte ciudadano
export const TIPOS_REPORTE = [
  {
    value: 'tala_arboles_ecologia',
    icon: '🌳',
    title: 'Tala de árboles/Ecología',
    desc: 'Problemas ambientales, tala de árboles, etc.'
  },
  {
    value: 'basura_alumbrado',
    icon: '🗑️',
    title: 'Basura/Alumbrado',
    desc: 'Recolección de basura, alumbrado público, etc.'
  },
  {
    value: 'transporte_urbano_rutas',
    icon: '🚌',
    title: 'Transporte urbano/Rutas',
    desc: 'Problemas con transporte público, rutas, etc.'
  },
  {
    value: 'agua_potable_drenaje',
    icon: '💧',
    title: 'Agua potable/Drenaje',
    desc: 'Problemas con agua potable, drenaje, etc.'
  },
  {
    value: 'policia_accidentes_delitos',
    icon: '🚔',
    title: 'Policía/Accidentes/Delitos',
    desc: 'Reportes de seguridad, accidentes, delitos, etc.'
  },
  {
    value: 'otro_queja_sugerencia',
    icon: '❓',
    title: 'Otro/Queja/Sugerencia',
    desc: 'Otros problemas, quejas o sugerencias'
  },
  {
    value: 'baches_banqueta_invadida',
    icon: '🔧',
    title: 'Baches/Banqueta invadida',
    desc: 'Baches en calles, banquetas invadidas, etc.'
  },
  {
    value: 'transito_vialidad',
    icon: '🚦',
    title: 'Tránsito/Vialidad',
    desc: 'Problemas de tránsito, semáforos, vialidad, etc.'
  },
  {
    value: 'citas_presidente_otros',
    icon: '🏁',
    title: 'Citas con presidente/Otros',
    desc: 'Solicitudes de citas con autoridades, etc.'
  },
  {
    value: 'obras_publicas_navojoa',
    icon: '🏠',
    title: 'Obras Públicas en Navojoa',
    desc: 'Problemas con obras públicas municipales'
  }
];

// Función para obtener tipo por valor
export const obtenerTipoPorValor = (valor) => {
  return TIPOS_REPORTE.find(tipo => tipo.value === valor);
};

// Función para obtener icono por valor
export const obtenerIconoPorValor = (valor) => {
  const tipo = obtenerTipoPorValor(valor);
  return tipo ? tipo.icon : '📋';
};

// Función para obtener título por valor
export const obtenerTituloPorValor = (valor) => {
  const tipo = obtenerTipoPorValor(valor);
  return tipo ? tipo.title : 'Reporte Ciudadano';
};

// Función para obtener descripción por valor
export const obtenerDescripcionPorValor = (valor) => {
  const tipo = obtenerTipoPorValor(valor);
  return tipo ? tipo.desc : 'Descripción no disponible';
};

// Estados de reporte
export const ESTADOS_REPORTE = [
  'pendiente',
  'en_revision',
  'en_progreso',
  'resuelto',
  'rechazado'
];

// Prioridades de reporte
export const PRIORIDADES_REPORTE = [
  'baja',
  'normal',
  'alta',
  'urgente'
];
