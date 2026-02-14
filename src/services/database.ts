import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type {
  Project,
  AsphaltDelivery,
  Material,
  Worker,
  WorkerHours,
  Vehicle,
  Trip,
  MaterialCatalog,
  MaterialUsage,
} from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('polier-app.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS asphalt_deliveries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      lieferschein_number TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      asphalt_class TEXT NOT NULL,
      tons REAL NOT NULL,
      driver TEXT,
      truck_number TEXT,
      notes TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      from_km TEXT DEFAULT '',
      to_km TEXT DEFAULT '',
      meters REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worker_hours (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_hours REAL DEFAULT 0.5,
      total_hours REAL NOT NULL,
      status TEXT DEFAULT 'present',
      overtime INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      current_odometer REAL NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      start_odometer REAL NOT NULL,
      end_odometer REAL NOT NULL,
      distance REAL NOT NULL,
      purpose TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS materials_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit REAL NOT NULL,
      density REAL,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS material_usage (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      material_id TEXT NOT NULL,
      date TEXT NOT NULL,
      input_quantity REAL NOT NULL,
      input_unit TEXT NOT NULL,
      thickness_cm REAL,
      final_quantity REAL NOT NULL,
      cost REAL NOT NULL,
      price_per_unit_at_time REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (material_id) REFERENCES materials_catalog(id)
    );

    CREATE INDEX IF NOT EXISTS idx_asphalt_project_date ON asphalt_deliveries(project_id, date);
    CREATE INDEX IF NOT EXISTS idx_materials_project_date ON materials(project_id, date);
    CREATE INDEX IF NOT EXISTS idx_hours_project_date ON worker_hours(project_id, date);
    CREATE INDEX IF NOT EXISTS idx_trips_project_date ON trips(project_id, date);
    CREATE INDEX IF NOT EXISTS idx_material_usage_project_date ON material_usage(project_id, date);
  `);
}

// ==================== PROJECTS ====================

export async function getActiveProject(): Promise<Project | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: string; name: string; location: string | null;
    start_date: string | null; end_date: string | null;
    active: number; created_at: string; updated_at: string;
  }>('SELECT * FROM projects WHERE active = 1 ORDER BY created_at DESC LIMIT 1');
  if (!row) return null;
  return mapProject(row);
}

export async function getAllProjects(): Promise<Project[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; name: string; location: string | null;
    start_date: string | null; end_date: string | null;
    active: number; created_at: string; updated_at: string;
  }>('SELECT * FROM projects ORDER BY created_at DESC');
  return rows.map(mapProject);
}

export async function createProject(name: string, location?: string): Promise<Project> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO projects (id, name, location, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
    [id, name, location ?? null, now, now]
  );
  return { id, name, location, active: true, createdAt: now, updatedAt: now };
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  if (data.name !== undefined) {
    await database.runAsync('UPDATE projects SET name = ?, updated_at = ? WHERE id = ?', [data.name, now, id]);
  }
  if (data.location !== undefined) {
    await database.runAsync('UPDATE projects SET location = ?, updated_at = ? WHERE id = ?', [data.location ?? null, now, id]);
  }
  if (data.active !== undefined) {
    await database.runAsync('UPDATE projects SET active = ?, updated_at = ? WHERE id = ?', [data.active ? 1 : 0, now, id]);
  }
}

export async function setActiveProject(id: string): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync('UPDATE projects SET active = 0, updated_at = ?', [now]);
  await database.runAsync('UPDATE projects SET active = 1, updated_at = ? WHERE id = ?', [now, id]);
}

// ==================== ASPHALT DELIVERIES ====================

export async function getAsphaltDeliveries(projectId: string, date: string): Promise<AsphaltDelivery[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; project_id: string; lieferschein_number: string;
    date: string; time: string; asphalt_class: string; tons: number;
    driver: string | null; truck_number: string | null; notes: string | null;
    image_uri: string | null; created_at: string; updated_at: string;
  }>('SELECT * FROM asphalt_deliveries WHERE project_id = ? AND date = ? ORDER BY time DESC', [projectId, date]);
  return rows.map(mapAsphaltDelivery);
}

export async function createAsphaltDelivery(delivery: Omit<AsphaltDelivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<AsphaltDelivery> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO asphalt_deliveries (id, project_id, lieferschein_number, date, time, asphalt_class, tons, driver, truck_number, notes, image_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, delivery.projectId, delivery.lieferscheinNumber, delivery.date, delivery.time,
     delivery.asphaltClass, delivery.tons, delivery.driver ?? null, delivery.truckNumber ?? null,
     delivery.notes ?? null, delivery.imageUri ?? null, now, now]
  );
  return { ...delivery, id, createdAt: now, updatedAt: now };
}

export async function updateAsphaltDelivery(id: string, delivery: Partial<AsphaltDelivery>): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (delivery.lieferscheinNumber !== undefined) { fields.push('lieferschein_number = ?'); values.push(delivery.lieferscheinNumber); }
  if (delivery.date !== undefined) { fields.push('date = ?'); values.push(delivery.date); }
  if (delivery.time !== undefined) { fields.push('time = ?'); values.push(delivery.time); }
  if (delivery.asphaltClass !== undefined) { fields.push('asphalt_class = ?'); values.push(delivery.asphaltClass); }
  if (delivery.tons !== undefined) { fields.push('tons = ?'); values.push(delivery.tons); }
  if (delivery.driver !== undefined) { fields.push('driver = ?'); values.push(delivery.driver ?? null); }
  if (delivery.truckNumber !== undefined) { fields.push('truck_number = ?'); values.push(delivery.truckNumber ?? null); }
  if (delivery.notes !== undefined) { fields.push('notes = ?'); values.push(delivery.notes ?? null); }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    await database.runAsync(`UPDATE asphalt_deliveries SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteAsphaltDelivery(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM asphalt_deliveries WHERE id = ?', [id]);
}

export async function getTotalTons(projectId: string, date: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(tons) as total FROM asphalt_deliveries WHERE project_id = ? AND date = ?',
    [projectId, date]
  );
  return result?.total ?? 0;
}

// ==================== MATERIALS ====================

export async function getMaterials(projectId: string, date: string): Promise<Material[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; project_id: string; type: string;
    from_km: string; to_km: string; meters: number;
    date: string; time: string; notes: string | null;
    image_uri: string | null; created_at: string;
  }>('SELECT * FROM materials WHERE project_id = ? AND date = ? ORDER BY time DESC', [projectId, date]);
  return rows.map(mapMaterial);
}

