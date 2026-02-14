# Instrukcje dla Claude Code - Implementacja Nowoczesnego Dashboardu Polier App

## 📦 Co zostało przygotowane

Masz do dyspozycji 2 pliki:

1. **polier-app-design-spec.md** - Pełna specyfikacja designu (kolory, animacje, komponenty)
2. **PolierAppComponents.tsx** - Gotowy kod React Native z wszystkimi komponentami

## 🎯 Zadanie dla Claude Code

Zaimplementuj nowoczesny dashboard z Material You design system w projekcie Polier App.

## 📋 Krok po kroku

### 1. Instalacja zależności

Najpierw zainstaluj wymagane paczki:

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg expo-haptics expo-linear-gradient @expo/vector-icons
```

### 2. Konfiguracja Reanimated

Dodaj do `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // MUSI BYĆ OSTATNI
    ],
  };
};
```

### 3. Struktura plików

Utwórz następującą strukturę w projekcie:

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardCard.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── index.ts
├── screens/
│   ├── DashboardScreen.tsx
│   └── index.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
└── types/
    └── modules.ts
```

### 4. Podziel kod z PolierAppComponents.tsx

Plik `PolierAppComponents.tsx` zawiera wszystkie komponenty w jednym pliku dla wygody.
Podziel go na odpowiednie pliki:

#### src/components/dashboard/DashboardCard.tsx
```typescript
// Skopiuj sekcję "DashboardCard.tsx" z PolierAppComponents.tsx
// (linie 1-186)
```

#### src/components/dashboard/DashboardHeader.tsx
```typescript
// Skopiuj sekcję "DashboardHeader.tsx" z PolierAppComponents.tsx
// (linie 188-327)
```

#### src/screens/DashboardScreen.tsx
```typescript
// Skopiuj sekcję "DashboardScreen.tsx" z PolierAppComponents.tsx
// (linie 329-520)
```

#### src/theme/index.ts
```typescript
// Skopiuj sekcję "theme.ts" z PolierAppComponents.tsx
// (linie 522-końca)
```

### 5. Popraw importy

W każdym pliku popraw ścieżki importów:

**DashboardCard.tsx:**
```typescript
import { colors, elevation } from '../../theme';
```

**DashboardScreen.tsx:**
```typescript
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
```

### 6. Dodaj typy

Utwórz `src/types/modules.ts`:

```typescript
import { MaterialIcons } from '@expo/vector-icons';

export interface Module {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  statusKey: string | null;
  statusFormat: string | null;
}

export interface DailyStats {
  tonnage: number;
  length: number;
  hours: number;
  distance: number;
}
```

### 7. Integracja z istniejącym projektem

Znajdź plik `App.tsx` lub główny routing i zastąp stary dashboard:

```typescript
import { DashboardScreen } from './src/screens/DashboardScreen';

export default function App() {
  return <DashboardScreen />;
}
```

### 8. Opcjonalne usprawnienia

