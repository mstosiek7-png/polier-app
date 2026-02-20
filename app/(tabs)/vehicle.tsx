import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  IconButton,
  Snackbar,
  Menu,
  Surface,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  getActiveProject,
  getActiveVehicle,
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTotalKm,
  getLastOdometer,
} from '../../src/services/database';
import type { Project, Vehicle, Trip } from '../../src/types';
import { TRIP_PURPOSES } from '../../src/utils/constants';
import { getTodayISO, getCurrentTime, formatNumber } from '../../src/utils/formatters';

export default function VehicleScreen() {
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalKm, setTotalKm] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // Form state
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formStartOdo, setFormStartOdo] = useState('');
  const [formEndOdo, setFormEndOdo] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [purposeMenuVisible, setPurposeMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);
      const activeVehicle = await getActiveVehicle();
      setVehicle(activeVehicle);

      if (activeProject && activeVehicle) {
        const today = getTodayISO();
        const [tripsList, km] = await Promise.all([
          getTrips(activeProject.id, today),
          getTotalKm(activeProject.id, today),
        ]);
        setTrips(tripsList);
        setTotalKm(km);
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormStartTime(getCurrentTime());
    setFormEndTime(getCurrentTime());
    setFormFrom('');
    setFormTo('');
    setFormStartOdo('');
    setFormEndOdo('');
    setFormPurpose(TRIP_PURPOSES[0]);
    setFormNotes('');
    setEditingTrip(null);
  };

  const openAddModal = async () => {
    resetForm();
    if (vehicle) {
      try {
        const lastOdo = await getLastOdometer(vehicle.id);
        setFormStartOdo(lastOdo.toString());
      } catch (error) {
        console.error('Error getting last odometer:', error);
      }
    }
    setModalVisible(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setFormStartTime(trip.startTime);
    setFormEndTime(trip.endTime);
    setFormFrom(trip.fromLocation);
    setFormTo(trip.toLocation);
    setFormStartOdo(trip.startOdometer.toString());
    setFormEndOdo(trip.endOdometer.toString());
    setFormPurpose(trip.purpose);
    setFormNotes(trip.notes ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!project) {
      Alert.alert('Blad', 'Brak aktywnego projektu');
      return;
    }
    if (!vehicle) {
      Alert.alert('Blad', 'Brak aktywnego pojazdu. Dodaj pojazd w Ustawieniach.');
      return;
    }

    if (!formFrom.trim()) {
      Alert.alert('Brak trasy', 'Podaj miejsce startu');
      return;
    }
    if (!formTo.trim()) {
      Alert.alert('Brak trasy', 'Podaj miejsce docelowe');
      return;
    }

    const startOdo = parseFloat(formStartOdo);
    const endOdo = parseFloat(formEndOdo);

    if (isNaN(startOdo)) {
      Alert.alert('Brak licznika', 'Podaj stan licznika na starcie');
      return;
    }
    if (isNaN(endOdo)) {
      Alert.alert('Brak licznika', 'Podaj stan licznika na koncu');
      return;
    }
    if (endOdo <= startOdo) {
      Alert.alert('Bledny licznik', 'Licznik koncowy musi byc wiekszy od poczatkowego');
      return;
    }

    const distance = endOdo - startOdo;

    try {
      console.log('Zapisuje przejazd:', { from: formFrom, to: formTo, distance });

      if (editingTrip) {
        await updateTrip(editingTrip.id, {
          startTime: formStartTime,
          endTime: formEndTime,
          fromLocation: formFrom.trim(),
          toLocation: formTo.trim(),
          startOdometer: startOdo,
          endOdometer: endOdo,
          distance,
          purpose: formPurpose,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await createTrip({
          vehicleId: vehicle.id,
          projectId: project.id,
          date: getTodayISO(),
          startTime: formStartTime,
          endTime: formEndTime,
          fromLocation: formFrom.trim(),
          toLocation: formTo.trim(),
          startOdometer: startOdo,
          endOdometer: endOdo,
          distance,
          purpose: formPurpose,
          notes: formNotes.trim() || undefined,
        });
      }
      setModalVisible(false);
      resetForm();
      await loadData();
      setSnackbar(t('common.success'));
      console.log('Przejazd zapisany');
    } catch (error) {
      console.error('Blad zapisu przejazdu:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac';
      Alert.alert('Blad zapisu', message);
    }
  };

  const handleDelete = (trip: Trip) => {
    Alert.alert(t('common.confirm'), t('vehicle.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip(trip.id);
            await loadData();
            setSnackbar(t('common.success'));
          } catch (error) {
            console.error('Blad usuwania przejazdu:', error);
            const message = error instanceof Error ? error.message : 'Nie udalo sie usunac';
            Alert.alert('Blad', message);
          }
        },
      },
    ]);
  };

  const renderTripCard = ({ item }: { item: Trip }) => (
    <Card mode="elevated" style={styles.tripCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="bodySmall" style={styles.timeText}>
            {item.startTime} - {item.endTime}
          </Text>
          <View style={styles.cardActions}>
            <IconButton icon="pencil" size={18} onPress={() => openEditModal(item)} />
            <IconButton
              icon="delete"
              size={18}
              iconColor="#F44336"
              onPress={() => handleDelete(item)}
            />
          </View>
        </View>

        <View style={styles.routeRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#4CAF50" />
          <Text variant="bodyMedium" style={styles.routeText}>{item.fromLocation}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#757575" />
          <MaterialCommunityIcons name="map-marker" size={16} color="#F44336" />
          <Text variant="bodyMedium" style={styles.routeText}>{item.toLocation}</Text>
        </View>

        <View style={styles.odometerRow}>
          <Text variant="bodySmall" style={styles.odometerText}>
            {formatNumber(item.startOdometer, 0)} km
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#BDBDBD" />
          <Text variant="bodySmall" style={styles.odometerText}>
            {formatNumber(item.endOdometer, 0)} km
          </Text>
          <Text variant="titleMedium" style={styles.distanceText}>
            {formatNumber(item.distance, 0)} km
          </Text>
        </View>

        {item.purpose && (
          <Text variant="bodySmall" style={styles.purposeText}>
            {item.purpose}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Vehicle info header */}
      {vehicle && (
        <Surface style={styles.vehicleInfo} elevation={1}>
          <MaterialCommunityIcons name="car" size={24} color="#9C27B0" />
          <View style={styles.vehicleText}>
            <Text variant="titleSmall" style={styles.vehicleName}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text variant="bodySmall" style={styles.vehicleReg}>
              {vehicle.registrationNumber}
            </Text>
          </View>
          <View style={styles.odometerInfo}>
            <Text variant="labelSmall" style={styles.odometerLabel}>
              {t('vehicle.currentOdometer')}
            </Text>
            <Text variant="titleSmall" style={styles.odometerValue}>
              {formatNumber(vehicle.currentOdometer, 0)} km
            </Text>
          </View>
        </Surface>
      )}

      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-outline" size={64} color="#E0E0E0" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('vehicle.noTrips')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Total footer */}
      <View style={styles.footer}>
        <Text variant="titleMedium" style={styles.footerLabel}>
          {t('vehicle.totalToday')}:
        </Text>
        <Text variant="headlineSmall" style={styles.footerValue}>
          {formatNumber(totalKm, 0)} km
        </Text>
      </View>

      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={openAddModal} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingTrip ? t('vehicle.editTitle') : t('vehicle.addTitle')}
          </Text>

          <View style={styles.timeRow}>
            <TextInput
              label={t('hours.start')}
              value={formStartTime}
              onChangeText={setFormStartTime}
              placeholder="HH:MM"
              style={[styles.input, { flex: 1 }]}
              mode="outlined"
            />
            <TextInput
              label={t('hours.end')}
              value={formEndTime}
              onChangeText={setFormEndTime}
              placeholder="HH:MM"
              style={[styles.input, { flex: 1, marginLeft: 12 }]}
              mode="outlined"
            />
          </View>

          <TextInput
            label={t('vehicle.from')}
            value={formFrom}
            onChangeText={setFormFrom}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('vehicle.to')}
            value={formTo}
            onChangeText={setFormTo}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.timeRow}>
            <TextInput
              label={t('vehicle.startOdometer')}
              value={formStartOdo}
              onChangeText={setFormStartOdo}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
              mode="outlined"
            />
            <TextInput
              label={t('vehicle.endOdometer')}
              value={formEndOdo}
              onChangeText={setFormEndOdo}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginLeft: 12 }]}
              mode="outlined"
            />
          </View>

          {formStartOdo && formEndOdo && (
            <View style={styles.distanceCalc}>
              <Text variant="bodyMedium" style={styles.distanceLabel}>
                {t('vehicle.distance')}:
              </Text>
              <Text variant="titleMedium" style={styles.distanceValue}>
                {formatNumber(
                  Math.max(0, parseFloat(formEndOdo || '0') - parseFloat(formStartOdo || '0')),
                  0
                )}{' '}
                km
              </Text>
            </View>
          )}

          <Menu
            visible={purposeMenuVisible}
            onDismiss={() => setPurposeMenuVisible(false)}
            anchor={
              <TextInput
                label={t('vehicle.purpose')}
                value={formPurpose}
                onFocus={() => setPurposeMenuVisible(true)}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="chevron-down" />}
                showSoftInputOnFocus={false}
              />
            }
          >
            {TRIP_PURPOSES.map((purpose) => (
              <Menu.Item
                key={purpose}
                onPress={() => {
                  setFormPurpose(purpose);
                  setPurposeMenuVisible(false);
                }}
                title={purpose}
              />
            ))}
          </Menu>

          <TextInput
            label={t('common.notes')}
            value={formNotes}
            onChangeText={setFormNotes}
            multiline
            numberOfLines={2}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.modalButton} buttonColor="#FF9800">
              {t('common.save')}
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleText: { flex: 1 },
  vehicleName: { fontWeight: '600', color: '#1A1A2E' },
  vehicleReg: { color: '#6B7280' },
  odometerInfo: { alignItems: 'flex-end' },
  odometerLabel: { color: '#9CA3AF', fontSize: 11 },
  odometerValue: { color: '#7E57C2', fontWeight: 'bold' },
  listContent: { padding: 20, paddingBottom: 140 },
  tripCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { color: '#6B7280' },
  cardActions: { flexDirection: 'row' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  routeText: { color: '#1A1A2E' },
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  odometerText: { color: '#9CA3AF' },
  distanceText: {
    color: '#7E57C2',
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  purposeText: { color: '#6B7280', marginTop: 4, fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  footerLabel: { color: '#6B7280' },
  footerValue: { color: '#7E57C2', fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    backgroundColor: '#FF9800',
    borderRadius: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontWeight: '700', marginBottom: 20, color: '#1A1A2E' },
  timeRow: { flexDirection: 'row' },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  distanceCalc: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  distanceLabel: { color: '#6B7280' },
  distanceValue: { color: '#7E57C2', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalButton: { minWidth: 100, borderRadius: 12 },
});
