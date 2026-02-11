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
  primary: '#00897B',
  primaryDark: '#00695C',
  primaryLight: '#4DB6AC',
  secondary: '#FF8A65',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  divider: '#E5E7EB',
} as const;

export const CARD_COLORS = {
  teal: { bg: '#E0F2F1', icon: '#00897B' },
  orange: { bg: '#FFF3E0', icon: '#FF8A65' },
  coral: { bg: '#FFEBEE', icon: '#EF5350' },
  purple: { bg: '#EDE7F6', icon: '#7E57C2' },
  blue: { bg: '#E3F2FD', icon: '#42A5F5' },
  green: { bg: '#E8F5E9', icon: '#66BB6A' },
  amber: { bg: '#FFF8E1', icon: '#FFB300' },
  pink: { bg: '#FCE4EC', icon: '#EC407A' },
  indigo: { bg: '#E8EAF6', icon: '#5C6BC0' },
} as const;

export const DEFAULT_BREAK_HOURS = 0.5;
export const DEFAULT_START_TIME = '07:00';
export const DEFAULT_END_TIME = '16:00';
