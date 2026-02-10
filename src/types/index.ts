export interface Project {
  id: string;
  name: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AsphaltDelivery {
  id: string;
  projectId: string;
  lieferscheinNumber: string;
  date: string;
  time: string;
  asphaltClass: string;
  tons: number;
  driver?: string;
  truckNumber?: string;
  notes?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  projectId: string;
  type: string;
  fromKm: string;
  toKm: string;
  meters: number;
  date: string;
  time: string;
  notes?: string;
  imageUri?: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
  createdAt: string;
}

export interface WorkerHours {
  id: string;
  workerId: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  totalHours: number;
  status: 'present' | 'vacation' | 'sick' | 'absent';
  overtime: boolean;
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  registrationNumber: string;
  currentOdometer: number;
  active: boolean;
  createdAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  fromLocation: string;
  toLocation: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  purpose: string;
  notes?: string;
  createdAt: string;
}

export interface DailyReport {
  projectId: string;
  projectName: string;
  date: string;
  polierName: string;
  asphaltDeliveries: AsphaltDelivery[];
  asphaltTotal: number;
  materials: Material[];
  materialsSummary: { [type: string]: number };
  workers: WorkerHours[];
  workersCount: number;
  totalHours: number;
  trips: Trip[];
  totalKm: number;
  vehicleName: string;
  finalOdometer: number;
}

export type AsphaltClass = 'AC 11 D S' | 'AC 8 D S' | 'SMA 8' | 'SMA 11' | 'Binder' | 'Trag' | 'Inne';

export type MaterialType = 'Fugenmasse' | 'Tack Coat' | 'Primer' | 'Inny';

export type WorkerStatus = 'present' | 'vacation' | 'sick' | 'absent';

export type TripPurpose =
  | 'Dojazd na budowę'
  | 'Powrót z budowy'
  | 'Zakup materiałów'
  | 'Transport pracowników'
  | 'Wizyta u klienta'
  | 'Inne';
