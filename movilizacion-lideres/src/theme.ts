export const COLORS = {
  // Marca
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  navy: '#0f172a',
  navyMid: '#1e3a5f',
  navyLight: '#1e40af',

  // Fondos
  bg: '#f1f5f9',
  bgCard: '#ffffff',
  bgLight: '#f8fafc',

  // Texto
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // Estado
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#06b6d4',
  infoLight: '#cffafe',

  // UI
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#e2e8f0',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(15,23,42,0.6)',

  // Categorías de reporte
  bache: '#f97316',
  agua: '#0ea5e9',
  seguridad: '#ef4444',
  iluminacion: '#eab308',
  salud: '#10b981',
  otros: '#8b5cf6',
};

export const FONTS = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const TIPO_REPORTE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  baches: { label: 'Baches', color: '#f97316', bg: '#fff7ed', icon: 'construct' },
  iluminacion: { label: 'Iluminación', color: '#eab308', bg: '#fefce8', icon: 'bulb' },
  agua: { label: 'Agua', color: '#0ea5e9', bg: '#f0f9ff', icon: 'water' },
  seguridad: { label: 'Seguridad', color: '#ef4444', bg: '#fef2f2', icon: 'shield' },
  salud: { label: 'Salud', color: '#10b981', bg: '#f0fdf4', icon: 'medkit' },
  basura: { label: 'Basura', color: '#84cc16', bg: '#f7fee7', icon: 'trash' },
  transporte: { label: 'Transporte', color: '#8b5cf6', bg: '#f5f3ff', icon: 'bus' },
  otros: { label: 'Otros', color: '#64748b', bg: '#f8fafc', icon: 'ellipsis-horizontal' },
};
