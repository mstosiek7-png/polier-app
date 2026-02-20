import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Portal,
  Modal,
  TextInput,
  Snackbar,
  Divider,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getAllProjects,
  createProject,
  setActiveProject,
  getAllWorkers,
  createWorker,
  updateWorkerStatus,
  getAllVehicles,
  createVehicle,
} from '../src/services/database';
import type { Project, Worker, Vehicle } from '../src/types';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [snackbar, setSnackbar] = useState('');

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');

  // Workers
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleReg, setNewVehicleReg] = useState('');
  const [newVehicleOdo, setNewVehicleOdo] = useState('');
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [p, w, v] = await Promise.all([
        getAllProjects(),
        getAllWorkers(),
        getAllVehicles(),
      ]);
      setProjects(p);
      setWorkers(w);
      setVehicles(v);
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // Project handlers
  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Blad', 'Podaj nazwe projektu');
      return;
    }
    try {
      await createProject(newProjectName.trim(), newProjectLocation.trim() || undefined);
      setProjectModalVisible(false);
      setNewProjectName('');
      setNewProjectLocation('');
      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Blad tworzenia projektu:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie utworzyc projektu';
      Alert.alert('Blad', message);
    }
  };

  const handleSetActiveProject = async (id: string) => {
    try {
      await setActiveProject(id);
      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Error setting active project:', error);
    }
  };

  // Worker handlers
  const handleAddWorker = async () => {
    if (!newFirstName.trim()) {
      Alert.alert('Blad', 'Podaj imie pracownika');
      return;
    }
    if (!newLastName.trim()) {
      Alert.alert('Blad', 'Podaj nazwisko pracownika');
      return;
    }
    try {
      await createWorker(newFirstName.trim(), newLastName.trim());
      setWorkerModalVisible(false);
      setNewFirstName('');
      setNewLastName('');
      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Blad dodawania pracownika:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie dodac pracownika';
      Alert.alert('Blad', message);
    }
  };

  const handleToggleWorker = async (worker: Worker) => {
    try {
      await updateWorkerStatus(worker.id, !worker.active);
      await loadData();
    } catch (error) {
      console.error('Error toggling worker:', error);
    }
  };

  // Vehicle handlers
  const handleAddVehicle = async () => {
    if (!newVehicleMake.trim()) {
      Alert.alert('Blad', 'Podaj marke pojazdu');
      return;
    }
    if (!newVehicleModel.trim()) {
      Alert.alert('Blad', 'Podaj model pojazdu');
      return;
    }
    if (!newVehicleReg.trim()) {
      Alert.alert('Blad', 'Podaj numer rejestracyjny');
      return;
    }
    const odo = parseFloat(newVehicleOdo) || 0;
    try {
      await createVehicle(
        newVehicleMake.trim(),
        newVehicleModel.trim(),
        newVehicleReg.trim(),
        odo
      );
      setVehicleModalVisible(false);
      setNewVehicleMake('');
      setNewVehicleModel('');
      setNewVehicleReg('');
      setNewVehicleOdo('');
      await loadData();
      setSnackbar(t('common.success'));
    } catch (error) {
      console.error('Blad dodawania pojazdu:', error);
      const message = error instanceof Error ? error.message : 'Nie udalo sie dodac pojazdu';
      Alert.alert('Blad', message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Language */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.language')}
            </Text>
            <RadioButton.Group onValueChange={changeLanguage} value={language}>
              <RadioButton.Item
                label={t('settings.polish')}
                value="pl"
                color="#FF9800"
              />
              <RadioButton.Item
                label={t('settings.german')}
                value="de"
                color="#FF9800"
              />
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Projects */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('settings.projects')}
              </Text>
              <IconButton
                icon="plus"
                iconColor="#FF9800"
                size={20}
                onPress={() => setProjectModalVisible(true)}
              />
            </View>
            {projects.map((project) => (
              <List.Item
                key={project.id}
                title={project.name}
                description={project.location}
                left={() => (
                  <RadioButton
                    value={project.id}
                    status={project.active ? 'checked' : 'unchecked'}
                    onPress={() => handleSetActiveProject(project.id)}
                    color="#FF9800"
                  />
                )}
                style={styles.listItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Workers */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('settings.workers')}
              </Text>
              <IconButton
                icon="plus"
                iconColor="#FF9800"
                size={20}
                onPress={() => setWorkerModalVisible(true)}
              />
            </View>
            {workers.map((worker) => (
              <List.Item
                key={worker.id}
                title={`${worker.firstName} ${worker.lastName}`}
                right={() => (
                  <Switch
                    value={worker.active}
                    onValueChange={() => handleToggleWorker(worker)}
                    color="#FF9800"
                  />
                )}
                style={[
                  styles.listItem,
                  !worker.active && styles.inactiveItem,
                ]}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Vehicles */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('settings.vehicles')}
              </Text>
              <IconButton
                icon="plus"
                iconColor="#FF9800"
                size={20}
                onPress={() => setVehicleModalVisible(true)}
              />
            </View>
            {vehicles.map((vehicle) => (
              <List.Item
                key={vehicle.id}
                title={`${vehicle.make} ${vehicle.model}`}
                description={`${vehicle.registrationNumber} | ${vehicle.currentOdometer} km`}
                style={styles.listItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Materials Catalog */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Materiały
              </Text>
              <IconButton
                icon="arrow-right"
                iconColor="#FF9800"
                size={20}
                onPress={() => router.push('/materials-catalog')}
              />
            </View>
            <List.Item
              title="Zarządzaj katalogiem materiałów"
              description="Dodawaj, edytuj i usuwaj materiały"
              left={(props) => <List.Icon {...props} icon="package-variant" color="#FF9800" />}
              style={styles.listItem}
              onPress={() => router.push('/materials-catalog')}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.about')}
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              Polier App v1.0.0
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Project Modal */}
      <Portal>
        <Modal
          visible={projectModalVisible}
          onDismiss={() => setProjectModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('common.add')} - {t('settings.projects')}
          </Text>
          <TextInput
            label="Name"
            value={newProjectName}
            onChangeText={setNewProjectName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Location"
            value={newProjectLocation}
            onChangeText={setNewProjectLocation}
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setProjectModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddProject} buttonColor="#FF9800">
              {t('common.save')}
            </Button>
          </View>
        </Modal>

        {/* Add Worker Modal */}
        <Modal
          visible={workerModalVisible}
          onDismiss={() => setWorkerModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('hours.addWorker')}
          </Text>
          <TextInput
            label={t('hours.firstName')}
            value={newFirstName}
            onChangeText={setNewFirstName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label={t('hours.lastName')}
            value={newLastName}
            onChangeText={setNewLastName}
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setWorkerModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddWorker} buttonColor="#FF9800">
              {t('common.save')}
            </Button>
          </View>
        </Modal>

        {/* Add Vehicle Modal */}
        <Modal
          visible={vehicleModalVisible}
          onDismiss={() => setVehicleModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('common.add')} - {t('settings.vehicles')}
          </Text>
          <TextInput
            label="Make"
            value={newVehicleMake}
            onChangeText={setNewVehicleMake}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Model"
            value={newVehicleModel}
            onChangeText={setNewVehicleModel}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Registration"
            value={newVehicleReg}
            onChangeText={setNewVehicleReg}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Odometer (km)"
            value={newVehicleOdo}
            onChangeText={setNewVehicleOdo}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setVehicleModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddVehicle} buttonColor="#FF9800">
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
  content: { padding: 20, paddingBottom: 32 },
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  listItem: {
    paddingLeft: 0,
  },
  inactiveItem: {
    opacity: 0.5,
  },
  aboutText: {
    color: '#6B7280',
    marginTop: 4,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 20,
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
    marginTop: 8,
  },
});