#### A. Dodaj nawigację
Jeśli używasz React Navigation, dodaj routes:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Asfalt" component={AsfaltScreen} />
        {/* ... inne ekrany ... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### B. Połącz z Store (Zustand)

W `DashboardScreen.tsx` dodaj:

```typescript
import { useStore } from '../store';

export const DashboardScreen: React.FC = () => {
  const dailyStats = useStore((state) => state.dailyStats);
  
  const getStatusText = (module: Module): string => {
    if (!module.statusKey) return '';
    const value = dailyStats[module.statusKey] || 0;
    return `Dzisiaj: ${value.toFixed(1)} ${module.statusFormat}`;
  };
  
  // ... reszta kodu
};
```

#### C. Dodaj Dark Mode

```typescript
import { useColorScheme } from 'react-native';
import { colors, darkColors } from '../theme';

export const DashboardScreen: React.FC = () => {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkColors : colors;
  
  // Użyj theme.background, theme.surface itd.
};
```

### 9. Testowanie

Po implementacji przetestuj:

```bash
# Start dev server
npx expo start

# Test na iOS
npx expo start --ios

# Test na Android
npx expo start --android
```

Sprawdź:
- ✅ Animacje wejścia (stagger)
- ✅ Animacje przycisku (scale on press)
- ✅ Haptic feedback
- ✅ Gradient w headerze
- ✅ Ikony się ładują
- ✅ Responsywność (różne rozmiary ekranów)

### 10. Optymalizacja wydajności

Dodaj do `app.json`:

```json
{
  "expo": {
    "plugins": [
      "react-native-reanimated/plugin"
    ],
    "jsEngine": "hermes"
  }
}
```

### 11. Troubleshooting

**Problem: Animacje nie działają**
- Upewnij się że `react-native-reanimated/plugin` jest OSTATNI w babel.config.js
- Wyczyść cache: `npx expo start -c`

**Problem: Ikony się nie renderują**
- Sprawdź czy nazwy ikon są poprawne (użyj Material Icons)
- W icon names używaj '-' zamiast '_' (np. 'local-shipping' zamiast 'local_shipping')

**Problem: Gradient nie działa**
- Upewnij się że zainstalowałeś `expo-linear-gradient`
- Na Android może wymagać rebuild

**Problem: Haptics nie działają**
- Haptics działa tylko na fizycznych urządzeniach, nie na symulatorze
- iOS wymaga Taptic Engine

### 12. Następne kroki

Po zaimplementowaniu dashboardu:

1. ✅ Dodaj Pull-to-Refresh (RefreshControl)
2. ✅ Dodaj FAB (Floating Action Button)
3. ✅ Dodaj skeleton loaders podczas ładowania danych
4. ✅ Zaimplementuj nawigację do poszczególnych modułów
5. ✅ Połącz z API/Store dla prawdziwych danych
6. ✅ Dodaj testy jednostkowe

---

## 🎨 Dodatkowe pliki do skopiowania

### expo-linear-gradient gradient config

```typescript
// src/components/common/GradientBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';

export const OrangeGradient = ({ children, style }: any) => (
  <LinearGradient
    colors={['#FF9800', '#F57C00']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);
```

---

## 📱 Preview w Expo Go

Najszybszy sposób na przetestowanie:

1. Zainstaluj Expo Go na telefonie
2. Uruchom: `npx expo start`
3. Zeskanuj QR code
4. Aplikacja załaduje się na telefonie

---

## ✅ Checklist implementacji

- [ ] Zainstalowane wszystkie zależności
- [ ] Skonfigurowany babel.config.js
- [ ] Utworzona struktura folderów
- [ ] Podzielony kod na komponenty
- [ ] Poprawione importy
- [ ] Dodane typy TypeScript
- [ ] Zintegrowane z nawigacją
- [ ] Przetestowane na iOS
- [ ] Przetestowane na Android
- [ ] Dodany Dark Mode (opcjonalnie)
- [ ] Połączone z Store (opcjonalnie)
- [ ] Dodane testy (opcjonalnie)

---

## 🚀 Gotowe!

Po wykonaniu tych kroków będziesz miał w pełni działający, nowoczesny dashboard z:
- ✨ Płynnymi animacjami Material Motion
- 🎨 Material You design system
- 📱 Responsywnym layoutem
- 🔄 Haptic feedback
- 🌈 Gradientami i cieniami
- ⚡ Optymalizacją wydajności

---

**Potrzebujesz pomocy?** 
Jeśli napotkasz problemy podczas implementacji, sprawdź:
1. Logi w terminalu (`npx expo start`)
2. React Native Debugger
3. Dokumentację Expo: https://docs.expo.dev
4. Dokumentację Reanimated: https://docs.swmansion.com/react-native-reanimated/

**Autor**: Claude + Michal
**Wersja**: 1.0.0
**Data**: 2026-02-11
