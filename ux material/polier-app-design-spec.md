# Polier App - Nowoczesny Design System (Material You)

## 🎨 Design Overview

Nowoczesna aplikacja mobilna dla brygadzistów (polierów) w branży budowy dróg asfaltowych. Design bazuje na Material Design 3 (Material You) z bogatymi animacjami i intuicyjnym interfejsem zoptymalizowanym pod kątem używania w rękawicach roboczych.

---

## 📐 Layout Structure

### Screen Dimensions
- **Width**: 390px (iPhone standard)
- **Height**: 844px (iPhone standard)
- **Safe Area Top**: 60px
- **Safe Area Bottom**: 34px

### Grid System
- **Type**: 2-column grid
- **Columns**: 2
- **Rows**: 3
- **Gap**: 16px
- **Padding**: 24px (horizontal), 16px (vertical)

---

## 🎨 Color Palette (Material You)

### Primary Colors
```
Primary Orange (Main): #FF9800
Primary Dark: #F57C00
Primary Light: #FFB74D
Primary Gradient: linear-gradient(135deg, #FF9800 0%, #F57C00 100%)
```

### Surface Colors
```
Background: #F5F5F5
Card Background: #FFFFFF
Card Shadow: rgba(0, 0, 0, 0.08)
```

### Accent Colors (Module Icons)
```
Asfalt (Orange): #FF9800
Materiały (Blue): #2196F3
Godziny (Green): #4CAF50
Kilometrówka (Purple): #9C27B0
Kalkulator (Gray): #607D8B
Raport (Brown): #795548
```

### Text Colors
```
Primary Text: #212121
Secondary Text: #757575
Disabled Text: #BDBDBD
White Text: #FFFFFF
```

### Status Colors
```
Success: #4CAF50
Warning: #FF9800
Error: #F44336
Info: #2196F3
```

---

## 📝 Typography

### Font Family
- **Primary**: Inter (fallback: Roboto, -apple-system)
- **Numbers**: SF Mono (fallback: Courier New)

### Type Scale
```typescript
// Display
display-large: 57px / 64px (line-height) / Bold
display-medium: 45px / 52px / Bold

// Headline
headline-large: 32px / 40px / Bold
headline-medium: 28px / 36px / Bold
headline-small: 24px / 32px / Bold

// Title
title-large: 22px / 28px / Medium
title-medium: 16px / 24px / Medium
title-small: 14px / 20px / Medium

// Body
body-large: 16px / 24px / Regular
body-medium: 14px / 20px / Regular
body-small: 12px / 16px / Regular

// Label
label-large: 14px / 20px / Medium
label-medium: 12px / 16px / Medium
label-small: 11px / 16px / Medium
```

---

## 🎴 Component Specifications

### 1. Header Component

**Dimensions:**
- Height: 240px
- Padding: 60px 24px 24px 24px

**Background:**
```css
background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
box-shadow: 0 4px 12px rgba(245, 124, 0, 0.3);
```

**Content:**
```typescript
{
  title: {
    text: "Polier App",
    style: {
      fontSize: 48,
      fontWeight: 700,
      color: "#FFFFFF",
      textShadow: "0 2px 8px rgba(0,0,0,0.2)"
    }
  },
  projectName: {
    text: "B455 Darmstadt - Abschnitt 2",
    style: {
      fontSize: 20,
      fontWeight: 500,
      color: "#FFFFFF",
      marginTop: 8
    }
  },
  location: {
    text: "Darmstadt",
    style: {
      fontSize: 16,
      fontWeight: 400,
      color: "rgba(255,255,255,0.9)",
      marginTop: 4
    }
  }
}
```

**Settings Button:**
```typescript
{
  position: "absolute",
  top: 60,
  right: 24,
  size: 48,
  icon: "settings",
  iconSize: 32,
  color: "#FFFFFF",
  rippleColor: "rgba(255,255,255,0.3)"
}
```

---

### 2. Dashboard Card Component