export async function createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO materials (id, project_id, type, from_km, to_km, meters, date, time, notes, image_uri, created_at)
     VALUES (?, ?, ?, '', '', ?, ?, ?, ?, ?, ?)`,
    [id, material.projectId, material.type,
     material.meters, material.date, material.time, material.notes ?? null, material.imageUri ?? null, now]
  );
  return { ...material, id, createdAt: now };
}

export async function updateMaterial(id: string, material: Partial<Material>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (material.type !== undefined) { fields.push('type = ?'); values.push(material.type); }
  if (material.meters !== undefined) { fields.push('meters = ?'); values.push(material.meters); }
  if (material.notes !== undefined) { fields.push('notes = ?'); values.push(material.notes ?? null); }

  if (fields.length > 0) {
    values.push(id);
    await database.runAsync(`UPDATE materials SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM materials WHERE id = ?', [id]);
}

export async function getMaterialsSummary(projectId: string, date: string): Promise<Record<string, number>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ type: string; total: number }>(
    'SELECT type, SUM(meters) as total FROM materials WHERE project_id = ? AND date = ? GROUP BY type',
    [projectId, date]
  );
  const summary: Record<string, number> = {};
  for (const row of rows) {
    summary[row.type] = row.total;
  }
  return summary;
}

// ==================== WORKERS ====================

export async function getActiveWorkers(): Promise<Worker[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; first_name: string; last_name: string;
    active: number; created_at: string;
  }>('SELECT * FROM workers WHERE active = 1 ORDER BY last_name, first_name');
  return rows.map(mapWorker);
}

export async function getAllWorkers(): Promise<Worker[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; first_name: string; last_name: string;
    active: number; created_at: string;
  }>('SELECT * FROM workers ORDER BY active DESC, last_name, first_name');
  return rows.map(mapWorker);
}

