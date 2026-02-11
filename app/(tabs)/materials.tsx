import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
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
import { calculateDistance, parseKilometer } from '../../src/utils/calculations';
import { validateKilometerFormat } from '../../src/utils/validators';

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
  const [formFromKm, setFormFromKm] = useState('');
  const [formToKm, setFormToKm] = useState('');
  const [formMeters, setFormMeters] = useState('0');
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

  // Auto-calculate meters when km changes
  useEffect(() => {
    if (validateKilometerFormat(formFromKm) && validateKilometerFormat(formToKm)) {
      const dist = calculateDistance(formFromKm, formToKm);
      setFormMeters(dist > 0 ? dist.toString() : '0');
    }
  }, [formFromKm, formToKm]);

  const resetForm = () => {
    setFormType('Fugenmasse');
    setFormFromKm('');
    setFormToKm('');
    setFormMeters('0');
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
    setFormFromKm(material.fromKm);
    setFormToKm(material.toKm);
    setFormMeters(material.meters.toString());
    setFormTime(material.time);
    setFormNotes(material.notes ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!project) return;

    if (!validateKilometerFormat(formFromKm) || !validateKilometerFormat(formToKm)) {
      setSnackbar(t('materials.invalidKmFormat'));
      return;
    }

    const meters = parseFloat(formMeters);
    if (isNaN(meters) || meters <= 0) {
      setSnackbar(t('common.error'));
      return;
    }

    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, {
          type: formType,
          fromKm: formFromKm,
          toKm: formToKm,
          meters,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await createMaterial({
          projectId: project.id,
          type: formType,
          fromKm: formFromKm,
          toKm: formToKm,
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
    } catch (error) {
      console.error('Error saving material:', error);
      setSnackbar(t('common.error'));
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
          }
        },
      },
    ]);
  };

  const renderMaterialCard = ({ item }: { item: Material }) => (
    <Card mode="outlined" style={styles.materialCard}>
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

        <View style={styles.kmRow}>
          <Text variant="bodyMedium" style={styles.kmText}>
            {item.fromKm}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#757575" />
          <Text variant="bodyMedium" style={styles.kmText}>
            {item.toKm}
          </Text>
          <Text variant="titleMedium" style={styles.metersText}>
            {item.meters} m
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
              {type}: {formatNumber(meters, 0)} m
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

          <View style={styles.kmInputRow}>
            <TextInput
              label={t('materials.fromKm')}
              value={formFromKm}
              onChangeText={setFormFromKm}
              placeholder="0+000"
              style={[styles.input, styles.kmInput]}
              mode="outlined"
            />
            <MaterialCommunityIcons
              name="arrow-right"
              size={24}
              color="#757575"
              style={styles.arrowIcon}
            />
            <TextInput
              label={t('materials.toKm')}
              value={formToKm}
              onChangeText={setFormToKm}
              placeholder="0+450"
              style={[styles.input, styles.kmInput]}
              mode="outlined"
            />
          </View>

          <TextInput
            label={t('materials.meters')}
            value={formMeters}
            onChangeText={setFormMeters}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            disabled
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
            <Button mode="contained" onPress={handleSave} style={styles.modalButton} buttonColor="#00897B">
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  listContent: { padding: 16, paddingBottom: 160 },
  materialCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: { borderRadius: 8 },
  cardActions: { flexDirection: 'row' },
  kmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  kmText: { color: '#424242', fontWeight: '600' },
  metersText: { color: '#2196F3', fontWeight: 'bold', marginLeft: 'auto' },
  timeText: { color: '#757575', marginTop: 4 },
  notes: { color: '#9E9E9E', marginTop: 4, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyText: { color: '#BDBDBD' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
  },
  footerLabel: { color: '#757575', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { color: '#2196F3', fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: 80, backgroundColor: '#00897B', borderRadius: 16 },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  modalTitle: { fontWeight: 'bold', marginBottom: 16, color: '#212121' },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  kmInputRow: { flexDirection: 'row', alignItems: 'center' },
  kmInput: { flex: 1 },
  arrowIcon: { marginHorizontal: 8, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalButton: { minWidth: 100 },
});
