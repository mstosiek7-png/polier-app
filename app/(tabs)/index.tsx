import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
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
  getMaterialCostSummary,
} from '../../src/services/database';
import type { Project } from '../../src/types';
import { getTodayISO, formatNumber } from '../../src/utils/formatters';

interface DashboardStats {
  tons: number;
  materialsTotal: number;
  workersCount: number;
  hours: number;
  km: number;
  materialCost: number;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    tons: 0,
    materialsTotal: 0,
    workersCount: 0,
    hours: 0,
    km: 0,
    materialCost: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);

      if (activeProject) {
        const today = getTodayISO();
        const [tons, materialsSummary, hoursData, km, materialCost] = await Promise.all([
          getTotalTons(activeProject.id, today),
          getMaterialsSummary(activeProject.id, today),
          getTotalHours(activeProject.id, today),
          getTotalKm(activeProject.id, today),
          getMaterialCostSummary(activeProject.id, today),
        ]);

        const materialsTotal = Object.values(materialsSummary).reduce(
          (sum, val) => sum + val,
          0
        );

        setStats({
          tons,
          materialsTotal,
          workersCount: hoursData.workersCount,
          hours: hoursData.totalHours,
          km,
          materialCost,
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

  const tiles = [
    {
      id: 1,
      title: 'Asfalt',
      subtitle: 'Lieferschein',
      icon: 'truck' as const,
      screen: '/(tabs)/asphalt',
      info: `${t('dashboard.today', 'Dzisiaj')}: ${formatNumber(stats.tons)} t`,
      color: '#FF9800',
    },
    {
      id: 2,
      title: t('tabs.materials', 'Materialy'),
      subtitle: 'Metry biezace',
      icon: 'tape-measure' as const,
      screen: '/(tabs)/materials',
      info: `${t('dashboard.today', 'Dzisiaj')}: ${formatNumber(stats.materialsTotal, 0)} MB`,
      color: '#2196F3',
    },
    {
      id: 3,
      title: t('tabs.hours', 'Godziny'),
      subtitle: t('hours.workers', 'Pracownicy'),
      icon: 'clock-outline' as const,
      screen: '/(tabs)/hours',
      info: `${t('dashboard.today', 'Dzisiaj')}: ${formatNumber(stats.hours)} h`,
      color: '#4CAF50',
    },
    {
      id: 4,
      title: t('vehicle.title', 'Kilometrowka'),
      subtitle: 'Bus',
      icon: 'car' as const,
      screen: '/(tabs)/vehicle',
      info: `${t('dashboard.today', 'Dzisiaj')}: ${formatNumber(stats.km, 0)} km`,
      color: '#9C27B0',
    },
    {
      id: 5,
      title: 'Kalkulator',
      subtitle: 'Asfaltu',
      icon: 'calculator' as const,
      screen: '/(tabs)/calculator',
      info: '',
      color: '#607D8B',
    },
    {
      id: 6,
      title: 'Raport',
      subtitle: 'Eksport',
      icon: 'file-document' as const,
      screen: '/export',
      info: '',
      color: '#795548',
    },
    {
      id: 7,
      title: 'Kalkulator materiałów',
      subtitle: 'Zużycie materiałów',
      icon: 'calculator-variant' as const,
      screen: '/(tabs)/materials-calculator',
      info: `${t('dashboard.today', 'Dzisiaj')}: ${formatNumber(stats.materialCost)} zł`,
      color: '#FF5722',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Polier App
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
        <IconButton
          icon="cog"
          iconColor="#FFFFFF"
          size={24}
          onPress={() => router.push('/settings')}
        />
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
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={styles.tileWrapper}
              onPress={() => router.push(tile.screen as any)}
              activeOpacity={0.7}
            >
              <Card style={styles.tile} mode="elevated">
                <Card.Content style={styles.tileContent}>
                  <MaterialCommunityIcons
                    name={tile.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={48}
                    color={tile.color}
                  />
                  <Text variant="titleLarge" style={styles.tileTitle}>
                    {tile.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.tileSubtitle}>
                    {tile.subtitle}
                  </Text>
                  {tile.info ? (
                    <Text variant="bodySmall" style={styles.tileInfo}>
                      {tile.info}
                    </Text>
                  ) : null}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerTextContainer: {
    flex: 1,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tileWrapper: {
    width: '50%',
    padding: 8,
  },
  tile: {
    height: 180,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  tileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tileTitle: {
    marginTop: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212121',
  },
  tileSubtitle: {
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
  },
  tileInfo: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});
