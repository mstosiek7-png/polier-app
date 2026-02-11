import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, IconButton, Surface } from 'react-native-paper';
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

interface DashboardStats {
  tons: number;
  materialsCount: number;
  workersCount: number;
  hours: number;
  km: number;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
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

        const materialsCount = Object.values(materialsSummary).reduce(
          (sum, val) => sum + val,
          0
        );

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>
            {t('dashboard.title')}
          </Text>
          <Text variant="bodyMedium" style={styles.projectName}>
            {project ? project.name : t('dashboard.noProject')}
          </Text>
          {project?.location && (
            <Text variant="bodySmall" style={styles.location}>
              {project.location}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="export-variant"
            iconColor="#FF9800"
            size={24}
            onPress={() => router.push('/export')}
          />
          <IconButton
            icon="cog"
            iconColor="#FF9800"
            size={24}
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
          />
        }
      >
        {/* Asphalt Card */}
        <DashboardCard
          title={t('dashboard.asphalt')}
          subtitle={t('dashboard.asphaltToday', {
            tons: formatNumber(stats.tons),
          })}
          icon="truck"
          color="#FF9800"
          onPress={() => router.push('/(tabs)/asphalt')}
        />

        {/* Materials Card */}
        <DashboardCard
          title={t('dashboard.materials')}
          subtitle={t('dashboard.materialsToday', {
            count: stats.materialsCount,
          })}
          icon="ruler"
          color="#2196F3"
          onPress={() => router.push('/(tabs)/materials')}
        />

        {/* Worker Hours Card */}
        <DashboardCard
          title={t('dashboard.hours')}
          subtitle={t('dashboard.hoursToday', {
            workers: stats.workersCount,
            hours: formatNumber(stats.hours),
          })}
          icon="account-group"
          color="#4CAF50"
          onPress={() => router.push('/(tabs)/hours')}
        />

        {/* Vehicle Card */}
        <DashboardCard
          title={t('dashboard.vehicle')}
          subtitle={t('dashboard.vehicleToday', {
            km: formatNumber(stats.km, 0),
          })}
          icon="car"
          color="#9C27B0"
          onPress={() => router.push('/(tabs)/vehicle')}
        />

        {/* Export Card */}
        <DashboardCard
          title={t('dashboard.export')}
          subtitle=""
          icon="file-chart"
          color="#607D8B"
          onPress={() => router.push('/export')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function DashboardCard({ title, subtitle, icon, color, onPress }: DashboardCardProps) {
  return (
    <Card mode="elevated" onPress={onPress} style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Surface style={[styles.iconContainer, { backgroundColor: color + '15' }]} elevation={0}>
          <MaterialCommunityIcons
            name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={28}
            color={color}
          />
        </Surface>
        <View style={styles.cardText}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  projectName: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  location: {
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#212121',
  },
  cardSubtitle: {
    color: '#757575',
    marginTop: 2,
  },
});
