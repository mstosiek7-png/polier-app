import { format } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy');
}

export function formatTime(time: string): string {
  return time;
}

export function formatDateTime(datetime: string): string {
  return format(new Date(datetime), 'dd.MM.yyyy HH:mm');
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals).replace('.', ',');
}

export function formatKilometer(km: string): string {
  if (!/^\d+\+\d{3}$/.test(km)) {
    const cleaned = km.replace(/[^0-9+]/g, '');
    if (cleaned.includes('+')) {
      const [before, after] = cleaned.split('+');
      return `${before}+${(after ?? '').padStart(3, '0')}`;
    }
  }
  return km;
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}
