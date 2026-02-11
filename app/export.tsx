import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Text,
  Switch,
  Snackbar,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CARD_COLORS } from '../src/utils/constants';

type DateRangeOption = 'today' | 'yesterday' | 'week' | 'custom';

const DATE_OPTIONS: { key: DateRangeOption; icon: string }[] = [
  { key: 'today', icon: 'calendar-today' },
  { key: 'yesterday', icon: 'calendar-arrow-left' },
  { key: 'week', icon: 'calendar-week' },
  { key: 'custom', icon: 'calendar-range' },
];

const INCLUDE_SECTIONS = [
  { key: 'includeAsphalt', icon: 'truck-delivery', colorScheme: 'teal' as const },
  { key: 'includeMaterials', icon: 'ruler-square', colorScheme: 'orange' as const },
  { key: 'includeHours', icon: 'account-group', colorScheme: 'coral' as const },
  { key: 'includeVehicle', icon: 'car-side', colorScheme: 'purple' as const },
];

const EXPORT_ACTIONS = [
  { key: 'generatePdf', icon: 'file-pdf-box', bg: '#FFEBEE', color: '#EF5350', handler: 'pdf' },
  { key: 'generateExcel', icon: 'file-excel', bg: '#E8F5E9', color: '#66BB6A', handler: 'excel' },
  { key: 'sendWhatsapp', icon: 'whatsapp', bg: '#E8F5E9', color: '#25D366', handler: 'whatsapp' },
];

export default function ExportScreen() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRangeOption>('today');
  const [includes, setIncludes] = useState({
    includeAsphalt: true,
    includeMaterials: true,
    includeHours: true,
    includeVehicle: true,
  });
  const [snackbar, setSnackbar] = useState('');

  const toggleInclude = (key: string) => {
    setIncludes((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleExport = (type: string) => {
    const messages: Record<string, string> = {
      pdf: 'PDF - coming soon',
      excel: 'Excel - coming soon',
      whatsapp: 'WhatsApp - coming soon',
    };
    setSnackbar(messages[type] ?? '');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#00897B" />
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('export.dateRange')}
            </Text>
          </View>
          <View style={styles.dateGrid}>
            {DATE_OPTIONS.map((opt) => {
              const active = dateRange === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setDateRange(opt.key)}
                  style={[
                    styles.dateChip,
                    active && styles.dateChipActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={20}
                    color={active ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.dateChipText,
                      active && styles.dateChipTextActive,
                    ]}
                  >
                    {t(`export.${opt.key === 'week' ? 'thisWeek' : opt.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Include Sections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="format-list-checks" size={20} color="#00897B" />
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('export.include')}
            </Text>
          </View>
          <View style={styles.includeList}>
            {INCLUDE_SECTIONS.map((item) => {
              const colors = CARD_COLORS[item.colorScheme];
              const checked = includes[item.key as keyof typeof includes];
              return (
                <View key={item.key} style={styles.includeRow}>
                  <View style={styles.includeLeft}>
                    <View style={[styles.includeIcon, { backgroundColor: colors.bg }]}>
                      <MaterialCommunityIcons
                        name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={colors.icon}
                      />
                    </View>
                    <Text variant="bodyMedium" style={styles.includeLabel}>
                      {t(`export.${item.key}`)}
                    </Text>
                  </View>
                  <Switch
                    value={checked}
                    onValueChange={() => toggleInclude(item.key)}
                    color="#00897B"
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Export Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="export-variant" size={20} color="#00897B" />
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Export
            </Text>
          </View>
          <View style={styles.exportGrid}>
            {EXPORT_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => handleExport(action.handler)}
                style={({ pressed }) => [
                  styles.exportCard,
                  pressed && styles.exportCardPressed,
                ]}
              >
                <View style={[styles.exportIconWrap, { backgroundColor: action.bg }]}>
                  <MaterialCommunityIcons
                    name={action.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text variant="labelMedium" style={styles.exportLabel}>
                  {t(`export.${action.key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Date Range Chips
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateChipActive: {
    backgroundColor: '#00897B',
    elevation: 3,
    shadowOpacity: 0.15,
  },
  dateChipText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },

  // Include toggles
  includeList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },
  includeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  includeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  includeLabel: {
    color: '#1A1A2E',
    fontWeight: '500',
  },

  // Export action cards
  exportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  exportCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  exportCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  exportIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportLabel: {
    color: '#1A1A2E',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },

  snackbar: {
    borderRadius: 12,
  },
});
