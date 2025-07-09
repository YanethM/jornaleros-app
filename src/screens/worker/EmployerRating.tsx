import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";
import { getAllQuestions, createQualification } from "../../services/qualifitionService";

const EmployerRating = ({ navigation, route }) => {
  const { employer } = route.params || {};
  
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await getAllQuestions();
      
      // Filtrar preguntas para empleadores/productores (RoleType.Productor)
      const employerQuestions = response.questions?.filter(
        (question) => question.roleType === "Productor"
      ) || [];
      
      setQuestions(employerQuestions);
      
      // Inicializar ratings vacíos
      const initialRatings = {};
      employerQuestions.forEach((question) => {
        initialRatings[question.id] = 0;
      });
      setRatings(initialRatings);
      
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las preguntas de evaluación");
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (questionId, rating) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: rating
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validar que todas las preguntas tengan rating
      const unansweredQuestions = questions.filter(
        question => !ratings[question.id] || ratings[question.id] === 0
      );

      if (unansweredQuestions.length > 0) {
        Alert.alert(
          "Evaluación incompleta",
          "Por favor, evalúa todas las preguntas antes de enviar."
        );
        return;
      }

      setSubmitting(true);

      // Crear las calificaciones
      const qualificationPromises = questions.map(question => {
        const qualificationData = {
          employerProfileId: employer.id,
          questionId: question.id,
          rating: ratings[question.id],
          description: comment.trim() || null
        };
        return createQualification(qualificationData);
      });

      await Promise.all(qualificationPromises);

      Alert.alert(
        "¡Evaluación enviada!",
        "Tu evaluación ha sido registrada exitosamente.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la evaluación. Intenta nuevamente.");
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (questionId, currentRating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(questionId, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? "star" : "star-outline"}
              size={28}
              color={star <= currentRating ? "#FFD700" : "#DDD"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmployerHeader = () => (
    <View style={styles.employerHeader}>
      <View style={styles.employerHeaderContent}>
        <Ionicons
          name={employer?.type === "Organización" ? "business" : "person"}
          size={32}
          color="#2196F3"
          style={styles.employerIcon}
        />
        <View style={styles.employerInfo}>
          <Text style={styles.employerName} numberOfLines={2}>
            {employer?.name || "Empleador"}
          </Text>
          <Text style={styles.employerType}>
            {employer?.type === "Organización" && employer?.organization !== "Ninguna"
              ? employer.organization
              : employer?.type || "Empleador"}
          </Text>
          {employer?.location?.fullLocation && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {employer.location.fullLocation}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.headerDescription}>
        Evalúa tu experiencia trabajando con este empleador
      </Text>
    </View>
  );

  const renderQuestionCard = (question, index) => (
    <View key={question.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
        <Text style={styles.ratingValue}>
          {ratings[question.id]}/5
        </Text>
      </View>
      <Text style={styles.questionText}>{question.question}</Text>
      {renderStarRating(question.id, ratings[question.id])}
    </View>
  );

  const canSubmit = () => {
    return questions.every(question => ratings[question.id] > 0) && !submitting;
  };

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <CustomTabBarWorker
          state={{ index: 1, routes: [] }}
          navigation={navigation}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  if (!employer) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <CustomTabBarWorker
          state={{ index: 1, routes: [] }}
          navigation={navigation}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            No se encontró información del empleador
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
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
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderEmployerHeader()}

          <View style={styles.questionsContainer}>
            <Text style={styles.sectionTitle}>Evaluación</Text>
            {questions.map((question, index) => renderQuestionCard(question, index))}
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Comentarios adicionales (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe aquí cualquier comentario adicional sobre tu experiencia..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 caracteres
            </Text>
          </View>

          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit() && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit()}
            >
              {submitting ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Enviar Evaluación</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f44336",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  backButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  employerHeader: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  employerHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  employerIcon: {
    marginRight: 16,
  },
  employerInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  employerType: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  headerDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  questionsContainer: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  ratingValue: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  commentSection: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 8,
  },
  submitSection: {
    margin: 16,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EmployerRating;