export async function createWorker(firstName: string, lastName: string): Promise<Worker> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO workers (id, first_name, last_name, active, created_at) VALUES (?, ?, ?, 1, ?)',
    [id, firstName, lastName, now]
  );
  return { id, firstName, lastName, active: true, createdAt: now };
}

export async function updateWorkerStatus(id: string, active: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE workers SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

// ==================== WORKER HOURS ====================

export async function getWorkerHours(projectId: string, date: string): Promise<WorkerHours[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; worker_id: string; project_id: string; date: string;
    start_time: string; end_time: string; break_hours: number;
    total_hours: number; status: string; overtime: number;
    notes: string | null; created_at: string;
  }>('SELECT * FROM worker_hours WHERE project_id = ? AND date = ? ORDER BY created_at', [projectId, date]);
  return rows.map(mapWorkerHours);
}

export async function upsertWorkerHours(hours: Omit<WorkerHours, 'id' | 'createdAt'>): Promise<WorkerHours> {
  const database = await getDatabase();
  const existing = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM worker_hours WHERE worker_id = ? AND project_id = ? AND date = ?',
    [hours.workerId, hours.projectId, hours.date]
  );

  const now = new Date().toISOString();
  if (existing) {
    await database.runAsync(
      `UPDATE worker_hours SET start_time = ?, end_time = ?, break_hours = ?, total_hours = ?, status = ?, overtime = ?, notes = ? WHERE id = ?`,
      [hours.startTime, hours.endTime, hours.breakHours, hours.totalHours, hours.status, hours.overtime ? 1 : 0, hours.notes ?? null, existing.id]
    );
    return { ...hours, id: existing.id, createdAt: now };
  } else {
    const id = Crypto.randomUUID();
    await database.runAsync(
      `INSERT INTO worker_hours (id, worker_id, project_id, date, start_time, end_time, break_hours, total_hours, status, overtime, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, hours.workerId, hours.projectId, hours.date, hours.startTime, hours.endTime,
       hours.breakHours, hours.totalHours, hours.status, hours.overtime ? 1 : 0, hours.notes ?? null, now]
    );
    return { ...hours, id, createdAt: now };
  }
}

export async function deleteWorkerHours(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM worker_hours WHERE id = ?', [id]);
}

export async function getTotalHours(projectId: string, date: string): Promise<{ totalHours: number; workersCount: number }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null; count: number }>(
    `SELECT SUM(total_hours) as total, COUNT(*) as count FROM worker_hours WHERE project_id = ? AND date = ? AND status = 'present'`,
    [projectId, date]
  );
  return { totalHours: result?.total ?? 0, workersCount: result?.count ?? 0 };
}

// ==================== VEHICLES ====================

export async function getActiveVehicle(): Promise<Vehicle | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: string; make: string; model: string;
    registration_number: string; current_odometer: number;
    active: number; created_at: string;
  }>('SELECT * FROM vehicles WHERE active = 1 ORDER BY created_at DESC LIMIT 1');
  if (!row) return null;
  return mapVehicle(row);
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; make: string; model: string;
    registration_number: string; current_odometer: number;
    active: number; created_at: string;
  }>('SELECT * FROM vehicles ORDER BY active DESC, created_at DESC');
  return rows.map(mapVehicle);
}

export async function createVehicle(make: string, model: string, registrationNumber: string, currentOdometer: number): Promise<Vehicle> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO vehicles (id, make, model, registration_number, current_odometer, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [id, make, model, registrationNumber, currentOdometer, now]
  );
  return { id, make, model, registrationNumber, currentOdometer, active: true, createdAt: now };
}

export async function updateVehicleOdometer(id: string, odometer: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE vehicles SET current_odometer = ? WHERE id = ?', [odometer, id]);
}

// ==================== TRIPS ====================

export async function getTrips(projectId: string, date: string): Promise<Trip[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; vehicle_id: string; project_id: string; date: string;
    start_time: string; end_time: string; from_location: string;
    to_location: string; start_odometer: number; end_odometer: number;
    distance: number; purpose: string | null; notes: string | null; created_at: string;
  }>('SELECT * FROM trips WHERE project_id = ? AND date = ? ORDER BY start_time DESC', [projectId, date]);
  return rows.map(mapTrip);
}

export async function createTrip(trip: Omit<Trip, 'id' | 'createdAt'>): Promise<Trip> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO trips (id, vehicle_id, project_id, date, start_time, end_time, from_location, to_location, start_odometer, end_odometer, distance, purpose, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, trip.vehicleId, trip.projectId, trip.date, trip.startTime, trip.endTime,
     trip.fromLocation, trip.toLocation, trip.startOdometer, trip.endOdometer,
     trip.distance, trip.purpose ?? null, trip.notes ?? null, now]
  );
  // Update vehicle odometer
  await updateVehicleOdometer(trip.vehicleId, trip.endOdometer);
  return { ...trip, id, createdAt: now };
}

export async function updateTrip(id: string, trip: Partial<Trip>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (trip.startTime !== undefined) { fields.push('start_time = ?'); values.push(trip.startTime); }
  if (trip.endTime !== undefined) { fields.push('end_time = ?'); values.push(trip.endTime); }
  if (trip.fromLocation !== undefined) { fields.push('from_location = ?'); values.push(trip.fromLocation); }
  if (trip.toLocation !== undefined) { fields.push('to_location = ?'); values.push(trip.toLocation); }
  if (trip.startOdometer !== undefined) { fields.push('start_odometer = ?'); values.push(trip.startOdometer); }
  if (trip.endOdometer !== undefined) { fields.push('end_odometer = ?'); values.push(trip.endOdometer); }
  if (trip.distance !== undefined) { fields.push('distance = ?'); values.push(trip.distance); }
  if (trip.purpose !== undefined) { fields.push('purpose = ?'); values.push(trip.purpose ?? null); }
  if (trip.notes !== undefined) { fields.push('notes = ?'); values.push(trip.notes ?? null); }

  if (fields.length > 0) {
    values.push(id);
    await database.runAsync(`UPDATE trips SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteTrip(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM trips WHERE id = ?', [id]);
}

export async function getTotalKm(projectId: string, date: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(distance) as total FROM trips WHERE project_id = ? AND date = ?',
    [projectId, date]
  );
  return result?.total ?? 0;
}

export async function getLastOdometer(vehicleId: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ end_odometer: number }>(
    'SELECT end_odometer FROM trips WHERE vehicle_id = ? ORDER BY date DESC, end_time DESC LIMIT 1',
    [vehicleId]
  );
  if (result) return result.end_odometer;
  const vehicle = await database.getFirstAsync<{ current_odometer: number }>(
    'SELECT current_odometer FROM vehicles WHERE id = ?',
    [vehicleId]
  );
  return vehicle?.current_odometer ?? 0;
}

