// DashboardCard.tsx - Nowoczesny komponent karty z animacjami Material You

import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  status: string;
  onPress: () => void;
  delay?: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  status,
  onPress,
  delay = 0,
}) => {
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const pressScale = useSharedValue(1);
  const elevation = useSharedValue(2);

  // Entrance animation
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 300,
      })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 300,
      })
    );
  }, []);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * pressScale.value },
        { translateY: translateY.value },
      ],
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(
        elevation.value,
        [2, 8],
        [0.08, 0.16],
        Extrapolate.CLAMP
      ),
      shadowRadius: interpolate(
        elevation.value,
        [2, 8],
        [8, 16],
        Extrapolate.CLAMP
      ),
      elevation: elevation.value,
    };
  });

  // Press handlers
  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
    elevation.value = withTiming(8, { duration: 100 });
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 10,
      stiffness: 150,
    });
    elevation.value = withTiming(2, { duration: 200 });
  };

  return (
    <Animated.View style={[styles.cardContainer, animatedCardStyle, animatedShadowStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <MaterialIcons name={icon} size={48} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Status */}
          <Text style={styles.status}>{status}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  touchable: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '400',
    color: '#BDBDBD',
  },
});

// ===================================================================
// DashboardHeader.tsx - Gradient header z animacjami
// ===================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface DashboardHeaderProps {
  title: string;
  projectName: string;
  location: string;
  onSettingsPress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  projectName,
  location,
  onSettingsPress,
}) => {
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-20);
  const settingsRotate = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    titleTranslateY.value = withDelay(100, withSpring(0, { damping: 15 }));
  }, []);

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedSettingsStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${settingsRotate.value}deg` }],
  }));

  const handleSettingsPress = () => {
    settingsRotate.value = withSpring(settingsRotate.value + 180, {
      damping: 12,
      stiffness: 150,
    });
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onSettingsPress();
  };

  return (
    <LinearGradient
      colors={['#FF9800', '#F57C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.headerContent, animatedTitleStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.projectName}>{projectName}</Text>
        <Text style={styles.location}>{location}</Text>
      </Animated.View>

      <Animated.View style={[styles.settingsButton, animatedSettingsStyle]}>
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.settingsTouch}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="settings" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 240,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#F57C00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -0.5,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.95,
  },
  location: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
  },
  settingsTouch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// ===================================================================
// DashboardScreen.tsx - Główny ekran z wszystkimi modułami
// ===================================================================

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { DashboardCard } from './DashboardCard';
import { DashboardHeader } from './DashboardHeader';

interface Module {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
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

export const DashboardScreen: React.FC = () => {
  const handleCardPress = (moduleId: string) => {
    console.log(`Navigating to ${moduleId}`);
    // Navigation logic here
    // navigation.navigate(moduleId);
  };

  const handleSettingsPress = () => {
    console.log('Opening settings');
    // navigation.navigate('Settings');
  };

  const getStatusText = (module: Module): string => {
    if (!module.statusKey) return '';
    // TODO: Replace with actual data from store/API
    const value = 0.0;
    return `Dzisiaj: ${value.toFixed(1)} ${module.statusFormat}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <DashboardHeader
        title="Polier App"
        projectName="B455 Darmstadt - Abschnitt 2"
        location="Darmstadt"
        onSettingsPress={handleSettingsPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {modules.map((module, index) => (
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
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

// ===================================================================
// theme.ts - Plik z wszystkimi kolorami i tokenami
// ===================================================================

export const colors = {
  // Primary
  primary: '#FF9800',
  primaryDark: '#F57C00',
  primaryLight: '#FFB74D',
  
  // Module colors
  asfalt: '#FF9800',
  materialy: '#2196F3',
  godziny: '#4CAF50',
  kilometrowka: '#9C27B0',
  kalkulator: '#607D8B',
  raport: '#795548',
  
  // Surface
  background: '#F5F5F5',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textWhite: '#FFFFFF',
  
  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export const typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '700' },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '700' },
  
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '500' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const elevation = {
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
