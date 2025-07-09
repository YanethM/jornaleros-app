import React, { useEffect, useState } from "react";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SwipeListView } from 'react-native-swipe-list-view';
import { getCultivationPhasesByCropId, updateCultivationPhase, deleteCultivationPhase } from "../../services/cultivationPhaseService";
import { useIsFocused } from "@react-navigation/native";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const SUCCESS_COLOR = "#2ecc71";
const DANGER_COLOR = "#e74c3c";
const WARNING_COLOR = "#f39c12";
const LIGHT_BACKGROUND = "#f8fafc";

const CropTypePhaseScreen = ({ navigation, route }) => {
  const { cropTypeId, cropTypeName } = route.params || {};
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editPhaseName, setEditPhaseName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isFocused = useIsFocused();

  const fetchPhases = async () => {
    if (!cropTypeId) {
      Alert.alert("Error", "No se pudo obtener el ID del cultivo");
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await getCultivationPhasesByCropId(cropTypeId);
      const phasesData = response.data || [];
      
      // Ordenar las fases por order si existe, o por nombre si no
      const sortedPhases = phasesData.sort((a, b) => {
        if (a.order !== null && b.order !== null) {
          return a.order - b.order;
        }
        // Si no hay order, ordenar por el número en el nombre
        const getPhaseNumber = (name) => {
          const match = name.match(/(\d+)\./);
          return match ? parseInt(match[1]) : 999;
        };
        return getPhaseNumber(a.name) - getPhaseNumber(b.name);
      });
      
      // Convertir el array para SwipeListView (necesita formato específico)
      const formattedPhases = sortedPhases.map(phase => ({
        key: phase.id.toString(),
        ...phase
      }));
      
      setPhases(formattedPhases);
    } catch (error) {
      console.error("Error al obtener fases:", error);
      Alert.alert("Error", "No se pudieron cargar las fases del cultivo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused && cropTypeId) {
      fetchPhases();
    }
  }, [isFocused, cropTypeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPhases();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPhaseIcon = (phaseName) => {
    const name = phaseName.toLowerCase();
    if (name.includes('germinación') || name.includes('vivero')) return 'eco';
    if (name.includes('trasplante')) return 'nature';
    if (name.includes('desarrollo') || name.includes('vegetativo')) return 'park';
    if (name.includes('floración')) return 'local-florist';
    if (name.includes('fructificación')) return 'agriculture';
    if (name.includes('cosecha')) return 'inventory';
    if (name.includes('mantenimiento') || name.includes('renovación')) return 'build';
    return 'timeline';
  };

  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
    setEditPhaseName(phase.name);
    setEditModalVisible(true);
  };

  const handleUpdatePhase = async () => {
    if (!editPhaseName.trim()) {
      Alert.alert("Error", "El nombre de la fase no puede estar vacío");
      return;
    }

    try {
      setUpdating(true);
      
      const updateData = {
        name: editPhaseName.trim(),
        cropTypeId: cropTypeId
      };

      await updateCultivationPhase(editingPhase.id, updateData);
      
      // Actualizar la fase en el estado local
      setPhases(prevPhases => 
        prevPhases.map(phase => 
          phase.id === editingPhase.id 
            ? { ...phase, name: editPhaseName.trim() }
            : phase
        )
      );

      setEditModalVisible(false);
      setEditingPhase(null);
      setEditPhaseName('');
      
      Alert.alert("Éxito", "La fase se ha actualizado correctamente");
      
    } catch (error) {
      console.error("Error al actualizar fase:", error);
      Alert.alert("Error", "No se pudo actualizar la fase. Intenta nuevamente.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingPhase(null);
    setEditPhaseName('');
  };

  const handleDeletePhase = (phase) => {
    Alert.alert(
      "Eliminar Fase",
      `¿Estás seguro de que quieres eliminar la fase "${phase.name}"?\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePhase(phase)
        }
      ]
    );
  };

  const deletePhase = async (phase) => {
    try {
      setDeleting(true);
      
      // Llamar al servicio de eliminación
      await deleteCultivationPhase(phase.id);
      
      // Actualizar el estado local eliminando la fase
      setPhases(prevPhases => 
        prevPhases.filter(p => p.id !== phase.id)
      );
      
      Alert.alert("Éxito", "La fase se ha eliminado correctamente");
      
    } catch (error) {
      console.error("Error al eliminar fase:", error);
      Alert.alert("Error", "No se pudo eliminar la fase. Intenta nuevamente.");
    } finally {
      setDeleting(false);
    }
  };

  const renderPhase = ({ item }) => (
    <View style={styles.phaseCard}>
      <View style={styles.phaseIconContainer}>
        <Icon name={getPhaseIcon(item.name)} size={24} color={PRIMARY_COLOR} />
      </View>
      <View style={styles.phaseContent}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseName}>{item.name}</Text>
          {item.isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Requerido</Text>
            </View>
          )}
        </View>
        
        {item.description && (
          <Text style={styles.phaseDescription}>{item.description}</Text>
        )}
        
        <View style={styles.phaseMetadata}>
          <Text style={styles.phaseDate}>
            Creado: {formatDate(item.createdAt)}
          </Text>
          {item.duration && (
            <Text style={styles.phaseDuration}>
              Duración: {item.duration}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderHiddenItem = ({ item }) => (
    <View style={styles.hiddenItemContainer}>
      <View style={styles.hiddenActionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, deleting && styles.disabledActionButton]}
          onPress={() => handleEditPhase(item)}
          disabled={deleting}
        >
          <Icon name="edit" size={20} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, deleting && styles.disabledActionButton]}
          onPress={() => handleDeletePhase(item)}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="delete" size={20} color="white" />
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="timeline" size={80} color={SECONDARY_COLOR} />
      <Text style={styles.emptyTitle}>Sin fases registradas</Text>
      <Text style={styles.emptyDescription}>
        Este tipo de cultivo aún no tiene fases definidas
      </Text>
    </View>
  );

  const ListContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Cargando fases...</Text>
        </View>
      );
    }

    if (phases.length === 0) {
      return <EmptyListComponent />;
    }

    return (
      <SwipeListView
        data={phases}
        renderItem={renderPhase}
        renderHiddenItem={renderHiddenItem}
        keyExtractor={(item) => item.key}
        rightOpenValue={-160}
        disableRightSwipe={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
          />
        }
        contentContainerStyle={styles.listContentContainer}
      />
    );
  };

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.newHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Fases de {cropTypeName || 'Cultivo'}</Text>
              <Text style={styles.headerSubtitle}>Fases del proceso de cultivo</Text>
            </View>
            
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Contador de fases */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {phases?.length || 0} fase{(phases?.length || 0) !== 1 ? 's' : ''} de cultivo
          </Text>
        </View>

        {/* Lista de fases */}
        <View style={styles.contentContainer}>
          <ListContent />
        </View>

        {/* Modal de edición */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancelEdit}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Fase</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancelEdit}
                >
                  <Icon name="close" size={24} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>Nombre de la fase</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhaseName}
                  onChangeText={setEditPhaseName}
                  placeholder="Ingresa el nombre de la fase"
                  multiline={false}
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={updating}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, updating && styles.disabledButton]}
                  onPress={handleUpdatePhase}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
  },
  newHeader: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  counterText: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  listContentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  phaseCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6f2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  phaseContent: {
    flex: 1,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    flex: 1,
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: SUCCESS_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  phaseMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  phaseDuration: {
    fontSize: 12,
    color: SECONDARY_COLOR,
    fontWeight: '500',
  },
  hiddenItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: LIGHT_BACKGROUND,
    marginBottom: 12,
    borderRadius: 12,
  },
  hiddenActionsContainer: {
    flexDirection: 'row',
    width: 160,
    height: '100%',
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  editButton: {
    backgroundColor: WARNING_COLOR,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  deleteButton: {
    backgroundColor: DANGER_COLOR,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: SECONDARY_COLOR,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CropTypePhaseScreen;