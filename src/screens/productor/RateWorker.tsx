import React, { useState, useEffect } from 'react';
import ScreenLayout from '../../components/ScreenLayout';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput 
} from 'react-native';
import CustomTabBar from '../../components/CustomTabBar';
import Icon from "react-native-vector-icons/MaterialIcons";
import { createQualification, getQualificationQuestionsByRole, checkWorkerRating } from '../../services/qualifitionService';

const COLORS = {
  primary: "#2C5F7B",
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

const RateWorker = ({ navigation, route }) => {
  const { workerId, workerName, workerProfile } = route.params || {};
  
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        const ratingCheck = await checkWorkerRating(workerId);
        console.log('Rating check response:', ratingCheck);
        
        if (ratingCheck.alreadyRated) {
          setAlreadyRated(true);
          return;
        }
        
        // Cargar preguntas si no ha sido evaluado
        const response = await getQualificationQuestionsByRole('Trabajador');
        
        if (response.success && response.data) {
          setQuestions(response.data);
          const initialRatings = {};
          response.data.forEach(question => {
            initialRatings[question.id] = 0;
          });
          setRatings(initialRatings);
        } else {
          throw new Error(response.msg || 'Error al cargar preguntas');
        }
      } catch (error) {
        console.error('Error inicializando:', error);
        setError('No se pudo cargar la información de evaluación');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [workerId]);

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
            <Icon
              name={star <= currentRating ? "star" : "star-border"}
              size={32}
              color={star <= currentRating ? "#FFD700" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
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

  const getQuestionIcon = (question) => {
    const questionText = question.toLowerCase();
    if (questionText.includes('calidad') || questionText.includes('trabajo')) return 'work';
    if (questionText.includes('puntualidad') || questionText.includes('horario')) return 'schedule';
    if (questionText.includes('comunicación') || questionText.includes('actitud')) return 'chat';
    if (questionText.includes('recomend')) return 'thumb_up';
    return 'star';
  };

  const handleSubmitEvaluation = async () => {
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

      const qualificationData = {
        workerProfileId: workerId,
        ratings: ratingsArray,
        comment: comment.trim() || null
      };

      const response = await createQualification(qualificationData);
      
      if (response.success) {
        Alert.alert(
          "¡Evaluación Enviada!",
          `Tu evaluación ha sido guardada exitosamente.\n\nPromedio: ${response.data.averageRating} estrellas`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else if (response.status === 400 && response.data?.msg?.includes("Ya has evaluado")) {
        setAlreadyRated(true);
        Alert.alert(
          "Evaluación Existente",
          response.data.msg,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response.msg || 'Error al enviar evaluación');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      Alert.alert(
        "Error",
        error.response?.data?.msg || "No se pudo enviar la evaluación. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Renderizado cuando ya fue evaluado
  if (alreadyRated) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Evaluación Existente</Text>
            <Text style={styles.headerSubtitle}>{workerName}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Icon name="verified" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.alreadyRatedContainer}>
          <Icon name="check-circle" size={80} color={COLORS.success} />
          <Text style={styles.alreadyRatedTitle}>Ya has evaluado a este trabajador</Text>
          <Text style={styles.alreadyRatedText}>
            Has enviado una evaluación para {workerName} anteriormente. 
            No puedes evaluar al mismo trabajador múltiples veces.
          </Text>
          
          <TouchableOpacity 
            style={styles.backToProfileButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backToProfileButtonText}>Volver al perfil</Text>
          </TouchableOpacity>
        </View>

        <CustomTabBar navigation={navigation} currentRoute="RateWorker" />
      </ScreenLayout>
    );
  }

  // 2. Renderizado durante carga
  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Evaluar Trabajador</Text>
            <Text style={styles.headerSubtitle}>Cargando...</Text>
          </View>
          <View style={styles.headerIcon}>
            <Icon name="star" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando preguntas de evaluación...</Text>
        </View>

        <CustomTabBar navigation={navigation} currentRoute="RateWorker" />
      </ScreenLayout>
    );
  }

  // 3. Renderizado de error
  if (error) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Error</Text>
            <Text style={styles.headerSubtitle}>No se pudieron cargar las preguntas</Text>
          </View>
          <View style={styles.headerIcon}>
            <Icon name="error" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={80} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setLoading(true);
              initialize();
            }}>
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>

        <CustomTabBar navigation={navigation} currentRoute="RateWorker" />
      </ScreenLayout>
    );
  }

  // 4. Renderizado normal (formulario de evaluación)
  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Evaluar Trabajador</Text>
          <Text style={styles.headerSubtitle}>{workerName}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="star" size={24} color="#fff" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.workerInfoCard}>
            <View style={styles.workerAvatar}>
              <Icon name="person" size={40} color="#fff" />
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerDetail}>{workerProfile?.location}</Text>
              <Text style={styles.workerDetail}>{workerProfile?.user?.email}</Text>
            </View>
            <View style={styles.overallRatingContainer}>
              <Text style={styles.overallRatingLabel}>Calificación</Text>
              <View style={styles.overallRatingBox}>
                <Icon name="star" size={20} color="#FFD700" />
                <Text style={styles.overallRatingText}>{getOverallRating()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.questionsContainer}>
            <Text style={styles.sectionTitle}>Evaluación de Desempeño</Text>
            <Text style={styles.sectionSubtitle}>
              Califica del 1 al 5 cada aspecto del trabajo realizado
            </Text>

            {questions.map((question) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Icon name={getQuestionIcon(question.question)} size={24} color={COLORS.primary} />
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

          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Comentarios Adicionales (Opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe cualquier comentario adicional sobre el desempeño del trabajador..."
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

          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid() && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitEvaluation}
            disabled={!isFormValid() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Enviar Evaluación
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <CustomTabBar navigation={navigation} currentRoute="RateWorker" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#284F66",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alreadyRatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alreadyRatedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  alreadyRatedText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  backToProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 30,
  },
  backToProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workerInfoCard: {
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
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  workerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  workerDetail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  overallRatingContainer: {
    alignItems: 'center',
  },
  overallRatingLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  overallRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overallRatingText: {
    fontSize: 16,
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

export default RateWorker;