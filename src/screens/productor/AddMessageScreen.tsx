import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import { useAuth } from "../../context/AuthContext";
import CustomTabBar from "../../components/CustomTabBar";
import { sendMessageAPI } from "../../services/messagesService";

const COLORS = {
  primary: "#284F66",
  primaryLight: "#4A7C94",
  primaryDark: "#1A3A4A",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceLight: "#F1F5F9",
  text: "#1A202C",
  textSecondary: "#4A5568",
  textLight: "#718096",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

// Plantillas de mensajes profesionales
const MESSAGE_TEMPLATES = [
  "💼 Me interesa conocer más sobre tu experiencia laboral",
  "🌱 Tenemos una oportunidad de trabajo agrícola disponible",
  "⭐ Tu perfil nos parece ideal para nuestro equipo",
  "🤝 Nos gustaría conversar sobre una posible colaboración",
  "📋 ¿Podrías contarnos sobre tu experiencia en cultivos?",
  "💰 Ofrecemos condiciones laborales competitivas",
  "📅 Buscamos incorporar personal próximamente",
  "🚗 ¿Cuentas con movilidad propia para el trabajo?",
];

const ContactWorkerScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [slideAnim] = useState(new Animated.Value(0));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [modalAnim] = useState(new Animated.Value(0));
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);

  const { receiverId, workerName, workerEmail, workerPhone, workerProfile } =
    route?.params || {};

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    console.log("📍 ContactWorkerScreen - Datos recibidos:", {
      receiverId,
      workerName,
      hasWorkerProfile: !!workerProfile,
    });

    if (!receiverId) {
      console.error("❌ receiverId faltante:", route?.params);
      Alert.alert("Error", "No se especificó el destinatario", [
        { text: "Volver", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    if (!user?.id) {
      console.error("❌ Usuario no autenticado");
      Alert.alert("Error", "No hay sesión activa", [
        { text: "Ir a Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    console.log("✅ Inicializando contacto:", {
      receiverId,
      senderId: user.id,
    });
  }, [receiverId, user]);

  // Limpiar timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Por favor escribe un mensaje");
      return;
    }

    if (!receiverId || !user?.id) {
      Alert.alert("Error", "Error de configuración");
      return;
    }

    setLoading(true);

    try {
      const messageData = {
        content: message.trim(),
        receiverId: receiverId,
      };

      console.log("📤 Enviando mensaje:", {
        receiverId: receiverId,
        senderName: user.name,
        receiverName: workerName,
        preview: message.substring(0, 50) + "...",
      });

      const result = await sendMessageAPI(messageData);
      console.log("✅ Mensaje enviado exitosamente:", result);

      // Mostrar modal de éxito
      const firstName = workerName?.split(" ")[0] || "el trabajador";
      setSuccessMessage(
        `Tu mensaje de contacto ha sido enviado a ${firstName} exitosamente`
      );
      setShowSuccessModal(true);

      // Animar entrada del modal
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-cerrar el modal después de 3 segundos
      const timer = setTimeout(() => {
        handleAutoClose();
      }, 3000);
      setAutoCloseTimer(timer);

    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);

      let errorMessage = "No se pudo enviar el mensaje. Intenta de nuevo.";

      if (error.status === 400) {
        errorMessage = error.response?.message || "Datos inválidos.";
      } else if (error.status === 401) {
        errorMessage = "Sesión expirada. Inicia sesión nuevamente.";
        navigation.navigate("Login");
      } else if (error.status === 404) {
        errorMessage = "El trabajador no fue encontrado.";
      } else if (error.status === 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Sin conexión a internet.";
      }

      Alert.alert("❌ Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template) => {
    setMessage(template + "\n\nSaludos cordiales.");
  };

  const handleAutoClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    closeSuccessModal();
  };

  const handleGoBack = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    closeSuccessModal();
  };

  const closeSuccessModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
      // Regresar a la vista anterior después de cerrar el modal
      setTimeout(() => navigation.goBack(), 100);
    });
  };

  const renderWorkerInfo = () => (
    <Animated.View
      style={[
        styles.workerCard,
        {
          opacity: slideAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.workerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {workerName?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.workerDetails}>
          <Text style={styles.workerName}>{workerName || "Usuario"}</Text>
          {workerProfile?.location && (
            <View style={styles.locationRow}>
              <Icon name="location-on" size={16} color={COLORS.textLight} />
              <Text style={styles.locationText}>{workerProfile.location}</Text>
            </View>
          )}
          {workerEmail && (
            <View style={styles.contactRow}>
              <Icon name="email" size={16} color={COLORS.textLight} />
              <Text style={styles.contactText}>{workerEmail}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderMessageTemplates = () => (
    <View style={styles.templatesSection}>
      <Text style={styles.templatesTitle}>📝 Plantillas de mensaje</Text>
      <Text style={styles.templatesSubtitle}>
        Toca cualquier plantilla para usarla como base
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templatesScroll}>
        {MESSAGE_TEMPLATES.map((template, index) => (
          <TouchableOpacity
            key={index}
            style={styles.templateCard}
            onPress={() => handleUseTemplate(template)}
            activeOpacity={0.7}>
            <Text style={styles.templateText}>{template}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessageForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.formTitle}>✉️ Mensaje de contacto</Text>
      <Text style={styles.formSubtitle}>
        Redacta un mensaje profesional para contactar al trabajador
      </Text>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.messageTextArea}
          placeholder="Escribe tu mensaje aquí..."
          placeholderTextColor={COLORS.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={8}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCounter}>{message.length}/1000 caracteres</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!message.trim() || loading) && styles.sendButtonDisabled,
        ]}
        onPress={handleSendMessage}
        disabled={!message.trim() || loading}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon name="send" size={20} color="#fff" style={styles.sendIcon} />
        )}
        <Text style={styles.sendButtonText}>
          {loading ? "Enviando..." : "Enviar mensaje"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.successModal,
            {
              transform: [
                {
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: modalAnim,
            },
          ]}>
          {/* Icono de éxito */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIcon}>
              <Icon name="check" size={32} color="#fff" />
            </View>
          </View>

          {/* Contenido del modal */}
          <Text style={styles.successTitle}>¡Mensaje Enviado!</Text>
          <Text style={styles.successMessage}>{successMessage}</Text>

          {/* Información del trabajador */}
          <View style={styles.workerSummary}>
            <View style={styles.workerAvatarSmall}>
              <Text style={styles.workerAvatarSmallText}>
                {workerName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.workerSummaryDetails}>
              <Text style={styles.workerSummaryName}>{workerName}</Text>
              <View style={styles.deliveryStatus}>
                <Icon name="done-all" size={16} color={COLORS.success} />
                <Text style={styles.deliveryText}>Entregado</Text>
              </View>
            </View>
          </View>

          {/* Botón de cierre */}
          <View style={styles.autoCloseContainer}>
            <Text style={styles.autoCloseText}>
              Regresando automáticamente...
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleGoBack}
              activeOpacity={0.8}>
              <Icon name="close" size={20} color={COLORS.primary} />
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <ScreenLayout navigation={navigation}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Contactar Trabajador</Text>
            <Text style={styles.headerSubtitle}>Envío de mensaje profesional</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Información del trabajador */}
          {renderWorkerInfo()}

          {/* Plantillas de mensaje */}
          {renderMessageTemplates()}

          {/* Formulario de mensaje */}
          {renderMessageForm()}
        </ScrollView>

        {/* Modal de éxito */}
        {renderSuccessModal()}
      </KeyboardAvoidingView>
      <CustomTabBar navigation={navigation} currentRoute="WorkerList" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  templatesSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  templatesSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  templatesScroll: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  templateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  messageTextArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
    minHeight: 150,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos del modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    maxWidth: 340,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  workerSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    width: "100%",
  },
  workerAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workerAvatarSmallText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  workerSummaryDetails: {
    flex: 1,
  },
  workerSummaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: "500",
  },
  autoCloseContainer: {
    width: "100%",
    alignItems: "center",
  },
  autoCloseText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  closeButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ContactWorkerScreen;