import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Button,
  RadioButton,
  Checkbox,
  Card,
  Snackbar,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayISO } from '../src/utils/formatters';
import {
  getDateRange,
  exportPdf,
  exportExcel,
  exportWhatsApp,
  type DateRangeType,
} from '../src/services/exportService';

export default function ExportScreen() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRangeType>('today');
  const [customFrom, setCustomFrom] = useState(getTodayISO());
  const [customTo, setCustomTo] = useState(getTodayISO());
  const [includeAsphalt, setIncludeAsphalt] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeMaterialUsage, setIncludeMaterialUsage] = useState(true);
  const [includeHours, setIncludeHours] = useState(true);
  const [includeVehicle, setIncludeVehicle] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const options = { includeAsphalt, includeMaterials, includeMaterialUsage, includeHours, includeVehicle };

  const hasAnySection = includeAsphalt || includeMaterials || includeMaterialUsage || includeHours || includeVehicle;

  const runExport = async (exportFn: () => Promise<void>, label: string) => {
    if (!hasAnySection) {
      Alert.alert(t('export.error'), t('export.noSectionSelected'));
      return;
    }
    setLoading(true);
    try {
      await exportFn();
    } catch (error) {
      console.error(`Export ${label} error:`, error);
      const message = error instanceof Error && error.message === 'NO_ACTIVE_PROJECT'
        ? t('export.noProject')
        : t('export.exportError');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);
    runExport(() => exportPdf(from, to, options), 'PDF');
  };

  const handleGenerateExcel = () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);
    runExport(() => exportExcel(from, to, options), 'Excel');
  };

  const handleSendWhatsapp = () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);
    runExport(() => exportWhatsApp(from, to, options), 'WhatsApp');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Range */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('export.dateRange')}
            </Text>
            <RadioButton.Group
              onValueChange={(v) => setDateRange(v as DateRangeType)}
              value={dateRange}
            >
              <RadioButton.Item
                label={t('export.today')}
                value="today"
                color="#FF9800"
              />
              <RadioButton.Item
                label={t('export.yesterday')}
                value="yesterday"
                color="#FF9800"
              />
              <RadioButton.Item
                label={t('export.thisWeek')}
                value="week"
                color="#FF9800"
              />
              <RadioButton.Item
                label={t('export.custom')}
                value="custom"
                color="#FF9800"
              />
            </RadioButton.Group>

            {dateRange === 'custom' && (
              <View style={styles.customDateContainer}>
                <TextInput
                  label={t('export.dateFrom')}
                  value={customFrom}
                  onChangeText={setCustomFrom}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  mode="outlined"
                  dense
                />
                <TextInput
                  label={t('export.dateTo')}
                  value={customTo}
                  onChangeText={setCustomTo}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  mode="outlined"
                  dense
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Include sections */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('export.include')}
            </Text>
            <Checkbox.Item
              label={t('export.includeAsphalt')}
              status={includeAsphalt ? 'checked' : 'unchecked'}
              onPress={() => setIncludeAsphalt(!includeAsphalt)}
              color="#FF9800"
            />
            <Checkbox.Item
              label={t('export.includeMaterials')}
              status={includeMaterials ? 'checked' : 'unchecked'}
              onPress={() => setIncludeMaterials(!includeMaterials)}
              color="#FF9800"
            />
            <Checkbox.Item
              label={t('export.includeMaterialUsage')}
              status={includeMaterialUsage ? 'checked' : 'unchecked'}
              onPress={() => setIncludeMaterialUsage(!includeMaterialUsage)}
              color="#FF9800"
            />
            <Checkbox.Item
              label={t('export.includeHours')}
              status={includeHours ? 'checked' : 'unchecked'}
              onPress={() => setIncludeHours(!includeHours)}
              color="#FF9800"
            />
            <Checkbox.Item
              label={t('export.includeVehicle')}
              status={includeVehicle ? 'checked' : 'unchecked'}
              onPress={() => setIncludeVehicle(!includeVehicle)}
              color="#FF9800"
            />
          </Card.Content>
        </Card>

        {/* Export buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={handleGeneratePdf}
            style={styles.exportButton}
            buttonColor="#F44336"
            contentStyle={styles.buttonContent}
            disabled={loading}
          >
            {t('export.generatePdf')}
          </Button>

          <Button
            mode="contained"
            icon="file-excel"
            onPress={handleGenerateExcel}
            style={styles.exportButton}
            buttonColor="#4CAF50"
            contentStyle={styles.buttonContent}
            disabled={loading}
          >
            {t('export.generateExcel')}
          </Button>

          <Button
            mode="contained"
            icon="whatsapp"
            onPress={handleSendWhatsapp}
            style={styles.exportButton}
            buttonColor="#25D366"
            contentStyle={styles.buttonContent}
            disabled={loading}
          >
            {t('export.sendWhatsapp')}
          </Button>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              {t('export.generating')}
            </Text>
          </View>
        )}
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2000}>
        {snackbar}
      </Snackbar>
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
  sectionTitle: {
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  buttonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  exportButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  loadingText: {
    color: '#757575',
  },
});
