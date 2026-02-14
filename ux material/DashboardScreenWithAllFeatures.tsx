// DashboardScreenWithAllFeatures.tsx
// Pełny przykład użycia wszystkich komponentów

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { DashboardCard } from './components/dashboard/DashboardCard';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import {
  FloatingActionButton,
  SkeletonCard,
  createPullToRefresh,
  SuccessAnimation,
  ErrorShake,
  LoadingOverlay,
} from './AdditionalComponents';

interface Module {
  id: string;
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  statusKey: string | null;
  statusFormat: string | null;
}

const modules: Module[] = [
  {
    id: 'asfalt',
    icon: 'local-shipping',
    iconColor: '#FF9800',
    title: 'Asfalt',
    subtitle: 'Lieferschein',
    statusKey: 'tonnage',
    statusFormat: 't',
  },
  {
    id: 'materialy',
    icon: 'straighten',
    iconColor: '#2196F3',
    title: 'Materiały',
    subtitle: 'Metry bieżące',
    statusKey: 'length',
    statusFormat: 'MB',
  },
  {
    id: 'godziny',
    icon: 'schedule',
    iconColor: '#4CAF50',
    title: 'Godziny',
    subtitle: 'Pracownicy',
    statusKey: 'hours',
    statusFormat: 'h',
  },
  {
    id: 'kilometrowka',
    icon: 'directions-car',
    iconColor: '#9C27B0',
    title: 'Kilometrówka',
    subtitle: 'Bus',
    statusKey: 'distance',
    statusFormat: 'km',
  },
  {
    id: 'kalkulator',
    icon: 'calculate',
    iconColor: '#607D8B',
    title: 'Kalkulator',
    subtitle: 'Asfaltu',
    statusKey: null,
    statusFormat: null,
  },
  {
    id: 'raport',
    icon: 'description',
    iconColor: '#795548',
    title: 'Raport',
    subtitle: 'Eksport',
    statusKey: null,
    statusFormat: null,
  },
];

export const DashboardScreenWithAllFeatures: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    tonnage: 12.5,
    length: 450.0,
    hours: 8.0,
    distance: 45.2,
  });

  // Handlers
  const handleCardPress = (moduleId: string) => {
    console.log(`Navigating to ${moduleId}`);
    // Przykład nawigacji
    // navigation.navigate(moduleId);
    
    // Przykład pokazania sukcesu
    setShowSuccess(true);
  };

  const handleSettingsPress = () => {
    console.log('Opening settings');
    // navigation.navigate('Settings');
  };

  const handleFABPress = () => {
    console.log('FAB pressed - Quick add');
    // Możesz otworzyć modal do szybkiego dodawania danych
    // setModalVisible(true);
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Symulacja pobrania danych z API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update stats with random data (przykład)
      setDailyStats({
        tonnage: Math.random() * 50,
        length: Math.random() * 1000,
        hours: Math.random() * 12,
        distance: Math.random() * 100,
      });
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Refresh error:', error);
      setShowError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getStatusText = (module: Module): string => {
    if (!module.statusKey) return '';
    const value = dailyStats[module.statusKey as keyof typeof dailyStats] || 0;
    return `Dzisiaj: ${value.toFixed(1)} ${module.statusFormat}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <DashboardHeader
        title="Polier App"
        projectName="B455 Darmstadt - Abschnitt 2"
        location="Darmstadt"
        onSettingsPress={handleSettingsPress}
      />

      {/* Main content with Pull to Refresh */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={createPullToRefresh({
          refreshing: isRefreshing,
          onRefresh: onRefresh,
          color: '#FF9800',
        })}
      >
        <ErrorShake trigger={showError}>
          <View style={styles.grid}>
            {isLoading ? (
              // Show skeleton loaders while loading
              <>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={100} />
                <SkeletonCard delay={200} />
                <SkeletonCard delay={300} />
                <SkeletonCard delay={400} />
                <SkeletonCard delay={500} />
              </>
            ) : (
              // Show actual cards
              modules.map((module, index) => (
                <DashboardCard
                  key={module.id}
                  icon={module.icon}
                  iconColor={module.iconColor}
                  title={module.title}
                  subtitle={module.subtitle}
                  status={getStatusText(module)}
                  onPress={() => handleCardPress(module.id)}
                  delay={index * 100}
                />
              ))
            )}
          </View>
        </ErrorShake>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        onPress={handleFABPress}
        color="#FF9800"
        size={64}
      />

      {/* Success Animation */}
      <SuccessAnimation
        visible={showSuccess}
        onHide={() => setShowSuccess(false)}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isLoading}
        text="Zapisywanie danych..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for FAB
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

// ===================================================================
// Przykład użycia z React Navigation
// ===================================================================

/*
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreenWithAllFeatures } from './DashboardScreenWithAllFeatures';
import { AsfaltScreen } from './screens/AsfaltScreen';
// ... inne ekrany

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreenWithAllFeatures}
        />
        <Stack.Screen
          name="asfalt"
          component={AsfaltScreen}
          options={{
            title: 'Asfalt',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#FF9800',
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen name="materialy" component={MaterialyScreen} />
        <Stack.Screen name="godziny" component={GodzinyScreen} />
        <Stack.Screen name="kilometrowka" component={KilometrowkaScreen} />
        <Stack.Screen name="kalkulator" component={KalkulatorScreen} />
        <Stack.Screen name="raport" component={RaportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
*/

// ===================================================================
// Przykład użycia z Zustand Store
// ===================================================================

/*
import { create } from 'zustand';

interface DailyStats {
  tonnage: number;
  length: number;
  hours: number;
  distance: number;
}

interface AppStore {
  dailyStats: DailyStats;
  isLoading: boolean;
  updateStats: (stats: Partial<DailyStats>) => void;
  fetchStats: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  dailyStats: {
    tonnage: 0,
    length: 0,
    hours: 0,
    distance: 0,
  },
  isLoading: false,
  
  updateStats: (stats) => {
    set((state) => ({
      dailyStats: { ...state.dailyStats, ...stats },
    }));
  },
  
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      // Fetch from API
      const response = await fetch('https://api.example.com/daily-stats');
      const data = await response.json();
      set({ dailyStats: data });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Użycie w komponencie:
const dailyStats = useStore((state) => state.dailyStats);
const isLoading = useStore((state) => state.isLoading);
const fetchStats = useStore((state) => state.fetchStats);
*/
