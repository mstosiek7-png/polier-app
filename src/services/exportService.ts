import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import {
  getActiveProject,
  getActiveVehicle,
  getAsphaltDeliveriesRange,
  getTotalTonsRange,
  getMaterialsRange,
  getMaterialsSummaryRange,
  getWorkerHoursRange,
  getTotalHoursRange,
  getTripsRange,
  getTotalKmRange,
  getActiveWorkers,
} from './database';
import { generatePdfHtml, generatePdfFile } from './pdfGenerator';
import { formatWhatsAppMessage, shareViaWhatsApp } from './whatsappFormatter';
import { formatDate } from '../utils/formatters';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';
import type { AsphaltDelivery, Material, Trip } from '../types';

// ==================== TYPES ====================

export interface ExportOptions {
  includeAsphalt: boolean;
  includeMaterials: boolean;
  includeHours: boolean;
  includeVehicle: boolean;
}

export interface WorkerHourRow {
  workerName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  totalHours: number;
  status: string;
  overtime: boolean;
}

export interface ReportData {
  projectName: string;
  projectLocation?: string;
  dateLabel: string;
  polierName: string;
  asphaltDeliveries: AsphaltDelivery[];
  asphaltTotal: number;
  materials: Material[];
  materialsSummary: Record<string, number>;
  workerHours: WorkerHourRow[];
  workersCount: number;
  totalHours: number;
  trips: Trip[];
  totalKm: number;
  vehicleName?: string;
}

// ==================== DATE RANGE ====================

export type DateRangeType = 'today' | 'yesterday' | 'week' | 'custom';

export function getDateRange(type: DateRangeType, customFrom?: string, customTo?: string): { from: string; to: string } {
  const today = new Date();
  switch (type) {
    case 'today':
      return { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
    case 'yesterday': {
      const yesterday = subDays(today, 1);
      return { from: format(yesterday, 'yyyy-MM-dd'), to: format(yesterday, 'yyyy-MM-dd') };
    }
    case 'week': {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return { from: format(weekStart, 'yyyy-MM-dd'), to: format(weekEnd, 'yyyy-MM-dd') };
    }
    case 'custom':
      return { from: customFrom ?? format(today, 'yyyy-MM-dd'), to: customTo ?? format(today, 'yyyy-MM-dd') };
  }
}

export function getDateLabel(type: DateRangeType, from: string, to: string): string {
  if (from === to) {
    return formatDate(from);
  }
  return `${formatDate(from)} - ${formatDate(to)}`;
}

// ==================== DATA FETCHING ====================

export async function fetchReportData(
  dateFrom: string,
  dateTo: string,
  options: ExportOptions,
): Promise<ReportData> {
  const project = await getActiveProject();
  if (!project) throw new Error('NO_ACTIVE_PROJECT');

  const projectId = project.id;

  const [asphaltDeliveries, asphaltTotal, materials, materialsSummary, workerHoursRaw, hoursStats, trips, totalKm, vehicle, workers] =
    await Promise.all([
      options.includeAsphalt ? getAsphaltDeliveriesRange(projectId, dateFrom, dateTo) : Promise.resolve([]),
      options.includeAsphalt ? getTotalTonsRange(projectId, dateFrom, dateTo) : Promise.resolve(0),
      options.includeMaterials ? getMaterialsRange(projectId, dateFrom, dateTo) : Promise.resolve([]),
      options.includeMaterials ? getMaterialsSummaryRange(projectId, dateFrom, dateTo) : Promise.resolve({}),
      options.includeHours ? getWorkerHoursRange(projectId, dateFrom, dateTo) : Promise.resolve([]),
      options.includeHours ? getTotalHoursRange(projectId, dateFrom, dateTo) : Promise.resolve({ totalHours: 0, workersCount: 0 }),
      options.includeVehicle ? getTripsRange(projectId, dateFrom, dateTo) : Promise.resolve([]),
      options.includeVehicle ? getTotalKmRange(projectId, dateFrom, dateTo) : Promise.resolve(0),
      getActiveVehicle(),
      options.includeHours ? getActiveWorkers() : Promise.resolve([]),
    ]);

  // Map worker IDs to names
  const workerMap = new Map(workers.map(w => [w.id, `${w.firstName} ${w.lastName}`]));

  const workerHours: WorkerHourRow[] = workerHoursRaw.map(wh => ({
    workerName: workerMap.get(wh.workerId) ?? wh.workerId,
    date: wh.date,
    startTime: wh.startTime,
    endTime: wh.endTime,
    breakHours: wh.breakHours,
    totalHours: wh.totalHours,
    status: wh.status,
    overtime: wh.overtime,
  }));

  const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : undefined;

  return {
    projectName: project.name,
    projectLocation: project.location,
    dateLabel: getDateLabel(
      dateFrom === dateTo ? 'today' : 'custom',
      dateFrom,
      dateTo,
    ),
    polierName: 'Polier',
    asphaltDeliveries,
    asphaltTotal,
    materials,
    materialsSummary,
    workerHours,
    workersCount: hoursStats.workersCount,
    totalHours: hoursStats.totalHours,
    trips,
    totalKm,
    vehicleName,
  };
}

// ==================== PDF EXPORT ====================

export async function exportPdf(
  dateFrom: string,
  dateTo: string,
  options: ExportOptions,
): Promise<void> {
  const data = await fetchReportData(dateFrom, dateTo, options);
  const html = generatePdfHtml(data, options);
  const uri = await generatePdfFile(html);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Eksport PDF',
    UTI: 'com.adobe.pdf',
  });
}

