import * as Print from 'expo-print';
import type { ReportData, ExportOptions } from './exportService';
import { formatNumber, formatDate } from '../utils/formatters';
import { fetchMaterialUsageData, getDateRange } from './exportService';

export async function generatePdfHtml(
  data: ReportData, 
  options: ExportOptions,
  projectId?: string,
  materialUsage?: any[]
): Promise<string> {
  let sectionsHtml = '';
  
  // If material usage not provided but materials are included, fetch them
  let materialUsageData = materialUsage;
  if (options.includeMaterials && !materialUsageData && projectId) {
    const { from, to } = getDateRange('custom', '', '');
    materialUsageData = await fetchMaterialUsageData(from, to, projectId);
  }

  if (options.includeAsphalt && data.asphaltDeliveries.length > 0) {
    const rows = data.asphaltDeliveries.map(d => `
      <tr>
        <td>${d.lieferscheinNumber}</td>
        <td>${formatDate(d.date)}</td>
        <td>${d.time}</td>
        <td>${d.asphaltClass}</td>
        <td style="text-align:right">${formatNumber(d.tons)}</td>
        <td>${d.driver ?? ''}</td>
        <td>${d.truckNumber ?? ''}</td>
      </tr>
    `).join('');

    sectionsHtml += `
      <div class="section">
        <div class="section-title">1. Asfalt - Lieferschein</div>
        <table>
          <thead><tr>
            <th>Nr Lieferschein</th>
            <th>Data</th>
            <th>Czas</th>
            <th>Klasa</th>
            <th style="text-align:right">Tony</th>
            <th>Kierowca</th>
            <th>LKW</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="4"><strong>SUMA</strong></td>
              <td style="text-align:right"><strong>${formatNumber(data.asphaltTotal)} t</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (options.includeMaterials && data.materials.length > 0) {
    const rows = data.materials.map(m => `
      <tr>
        <td>${m.type}</td>
        <td>${formatDate(m.date)}</td>
        <td>${m.time}</td>
        <td style="text-align:right">${formatNumber(m.meters, 1)}</td>
        <td>${m.notes ?? ''}</td>
      </tr>
    `).join('');

    const summaryRows = Object.entries(data.materialsSummary).map(([type, meters]) =>
      `<tr class="total-row"><td colspan="3"><strong>${type}</strong></td><td style="text-align:right"><strong>${formatNumber(meters, 0)} MB</strong></td><td></td></tr>`
    ).join('');

    sectionsHtml += `
      <div class="section">
        <div class="section-title">2. Materialy (Metry biezace)</div>
        <table>
          <thead><tr>
            <th>Typ</th>
            <th>Data</th>
            <th>Czas</th>
            <th style="text-align:right">Metry (MB)</th>
            <th>Notatki</th>
          </tr></thead>
          <tbody>
            ${rows}
            ${summaryRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Material Usage section
  if (options.includeMaterials && materialUsageData && materialUsageData.length > 0) {
    const rows = materialUsageData.map((mu: any) => `
      <tr>
        <td>${formatDate(mu.date)}</td>
        <td>${mu.projectName || data.projectName}</td>
        <td>${mu.name || ''}</td>
        <td style="text-align:right">${formatNumber(mu.finalQuantity, 2)}</td>
        <td>${mu.inputUnit}</td>
        <td style="text-align:right">${formatNumber(mu.cost, 2)} zł</td>
      </tr>
    `).join('');
    
    const totalCost = materialUsageData.reduce((sum: number, mu: any) => sum + mu.cost, 0);
    const totalQuantity = materialUsageData.reduce((sum: number, mu: any) => sum + mu.finalQuantity, 0);
    
    sectionsHtml += `
      <div class="section">
        <div class="section-title">3. Materiały (zużycie)</div>
        <table>
          <thead><tr>
            <th>Data</th>
            <th>Projekt</th>
            <th>Materiał</th>
            <th style="text-align:right">Ilość</th>
            <th>Jednostka</th>
            <th style="text-align:right">Koszt</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="3"><strong>SUMA</strong></td>
              <td style="text-align:right"><strong>${formatNumber(totalQuantity, 2)}</strong></td>
              <td></td>
              <td style="text-align:right"><strong>${formatNumber(totalCost, 2)} zł</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (options.includeHours && data.workerHours.length > 0) {
    const rows = data.workerHours.map(wh => `
      <tr>
        <td>${wh.workerName}</td>
        <td>${formatDate(wh.date)}</td>
        <td>${wh.startTime}</td>
        <td>${wh.endTime}</td>
        <td style="text-align:right">${formatNumber(wh.breakHours)}</td>
        <td style="text-align:right">${formatNumber(wh.totalHours)}</td>
        <td>${wh.status}</td>
        <td>${wh.overtime ? 'Tak' : ''}</td>
      </tr>
    `).join('');

    sectionsHtml += `
      <div class="section">
        <div class="section-title">4. Godziny pracownikow</div>
        <table>
          <thead><tr>
            <th>Pracownik</th>
            <th>Data</th>
            <th>Start</th>
            <th>Koniec</th>
            <th style="text-align:right">Przerwa</th>
            <th style="text-align:right">Suma h</th>
            <th>Status</th>
            <th>Nadgodziny</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="5"><strong>SUMA: ${data.workersCount} pracownikow</strong></td>
              <td style="text-align:right"><strong>${formatNumber(data.totalHours)} h</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (options.includeVehicle && data.trips.length > 0) {
    const rows = data.trips.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.startTime}-${t.endTime}</td>
        <td>${t.fromLocation}</td>
        <td>${t.toLocation}</td>
        <td style="text-align:right">${formatNumber(t.startOdometer, 0)}</td>
        <td style="text-align:right">${formatNumber(t.endOdometer, 0)}</td>
        <td style="text-align:right">${formatNumber(t.distance, 0)}</td>
        <td>${t.purpose}</td>
      </tr>
    `).join('');

    sectionsHtml += `
      <div class="section">
        <div class="section-title">5. Kilometrowka busa${data.vehicleName ? ` - ${data.vehicleName}` : ''}</div>
        <table>
          <thead><tr>
            <th>Data</th>
            <th>Czas</th>
            <th>Skad</th>
            <th>Dokad</th>
            <th style="text-align:right">Start km</th>
            <th style="text-align:right">Koniec km</th>
            <th style="text-align:right">Dystans</th>
            <th>Cel</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="6"><strong>SUMA</strong></td>
              <td style="text-align:right"><strong>${formatNumber(data.totalKm, 0)} km</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const now = new Date();
  const generatedAt = `${formatDate(now.toISOString())} ${now.toTimeString().slice(0, 5)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #212121; font-size: 11px; padding: 16px; }
    .header { background: #FF9800; color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
    .header h1 { font-size: 20px; margin-bottom: 4px; }
    .header p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
    .section { margin-bottom: 24px; }
    .section-title {
      background: #F5F5F5; padding: 8px 12px; font-size: 14px;
      font-weight: bold; border-left: 4px solid #FF9800; margin-bottom: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th { background: #FF9800; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #E0E0E0; font-size: 10px; }
    tr:nth-child(even) { background: #FAFAFA; }
    .total-row { font-weight: bold; background: #FFF3E0 !important; }
    .total-row td { border-top: 2px solid #FF9800; }
    .footer { margin-top: 32px; text-align: center; color: #9E9E9E; font-size: 9px; border-top: 1px solid #E0E0E0; padding-top: 12px; }
    .signature { margin-top: 40px; border-top: 1px solid #212121; width: 200px; text-align: center; padding-top: 4px; font-size: 10px; color: #757575; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.projectName)}</h1>
    ${data.projectLocation ? `<p>${escapeHtml(data.projectLocation)}</p>` : ''}
    <p>${data.dateLabel} | Polier: ${escapeHtml(data.polierName)}</p>
  </div>

  ${sectionsHtml}

  <div class="signature">Podpis Polier</div>

  <div class="footer">
    Polier App | Wygenerowano: ${generatedAt}
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function generatePdfFile(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });
  return uri;
}