**Dimensions:**
```typescript
{
  width: "calc(50% - 8px)", // 2-column grid with 16px gap
  height: 180,
  borderRadius: 20,
  padding: 24,
  backgroundColor: "#FFFFFF",
  elevation: 2,
  shadowColor: "rgba(0,0,0,0.08)",
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  shadowOpacity: 1
}
```

**Structure:**
```typescript
interface DashboardCard {
  icon: {
    name: string;          // Material icon name
    size: 64;
    color: string;         // Module-specific color
    marginBottom: 16;
  };
  title: {
    text: string;          // e.g., "Asfalt", "Materiały"
    fontSize: 28;
    fontWeight: 700;
    color: "#212121";
    marginBottom: 4;
  };
  subtitle: {
    text: string;          // e.g., "Lieferschein", "Metry bieżące"
    fontSize: 16;
    fontWeight: 500;
    color: "#757575";
    marginBottom: 8;
  };
  status: {
    text: string;          // e.g., "Dzisiaj: 0,0 t"
    fontSize: 14;
    fontWeight: 400;
    color: "#BDBDBD";
  };
}
```

**States:**
```typescript
// Default state
{
  scale: 1.0,
  elevation: 2,
  opacity: 1.0
}

// Pressed state
{
  scale: 0.95,
  elevation: 8,
  opacity: 0.9,
  ripple: true
}

// Hover state (web)
{
  elevation: 4,
  cursor: "pointer"
}
```

---

### 3. Module Cards Configuration

```typescript
const modules = [
  {
    id: "asfalt",
    icon: "local_shipping",
    iconColor: "#FF9800",
    title: "Asfalt",
    subtitle: "Lieferschein",
    statusKey: "tonnage",
    statusFormat: "t"
  },
  {
    id: "materialy",
    icon: "straighten",
    iconColor: "#2196F3",
    title: "Materiały",
    subtitle: "Metry bieżące",
    statusKey: "length",
    statusFormat: "MB"
  },
  {
    id: "godziny",
    icon: "schedule",
    iconColor: "#4CAF50",
    title: "Godziny",
    subtitle: "Pracownicy",
    statusKey: "hours",
    statusFormat: "h"
  },
  {
    id: "kilometrowka",
    icon: "directions_car",
    iconColor: "#9C27B0",
    title: "Kilometrówka",
    subtitle: "Bus",
    statusKey: "distance",
    statusFormat: "km"
  },
  {
    id: "kalkulator",
    icon: "calculate",
    iconColor: "#607D8B",
    title: "Kalkulator",
    subtitle: "Asfaltu",
    statusKey: null,
    statusFormat: null
  },
  {
    id: "raport",
    icon: "description",
    iconColor: "#795548",
    title: "Raport",
    subtitle: "Eksport",
    statusKey: null,
    statusFormat: null
  }
];
```

---

## 🎬 Animation Specifications

### 1. Screen Entry Animations (Stagger)

```typescript
// Card entrance animation (one by one)
const cardEntranceAnimation = {
  cards: [
    { delay: 0 },      // Card 1
    { delay: 100 },    // Card 2
    { delay: 200 },    // Card 3
    { delay: 300 },    // Card 4
    { delay: 400 },    // Card 5
    { delay: 500 }     // Card 6
  ],
  animation: {
    from: {
      opacity: 0,
      translateY: 20,
      scale: 0.9
    },
    to: {
      opacity: 1,
      translateY: 0,
      scale: 1.0
    },
    duration: 300,
    easing: "cubic-bezier(0.4, 0.0, 0.2, 1)" // Material easing
  }
};
```

### 2. Card Press Animation

```typescript
const cardPressAnimation = {
  onPressIn: {
    scale: 0.95,
    elevation: 8,
    duration: 100,
    easing: "ease-out"
  },
  onPressOut: {
    scale: 1.0,
    elevation: 2,
    duration: 200,
    easing: "ease-in-out"
  },
  ripple: {
    enabled: true,
    color: "rgba(0, 0, 0, 0.1)",
    borderless: false
  }
};
```

### 3. Header Gradient Animation

