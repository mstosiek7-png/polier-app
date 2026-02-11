import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="asphalt"
        options={{
          title: t('tabs.asphalt'),
        }}
      />
      <Stack.Screen
        name="materials"
        options={{
          title: t('tabs.materials'),
        }}
      />
      <Stack.Screen
        name="hours"
        options={{
          title: t('tabs.hours'),
        }}
      />
      <Stack.Screen
        name="vehicle"
        options={{
          title: t('tabs.vehicle'),
        }}
      />
      <Stack.Screen
        name="calculator"
        options={{
          title: t('tabs.calculator', 'Kalkulator'),
        }}
      />
    </Stack>
  );
}
