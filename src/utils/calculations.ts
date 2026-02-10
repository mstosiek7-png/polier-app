export function parseKilometer(km: string): number {
  const parts = km.split('+');
  const kilometers = parseInt(parts[0] ?? '0', 10);
  const meters = parseInt(parts[1] ?? '0', 10);
  return kilometers * 1000 + meters;
}

export function calculateDistance(fromKm: string, toKm: string): number {
  return parseKilometer(toKm) - parseKilometer(fromKm);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function calculateHours(
  startTime: string,
  endTime: string,
  breakHours: number
): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const workedMinutes = endMinutes - startMinutes;
  const netMinutes = workedMinutes - breakHours * 60;
  return Math.max(0, netMinutes / 60);
}

export function calculateTripDistance(
  startOdometer: number,
  endOdometer: number
): number {
  return endOdometer - startOdometer;
}