// ==================== EXCEL EXPORT ====================

export async function exportExcel(
  dateFrom: string,
  dateTo: string,
  options: ExportOptions,
): Promise<void> {
  const data = await fetchReportData(dateFrom, dateTo, options);
  const wb = XLSX.utils.book_new();

  if (options.includeAsphalt && data.asphaltDeliveries.length > 0) {
    const rows = data.asphaltDeliveries.map(d => ({
      'Nr Lieferschein': d.lieferscheinNumber,
      'Data': d.date,
      'Czas': d.time,
      'Klasa': d.asphaltClass,
      'Tony': d.tons,
      'Kierowca': d.driver ?? '',
      'LKW': d.truckNumber ?? '',
    }));
    rows.push({
      'Nr Lieferschein': 'SUMA',
      'Data': '',
      'Czas': '',
      'Klasa': '',
      'Tony': data.asphaltTotal,
      'Kierowca': '',
      'LKW': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Asfalt');
  }

  if (options.includeMaterials && data.materials.length > 0) {
    const rows = data.materials.map(m => ({
      'Typ': m.type,
      'Data': m.date,
      'Czas': m.time,
      'Metry (MB)': m.meters,
      'Notatki': m.notes ?? '',
    }));
    // Add summary rows
    for (const [type, meters] of Object.entries(data.materialsSummary)) {
      rows.push({
        'Typ': `SUMA: ${type}`,
        'Data': '',
        'Czas': '',
        'Metry (MB)': meters,
        'Notatki': '',
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Materialy');
  }

  if (options.includeHours && data.workerHours.length > 0) {
    const rows = data.workerHours.map(wh => ({
      'Pracownik': wh.workerName,
      'Data': wh.date,
      'Start': wh.startTime,
      'Koniec': wh.endTime,
      'Przerwa (h)': wh.breakHours,
      'Suma (h)': wh.totalHours,
      'Status': wh.status,
      'Nadgodziny': wh.overtime ? 'Tak' : '',
    }));
    rows.push({
      'Pracownik': `SUMA: ${data.workersCount} pracownikow`,
      'Data': '',
      'Start': '',
      'Koniec': '',
      'Przerwa (h)': 0,
      'Suma (h)': data.totalHours,
      'Status': '',
      'Nadgodziny': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Godziny');
  }

  if (options.includeVehicle && data.trips.length > 0) {
    const rows = data.trips.map(t => ({
      'Data': t.date,
      'Czas': `${t.startTime}-${t.endTime}`,
      'Skad': t.fromLocation,
      'Dokad': t.toLocation,
      'Start km': t.startOdometer,
      'Koniec km': t.endOdometer,
      'Dystans': t.distance,
      'Cel': t.purpose,
    }));
    rows.push({
      'Data': 'SUMA',
      'Czas': '',
      'Skad': '',
      'Dokad': '',
      'Start km': 0,
      'Koniec km': 0,
      'Dystans': data.totalKm,
      'Cel': '',
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Kilometrowka');
  }

  // Write to base64 and save
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileName = `raport_${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateFrom}.xlsx`;
  const file = new ExpoFile(Paths.cache, fileName);
  file.write(wbout, { encoding: 'base64' });
  const filePath = file.uri;

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Eksport Excel',
  });
}

// ==================== WHATSAPP EXPORT ====================

export async function exportWhatsApp(
  dateFrom: string,
  dateTo: string,
  options: ExportOptions,
): Promise<void> {
  const data = await fetchReportData(dateFrom, dateTo, options);
  const text = formatWhatsAppMessage(data, options);
  await shareViaWhatsApp(text);
}