```typescript
const headerGradientAnimation = {
  colors: [
    "#FF9800",
    "#F57C00",
    "#FF6F00",
    "#F57C00",
    "#FF9800"
  ],
  duration: 5000,
  loop: true,
  easing: "linear"
};
```

### 4. Icon Bounce Animation (on card press)

```typescript
const iconBounceAnimation = {
  onPress: {
    sequence: [
      { scale: 1.2, duration: 100 },
      { scale: 0.95, duration: 100 },
      { scale: 1.0, duration: 100 }
    ],
    easing: "ease-out"
  }
};
```

### 5. Status Text Update Animation

```typescript
const statusUpdateAnimation = {
  onUpdate: {
    sequence: [
      { opacity: 0, scale: 0.8, duration: 150 },
      { opacity: 1, scale: 1.0, duration: 150 }
    ],
    easing: "ease-in-out"
  }
};
```

### 6. Pull to Refresh Animation

```typescript
const pullToRefreshAnimation = {
  indicator: {
    size: 40,
    color: "#FF9800",
    position: "top-center",
    pullDistance: 80
  },
  animation: {
    pulling: {
      rotate: "0deg to 180deg",
      duration: "based on pull distance"
    },
    refreshing: {
      rotate: "continuous 360deg",
      duration: 1000
    }
  }
};
```

### 7. Floating Action Button (FAB)

```typescript
const fabAnimation = {
  position: {
    bottom: 24,
    right: 24
  },
  size: 64,
  backgroundColor: "#FF9800",
  elevation: 6,
  icon: "add",
  iconSize: 32,
  iconColor: "#FFFFFF",
  animations: {
    onPress: {
      rotate: "0deg to 135deg",
      scale: 0.9,
      duration: 200
    },
    entrance: {
      from: { scale: 0, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      duration: 300,
      delay: 600
    }
  }
};
```

---

## 🔄 Micro-interactions

### 1. Haptic Feedback
```typescript
const hapticFeedback = {
  cardPress: "impactLight",
  success: "notificationSuccess",
  error: "notificationError",
  warning: "notificationWarning"
};
```

### 2. Loading States

**Skeleton Loader:**
```typescript
const skeletonLoader = {
  backgroundColor: "#E0E0E0",
  highlightColor: "#F5F5F5",
  animation: {
    type: "shimmer",
    duration: 1500,
    direction: "left-to-right"
  },
  elements: [
    { type: "circle", size: 64, marginBottom: 16 },
    { type: "rect", width: "80%", height: 28, marginBottom: 8 },
    { type: "rect", width: "60%", height: 16, marginBottom: 8 },
    { type: "rect", width: "40%", height: 14 }
  ]
};
```

### 3. Success Animation

```typescript
const successAnimation = {
  icon: "check_circle",
  color: "#4CAF50",
  animation: {
    sequence: [
      { scale: 0, opacity: 0, duration: 0 },
      { scale: 1.3, opacity: 1, duration: 200 },
      { scale: 1.0, opacity: 1, duration: 100 }
    ]
  },
  duration: 2000 // Auto-dismiss after 2s
};
```

### 4. Error Shake Animation

```typescript
const errorShakeAnimation = {
  sequence: [
    { translateX: -10, duration: 50 },
    { translateX: 10, duration: 50 },
    { translateX: -10, duration: 50 },
    { translateX: 10, duration: 50 },
    { translateX: 0, duration: 50 }
  ]
};
```

---

## 🌙 Dark Mode Support

### Color Adjustments
```typescript
const darkModeColors = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceVariant: "#2C2C2C",
  primary: "#FFB74D",
  onPrimary: "#000000",
  onSurface: "#FFFFFF",
  onSurfaceVariant: "#E0E0E0",
  outline: "#424242"
};
```

### Elevation in Dark Mode
```typescript
const darkModeElevation = {
  level1: "rgba(255, 183, 77, 0.05)",
  level2: "rgba(255, 183, 77, 0.08)",
  level3: "rgba(255, 183, 77, 0.11)",
  level4: "rgba(255, 183, 77, 0.12)",
  level5: "rgba(255, 183, 77, 0.14)"
};
```

