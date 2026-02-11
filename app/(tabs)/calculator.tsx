import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Card, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function CalculatorScreen() {
  const { t } = useTranslation();

  // Inputs
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [density, setDensity] = useState('2.4');

  // Results
  const [result, setResult] = useState<{
    area: number;
    volume: number;
    tons: number;
  } | null>(null);

  const handleCalculate = () => {
    const l = parseFloat(length.replace(',', '.'));
    const w = parseFloat(width.replace(',', '.'));
    const th = parseFloat(thickness.replace(',', '.'));
    const d = parseFloat(density.replace(',', '.'));

    if (isNaN(l) || isNaN(w) || isNaN(th) || isNaN(d) || l <= 0 || w <= 0 || th <= 0 || d <= 0) {
      setResult(null);
      return;
    }

    const area = l * w;
    const thicknessM = th / 100; // cm -> m
    const volume = area * thicknessM;
    const tons = volume * d;

    setResult({ area, volume, tons });
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setThickness('');
    setDensity('2.4');
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.iconRow}>
              <MaterialCommunityIcons name="calculator" size={32} color="#607D8B" />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Kalkulator asfaltu
              </Text>
            </View>

            <TextInput
              label="Dlugosc (m)"
              value={length}
              onChangeText={setLength}
              keyboardType="decimal-pad"
              style={styles.input}
              mode="outlined"
              placeholder="np. 100"
              right={<TextInput.Affix text="m" />}
            />

            <TextInput
              label="Szerokosc (m)"
              value={width}
              onChangeText={setWidth}
              keyboardType="decimal-pad"
              style={styles.input}
              mode="outlined"
              placeholder="np. 3.5"
              right={<TextInput.Affix text="m" />}
            />

            <TextInput
              label="Grubosc (cm)"
              value={thickness}
              onChangeText={setThickness}
              keyboardType="decimal-pad"
              style={styles.input}
              mode="outlined"
              placeholder="np. 4"
              right={<TextInput.Affix text="cm" />}
            />

            <TextInput
              label="Gestosc (t/m3)"
              value={density}
              onChangeText={setDensity}
              keyboardType="decimal-pad"
              style={styles.input}
              mode="outlined"
              placeholder="2.4"
              right={<TextInput.Affix text="t/m3" />}
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleReset}
                style={styles.button}
              >
                Wyczysc
              </Button>
              <Button
                mode="contained"
                onPress={handleCalculate}
                style={styles.button}
                buttonColor="#FF9800"
              >
                Oblicz
              </Button>
            </View>
          </Card.Content>
        </Card>

        {result && (
          <Card mode="elevated" style={styles.resultCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.resultTitle}>
                Wynik obliczenia
              </Text>
              <Divider style={styles.divider} />

              <View style={styles.resultRow}>
                <Text variant="bodyMedium" style={styles.resultLabel}>
                  Powierzchnia:
                </Text>
                <Text variant="titleMedium" style={styles.resultValue}>
                  {result.area.toFixed(2)} m2
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text variant="bodyMedium" style={styles.resultLabel}>
                  Objetosc:
                </Text>
                <Text variant="titleMedium" style={styles.resultValue}>
                  {result.volume.toFixed(3)} m3
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.resultRow}>
                <Text variant="bodyLarge" style={styles.resultLabelMain}>
                  Potrzebny asfalt:
                </Text>
                <Text variant="headlineSmall" style={styles.resultValueMain}>
                  {result.tons.toFixed(2)} t
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card mode="elevated" style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>
              Typowe gestosci asfaltu
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>AC 11 D S: 2.40 t/m3</Text>
            <Text variant="bodySmall" style={styles.infoText}>AC 8 D S: 2.35 t/m3</Text>
            <Text variant="bodySmall" style={styles.infoText}>SMA 8: 2.45 t/m3</Text>
            <Text variant="bodySmall" style={styles.infoText}>SMA 11: 2.45 t/m3</Text>
            <Text variant="bodySmall" style={styles.infoText}>Binder: 2.50 t/m3</Text>
            <Text variant="bodySmall" style={styles.infoText}>Trag: 2.50 t/m3</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#212121',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 120,
  },
  resultCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  resultTitle: {
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  resultLabel: {
    color: '#757575',
  },
  resultValue: {
    color: '#424242',
    fontWeight: '600',
  },
  resultLabelMain: {
    color: '#212121',
    fontWeight: '600',
  },
  resultValueMain: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#607D8B',
    marginBottom: 8,
  },
  infoText: {
    color: '#757575',
    marginBottom: 2,
  },
});