// ==================== DATE RANGE QUERIES (for export) ====================

export async function getAsphaltDeliveriesRange(projectId: string, dateFrom: string, dateTo: string): Promise<AsphaltDelivery[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; project_id: string; lieferschein_number: string;
    date: string; time: string; asphalt_class: string; tons: number;
    driver: string | null; truck_number: string | null; notes: string | null;
    image_uri: string | null; created_at: string; updated_at: string;
  }>('SELECT * FROM asphalt_deliveries WHERE project_id = ? AND date BETWEEN ? AND ? ORDER BY date, time', [projectId, dateFrom, dateTo]);
  return rows.map(mapAsphaltDelivery);
}

export async function getTotalTonsRange(projectId: string, dateFrom: string, dateTo: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(tons) as total FROM asphalt_deliveries WHERE project_id = ? AND date BETWEEN ? AND ?',
    [projectId, dateFrom, dateTo]
  );
  return result?.total ?? 0;
}

export async function getMaterialsRange(projectId: string, dateFrom: string, dateTo: string): Promise<Material[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; project_id: string; type: string;
    from_km: string; to_km: string; meters: number;
    date: string; time: string; notes: string | null;
    image_uri: string | null; created_at: string;
  }>('SELECT * FROM materials WHERE project_id = ? AND date BETWEEN ? AND ? ORDER BY date, time', [projectId, dateFrom, dateTo]);
  return rows.map(mapMaterial);
}

