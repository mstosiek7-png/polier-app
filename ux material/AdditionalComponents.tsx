// AdditionalComponents.tsx - Dodatkowe komponenty dla Polier App

import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// ===================================================================
// FloatingActionButton (FAB) - Animowany przycisk akcji
// ===================================================================

interface FABProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon = 'add',
  onPress,
  color = '#FF9800',
  size = 64,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(
      600,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.9, { duration: 100 });
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 10,
      stiffness: 150,
    });
  };

  const handlePress = () => {
    // Rotate animation on press
    rotation.value = withSpring(rotation.value + 135, {
      damping: 12,
      stiffness: 150,
    });
    onPress();
  };

  return (
    <Animated.View style={[styles.fabContainer, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.fab, { width: size, height: size, backgroundColor: color }]}
      >
        <MaterialIcons name={icon} size={size * 0.5} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fab: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ===================================================================
// SkeletonLoader - Animowany loader dla kart
// ===================================================================

interface SkeletonCardProps {
  delay?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ delay = 0 }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false
      )
    );
  }, []);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-200, 200],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.shimmerContainer}>
        <Animated.View style={[skeletonStyles.shimmer, animatedShimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={skeletonStyles.gradient}
          />
        </Animated.View>
      </View>

      <View style={skeletonStyles.iconPlaceholder} />
      <View style={skeletonStyles.titlePlaceholder} />
      <View style={skeletonStyles.subtitlePlaceholder} />
      <View style={skeletonStyles.statusPlaceholder} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    width: '48%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmer: {
    width: 200,
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  titlePlaceholder: {
    width: '80%',
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  subtitlePlaceholder: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  statusPlaceholder: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
});

// ===================================================================
// PullToRefresh - Komponent do odświeżania dashboardu
// ===================================================================

import { RefreshControl } from 'react-native';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  color?: string;
}

export const createPullToRefresh = ({
  refreshing,
  onRefresh,
  color = '#FF9800',
}: PullToRefreshProps) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={color}
      colors={[color]}
      progressBackgroundColor="#FFFFFF"
      progressViewOffset={0}
    />
  );
};

// ===================================================================
// SuccessAnimation - Animacja sukcesu po zapisie danych
// ===================================================================

interface SuccessAnimationProps {
  visible: boolean;
  onHide?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  onHide,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1.3, { damping: 10 });
      
      // Scale back
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 10 });
      }, 200);

      // Auto hide after 2 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0, { duration: 200 });
        onHide?.();
      }, 2000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[successAnimationStyles.container, animatedStyle]}>
      <View style={successAnimationStyles.circle}>
        <MaterialIcons name="check" size={48} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
};

const successAnimationStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    zIndex: 9999,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ===================================================================
// ErrorShake - Animacja błędu (shake)
// ===================================================================

interface ErrorShakeProps {
  children: React.ReactNode;
  trigger: boolean;
}

export const ErrorShake: React.FC<ErrorShakeProps> = ({ children, trigger }) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      // Shake animation
      translateX.value = withSpring(-10, { damping: 8 });
      setTimeout(() => {
        translateX.value = withSpring(10, { damping: 8 });
      }, 50);
      setTimeout(() => {
        translateX.value = withSpring(-10, { damping: 8 });
      }, 100);
      setTimeout(() => {
        translateX.value = withSpring(10, { damping: 8 });
      }, 150);
      setTimeout(() => {
        translateX.value = withSpring(0, { damping: 8 });
      }, 200);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

// ===================================================================
// LoadingOverlay - Overlay z spinnerem podczas ładowania
// ===================================================================

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Ładowanie...',
}) => {
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[loadingStyles.container, animatedContainerStyle]}>
      <View style={loadingStyles.content}>
        <Animated.View style={animatedSpinnerStyle}>
          <MaterialIcons name="refresh" size={48} color="#FF9800" />
        </Animated.View>
        <Text style={loadingStyles.text}>{text}</Text>
      </View>
    </Animated.View>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
});

// ===================================================================
// Eksport wszystkich komponentów
// ===================================================================

export {
  FloatingActionButton,
  SkeletonCard,
  createPullToRefresh,
  SuccessAnimation,
  ErrorShake,
  LoadingOverlay,
};
