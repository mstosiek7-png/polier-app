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
  Chip,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  getActiveProject,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialsSummary,
} from '../../src/services/database';
import type { Material, Project } from '../../src/types';
import { MATERIAL_TYPES } from '../../src/utils/constants';
import { getTodayISO, getCurrentTime, formatNumber } from '../../src/utils/formatters';

export default function MaterialsScreen() {
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // Form state
  const [formType, setFormType] = useState('Fugenmasse');
  const [formMeters, setFormMeters] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeProject = await getActiveProject();
      setProject(activeProject);
      if (activeProject) {
        const today = getTodayISO();
        const [items, summaryData] = await Promise.all([
          getMaterials(activeProject.id, today),
          getMaterialsSummary(activeProject.id, today),
        ]);
        setMaterials(items);
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormType('Fugenmasse');
    setFormMeters('');
    setFormTime(getCurrentTime());
    setFormNotes('');
    setEditingMaterial(null);
  };

  const openAddModal = () => {
    resetForm();
    setFormTime(getCurrentTime());
    setModalVisible(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormType(material.type);
    setFormMeters(material.meters.toString());
    setFormTime(material.time);
    setFormNotes(material.notes ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!project) {
      Alert.alert('Blad', 'Brak aktywnego projektu');
      return;
    }

    if (!formType) {
      Alert.alert('Brak typu', 'Wybierz typ materialu');
      return;
    }

    const meters = parseFloat(formMeters.replace(',', '.'));
    if (isNaN(meters) || meters <= 0) {
      Alert.alert('Bledna ilosc', 'Podaj metry biezace (wieksza od 0)');
      return;
    }

    try {
      console.log('Zapisuje material:', { type: formType, meters, time: formTime });

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, {
          type: formType,
          meters,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await createMaterial({
          projectId: project.id,
          type: formType,
          meters,
          date: getTodayISO(),
          time: formTime,
          notes: formNotes.trim() || undefined,
        });
      }
      setModalVisible(false);
      resetForm();
      await loadData();
      setSnackbar(t('common.success'));
      console.log('Material zapisany');
    } catch (error) {
      console.error('Blad zapisu materialu:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac';
      Alert.alert('Blad zapisu', message);
    }
  };

  const handleDelete = (material: Material) => {
    Alert.alert(t('common.confirm'), t('materials.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaterial(material.id);
            await loadData();
            setSnackbar(t('common.success'));
          } catch (error) {
            console.error('Error deleting material:', error);
            const message = error instanceof Error ? error.message : 'Nie udalo sie usunac';
            Alert.alert('Blad', message);
          }
        },
      },
    ]);
  };

  const renderMaterialCard = ({ item }: { item: Material }) => (
    <Card mode="elevated" style={styles.materialCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Chip
            mode="flat"
            style={[styles.typeChip, { backgroundColor: '#2196F3' + '20' }]}
            textStyle={{ color: '#2196F3', fontSize: 12 }}
          >
            {item.type}
          </Chip>
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

        <View style={styles.metersRow}>
          <Text variant="titleMedium" style={styles.metersText}>
            {formatNumber(item.meters, 1)} MB
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.timeText}>
          {item.time}
        </Text>

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
        data={materials}
        renderItem={renderMaterialCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ruler" size={64} color="#E0E0E0" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t('materials.noMaterials')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Summary footer */}
      <View style={styles.footer}>
        <Text variant="titleSmall" style={styles.footerLabel}>
          {t('materials.summary')}:
        </Text>
        <View style={styles.summaryRow}>
          {Object.entries(summary).map(([type, meters]) => (
            <Text key={type} variant="bodySmall" style={styles.summaryItem}>
              {type}: {formatNumber(meters, 0)} MB
            </Text>
          ))}
          {Object.keys(summary).length === 0 && (
            <Text variant="bodySmall" style={styles.summaryItem}>
              {t('common.noData')}
            </Text>
          )}
        </View>
      </View>

      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={openAddModal} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingMaterial ? t('materials.editTitle') : t('materials.addTitle')}
          </Text>

          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <TextInput
                label={t('materials.type')}
                value={formType}
                onFocus={() => setTypeMenuVisible(true)}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="chevron-down" />}
                showSoftInputOnFocus={false}
              />
            }
          >
            {MATERIAL_TYPES.map((type) => (
              <Menu.Item
                key={type}
                onPress={() => {
                  setFormType(type);
                  setTypeMenuVisible(false);
                }}
                title={type}
              />
            ))}
          </Menu>

          <TextInput
            label="Metry biezace (MB)"
            value={formMeters}
            onChangeText={setFormMeters}
            keyboardType="decimal-pad"
            style={styles.input}
            mode="outlined"
            placeholder="np. 120.5"
            right={<TextInput.Affix text="MB" />}
          />

          <TextInput
            label={t('common.time')}
            value={formTime}
            onChangeText={setFormTime}
            placeholder="HH:MM"
            style={styles.input}
            mode="outlined"
          />

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
  listContent: { padding: 20, paddingBottom: 160 },
  materialCard: {
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
  typeChip: { borderRadius: 10 },
  cardActions: { flexDirection: 'row' },
  metersRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
  },
  metersText: { color: '#2196F3', fontWeight: 'bold' },
  timeText: { color: '#6B7280', marginTop: 4 },
  notes: { color: '#9CA3AF', marginTop: 6, fontStyle: 'italic', fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  footerLabel: { color: '#1A1A2E', fontWeight: '700', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { color: '#2196F3', fontWeight: '600' },
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
  modalTitle: { fontWeight: '700', marginBottom: 20, color: '#1A1A2E' },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalButton: { minWidth: 100, borderRadius: 12 },
});