export async function getMaterialsSummaryRange(projectId: string, dateFrom: string, dateTo: string): Promise<Record<string, number>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ type: string; total: number }>(
    'SELECT type, SUM(meters) as total FROM materials WHERE project_id = ? AND date BETWEEN ? AND ? GROUP BY type',
    [projectId, dateFrom, dateTo]
  );
  const summary: Record<string, number> = {};
  for (const row of rows) { summary[row.type] = row.total; }
  return summary;
}

export async function getWorkerHoursRange(projectId: string, dateFrom: string, dateTo: string): Promise<WorkerHours[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; worker_id: string; project_id: string; date: string;
    start_time: string; end_time: string; break_hours: number;
    total_hours: number; status: string; overtime: number;
    notes: string | null; created_at: string;
  }>('SELECT * FROM worker_hours WHERE project_id = ? AND date BETWEEN ? AND ? ORDER BY date, created_at', [projectId, dateFrom, dateTo]);
  return rows.map(mapWorkerHours);
}

export async function getTotalHoursRange(projectId: string, dateFrom: string, dateTo: string): Promise<{ totalHours: number; workersCount: number }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null; count: number }>(
    `SELECT SUM(total_hours) as total, COUNT(DISTINCT worker_id) as count FROM worker_hours WHERE project_id = ? AND date BETWEEN ? AND ? AND status = 'present'`,
    [projectId, dateFrom, dateTo]
  );
  return { totalHours: result?.total ?? 0, workersCount: result?.count ?? 0 };
}

export async function getTripsRange(projectId: string, dateFrom: string, dateTo: string): Promise<Trip[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; vehicle_id: string; project_id: string; date: string;
    start_time: string; end_time: string; from_location: string;
    to_location: string; start_odometer: number; end_odometer: number;
    distance: number; purpose: string | null; notes: string | null; created_at: string;
  }>('SELECT * FROM trips WHERE project_id = ? AND date BETWEEN ? AND ? ORDER BY date, start_time', [projectId, dateFrom, dateTo]);
  return rows.map(mapTrip);
}

export async function getTotalKmRange(projectId: string, dateFrom: string, dateTo: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(distance) as total FROM trips WHERE project_id = ? AND date BETWEEN ? AND ?',
    [projectId, dateFrom, dateTo]
  );
  return result?.total ?? 0;
}

// ==================== SEED DATA ====================

export async function seedDatabase(): Promise<void> {
  const database = await getDatabase();
  const existingProject = await database.getFirstAsync<{ id: string }>('SELECT id FROM projects LIMIT 1');
  if (existingProject) return;

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Seed project
  await database.runAsync(
    'INSERT INTO projects (id, name, location, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
    ['project-1', 'B455 Darmstadt - Abschnitt 2', 'Darmstadt', now, now]
  );

  // Seed workers
  const workers = [
    ['worker-1', 'Jan', 'Kowalski'],
    ['worker-2', 'Adam', 'Nowak'],
    ['worker-3', 'Piotr', 'Wiśniewski'],
    ['worker-4', 'Marek', 'Wójcik'],
    ['worker-5', 'Tomasz', 'Kamiński'],
  ];
  for (const [id, first, last] of workers) {
    await database.runAsync(
      'INSERT INTO workers (id, first_name, last_name, active, created_at) VALUES (?, ?, ?, 1, ?)',
      [id!, first!, last!, now]
    );
  }

  // Seed vehicle
  await database.runAsync(
    'INSERT INTO vehicles (id, make, model, registration_number, current_odometer, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    ['vehicle-1', 'Mercedes', 'Sprinter', 'OF-AB 1234', 145230, now]
  );

  // Seed some asphalt deliveries for today
  await database.runAsync(
    `INSERT INTO asphalt_deliveries (id, project_id, lieferschein_number, date, time, asphalt_class, tons, driver, truck_number, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asphalt-1', 'project-1', '123456', today!, '07:30', 'AC 11 D S', 25.5, 'Hans Mueller', 'OF-XY 789', now, now]
  );
  await database.runAsync(
    `INSERT INTO asphalt_deliveries (id, project_id, lieferschein_number, date, time, asphalt_class, tons, driver, truck_number, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asphalt-2', 'project-1', '123457', today!, '09:15', 'SMA 11', 18.0, 'Karl Schmidt', 'DA-AB 456', now, now]
  );

  // Seed materials for today
  await database.runAsync(
    `INSERT INTO materials (id, project_id, type, from_km, to_km, meters, date, time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['material-1', 'project-1', 'Tack Coat', '0+000', '0+450', 450, today!, '08:00', now]
  );

  // Seed a trip for today
  await database.runAsync(
    `INSERT INTO trips (id, vehicle_id, project_id, date, start_time, end_time, from_location, to_location, start_odometer, end_odometer, distance, purpose, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['trip-1', 'vehicle-1', 'project-1', today!, '06:00', '06:45', 'Hotel', 'Baustelle B455', 145230, 145267, 37, 'Dojazd na budowę', now]
  );
}

// ==================== MATERIALS CATALOG ====================

export async function getMaterialsCatalog(): Promise<MaterialCatalog[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; name: string; unit: string; price_per_unit: number;
    density: number | null; category: string | null; created_at: string;
  }>('SELECT * FROM materials_catalog ORDER BY name');
  return rows.map(mapMaterialCatalog);
}

export async function addMaterialCatalog(material: Omit<MaterialCatalog, 'id' | 'createdAt'>): Promise<MaterialCatalog> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO materials_catalog (id, name, unit, price_per_unit, density, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, material.name, material.unit, material.pricePerUnit, material.density ?? null, material.category ?? null, now]
  );
  return { ...material, id, createdAt: now };
}

