import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Button,
  RadioButton,
  Checkbox,
  Card,
  Snackbar,
  Divider,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ExportScreen() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('today');
  const [includeAsphalt, setIncludeAsphalt] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeHours, setIncludeHours] = useState(true);
  const [includeVehicle, setIncludeVehicle] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  const handleGeneratePdf = () => {
    // TODO: Implement PDF generation
    setSnackbar('PDF - coming soon');
  };

  const handleGenerateExcel = () => {
    // TODO: Implement Excel generation
    setSnackbar('Excel - coming soon');
  };

  const handleSendWhatsapp = () => {
    // TODO: Implement WhatsApp sharing
    setSnackbar('WhatsApp - coming soon');
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
              onValueChange={setDateRange}
              value={dateRange}
            >
              <RadioButton.Item
                label={t('export.today')}
                value="today"
                color="#00897B"
              />
              <RadioButton.Item
                label={t('export.yesterday')}
                value="yesterday"
                color="#00897B"
              />
              <RadioButton.Item
                label={t('export.thisWeek')}
                value="week"
                color="#00897B"
              />
              <RadioButton.Item
                label={t('export.custom')}
                value="custom"
                color="#00897B"
              />
            </RadioButton.Group>
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
              color="#00897B"
            />
            <Checkbox.Item
              label={t('export.includeMaterials')}
              status={includeMaterials ? 'checked' : 'unchecked'}
              onPress={() => setIncludeMaterials(!includeMaterials)}
              color="#00897B"
            />
            <Checkbox.Item
              label={t('export.includeHours')}
              status={includeHours ? 'checked' : 'unchecked'}
              onPress={() => setIncludeHours(!includeHours)}
              color="#00897B"
            />
            <Checkbox.Item
              label={t('export.includeVehicle')}
              status={includeVehicle ? 'checked' : 'unchecked'}
              onPress={() => setIncludeVehicle(!includeVehicle)}
              color="#00897B"
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
          >
            {t('export.sendWhatsapp')}
          </Button>
        </View>
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
});
