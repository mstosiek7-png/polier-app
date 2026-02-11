import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase, seedDatabase } from '../src/services/database';
import '../src/i18n';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#00897B',
    primaryContainer: '#E0F2F1',
    secondary: '#FF8A65',
    secondaryContainer: '#FFF3E0',
    error: '#EF5350',
    errorContainer: '#FFEBEE',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F1F3',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A2E',
    onSurface: '#1A1A2E',
    outline: '#E5E7EB',
  },
};

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        await seedDatabase();
        setDbReady(true);
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbReady(true);
      }
    }
    setup();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="export"
            options={{
              headerShown: true,
              title: 'Export',
              headerStyle: { backgroundColor: '#00897B' },
              headerTintColor: '#FFFFFF',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Settings',
              headerStyle: { backgroundColor: '#00897B' },
              headerTintColor: '#FFFFFF',
              presentation: 'modal',
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
