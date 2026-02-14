import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  FAB, 
  Portal, 
  Modal, 
  TextInput, 
  Divider,
  IconButton,
  Menu,
  Chip,
  Snackbar
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MaterialUsage, Project } from '../../src/types';
import { 
  getAllProjects, 
  getMaterialUsageByProjectAndDate,
  deleteMaterialUsage
} from '../../src/services/database';

export default function MaterialsCalculatorScreen() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<MaterialUsage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Summary state
  const [summary, setSummary] = useState({
    totalCost: 0,
    quantities: {} as Record<string, number>
  });

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getAllProjects();
        setProjects(projectsData);
        
        // Set first active project as default if none selected
        if (!selectedProject && projectsData.length > 0) {
          const activeProject = projectsData.find(p => p.active) || projectsData[0];
          setSelectedProject(activeProject.id);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  // Load entries when project or date changes
  const loadEntries = useCallback(async () => {
    if (!selectedProject) return;
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await getMaterialUsageByProjectAndDate(selectedProject, dateStr);
      setEntries(data);
      calculateSummary(data);
    } catch (error) {
      console.error('Error loading material usage:', error);
      setSnackbar('Błąd ładowania danych');
    }
  }, [selectedProject, selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const calculateSummary = (entries: MaterialUsage[]) => {
    const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
    const quantities: Record<string, number> = {};
    
    entries.forEach(entry => {
      quantities[entry.inputUnit] = (quantities[entry.inputUnit] || 0) + entry.inputQuantity;
    });
    
    setSummary({ totalCost, quantities });
  };

  const handleDeleteEntry = async (id: string) => {
    Alert.alert(
      t('common.confirmDelete'),
      t('common.areYouSure'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMaterialUsage(id);
              await loadEntries();
              setSnackbar(t('common.deleted'));
            } catch (error) {
              console.error('Error deleting entry:', error);
              setSnackbar('Błąd usuwania wpisu');
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: pl });
  };

  const getSelectedProjectName = () => {
    const project = projects.find(p => p.id === selectedProject);
    return project ? project.name : 'Wybierz projekt';
  };

  const renderEntry = ({ item }: { item: MaterialUsage }) => (
    <Card mode="elevated" style={styles.entryCard}>
      <Card.Content>
        <View style={styles.entryHeader}>
          <View style={styles.entryTitleContainer}>
            <Text variant="titleMedium" style={styles.entryTitle}>
              {item.name || 'Materiał'}
            </Text>
            <Chip mode="outlined" style={styles.unitChip}>
              {item.inputQuantity} {item.inputUnit}
            </Chip>
          </View>
          <IconButton
            icon="delete"
            iconColor="#F44336"
            size={20}
            onPress={() => handleDeleteEntry(item.id)}
          />
        </View>
        
        <View style={styles.entryDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>Koszt:</Text>
            <Text variant="bodyMedium" style={styles.costText}>
              {item.cost.toFixed(2)} €
            </Text>
          </View>
          
          {item.thicknessCm && (
            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.detailLabel}>Grubość:</Text>
              <Text variant="bodyMedium">{item.thicknessCm} cm</Text>
            </View>
          )}
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text variant="bodySmall" style={styles.detailLabel}>Uwagi:</Text>
              <Text variant="bodySmall" style={styles.notesText}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with project selector and date */}
        <Card mode="elevated" style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <MaterialCommunityIcons name="calculator" size={28} color="#FF9800" />
              <Text variant="titleLarge" style={styles.screenTitle}>
                Kalkulator materiałów
              </Text>
            </View>

            {/* Project selector */}
            <View style={styles.selectorContainer}>
              <Text variant="bodyMedium" style={styles.selectorLabel}>
                Projekt:
              </Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                    style={styles.projectButton}
                    contentStyle={styles.projectButtonContent}
                    icon="chevron-down"
                  >
                    <Text numberOfLines={1} style={styles.projectButtonText}>
                      {getSelectedProjectName()}
                    </Text>
                  </Button>
                }
              >
                {projects.map(project => (
                  <Menu.Item
                    key={project.id}
                    title={project.name}
                    onPress={() => {
                      setSelectedProject(project.id);
                      setMenuVisible(false);
                    }}
                    titleStyle={project.id === selectedProject ? styles.selectedProject : undefined}
                  />
                ))}
              </Menu>
            </View>

            {/* Date selector */}
            <View style={styles.dateContainer}>
              <Text variant="bodyMedium" style={styles.selectorLabel}>
                Data:
              </Text>
              <View style={styles.dateControls}>
                <IconButton
                  icon="chevron-left"
                  size={24}
                  onPress={() => handleDateChange(-1)}
                  iconColor="#FF9800"
                />
                <View style={styles.dateDisplay}>
                  <Text variant="bodyLarge" style={styles.dateText}>
                    {formatDate(selectedDate)}
                  </Text>
                  <Button
                    mode="text"
                    onPress={handleToday}
                    compact
                    textColor="#FF9800"
                  >
                    Dzisiaj
                  </Button>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  onPress={() => handleDateChange(1)}
                  iconColor="#FF9800"
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Summary card */}
        {entries.length > 0 && (
          <Card mode="elevated" style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                Podsumowanie
              </Text>
              <Divider style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text variant="bodyLarge" style={styles.summaryLabel}>
                  Łączny koszt:
                </Text>
                <Text variant="headlineSmall" style={styles.totalCost}>
                  {summary.totalCost.toFixed(2)} €
                </Text>
              </View>

              {Object.keys(summary.quantities).length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="bodyMedium" style={styles.quantitiesTitle}>
                    Ilości według jednostek:
                  </Text>
                  <View style={styles.quantitiesContainer}>
                    {Object.entries(summary.quantities).map(([unit, quantity]) => (
                      <Chip key={unit} mode="flat" style={styles.quantityChip}>
                        {quantity.toFixed(2)} {unit}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Entries list */}
        <Card mode="elevated" style={styles.listCard}>
          <Card.Content>
            <View style={styles.listHeader}>
              <Text variant="titleMedium" style={styles.listTitle}>
                Wpisy materiałów ({entries.length})
              </Text>
              {entries.length === 0 && (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Brak wpisów dla wybranej daty
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {entries.length > 0 ? (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <Card mode="elevated" style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons 
                name="package-variant-closed" 
                size={64} 
                color="#BDBDBD" 
              />
              <Text variant="bodyLarge" style={styles.emptyMessage}>
                Brak materiałów dla wybranej daty
              </Text>
              <Text variant="bodySmall" style={styles.emptyHint}>
                Dodaj nowy wpis za pomocą przycisku +
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB for adding new entry */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
        color="#FFFFFF"
        customSize={56}
      />

      {/* Modal for adding new entry (to be implemented in Stage 4) */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Dodaj nowy wpis materiału
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Funkcjonalność będzie dostępna w Etapie 4
          </Text>
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setIsModalVisible(false)}
              style={styles.modalButton}
            >
              Zamknij
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 100 },
  
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  screenTitle: {
    fontWeight: 'bold',
    color: '#212121',
  },
  
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    color: '#757575',
    marginBottom: 8,
  },
  projectButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  projectButtonContent: {
    justifyContent: 'space-between',
  },
  projectButtonText: {
    flex: 1,
    textAlign: 'left',
  },
  selectedProject: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  
  dateContainer: {
    marginBottom: 8,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dateText: {
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#757575',
  },
  totalCost: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  quantitiesTitle: {
    color: '#757575',
    marginBottom: 8,
  },
  quantitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quantityChip: {
    backgroundColor: '#E8F5E9',
  },
  
  listCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listHeader: {
    alignItems: 'center',
  },
  listTitle: {
    fontWeight: 'bold',
    color: '#212121',
  },
  emptyText: {
    color: '#9E9E9E',
    marginTop: 4,
  },
  
  listContent: {
    paddingBottom: 16,
  },
  entryCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTitle: {
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  unitChip: {
    backgroundColor: '#FFF3E0',
  },
  entryDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#757575',
  },
  costText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  notesText: {
    color: '#616161',
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMessage: {
    color: '#757575',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    color: '#BDBDBD',
    textAlign: 'center',
  },
  
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF9800',
  },
  
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  modalSubtitle: {
    color: '#757575',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    minWidth: 100,
  },
});