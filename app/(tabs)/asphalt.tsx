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
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  getActiveProject,
  getAsphaltDeliveries,
  createAsphaltDelivery,
  updateAsphaltDelivery,
  deleteAsphaltDelivery,
  getTotalTons,
} from '../../src/services/database';
import type { AsphaltDelivery, Project } from '../../src/types';
import { ASPHALT_CLASSES } from '../../src/utils/constants';
import { getTodayISO, getCurrentTime, formatNumber } from '../../src/utils/formatters';

export default function AsphaltScreen() {
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [deliveries, setDeliveries] = useState<AsphaltDelivery[]>([]);
  const [totalTons, setTotalTons] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<AsphaltDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // Form state
  const [formNumber, setFormNumber] = useState('');
  const [formClass, setFormClass] = useState('AC 11 D S');
  const [formTons, setFormTons] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formTruck, setFormTruck] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [classMenuVisible, setClassMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);
      if (activeProject) {
        const today = getTodayISO();
        const [items, total] = await Promise.all([
          getAsphaltDeliveries(activeProject.id, today),
          getTotalTons(activeProject.id, today),
        ]);
        setDeliveries(items);
        setTotalTons(total);
      }
    } catch (error) {
      console.error('Error loading asphalt data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormNumber('');
    setFormClass('AC 11 D S');
    setFormTons('');
    setFormDriver('');
    setFormTruck('');
    setFormTime(getCurrentTime());
    setFormNotes('');
    setEditingDelivery(null);
  };

  const openAddModal = () => {
    resetForm();
    setFormTime(getCurrentTime());
    setModalVisible(true);
  };

  const openEditModal = (delivery: AsphaltDelivery) => {
    setEditingDelivery(delivery);
    setFormNumber(delivery.lieferscheinNumber);
    setFormClass(delivery.asphaltClass);
    setFormTons(delivery.tons.toString());
    setFormDriver(delivery.driver ?? '');
    setFormTruck(delivery.truckNumber ?? '');
    setFormTime(delivery.time);
    setFormNotes(delivery.notes ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!project) {
      Alert.alert('Blad', 'Brak aktywnego projektu');
      return;
    }

    if (!formNumber.trim()) {
      Alert.alert('Brak numeru', 'Podaj numer Lieferschein');
      return;
    }

    if (!formClass) {
      Alert.alert('Brak klasy', 'Wybierz klase asfaltu');
      return;
    }

    if (!formTons.trim()) {
      Alert.alert('Brak ilosci', 'Podaj ilosc ton');
      return;
    }

    const tons = parseFloat(formTons.replace(',', '.'));
    if (isNaN(tons) || tons <= 0) {
      Alert.alert('Bledna ilosc', 'Podaj ilosc ton (wieksza od 0)');
      return;
    }

    try {
      console.log('Zapisuje Lieferschein:', { number: formNumber, class: formClass, tons });

      if (editingDelivery) {
        await updateAsphaltDelivery(editingDelivery.id, {
          lieferscheinNumber: formNumber.trim(),
          asphaltClass: formClass,
          tons,
          driver: formDriver.trim() || undefined,
          truckNumber: formTruck.trim() || undefined,
          time: formTime,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await createAsphaltDelivery({
          projectId: project.id,
          lieferscheinNumber: formNumber.trim(),
          date: getTodayISO(),
          time: formTime,
          asphaltClass: formClass,
          tons,
          driver: formDriver.trim() || undefined,
          truckNumber: formTruck.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
      }
      setModalVisible(false);
      resetForm();
      await loadData();
      setSnackbar(t('common.success'));
      console.log('Lieferschein zapisany');
    } catch (error) {
      console.error('Blad zapisu Lieferschein:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac';
      Alert.alert('Blad zapisu', message);
    }
  };

  const handleDelete = (delivery: AsphaltDelivery) => {
    Alert.alert(t('common.confirm'), t('asphalt.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsphaltDelivery(delivery.id);
            await loadData();
            setSnackbar(t('common.success'));
          } catch (error) {
            console.error('Blad usuwania dostawy:', error);
            const message = error instanceof Error ? error.message : 'Nie udalo sie usunac';
            Alert.alert('Blad', message);
          }
        },
      },
    ]);
  };

  const renderDeliveryCard = ({ item }: { item: AsphaltDelivery }) => (
    <Card mode="elevated" style={styles.deliveryCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons name="file-document" size={18} color="#FF9800" />
            <Text variant="titleSmall" style={styles.lieferscheinNumber}>
              #{item.lieferscheinNumber}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="pencil"
              size={18}
              onPress={() => openEditModal(item)}
            />
            <IconButton
              icon="delete"
              size={18}
              iconColor="#F44336"
              onPress={() => handleDelete(item)}
            />
          </View>
        </View>

        <Text variant="bodySmall" style={styles.timeText}>
          {item.time}
        </Text>

        <View style={styles.mainInfo}>
          <Text variant="bodyLarge" style={styles.asphaltClass}>
            {item.asphaltClass}
          </Text>
          <Text variant="headlineSmall" style={styles.tons}>
            {formatNumber(item.tons)} t
          </Text>
        </View>

        {(item.driver || item.truckNumber) && (
          <View style={styles.driverInfo}>
            {item.driver && (
              <Text variant="bodySmall" style={styles.driverText}>
                Fahrer: {item.driver}
              </Text>
            )}
            {item.truckNumber && (
              <Text variant="bodySmall" style={styles.driverText}>
                LKW: {item.truckNumber}
              </Text>
            )}
          </View>
        )}

        {item.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            {item.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={64}
                color="#E0E0E0"
              />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('asphalt.noDeliveries')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Total tons footer */}
      <View style={styles.footer}>
        <Text variant="titleMedium" style={styles.footerLabel}>
          {t('asphalt.totalToday')}:
        </Text>
        <Text variant="headlineSmall" style={styles.footerValue}>
          {formatNumber(totalTons)} t
        </Text>
      </View>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={openAddModal}
      />

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingDelivery ? t('asphalt.editTitle') : t('asphalt.addTitle')}
          </Text>

          <TextInput
            label={t('asphalt.lieferscheinNumber')}
            value={formNumber}
            onChangeText={setFormNumber}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={classMenuVisible}
            onDismiss={() => setClassMenuVisible(false)}
            anchor={
              <TextInput
                label={t('asphalt.asphaltClass')}
                value={formClass}
                onFocus={() => setClassMenuVisible(true)}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="chevron-down" />}
                showSoftInputOnFocus={false}
              />
            }
          >
            {ASPHALT_CLASSES.map((cls) => (
              <Menu.Item
                key={cls}
                onPress={() => {
                  setFormClass(cls);
                  setClassMenuVisible(false);
                }}
                title={cls}
              />
            ))}
          </Menu>

          <TextInput
            label={t('asphalt.tons')}
            value={formTons}
            onChangeText={setFormTons}
            keyboardType="decimal-pad"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('asphalt.time')}
            value={formTime}
            onChangeText={setFormTime}
            placeholder="HH:MM"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('asphalt.driver')}
            value={formDriver}
            onChangeText={setFormDriver}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('asphalt.truckNumber')}
            value={formTruck}
            onChangeText={setFormTruck}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label={t('asphalt.notes')}
            value={formNotes}
            onChangeText={setFormNotes}
            multiline
            numberOfLines={2}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.modalButton}
              buttonColor="#FF9800"
            >
              {t('common.save')}
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={2000}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 20,
    paddingBottom: 140,
  },
  deliveryCard: {
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lieferscheinNumber: {
    fontWeight: '700',
    color: '#FF9800',
  },
  cardActions: {
    flexDirection: 'row',
  },
  timeText: {
    color: '#6B7280',
    marginTop: 4,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  asphaltClass: {
    color: '#1A1A2E',
    fontWeight: '500',
  },
  tons: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  driverInfo: {
    marginTop: 8,
    gap: 2,
  },
  driverText: {
    color: '#6B7280',
    fontSize: 13,
  },
  notes: {
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
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
  footerLabel: {
    color: '#6B7280',
  },
  footerValue: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A2E',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
    borderRadius: 12,
  },
});
