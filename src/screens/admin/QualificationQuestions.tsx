import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getAllQuestions, createQualificationQuestion, deleteQualificationQuestion } from "../../services/qualifitionService";
import { getRoles } from "../../services/rolesService";
import {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  LIGHT_BACKGROUND,
} from "../../styles/colors";

// Componente Modal separado para evitar re-renderizados
const CreateQuestionModal = React.memo(({ 
  visible, 
  onClose, 
  onSubmit, 
  roles 
}) => {
  // Estado local del modal para evitar interferencias
  const [question, setQuestion] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [creating, setCreating] = useState(false);

  // Resetear formulario cuando el modal se abre/cierra
  useEffect(() => {
    if (!visible) {
      setQuestion("");
      setSelectedRoleId("");
      setCreating(false);
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      Alert.alert("Error", "Por favor ingrese una pregunta");
      return;
    }
    
    if (!selectedRoleId) {
      Alert.alert("Error", "Por favor seleccione un rol");
      return;
    }

    setCreating(true);
    
    try {
      // Encontrar el nombre del rol seleccionado
      const selectedRole = roles.find(role => role.value === selectedRoleId);
      
      const questionData = {
        question: question.trim(),
        roleType: selectedRole?.title || "",
      };
      
      await onSubmit(questionData);
      
      // Cerrar modal después del éxito
      onClose();
      
    } catch (error) {
      console.error("Error al crear pregunta:", error);
      Alert.alert("Error", "No se pudo crear la pregunta");
    } finally {
      setCreating(false);
    }
  }, [question, selectedRoleId, roles, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (!creating) {
      onClose();
    }
  }, [creating, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Pregunta de Evaluación</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={SECONDARY_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pregunta *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Escriba la pregunta de evaluación..."
                value={question}
                onChangeText={setQuestion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rol destinatario *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                  style={styles.picker}
                  enabled={roles.length > 0}>
                  <Picker.Item 
                    key="default" 
                    label={roles.length === 0 ? "Cargando roles..." : "Seleccione un rol..."} 
                    value="" 
                  />
                  {roles.map((role) => (
                    <Picker.Item
                      key={role.value}
                      label={role.title}
                      value={role.value}
                    />
                  ))}
                </Picker>
              </View>
              {roles.length === 0 && (
                <Text style={styles.noRolesText}>
                  No se pudieron cargar los roles. Verifique su conexión.
                </Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleClose}
                disabled={creating}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleSubmit}
                disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="add" size={20} color="white" />
                    <Text style={styles.createButtonText}>Crear Pregunta</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

CreateQuestionModal.displayName = 'CreateQuestionModal';

const QualificationQuestionsScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Filtrar preguntas basado en el texto de búsqueda
    if (searchText.trim() === "") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(question => 
        question.question.toLowerCase().includes(searchText.toLowerCase()) ||
        question.roleType.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [questions, searchText]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [questionsResponse, rolesData] = await Promise.all([
        getAllQuestions(),
        getRoles()
      ]);
      
      // Extraer el array de preguntas de la respuesta
      const questionsData = questionsResponse?.data || [];
      console.log("Questions loaded:", questionsData.length);
      console.log("Roles loaded:", rolesData);
      
      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
      // Asegurar que questions sea un array vacío en caso de error
      setQuestions([]);
      setFilteredQuestions([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const questionsResponse = await getAllQuestions();
      const questionsData = questionsResponse?.data || [];
      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
    } catch (error) {
      console.error("Error al refrescar:", error);
      Alert.alert("Error", "No se pudieron actualizar los datos");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCreateQuestion = useCallback(async (questionData) => {
    try {
      await createQualificationQuestion(questionData);
      
      // Recargar preguntas
      await loadInitialData();
      
      Alert.alert("Éxito", "Pregunta creada correctamente");
    } catch (error) {
      throw error; // Propagar el error para que el modal lo maneje
    }
  }, [loadInitialData]);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    try {
      await deleteQualificationQuestion(questionId);
      
      // Recargar preguntas después de eliminar
      await loadInitialData();
      
      Alert.alert("Éxito", "Pregunta eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar pregunta:", error);
      Alert.alert("Error", "No se pudo eliminar la pregunta");
      throw error; // Propagar el error para que el componente lo maneje
    }
  }, [loadInitialData]);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const getRoleColor = useCallback((roleName) => {
    switch (roleName) {
      case "Trabajador":
        return PRIMARY_COLOR;
      case "Productor":
        return PRIMARY_COLOR;
      case "Administrador":
        return PRIMARY_COLOR;
      default:
        return SECONDARY_COLOR;
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Componente SwipeableQuestionCard con funcionalidad de eliminar
  const SwipeableQuestionCard = React.memo(({ question, onDelete }) => {
    const [translateX] = useState(new Animated.Value(0));
    const [isDeleting, setIsDeleting] = useState(false);

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Solo permitir deslizar hacia la izquierda
        if (gestureState.dx <= 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        
        if (gestureState.dx < -100) {
          // Mostrar botón de eliminar
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: false,
          }).start();
        } else {
          // Volver a la posición original
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    });

    const handleDelete = useCallback(() => {
      Alert.alert(
        "Eliminar Pregunta",
        `¿Está seguro que desea eliminar esta pregunta?\n\n"${question.question}"`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              // Volver a la posición original
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
              }).start();
            }
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              setIsDeleting(true);
              try {
                await onDelete(question.id);
                // Animar la salida del card
                Animated.timing(translateX, {
                  toValue: -Dimensions.get('window').width,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              } catch (error) {
                setIsDeleting(false);
                // Volver a la posición original si hay error
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: false,
                }).start();
              }
            }
          }
        ]
      );
    }, [question, onDelete, translateX]);

    return (
      <View style={styles.swipeContainer}>
        {/* Botón de eliminar que aparece al deslizar */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="delete" size={24} color="white" />
                <Text style={styles.actionText}>Borrar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Card principal */}
        <Animated.View
          style={[
            styles.questionCardContainer,
            {
              transform: [{ translateX }]
            }
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionInfo}>
                <Text style={styles.questionText}>{question.question}</Text>
                <View style={styles.questionMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(question.roleType) },
                    ]}>
                    <Icon name="group" size={14} color="white" />
                    <Text style={styles.roleText}>{question.roleType}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    Creada: {formatDate(question.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  });

  SwipeableQuestionCard.displayName = 'SwipeableQuestionCard';

  // Memoizar los roles para evitar re-renders innecesarios en el modal
  const memoizedRoles = useMemo(() => roles, [roles]);

  if (loading) {
    return (
      <ScreenLayoutAdmin navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </ScreenLayoutAdmin>
    );
  }

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header con diseño nuevo */}
        <View style={styles.newHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Preguntas de Evaluación</Text>
              <Text style={styles.headerSubtitle}>Gestiona las preguntas de evaluación</Text>
            </View>
            
            <View style={styles.headerActions}>
             
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleOpenModal}>
                <Icon name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por pregunta o rol..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchText("")}
                  style={styles.clearButton}>
                  <Icon name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Contador de preguntas */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {searchText ? filteredQuestions.length : questions?.length || 0} pregunta{((searchText ? filteredQuestions.length : questions?.length || 0) !== 1) ? 's' : ''} 
            {searchText ? ` encontrada${filteredQuestions.length !== 1 ? 's' : ''}` : ' registrada' + ((questions?.length || 0) !== 1 ? 's' : '')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {!filteredQuestions || filteredQuestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="help-outline" size={80} color={SECONDARY_COLOR} />
              <Text style={styles.emptyTitle}>
                {searchText ? "No se encontraron preguntas" : "No hay preguntas registradas"}
              </Text>
              <Text style={styles.emptyDescription}>
                {searchText 
                  ? "Intenta con otros términos de búsqueda" 
                  : "Comience creando su primera pregunta de evaluación"}
              </Text>
              {!searchText && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleOpenModal}>
                  <Icon name="add" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.emptyButtonText}>Crear Primera Pregunta</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.questionsContainer}>
              {filteredQuestions.map((question) => (
                <SwipeableQuestionCard 
                  key={question.id} 
                  question={question} 
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <CreateQuestionModal
          visible={showCreateModal}
          onClose={handleCloseModal}
          onSubmit={handleCreateQuestion}
          roles={memoizedRoles}
        />
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
    backgroundColor: '#284F66', 
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    marginHorizontal: 14,
  },
  mainTitle: {
    fontSize: 22,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  scrollContainer: {
    flex: 1,
  },
  questionsContainer: {
    padding: 16,
  },
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  questionCardContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionCard: {
    padding: 16,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: SECONDARY_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  emptyButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: PRIMARY_COLOR,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  picker: {
    height: 50,
    color: PRIMARY_COLOR,
  },
  noRolesText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginTop: 4,
    fontStyle: "italic",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  cancelButtonText: {
    color: SECONDARY_COLOR,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default QualificationQuestionsScreen;