export const ASPHALT_CLASSES = [
  'AC 11 D S',
  'AC 8 D S',
  'SMA 8',
  'SMA 11',
  'Binder',
  'Trag',
  'Inne',
] as const;

export const MATERIAL_TYPES = [
  'Fugenmasse',
  'Tack Coat',
  'Primer',
  'Inny',
] as const;

export const WORKER_STATUSES = [
  'present',
  'vacation',
  'sick',
  'absent',
] as const;

export const TRIP_PURPOSES = [
  'Dojazd na budowę',
  'Powrót z budowy',
  'Zakup materiałów',
  'Transport pracowników',
  'Wizyta u klienta',
  'Inne',
] as const;

export const COLORS = {
  primary: '#FF9800',
  primaryDark: '#F57C00',
  primaryLight: '#FFB74D',
  secondary: '#2196F3',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  divider: '#E0E0E0',
} as const;

export const DEFAULT_BREAK_HOURS = 0.5;
export const DEFAULT_START_TIME = '07:00';
export const DEFAULT_END_TIME = '16:00';