---

## 📱 Responsive Behavior

### Small Screens (< 375px)
```typescript
{
  header.title.fontSize: 42,
  card.padding: 20,
  card.icon.size: 56,
  card.title.fontSize: 24
}
```

### Large Screens (> 414px)
```typescript
{
  grid.columns: 2, // Keep 2 columns
  card.minHeight: 200,
  gap: 20
}
```

### Tablet (> 768px)
```typescript
{
  grid.columns: 3,
  maxWidth: 768,
  centerAlign: true
}
```

---

## 🎯 Touch Targets

All interactive elements follow Material Design guidelines:

```typescript
const touchTargets = {
  minimum: 48, // px
  recommended: 56, // px
  card: {
    width: "100%",
    height: 180,
    padding: 24 // Increases touch area
  },
  fab: {
    size: 64
  },
  iconButton: {
    size: 48
  }
};
```

---

## 🚀 Performance Optimizations

### 1. Animation Performance
```typescript
{
  useNativeDriver: true, // For all transform and opacity animations
  shouldRasterizeIOS: true, // For complex card shadows
  renderToHardwareTextureAndroid: true
}
```

### 2. Image Optimization
```typescript
{
  icons: "SVG vector (React Native SVG)",
  format: "WebP with PNG fallback",
  compression: "80% quality",
  caching: "Memory + Disk"
}
```

### 3. List Performance
```typescript
{
  component: "FlatList",
  removeClippedSubviews: true,
  maxToRenderPerBatch: 6,
  updateCellsBatchingPeriod: 50,
  windowSize: 5
}
```

---

## 🎨 Component Library (React Native)

### Required Dependencies
```json
{
  "dependencies": {
    "react-native-reanimated": "^3.6.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-svg": "^14.0.0",
    "@expo/vector-icons": "^14.0.0",
    "expo-haptics": "^12.8.0",
    "react-native-linear-gradient": "^2.8.0"
  }
}
```

---

## 📄 Export Specifications

### Assets to Export
1. **Icons**: SVG format, 64x64px viewBox
2. **Header gradient**: CSS/React Native gradient config
3. **Card components**: Reusable React Native components
4. **Animation configs**: Reanimated worklet functions
5. **Theme tokens**: TypeScript constants file

### File Structure
```
/design-system
  /assets
    /icons
      asfalt.svg
      materialy.svg
      godziny.svg
      ...
  /components
    DashboardCard.tsx
    Header.tsx
    FAB.tsx
  /theme
    colors.ts
    typography.ts
    spacing.ts
    animations.ts
  /animations
    cardEntrance.ts
    cardPress.ts
    pullToRefresh.ts
```

---

## ✅ Implementation Checklist

- [ ] Setup React Native Reanimated 3
- [ ] Create color theme tokens
- [ ] Create typography scale
- [ ] Build Header component with gradient
- [ ] Build DashboardCard component
- [ ] Implement card press animations
- [ ] Implement stagger entrance animations
- [ ] Add haptic feedback
- [ ] Create icon components (SVG)
- [ ] Implement FAB with rotation animation
- [ ] Add pull-to-refresh
- [ ] Add skeleton loaders
- [ ] Implement dark mode
- [ ] Add accessibility labels
- [ ] Test on iOS and Android
- [ ] Performance optimization
- [ ] Add error boundaries
- [ ] Create documentation

---

## 🎓 Usage Example

```typescript
import { DashboardCard } from './components/DashboardCard';

<DashboardCard
  icon="local_shipping"
  iconColor="#FF9800"
  title="Asfalt"
  subtitle="Lieferschein"
  status="Dzisiaj: 0,0 t"
  onPress={() => navigation.navigate('Asfalt')}
  delay={0}
/>
```

---

**Design System Version**: 1.0.0
**Last Updated**: 2026-02-11
**Designer**: Claude + Michal
**Platform**: React Native (Expo)
**Target OS**: iOS 14+, Android 10+
