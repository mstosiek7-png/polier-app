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
    primary: '#FF9800',
    primaryContainer: '#FFE0B2',
    secondary: '#2196F3',
    secondaryContainer: '#BBDEFB',
    error: '#F44336',
    errorContainer: '#FFCDD2',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#212121',
    onSurface: '#212121',
    outline: '#E0E0E0',
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
              headerStyle: { backgroundColor: '#FF9800' },
              headerTintColor: '#FFFFFF',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Settings',
              headerStyle: { backgroundColor: '#FF9800' },
              headerTintColor: '#FFFFFF',
              presentation: 'modal',
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