export async function updateMaterialCatalog(id: string, updates: Partial<MaterialCatalog>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.unit !== undefined) { fields.push('unit = ?'); values.push(updates.unit); }
  if (updates.pricePerUnit !== undefined) { fields.push('price_per_unit = ?'); values.push(updates.pricePerUnit); }
  if (updates.density !== undefined) { fields.push('density = ?'); values.push(updates.density ?? null); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category ?? null); }

  if (fields.length > 0) {
    values.push(id);
    await database.runAsync(`UPDATE materials_catalog SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteMaterialCatalog(id: string): Promise<void> {
  const database = await getDatabase();
  const usageCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM material_usage WHERE material_id = ?',
    [id]
  );
  if (usageCount && usageCount.count > 0) {
    throw new Error('Nie można usunąć materiału, ponieważ istnieją powiązane użycia');
  }
  await database.runAsync('DELETE FROM materials_catalog WHERE id = ?', [id]);
}

// ==================== MATERIAL USAGE ====================

export async function getMaterialUsageByProjectAndDate(projectId: string, date: string): Promise<MaterialUsage[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; project_id: string; material_id: string; date: string;
    input_quantity: number; input_unit: string; thickness_cm: number | null;
    final_quantity: number; cost: number; price_per_unit_at_time: number;
    notes: string | null; created_at: string; name: string;
  }>(`
    SELECT mu.*, mc.name 
    FROM material_usage mu 
    JOIN materials_catalog mc ON mu.material_id = mc.id 
    WHERE mu.project_id = ? AND mu.date = ? 
    ORDER BY mu.created_at
  `, [projectId, date]);
  return rows.map(mapMaterialUsage);
}

export async function addMaterialUsage(usage: Omit<MaterialUsage, 'id' | 'createdAt'>): Promise<MaterialUsage> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO material_usage (id, project_id, material_id, date, input_quantity, input_unit, thickness_cm, final_quantity, cost, price_per_unit_at_time, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, usage.projectId, usage.materialId, usage.date, usage.inputQuantity, usage.inputUnit,
     usage.thicknessCm ?? null, usage.finalQuantity, usage.cost, usage.pricePerUnitAtTime,
     usage.notes ?? null, now]
  );
  return { ...usage, id, createdAt: now };
}

export async function deleteMaterialUsage(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM material_usage WHERE id = ?', [id]);
}

export async function getMaterialUsageForExport(
  startDate: string, 
  endDate: string, 
  projectId?: string
): Promise<MaterialUsage[]> {
  const database = await getDatabase();
  let query = `
    SELECT mu.*, mc.name, p.name as project_name
    FROM material_usage mu 
    JOIN materials_catalog mc ON mu.material_id = mc.id 
    JOIN projects p ON mu.project_id = p.id 
    WHERE mu.date BETWEEN ? AND ?
  `;
  const params: (string | number)[] = [startDate, endDate];
  
  if (projectId) {
    query += ' AND mu.project_id = ?';
    params.push(projectId);
  }
  
  query += ' ORDER BY mu.date, mu.created_at';
  
  const rows = await database.getAllAsync<{
    id: string; project_id: string; material_id: string; date: string;
    input_quantity: number; input_unit: string; thickness_cm: number | null;
    final_quantity: number; cost: number; price_per_unit_at_time: number;
    notes: string | null; created_at: string; name: string; project_name: string;
  }>(query, params);
  
  return rows.map(row => ({
    ...mapMaterialUsage(row),
    projectName: row.project_name,
  }));
}

// ==================== MAPPERS ====================

function mapProject(row: {
  id: string; name: string; location: string | null;
  start_date: string | null; end_date: string | null;
  active: number; created_at: string; updated_at: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAsphaltDelivery(row: {
  id: string; project_id: string; lieferschein_number: string;
  date: string; time: string; asphalt_class: string; tons: number;
  driver: string | null; truck_number: string | null; notes: string | null;
  image_uri: string | null; created_at: string; updated_at: string;
}): AsphaltDelivery {
  return {
    id: row.id,
    projectId: row.project_id,
    lieferscheinNumber: row.lieferschein_number,
    date: row.date,
    time: row.time,
    asphaltClass: row.asphalt_class,
    tons: row.tons,
    driver: row.driver ?? undefined,
    truckNumber: row.truck_number ?? undefined,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMaterial(row: {
  id: string; project_id: string; type: string;
  from_km: string; to_km: string; meters: number;
  date: string; time: string; notes: string | null;
  image_uri: string | null; created_at: string;
}): Material {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    meters: row.meters,
    date: row.date,
    time: row.time,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
  };
}

function mapWorker(row: {
  id: string; first_name: string; last_name: string;
  active: number; created_at: string;
}): Worker {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function mapWorkerHours(row: {
  id: string; worker_id: string; project_id: string; date: string;
  start_time: string; end_time: string; break_hours: number;
  total_hours: number; status: string; overtime: number;
  notes: string | null; created_at: string;
}): WorkerHours {
  return {
    id: row.id,
    workerId: row.worker_id,
    projectId: row.project_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    breakHours: row.break_hours,
    totalHours: row.total_hours,
    status: row.status as WorkerHours['status'],
    overtime: row.overtime === 1,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapVehicle(row: {
  id: string; make: string; model: string;
  registration_number: string; current_odometer: number;
  active: number; created_at: string;
}): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    registrationNumber: row.registration_number,
    currentOdometer: row.current_odometer,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function mapTrip(row: {
  id: string; vehicle_id: string; project_id: string; date: string;
  start_time: string; end_time: string; from_location: string;
  to_location: string; start_odometer: number; end_odometer: number;
  distance: number; purpose: string | null; notes: string | null; created_at: string;
}): Trip {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    projectId: row.project_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    fromLocation: row.from_location,
    toLocation: row.to_location,
    startOdometer: row.start_odometer,
    endOdometer: row.end_odometer,
    distance: row.distance,
    purpose: row.purpose ?? '',
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapMaterialCatalog(row: {
  id: string; name: string; unit: string; price_per_unit: number;
  density: number | null; category: string | null; created_at: string;
}): MaterialCatalog {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    pricePerUnit: row.price_per_unit,
    density: row.density ?? undefined,
    category: row.category ?? undefined,
    createdAt: row.created_at,
  };
}

function mapMaterialUsage(row: {
  id: string; project_id: string; material_id: string; date: string;
  input_quantity: number; input_unit: string; thickness_cm: number | null;
  final_quantity: number; cost: number; price_per_unit_at_time: number;
  notes: string | null; created_at: string; name?: string; project_name?: string;
}): MaterialUsage {
  return {
    id: row.id,
    projectId: row.project_id,
    materialId: row.material_id,
    date: row.date,
    inputQuantity: row.input_quantity,
    inputUnit: row.input_unit,
    thicknessCm: row.thickness_cm ?? undefined,
    finalQuantity: row.final_quantity,
    cost: row.cost,
    pricePerUnitAtTime: row.price_per_unit_at_time,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}
