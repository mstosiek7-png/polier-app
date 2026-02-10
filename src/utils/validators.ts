export function validateLieferscheinNumber(number: string): boolean {
  return /^\d{4,8}$/.test(number);
}

export function validateTons(tons: number): boolean {
  return tons > 0 && tons < 100;
}

export function validateTruckNumber(number: string): boolean {
  if (!number) return true;
  return /^[A-ZÄÖÜa-zäöü]{1,3}-[A-ZÄÖÜa-zäöü]{1,2}\s?\d{1,4}$/.test(number);
}

export function validateKilometerFormat(km: string): boolean {
  return /^\d+\+\d{3}$/.test(km);
}

export function validateTimeFormat(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function validateOdometer(value: number): boolean {
  return value >= 0 && value < 1000000;
}
