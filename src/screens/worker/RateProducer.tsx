import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";
import { getMyEmployers, getQualificationQuestionsByEmployer, createQualification } from "../../services/qualifitionService";
import { getUserData } from "../../services/userService"; // ← Agregar esta importación

const COLORS = {
  primary: "#274F66",
  primaryLight: "#E8F1F5", 
  primaryDark: "#1A3B4A",
  secondary: "#C49B61",
  secondaryLight: "#F7F2E8",
  tertiary: "#0F52A0",
  tertiaryLight: "#E6EDF8",
  success: "#22C55E",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#E35353",
  errorLight: "#FEF2F2",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    white: "#FFFFFF",
  },
  background: {
    primary: "#F9FAFB",
    secondary: "#FFFFFF",
    tertiary: "#F3F4F6",
  },
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },
};

const RateProducer = ({ navigation }) => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // ← Agregar estado para usuario actual

  useEffect(() => {
    fetchEmployers();
    fetchUserData(); // ← Llamar función para obtener datos del usuario
  }, []);

  // ← Agregar función para obtener datos del usuario
  const fetchUserData = async () => {
    try {
      const userData = await getUserData();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del usuario");
    }
  };

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const response = await getMyEmployers();
      setEmployers(response.employers || []);
      setSummary(response.summary || null);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los empleadores");
      console.error("Error loading employers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (employerId) => {
    try {
      setQuestionsLoading(true);
      const response = await getQualificationQuestionsByEmployer('Productor');
      if (response.success) {
        const producerQuestions = response.data.filter(
          q => q.roleType === "Productor"
        );
        setQuestions(producerQuestions);
        
        // Inicializar ratings
        const initialRatings = {};
        producerQuestions.forEach(question => {
          initialRatings[question.id] = 0;
        });
        setRatings(initialRatings);
        setShowQuestionsModal(true);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las preguntas de evaluación");
      console.error("Error loading questions:", error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchEmployers(), fetchUserData()]); // ← Actualizar ambos datos
    setRefreshing(false);
  };

  const handleSelectEmployer = (employer) => {
    console.log('Selected employer structure:', employer); // ← Debug log temporal
    setSelectedEmployer(employer);
    setComment('');
    fetchQuestions(employer.id);
  };

  const closeQuestionsModal = () => {
    setShowQuestionsModal(false);
    setQuestions([]);
    setRatings({});
    setComment('');
    setSelectedEmployer(null);
  };

  const handleStarPress = (questionId, starValue) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: starValue
    }));
  };

  const renderStars = (questionId, currentRating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(questionId, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? "star" : "star-outline"}
              size={28}
              color={star <= currentRating ? "#FFD700" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getQuestionIcon = (question) => {
    const questionText = question.toLowerCase();
    if (questionText.includes('comunicación') || questionText.includes('trato')) return 'chatbubble';
    if (questionText.includes('pago') || questionText.includes('salario')) return 'card';
    if (questionText.includes('condiciones') || questionText.includes('ambiente')) return 'shield-checkmark';
    if (questionText.includes('organización') || questionText.includes('planificación')) return 'calendar';
    if (questionText.includes('recomend')) return 'thumbs-up';
    return 'star';
  };

  const getOverallRating = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const validRatings = values.filter(rating => rating > 0).length;
    return validRatings > 0 ? (sum / validRatings).toFixed(1) : 0;
  };

  const isFormValid = () => {
    return Object.values(ratings).every(rating => rating > 0);
  };

  const handleSubmitEvaluation = async () => {
    // ← Verificar que tenemos los datos del usuario
    if (!currentUser) {
      Alert.alert(
        "Error",
        "No se han cargado los datos del usuario. Por favor, inténtalo de nuevo.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!isFormValid()) {
      Alert.alert(
        "Evaluación Incompleta",
        "Por favor califica todas las preguntas antes de enviar la evaluación.",
        [{ text: "OK" }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const ratingsArray = Object.entries(ratings).map(([questionId, rating]) => ({
        questionId,
        rating
      }));

      // ← Datos para evaluación de trabajador a empleador (Opción 2)
      const qualificationData = {
        employerProfileId: selectedEmployer.employerProfileId || selectedEmployer.id, // ← ID del perfil del empleador
        ratings: ratingsArray,
        comment: comment.trim() || null,
        // El trabajador actual y su perfil se obtienen automáticamente del token en el backend
      };

      console.log('Sending qualification data:', qualificationData); // ← Debug log

      const response = await createQualification(qualificationData);
      
      if (response.success) {
        const employerName = response.data.evaluatedName || getEmployerDisplayName(selectedEmployer);
        Alert.alert(
          "¡Evaluación Enviada!",
          `Tu evaluación de ${employerName} ha sido guardada exitosamente.\n\nPromedio: ${response.data.averageRating} estrellas`,
          [{ text: "OK", onPress: closeQuestionsModal }]
        );
      } else {
        throw new Error(response.msg || 'Error al enviar evaluación');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      
      // ← Mejorar el manejo de errores
      let errorMessage = "No se pudo enviar la evaluación. Inténtalo de nuevo.";
      
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployerTypeIcon = (type) => {
    return type === "Organización" ? "business" : "person";
  };

  const getStatusColor = (isCurrentlyWorking) => {
    return isCurrentlyWorking ? "#4CAF50" : "#757575";
  };

  const formatLocation = (location) => {
    return location?.fullLocation || `${location?.city}, ${location?.department}`;
  };

  const getEmployerDisplayName = (employer) => {
    return employer.name || employer.displayName || 'Nombre no disponible';
  };

  const getEmployerSubtitle = (employer) => {
    if (employer.type === "Organización" && employer.organization && employer.organization !== 'Ninguna') {
      return employer.organization;
    }
    return employer.type;
  };

  const renderEmployerCard = ({ item }) => (
    <TouchableOpacity
      style={styles.employerCard}
      onPress={() => handleSelectEmployer(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={getEmployerTypeIcon(item.type)}
            size={24}
            color={COLORS.primary}
            style={styles.typeIcon}
          />
          <View style={styles.employerInfo}>
            <Text style={styles.employerName} numberOfLines={1}>
              {getEmployerDisplayName(item)}
            </Text>
            <Text style={styles.employerType}>
              {getEmployerSubtitle(item)}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.isCurrentlyWorking) },
            ]}
          />
          <Text style={styles.statusText}>
            {item.isCurrentlyWorking ? "Activo" : "Inactivo"}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {formatLocation(item.location)}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.stats.totalApplications}</Text>
            <Text style={styles.statLabel}>Aplicaciones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.stats.acceptedApplications}</Text>
            <Text style={styles.statLabel}>Aceptadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.successRate}%</Text>
            <Text style={styles.statLabel}>Éxito</Text>
          </View>
        </View>

        {item.jobTypes.length > 0 && (
          <View style={styles.jobTypesContainer}>
            <Text style={styles.jobTypesLabel}>Cultivos:</Text>
            <View style={styles.jobTypesList}>
              {item.jobTypes.slice(0, 3).map((jobType, index) => (
                <View key={index} style={styles.jobTypeChip}>
                  <Text style={styles.jobTypeText}>{jobType}</Text>
                </View>
              ))}
              {item.jobTypes.length > 3 && (
                <Text style={styles.moreJobTypes}>+{item.jobTypes.length - 3}</Text>
              )}
            </View>
          </View>
        )}

        <Text style={styles.relationshipText}>
          Relación: {item.workRelationship.relationshipDuration}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.rateText}>Tocar para evaluar</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (!summary) return null;

    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mis Empleadores</Text>
        {/* ← Agregar información del usuario si está disponible */}
        {currentUser && (
          <Text style={styles.userInfo}>
            {currentUser.name} {currentUser.lastname}
          </Text>
        )}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{summary.totalEmployers}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{summary.currentEmployers}</Text>
            <Text style={styles.summaryLabel}>Activos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{summary.totalApplications}</Text>
            <Text style={styles.summaryLabel}>Aplicaciones</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay empleadores</Text>
      <Text style={styles.emptyMessage}>
        Aún no has trabajado con ningún empleador
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <CustomTabBarWorker
          state={{ index: 1, routes: [] }}
          navigation={navigation}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando empleadores...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <CustomTabBarWorker
        state={{ index: 1, routes: [] }}
        navigation={navigation}
      />
      <View style={styles.container}>
        <FlatList
          data={employers}
          renderItem={renderEmployerCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />

        {/* Modal mejorado para preguntas de evaluación */}
        <Modal
          visible={showQuestionsModal}
          animationType="slide"
          transparent={false}
          onRequestClose={closeQuestionsModal}
        >
          <View style={styles.modalContainer}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeQuestionsModal}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTitleContainer}>
                <Text style={styles.modalHeaderTitle}>Evaluar Empleador</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  {selectedEmployer ? getEmployerDisplayName(selectedEmployer) : ''}
                </Text>
              </View>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="star" size={24} color="#fff" />
              </View>
            </View>

            {questionsLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando preguntas...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
                  {/* Información del empleador */}
                  {selectedEmployer && (
                    <View style={styles.employerInfoCard}>
                      <View style={styles.employerAvatar}>
                        <Ionicons name={getEmployerTypeIcon(selectedEmployer.type)} size={30} color="#fff" />
                      </View>
                      <View style={styles.employerModalInfo}>
                        <Text style={styles.employerModalName}>
                          {getEmployerDisplayName(selectedEmployer)}
                        </Text>
                        <Text style={styles.employerModalDetail}>
                          {formatLocation(selectedEmployer.location)}
                        </Text>
                        <Text style={styles.employerModalDetail}>
                          {getEmployerSubtitle(selectedEmployer)}
                        </Text>
                      </View>
                      <View style={styles.overallRatingContainer}>
                        <Text style={styles.overallRatingLabel}>Calificación</Text>
                        <View style={styles.overallRatingBox}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={styles.overallRatingText}>{getOverallRating()}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Preguntas de evaluación */}
                  <View style={styles.questionsContainer}>
                    <Text style={styles.sectionTitle}>Evaluación de Desempeño</Text>
                    <Text style={styles.sectionSubtitle}>
                      Califica del 1 al 5 cada aspecto de tu experiencia como empleado
                    </Text>

                    {questions.map((question) => (
                      <View key={question.id} style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                          <Ionicons 
                            name={getQuestionIcon(question.question)} 
                            size={24} 
                            color={COLORS.primary} 
                          />
                          <Text style={styles.questionText}>{question.question}</Text>
                        </View>
                        
                        {renderStars(question.id, ratings[question.id] || 0)}
                        
                        <View style={styles.ratingLabels}>
                          <Text style={styles.ratingLabel}>Muy malo</Text>
                          <Text style={styles.ratingLabel}>Excelente</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Sección de comentarios */}
                  <View style={styles.commentSection}>
                    <Text style={styles.commentTitle}>Comentarios Adicionales (Opcional)</Text>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Escribe cualquier comentario adicional sobre tu experiencia con este empleador..."
                      placeholderTextColor={COLORS.text.tertiary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={comment}
                      onChangeText={setComment}
                      maxLength={500}
                    />
                    <Text style={styles.characterCount}>{comment.length}/500</Text>
                  </View>

                  {/* Botón de envío */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!isFormValid() || !currentUser) && styles.submitButtonDisabled // ← Deshabilitar si no hay usuario
                    ]}
                    onPress={handleSubmitEvaluation}
                    disabled={!isFormValid() || submitting || !currentUser} // ← Agregar verificación de usuario
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>
                          Enviar Evaluación
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.bottomSpacer} />
                </View>
              </ScrollView>
            )}
          </View>
        </Modal>
      </View>
    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  listContainer: {
    paddingVertical: 16,
  },
  headerContainer: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8, // ← Reducir margen para hacer espacio para userInfo
  },
  // ← Agregar estilo para información del usuario
  userInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  employerCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeIcon: {
    marginRight: 12,
  },
  employerInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  employerType: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  cardContent: {
    padding: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  jobTypesContainer: {
    marginBottom: 12,
  },
  jobTypesLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  jobTypesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  jobTypeChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  jobTypeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
  },
  moreJobTypes: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
  relationshipText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f8f8",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  rateText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
  // Estilos del modal mejorado
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employerInfoCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  employerModalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  employerModalName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  employerModalDetail: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  overallRatingContainer: {
    alignItems: 'center',
  },
  overallRatingLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  overallRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overallRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  questionsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  commentSection: {
    marginTop: 24,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.text.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default RateProducer;