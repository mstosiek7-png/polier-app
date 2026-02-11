import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import type { ReportData, ExportOptions } from './exportService';
import { formatNumber } from '../utils/formatters';

export function formatWhatsAppMessage(data: ReportData, options: ExportOptions): string {
  const lines: string[] = [];

  lines.push(`*${data.projectName}*`);
  if (data.projectLocation) lines.push(data.projectLocation);
  lines.push(data.dateLabel);
  lines.push('');

  if (options.includeAsphalt && data.asphaltDeliveries.length > 0) {
    lines.push(`\u{1F69A} *Asfalt:* ${formatNumber(data.asphaltTotal)} t`);
    const byClass: Record<string, number> = {};
    for (const d of data.asphaltDeliveries) {
      byClass[d.asphaltClass] = (byClass[d.asphaltClass] ?? 0) + d.tons;
    }
    for (const [cls, tons] of Object.entries(byClass)) {
      lines.push(`  - ${cls}: ${formatNumber(tons)} t`);
    }
    lines.push('');
  }

  if (options.includeMaterials && Object.keys(data.materialsSummary).length > 0) {
    lines.push(`\u{1F4CF} *Materialy:*`);
    for (const [type, meters] of Object.entries(data.materialsSummary)) {
      lines.push(`  - ${type}: ${formatNumber(meters, 0)} MB`);
    }
    lines.push('');
  }

  if (options.includeHours && data.totalHours > 0) {
    lines.push(`\u{23F0} *Godziny:* ${formatNumber(data.totalHours)}h (${data.workersCount} os.)`);
    lines.push('');
  }

  if (options.includeVehicle && data.totalKm > 0) {
    lines.push(`\u{1F697} *Km:* ${formatNumber(data.totalKm, 0)} km`);
    if (data.vehicleName) lines.push(`  ${data.vehicleName}`);
    lines.push('');
  }

  lines.push('_Polier App_');

  return lines.join('\n');
}

export async function shareViaWhatsApp(text: string): Promise<void> {
  const encoded = encodeURIComponent(text);
  const url = `whatsapp://send?text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback: use system share sheet
    await Share.share({ message: text });
  }
}
