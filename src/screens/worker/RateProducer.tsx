import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";

const { width } = Dimensions.get("window");

// Paleta de colores
const COLORS = {
  primary: "#274F66",
  primaryLight: "#3A6B85",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#274E66",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  gold: "#FFD700",
};

const RateProducer = ({ navigation }) => {
  const [ratings, setRatings] = useState({
    workingConditions: 0,
    paymentCompliance: 0,
    employerTreatment: 0,
    facilitiesQuality: 0,
    overallRecommendation: 0,
  });
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preguntas de evaluación específicas para el contexto agrícola
  const evaluationQuestions = [
    {
      id: "workingConditions",
      title: "Condiciones de Trabajo",
      description:
        "¿Cómo calificarías las condiciones de seguridad y comodidad en el campo?",
      icon: "shield-checkmark",
      color: COLORS.success,
    },
    {
      id: "paymentCompliance",
      title: "Cumplimiento de Pagos",
      description:
        "¿El empleador cumplió con los pagos acordados en tiempo y forma?",
      icon: "card",
      color: COLORS.secondary,
    },
    {
      id: "employerTreatment",
      title: "Trato del Empleador",
      description: "¿Cómo fue el trato y comunicación por parte del empleador?",
      icon: "people",
      color: COLORS.primary,
    },
    {
      id: "facilitiesQuality",
      title: "Alojamiento y Alimentación",
      description:
        "¿Cómo calificas la calidad del alojamiento y comida proporcionados?",
      icon: "home",
      color: COLORS.warning,
    },
    {
      id: "overallRecommendation",
      title: "Recomendación General",
      description:
        "¿Recomendarías trabajar con este empleador a otros trabajadores?",
      icon: "thumbs-up",
      color: COLORS.success,
    },
  ];

  // Componente de calificación con estrellas
  const StarRating = ({ questionId, currentRating, onRatingChange, color }) => {
    const [animatedValues] = useState(
      Array.from({ length: 5 }, () => new Animated.Value(1))
    );

    const handleStarPress = (rating) => {
      onRatingChange(questionId, rating);

      // Animación al presionar estrella
      Animated.sequence([
        Animated.timing(animatedValues[rating - 1], {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[rating - 1], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.starWrapper,
                { transform: [{ scale: animatedValues[star - 1] }] },
              ]}>
              <Ionicons
                name={star <= currentRating ? "star" : "star-outline"}
                size={32}
                color={star <= currentRating ? COLORS.gold : COLORS.border}
                style={styles.star}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Función para actualizar calificaciones
  const handleRatingChange = (questionId, rating) => {
    setRatings((prev) => ({
      ...prev,
      [questionId]: rating,
    }));
  };

  // Función para obtener el texto de la calificación
  const getRatingText = (rating) => {
    const ratingTexts = {
      1: "Muy malo",
      2: "Malo",
      3: "Regular",
      4: "Bueno",
      5: "Excelente",
    };
    return rating > 0 ? ratingTexts[rating] : "Sin calificar";
  };

  // Función para validar formulario
  const validateForm = () => {
    const unratedQuestions = evaluationQuestions.filter(
      (question) => ratings[question.id] === 0
    );

    if (unratedQuestions.length > 0) {
      Alert.alert(
        "Evaluación Incompleta",
        `Por favor califica: ${unratedQuestions.map((q) => q.title).join(", ")}`
      );
      return false;
    }

    return true;
  };

  // Función para enviar evaluación
  const handleSubmitEvaluation = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Aquí iría la llamada a la API para enviar la evaluación
      const evaluationData = {
        ratings,
        comments: comments.trim(),
        timestamp: new Date().toISOString(),
      };

      console.log("Enviando evaluación:", evaluationData);

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "¡Evaluación Enviada!",
        "Tu evaluación ha sido enviada exitosamente. Gracias por tu feedback.",
        [
          {
            text: "Continuar",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error enviando evaluación:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar la evaluación. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular promedio de calificaciones
  const getAverageRating = () => {
    const validRatings = Object.values(ratings).filter((rating) => rating > 0);
    if (validRatings.length === 0) return 0;
    return (
      validRatings.reduce((sum, rating) => sum + rating, 0) /
      validRatings.length
    ).toFixed(1);
  };

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Evaluar Empleador</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Card de Información */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.infoGradient}>
              <Ionicons name="star" size={40} color={COLORS.gold} />
              <Text style={styles.infoTitle}>Evalúa tu Experiencia</Text>
              <Text style={styles.infoSubtitle}>
                Tu opinión es importante para mejorar las condiciones laborales
              </Text>
            </LinearGradient>
          </View>

          {/* Resumen de Calificación */}
          {Object.values(ratings).some((rating) => rating > 0) && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Promedio General</Text>
                <View style={styles.averageContainer}>
                  <Text style={styles.averageNumber}>{getAverageRating()}</Text>
                  <Ionicons name="star" size={20} color={COLORS.gold} />
                </View>
              </View>
            </View>
          )}

          {/* Preguntas de Evaluación */}
          <View style={styles.questionsContainer}>
            {evaluationQuestions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionIconContainer}>
                    <View
                      style={[
                        styles.questionIcon,
                        { backgroundColor: `${question.color}20` },
                      ]}>
                      <Ionicons
                        name={question.icon}
                        size={24}
                        color={question.color}
                      />
                    </View>
                    <View style={styles.questionInfo}>
                      <Text style={styles.questionTitle}>{question.title}</Text>
                      <Text style={styles.questionDescription}>
                        {question.description}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Rating con Estrellas */}
                <StarRating
                  questionId={question.id}
                  currentRating={ratings[question.id]}
                  onRatingChange={handleRatingChange}
                  color={question.color}
                />

                {/* Texto de Calificación */}
                <View style={styles.ratingTextContainer}>
                  <Text style={styles.ratingText}>
                    {getRatingText(ratings[question.id])}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Campo de Comentarios */}
          <View style={styles.commentsCard}>
            <View style={styles.commentsHeader}>
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.commentsTitle}>Comentarios Adicionales</Text>
            </View>
            <Text style={styles.commentsSubtitle}>
              Comparte detalles específicos sobre tu experiencia (opcional)
            </Text>
            <TextInput
              style={styles.commentsInput}
              multiline
              numberOfLines={4}
              placeholder="Escribe aquí cualquier comentario adicional sobre tu experiencia laboral..."
              placeholderTextColor={COLORS.textLight}
              value={comments}
              onChangeText={setComments}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {comments.length}/500 caracteres
            </Text>
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitEvaluation}
            disabled={isSubmitting}
            activeOpacity={0.8}>
            <LinearGradient
              colors={
                isSubmitting
                  ? [COLORS.textLight, COLORS.textLight]
                  : [COLORS.primary, "#274F50"]
              }
              style={styles.submitGradient}>
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviar Evaluación</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Información de Privacidad */}
          <View style={styles.privacyCard}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.privacyText}>
              Tu evaluación es confidencial y ayuda a mejorar las condiciones
              laborales para todos
            </Text>
          </View>
        </ScrollView>
      </View>
      <CustomTabBarWorker navigation={navigation} currentRoute="RateProducer" />
    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoGradient: {
    padding: 24,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  averageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  averageNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  questionsContainer: {
    gap: 20,
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionIconContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  questionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  questionInfo: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  questionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  starWrapper: {
    padding: 4,
  },
  star: {
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ratingTextContainer: {
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  commentsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  commentsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: "top",
    minHeight: 100,
    backgroundColor: COLORS.background,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "right",
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}15`,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default RateProducer;
