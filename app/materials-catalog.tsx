import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FAB, Card, IconButton, Modal, Portal, Button } from 'react-native-paper';
import { MaterialCatalog } from '../src/types';
import { getMaterialsCatalog, addMaterialCatalog, updateMaterialCatalog, deleteMaterialCatalog } from '../src/services/database';
import MaterialForm from '../src/components/common/MaterialForm';

export default function MaterialsCatalogScreen() {
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalog | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMaterials = async () => {
    try {
      const data = await getMaterialsCatalog();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      Alert.alert('Błąd', 'Nie udało się załadować materiałów');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setModalVisible(true);
  };

  const handleEditMaterial = (material: MaterialCatalog) => {
    setEditingMaterial(material);
    setModalVisible(true);
  };

  const handleDeleteMaterial = (material: MaterialCatalog) => {
    Alert.alert(
      'Usuń materiał',
      `Czy na pewno chcesz usunąć materiał "${material.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMaterialCatalog(material.id);
              loadMaterials();
            } catch (error: any) {
              Alert.alert('Błąd', error.message || 'Nie udało się usunąć materiału');
            }
          },
        },
      ]
    );
  };

  const handleSaveMaterial = async (data: Omit<MaterialCatalog, 'id' | 'createdAt'>) => {
    try {
      if (editingMaterial) {
        await updateMaterialCatalog(editingMaterial.id, data);
      } else {
        await addMaterialCatalog(data);
      }
      setModalVisible(false);
      loadMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać materiału');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMaterials();
  };

  const renderMaterialItem = ({ item }: { item: MaterialCatalog }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              {item.unit} • {item.pricePerUnit.toFixed(2)} zł
            </Text>
            {item.density && (
              <Text style={styles.itemDetails}>Gęstość: {item.density} t/m³</Text>
            )}
            {item.category && (
              <Text style={styles.itemDetails}>Kategoria: {item.category}</Text>
            )}
          </View>
          <View style={styles.itemActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditMaterial(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteMaterial(item)}
              style={styles.deleteButton}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={materials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak materiałów w katalogu</Text>
            <Text style={styles.emptySubtext}>
              Dodaj pierwszy materiał za pomocą przycisku +
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddMaterial}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <MaterialForm
            initialData={editingMaterial || undefined}
            onSubmit={handleSaveMaterial}
            onCancel={() => setModalVisible(false)}
            unitOptions={['m²', 'mb', 't']}
          />
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginLeft: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF9800',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});