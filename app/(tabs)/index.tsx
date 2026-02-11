import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getActiveProject,
  getTotalTons,
  getMaterialsSummary,
  getTotalHours,
  getTotalKm,
} from '../../src/services/database';
import type { Project } from '../../src/types';
import { getTodayISO, formatNumber } from '../../src/utils/formatters';
import { format } from 'date-fns';
import { pl, de } from 'date-fns/locale';
import { CARD_COLORS } from '../../src/utils/constants';

interface DashboardStats {
  tons: number;
  materialsCount: number;
  workersCount: number;
  hours: number;
  km: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 20;
const CARD_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * 2) / 3;

interface GridCardItem {
  key: string;
  labelKey: string;
  icon: string;
  colorScheme: keyof typeof CARD_COLORS;
  route: string;
}

const GRID_ITEMS: GridCardItem[] = [
  { key: 'asphalt', labelKey: 'dashboard.asphalt', icon: 'truck-delivery', colorScheme: 'teal', route: '/(tabs)/asphalt' },
  { key: 'materials', labelKey: 'dashboard.materials', icon: 'ruler-square', colorScheme: 'orange', route: '/(tabs)/materials' },
  { key: 'hours', labelKey: 'dashboard.hours', icon: 'account-group', colorScheme: 'coral', route: '/(tabs)/hours' },
  { key: 'vehicle', labelKey: 'dashboard.vehicle', icon: 'car-side', colorScheme: 'purple', route: '/(tabs)/vehicle' },
  { key: 'export', labelKey: 'dashboard.export', icon: 'file-chart-outline', colorScheme: 'blue', route: '/export' },
  { key: 'settings', labelKey: 'dashboard.settings', icon: 'cog-outline', colorScheme: 'amber', route: '/settings' },
];

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    tons: 0,
    materialsCount: 0,
    workersCount: 0,
    hours: 0,
    km: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);

      if (activeProject) {
        const today = getTodayISO();
        const [tons, materialsSummary, hoursData, km] = await Promise.all([
          getTotalTons(activeProject.id, today),
          getMaterialsSummary(activeProject.id, today),
          getTotalHours(activeProject.id, today),
          getTotalKm(activeProject.id, today),
        ]);

        setStats({
          tons,
          materialsCount: Object.keys(materialsSummary).length,
          workersCount: hoursData.workersCount,
          hours: hoursData.totalHours,
          km,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const todayFormatted = format(new Date(), 'd MMMM yyyy', {
    locale: i18n.language === 'de' ? de : pl,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.title}>
            {t('dashboard.title')}
          </Text>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-today" size={14} color="#6B7280" />
            <Text variant="bodySmall" style={styles.dateText}>
              {t('common.today')}, {todayFormatted}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="bell-outline"
            iconColor="#1A1A2E"
            size={22}
            style={styles.headerIcon}
            onPress={() => {}}
          />
          <IconButton
            icon="cog-outline"
            iconColor="#1A1A2E"
            size={22}
            style={styles.headerIcon}
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      {/* Project info */}
      {project && (
        <View style={styles.projectBar}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#00897B" />
          <Text variant="bodyMedium" style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          {project.location && (
            <Text variant="bodySmall" style={styles.projectLocation} numberOfLines={1}>
              {' '}— {project.location}
            </Text>
          )}
        </View>
      )}

      {/* Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00897B']}
          />
        }
      >
        <View style={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <GridCard
              key={item.key}
              item={item}
              stats={stats}
              onPress={() => router.push(item.route as any)}
              t={t}
            />
          ))}
        </View>

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <Text variant="titleSmall" style={styles.summaryTitle}>
            {t('common.today')}
          </Text>
          <View style={styles.summaryRow}>
            <SummaryChip icon="truck" value={`${formatNumber(stats.tons)} t`} color="#00897B" />
            <SummaryChip icon="ruler" value={`${stats.materialsCount}`} color="#FF8A65" />
            <SummaryChip icon="account" value={`${stats.workersCount}`} color="#EF5350" />
            <SummaryChip icon="road-variant" value={`${formatNumber(stats.km, 0)} km`} color="#7E57C2" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface GridCardProps {
  item: GridCardItem;
  stats: DashboardStats;
  onPress: () => void;
  t: (key: string) => string;
}

function GridCard({ item, onPress, t }: GridCardProps) {
  const colors = CARD_COLORS[item.colorScheme];

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View
          style={[styles.cardTouchable]}
          onTouchEnd={onPress}
        >
          <View style={[styles.cardIconArea, { backgroundColor: colors.bg }]}>
            <MaterialCommunityIcons
              name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={36}
              color={colors.icon}
            />
          </View>
          <Text variant="labelMedium" style={styles.cardLabel} numberOfLines={2}>
            {t(item.labelKey)}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface SummaryChipProps {
  icon: string;
  value: string;
  color: string;
}

function SummaryChip({ icon, value, color }: SummaryChipProps) {
  return (
    <View style={styles.summaryChip}>
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={16}
        color={color}
      />
      <Text variant="labelMedium" style={[styles.summaryValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: '#1A1A2E',
    fontWeight: '700',
    fontSize: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    margin: 0,
  },
  projectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
    gap: 6,
  },
  projectName: {
    color: '#1A1A2E',
    fontWeight: '600',
    fontSize: 14,
  },
  projectLocation: {
    color: '#6B7280',
    fontSize: 13,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_SIZE,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTouchable: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  cardIconArea: {
    width: CARD_SIZE - 24,
    height: CARD_SIZE - 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#1A1A2E',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14,
  },
  summaryBar: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    color: '#1A1A2E',
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryChip: {
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontWeight: '700',
    fontSize: 13,
  },
});
