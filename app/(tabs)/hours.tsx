import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Checkbox,
  IconButton,
  Snackbar,
  Portal,
  Modal,
  TextInput,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  getActiveProject,
  getActiveWorkers,
  getWorkerHours,
  upsertWorkerHours,
  getTotalHours,
} from '../../src/services/database';
import type { Project, Worker, WorkerHours } from '../../src/types';
import { getTodayISO, formatNumber } from '../../src/utils/formatters';
import { calculateHours } from '../../src/utils/calculations';
import {
  DEFAULT_BREAK_HOURS,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  WORKER_STATUSES,
} from '../../src/utils/constants';

interface WorkerWithHours extends Worker {
  hours?: WorkerHours;
  selected: boolean;
}

export default function HoursScreen() {
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [workersWithHours, setWorkersWithHours] = useState<WorkerWithHours[]>([]);
  const [totalStats, setTotalStats] = useState({ totalHours: 0, workersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // Bulk edit state
  const [bulkStart, setBulkStart] = useState(DEFAULT_START_TIME);
  const [bulkEnd, setBulkEnd] = useState(DEFAULT_END_TIME);
  const [selectAll, setSelectAll] = useState(false);

  // Individual edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerWithHours | null>(null);
  const [editStart, setEditStart] = useState(DEFAULT_START_TIME);
  const [editEnd, setEditEnd] = useState(DEFAULT_END_TIME);
  const [editBreak, setEditBreak] = useState(DEFAULT_BREAK_HOURS.toString());
  const [editStatus, setEditStatus] = useState<string>('present');
  const [editOvertime, setEditOvertime] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);

      if (activeProject) {
        const today = getTodayISO();
        const [workers, hours, stats] = await Promise.all([
          getActiveWorkers(),
          getWorkerHours(activeProject.id, today),
          getTotalHours(activeProject.id, today),
        ]);

        const hoursMap = new Map(hours.map((h) => [h.workerId, h]));
        const combined = workers.map((worker) => ({
          ...worker,
          hours: hoursMap.get(worker.id),
          selected: false,
        }));

        setWorkersWithHours(combined);
        setTotalStats(stats);
      }
    } catch (error) {
      console.error('Error loading hours:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setWorkersWithHours((prev) =>
      prev.map((w) => ({ ...w, selected: newState }))
    );
  };

  const toggleWorkerSelect = (workerId: string) => {
    setWorkersWithHours((prev) =>
      prev.map((w) =>
        w.id === workerId ? { ...w, selected: !w.selected } : w
      )
    );
  };

  const applyBulkHours = async () => {
    if (!project) return;
    const selectedWorkers = workersWithHours.filter((w) => w.selected);
    if (selectedWorkers.length === 0) return;

    try {
      const today = getTodayISO();
      const breakH = DEFAULT_BREAK_HOURS;
      const total = calculateHours(bulkStart, bulkEnd, breakH);

      for (const worker of selectedWorkers) {
        await upsertWorkerHours({
          workerId: worker.id,
          projectId: project.id,
          date: today,
          startTime: bulkStart,
          endTime: bulkEnd,
          breakHours: breakH,
          totalHours: total,
          status: 'present',
          overtime: false,
        });
      }

      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Error applying bulk hours:', error);
      setSnackbar(t('common.error'));
    }
  };

  const openEditModal = (worker: WorkerWithHours) => {
    setEditingWorker(worker);
    setEditStart(worker.hours?.startTime ?? DEFAULT_START_TIME);
    setEditEnd(worker.hours?.endTime ?? DEFAULT_END_TIME);
    setEditBreak((worker.hours?.breakHours ?? DEFAULT_BREAK_HOURS).toString());
    setEditStatus(worker.hours?.status ?? 'present');
    setEditOvertime(worker.hours?.overtime ?? false);
    setEditNotes(worker.hours?.notes ?? '');
    setEditModalVisible(true);
  };

  const handleSaveIndividual = async () => {
    if (!project || !editingWorker) return;

    try {
      const breakH = parseFloat(editBreak.replace(',', '.')) || DEFAULT_BREAK_HOURS;
      const total = editStatus === 'present' ? calculateHours(editStart, editEnd, breakH) : 0;

      await upsertWorkerHours({
        workerId: editingWorker.id,
        projectId: project.id,
        date: getTodayISO(),
        startTime: editStart,
        endTime: editEnd,
        breakHours: breakH,
        totalHours: total,
        status: editStatus as WorkerHours['status'],
        overtime: editOvertime,
        notes: editNotes.trim() || undefined,
      });

      setEditModalVisible(false);
      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Error saving hours:', error);
      setSnackbar(t('common.error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'vacation': return '#2196F3';
      case 'sick': return '#F44336';
      case 'absent': return '#757575';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`hours.${status}`);
  };

  const renderWorkerCard = ({ item }: { item: WorkerWithHours }) => (
    <Card mode="outlined" style={styles.workerCard}>
      <Card.Content>
        <View style={styles.workerHeader}>
          <View style={styles.workerHeaderLeft}>
            <Checkbox
              status={item.selected ? 'checked' : 'unchecked'}
              onPress={() => toggleWorkerSelect(item.id)}
              color="#00897B"
            />
            <View>
              <Text variant="titleSmall" style={styles.workerName}>
                {item.firstName} {item.lastName}
              </Text>
              {item.hours && (
                <Chip
                  mode="flat"
                  compact
                  style={{
                    backgroundColor: getStatusColor(item.hours.status) + '20',
                    alignSelf: 'flex-start',
                    marginTop: 2,
                  }}
                  textStyle={{ color: getStatusColor(item.hours.status), fontSize: 10 }}
                >
                  {getStatusLabel(item.hours.status)}
                </Chip>
              )}
            </View>
          </View>
          <IconButton icon="pencil" size={18} onPress={() => openEditModal(item)} />
        </View>

        {item.hours && item.hours.status === 'present' && (
          <View style={styles.hoursRow}>
            <View style={styles.hourItem}>
              <Text variant="labelSmall" style={styles.hourLabel}>{t('hours.start')}</Text>
              <Text variant="bodyMedium" style={styles.hourValue}>{item.hours.startTime}</Text>
            </View>
            <View style={styles.hourItem}>
              <Text variant="labelSmall" style={styles.hourLabel}>{t('hours.end')}</Text>
              <Text variant="bodyMedium" style={styles.hourValue}>{item.hours.endTime}</Text>
            </View>
            <View style={styles.hourItem}>
              <Text variant="labelSmall" style={styles.hourLabel}>{t('hours.break')}</Text>
              <Text variant="bodyMedium" style={styles.hourValue}>{item.hours.breakHours}h</Text>
            </View>
            <View style={styles.hourItem}>
              <Text variant="labelSmall" style={styles.hourLabel}>{t('common.total')}</Text>
              <Text variant="titleSmall" style={styles.totalValue}>
                {formatNumber(item.hours.totalHours)}h
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Bulk edit panel */}
      <Card mode="elevated" style={styles.bulkPanel}>
        <Card.Content>
          <View style={styles.bulkHeader}>
            <Checkbox
              status={selectAll ? 'checked' : 'unchecked'}
              onPress={toggleSelectAll}
              color="#00897B"
            />
            <Text variant="titleSmall" style={styles.bulkTitle}>
              {t('hours.selectAll')}
            </Text>
          </View>

          <View style={styles.bulkTimeRow}>
            <TextInput
              label={t('hours.start')}
              value={bulkStart}
              onChangeText={setBulkStart}
              style={[styles.bulkInput]}
              mode="outlined"
              dense
            />
            <TextInput
              label={t('hours.end')}
              value={bulkEnd}
              onChangeText={setBulkEnd}
              style={[styles.bulkInput]}
              mode="outlined"
              dense
            />
            <Button
              mode="contained"
              onPress={applyBulkHours}
              buttonColor="#00897B"
              compact
              style={styles.applyButton}
            >
              {t('hours.applyToAll')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <FlatList
        data={workersWithHours}
        renderItem={renderWorkerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color="#E0E0E0" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('hours.noWorkers')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Total footer */}
      <View style={styles.footer}>
        <Text variant="titleMedium" style={styles.footerLabel}>
          {t('hours.totalHours')}:
        </Text>
        <Text variant="headlineSmall" style={styles.footerValue}>
          {formatNumber(totalStats.totalHours)}h ({totalStats.workersCount} {t('hours.workers').toLowerCase()})
        </Text>
      </View>

      {/* Individual edit modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          {editingWorker && (
            <>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingWorker.firstName} {editingWorker.lastName}
              </Text>

              <View style={styles.statusRow}>
                {WORKER_STATUSES.map((status) => (
                  <Chip
                    key={status}
                    mode={editStatus === status ? 'flat' : 'outlined'}
                    selected={editStatus === status}
                    onPress={() => setEditStatus(status)}
                    style={{
                      backgroundColor: editStatus === status ? getStatusColor(status) + '30' : undefined,
                    }}
                    textStyle={{
                      color: editStatus === status ? getStatusColor(status) : '#757575',
                      fontSize: 12,
                    }}
                  >
                    {getStatusLabel(status)}
                  </Chip>
                ))}
              </View>

              {editStatus === 'present' && (
                <>
                  <View style={styles.timeRow}>
                    <TextInput
                      label={t('hours.start')}
                      value={editStart}
                      onChangeText={setEditStart}
                      style={[styles.input, { flex: 1 }]}
                      mode="outlined"
                    />
                    <TextInput
                      label={t('hours.end')}
                      value={editEnd}
                      onChangeText={setEditEnd}
                      style={[styles.input, { flex: 1, marginLeft: 12 }]}
                      mode="outlined"
                    />
                  </View>

                  <TextInput
                    label={t('hours.break') + ' (h)'}
                    value={editBreak}
                    onChangeText={setEditBreak}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    mode="outlined"
                  />

                  <View style={styles.calculatedRow}>
                    <Text variant="bodyMedium" style={styles.calculatedLabel}>
                      {t('common.total')}:
                    </Text>
                    <Text variant="titleMedium" style={styles.calculatedValue}>
                      {formatNumber(
                        calculateHours(
                          editStart,
                          editEnd,
                          parseFloat(editBreak.replace(',', '.')) || 0
                        )
                      )}h
                    </Text>
                  </View>

                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={editOvertime ? 'checked' : 'unchecked'}
                      onPress={() => setEditOvertime(!editOvertime)}
                      color="#00897B"
                    />
                    <Text variant="bodyMedium">{t('hours.overtime')}</Text>
                  </View>
                </>
              )}

              <TextInput
                label={t('common.notes')}
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={2}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setEditModalVisible(false)} style={styles.modalButton}>
                  {t('common.cancel')}
                </Button>
                <Button mode="contained" onPress={handleSaveIndividual} style={styles.modalButton} buttonColor="#00897B">
                  {t('common.save')}
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  bulkPanel: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  bulkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulkTitle: { fontWeight: '600' },
  bulkTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkInput: { flex: 1, backgroundColor: '#FFFFFF' },
  applyButton: { marginTop: 6 },
  listContent: { padding: 16, paddingBottom: 100 },
  workerCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#E0E0E0',
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerName: { fontWeight: '600', color: '#212121' },
  hoursRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  hourItem: { flex: 1, alignItems: 'center' },
  hourLabel: { color: '#9E9E9E', marginBottom: 2 },
  hourValue: { color: '#424242' },
  totalValue: { color: '#4CAF50', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyText: { color: '#BDBDBD' },
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
    borderTopColor: '#E0E0E0',
    elevation: 8,
  },
  footerLabel: { color: '#757575' },
  footerValue: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalTitle: { fontWeight: 'bold', marginBottom: 16, color: '#212121' },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeRow: { flexDirection: 'row' },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  calculatedLabel: { color: '#757575' },
  calculatedValue: { color: '#4CAF50', fontWeight: 'bold' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: { minWidth: 100 },
});
