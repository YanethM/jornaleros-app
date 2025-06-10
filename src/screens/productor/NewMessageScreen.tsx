import React, { useState, useEffect, useMemo } from "react";
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
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import { useAuth } from "../../context/AuthContext";
import CustomTabBar from "../../components/CustomTabBar";
import { createNotification, sendMessage, sendMessageAPI } from "../../services/messagesService";


const COLORS = {
  primary: "#284F66",
  primaryLight: "#4A7C94",
  primaryDark: "#1A3A4A",
  secondary: "#B6883E",
  accent: "#667EEA",
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

// Tipos de eventos que coinciden EXACTAMENTE con el enum NotificationEvent del backend
const eventTypes = {
  Nueva_oferta: { 
    label: "Nueva Oferta", 
    icon: "work", 
    color: "#10B981",
    description: "Publicar una nueva oferta de trabajo"
  },
  Aplicacion_aceptada: { 
    label: "Aplicación Aceptada", 
    icon: "check-circle", 
    color: "#10B981",
    description: "Aceptar una aplicación de trabajo"
  },
  Aplicacion_cancelada: { 
    label: "Aplicación Cancelada", 
    icon: "cancel", 
    color: "#EF4444",
    description: "Cancelar una aplicación de trabajo"
  },
  Evaluacion_recibida: { 
    label: "Evaluación Recibida", 
    icon: "star", 
    color: "#F59E0B",
    description: "Enviar una evaluación"
  },
};

// Sistema de mensajes contextuales
const CONTEXTUAL_MESSAGES = {
  INITIAL_INTEREST: {
    base: "Hola {name}, vi tu perfil y me parece que podrías ser una excelente adición a nuestro equipo.",
    withSkills: "Hola {name}, me interesa mucho tu experiencia en {skills}. Tengo una oportunidad que podría interesarte.",
    withLocation: "Hola {name}, estoy buscando trabajadores en {location} y creo que podrías ser perfecto para el puesto.",
  },
  REQUEST_INFO: {
    base: "¿Podrías contarme más sobre tu experiencia en el campo agrícola?",
    withSkills: "Me gustaría conocer más detalles sobre tu experiencia en {skills}.",
    available: "Veo que estás disponible. ¿Cuándo podrías comenzar a trabajar?",
  },
  INTERVIEW_REQUEST: {
    base: "¿Te gustaría que programemos una entrevista para conocernos mejor?",
    phone: "¿Podríamos coordinar una llamada para hablar sobre la oportunidad? Mi número es {phone}.",
    available: "Como estás disponible, ¿qué tal si hablamos mañana sobre el trabajo?",
  },
  JOB_OFFER: {
    base: "Tengo una oferta de trabajo que creo que te va a interesar. ¿Te gustaría conocer los detalles?",
    withSkills: "Tengo un trabajo perfecto para alguien con tu experiencia en {skills}. ¿Te interesa?",
    urgent: "Necesito cubrir un puesto urgentemente y creo que serías perfecto. ¿Podemos hablar?",
  },
  FOLLOW_UP: {
    base: "Hola {name}, quería hacer seguimiento a nuestra conversación anterior.",
    interested: "¿Has tenido tiempo de pensar en la propuesta que te hice?",
    pending: "¿Necesitas alguna información adicional para tomar una decisión?",
  }
};

// Función para generar mensajes contextuales
const getContextualMessage = (worker, messageType, employerInfo = {}) => {
  const templates = CONTEXTUAL_MESSAGES[messageType];
  if (!templates) return templates?.base || "";

  const workerName = worker.user?.name || "Usuario";
  const skills = worker.skills?.join(", ") || worker.WorkerSkill?.map(ws => ws.cropType?.name).join(", ") || "";
  const location = [
    worker.user?.city?.name,
    worker.user?.departmentState?.name
  ].filter(Boolean).join(", ");

  let selectedTemplate = templates.base;

  // Seleccionar template más específico si hay datos disponibles
  if (worker.availability && templates.available) {
    selectedTemplate = templates.available;
  } else if (skills && templates.withSkills) {
    selectedTemplate = templates.withSkills;
  } else if (location && templates.withLocation) {
    selectedTemplate = templates.withLocation;
  }

  // Reemplazar placeholders
  return selectedTemplate
    .replace(/{name}/g, workerName)
    .replace(/{skills}/g, skills)
    .replace(/{location}/g, location)
    .replace(/{phone}/g, employerInfo.phone || "");
};

const NewMessageScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("Nueva_oferta");
  const [slideAnim] = useState(new Animated.Value(0));
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // ✅ Solución al error: Verificar que route y route.params existan antes de desestructurar
  const routeParams = route?.params || {};
  const {
    recipientId,
    recipientName,
    recipientEmail,
    recipientPhone,
    workerProfile,
    context,
  } = routeParams;

  // Crear objeto worker compatible con el sistema de mensajes contextuales
  const workerData = useMemo(() => {
    if (!recipientId || !recipientName) {
      return null;
    }

    return {
      user: {
        id: recipientId,
        name: recipientName?.split(' ')[0] || '',
        lastname: recipientName?.split(' ').slice(1).join(' ') || '',
        email: recipientEmail,
        phone: recipientPhone,
        city: workerProfile?.location ? { name: workerProfile.location.split(',')[0] } : null,
        departmentState: workerProfile?.location ? { name: workerProfile.location.split(',')[1] } : null,
      },
      skills: workerProfile?.skills || [],
      availability: workerProfile?.availability || false,
      WorkerSkill: workerProfile?.skills?.map(skill => ({
        cropType: { name: skill }
      })) || []
    };
  }, [recipientId, recipientName, recipientEmail, recipientPhone, workerProfile]);

  // Generar sugerencias contextuales
  const contextualSuggestions = useMemo(() => {
    if (!workerData) return [];

    const messageCount = 0; // Asumimos que es el primer mensaje
    const baseSuggestions = [
      {
        label: "🌟 Mostrar interés inicial",
        message: getContextualMessage(workerData, "INITIAL_INTEREST"),
        category: "interest",
        icon: "star",
        color: COLORS.warning
      },
      {
        label: "❓ Solicitar más información",
        message: getContextualMessage(workerData, "REQUEST_INFO"),
        category: "info",
        icon: "help",
        color: COLORS.info
      },
      {
        label: "📞 Proponer entrevista",
        message: getContextualMessage(workerData, "INTERVIEW_REQUEST"),
        category: "interview",
        icon: "phone",
        color: COLORS.success
      },
      {
        label: "💼 Ofrecer trabajo",
        message: getContextualMessage(workerData, "JOB_OFFER"),
        category: "offer",
        icon: "work",
        color: COLORS.primary
      },
    ];

    return baseSuggestions;
  }, [workerData]);

  // Respuestas rápidas con emojis
  const quickReplies = [
    "👋 ¡Hola! ¿Cómo estás?",
    "💼 ¿Te interesa el trabajo?",
    "📅 ¿Cuándo puedes empezar?",
    "💰 Hablemos del salario",
    "📍 ¿Conoces la ubicación?",
    "⏰ ¿Qué horarios prefieres?",
    "🚗 ¿Tienes transporte?",
    "📋 ¿Tienes experiencia?",
    "✅ ¡Perfecto!",
    "🤔 Déjame consultarlo",
    "📞 ¿Podemos hablar por teléfono?",
    "📱 Te envío más detalles",
  ];

  useEffect(() => {
    // Animación de entrada
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // ✅ Verificación mejorada de datos
    console.log("📍 NewMessageScreen - Datos recibidos:", {
      hasRoute: !!route,
      hasParams: !!route?.params,
      recipientId,
      recipientName,
      context: context?.source,
      workerData: !!workerData
    });

    // Verificar que se recibieron los datos del trabajador
    if (!recipientId || !recipientName) {
      console.error("❌ Datos faltantes:", { 
        recipientId, 
        recipientName,
        hasRoute: !!route,
        hasParams: !!route?.params,
        allParams: routeParams
      });
      Alert.alert("Error", "No se recibieron los datos del destinatario", [
        {
          text: "Volver",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }

    // Verificar usuario autenticado
    if (!user?.id) {
      console.error("❌ Usuario no autenticado");
      Alert.alert("Error", "No hay sesión activa", [
        {
          text: "Ir a Login",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
      return;
    }

    console.log("✅ Inicializando AddMessage con:", {
      recipientId,
      recipientName,
      senderId: user.id,
      context: context?.source,
      availableEvents: Object.keys(eventTypes) // ← Ver eventos disponibles
    });

    // Configurar mensaje inicial según el contexto
    if (context?.source === "worker_search") {
      setTitle("Interés en oportunidad laboral");
      if (workerData) {
        setMessage(getContextualMessage(workerData, "INITIAL_INTEREST"));
      }
      setSelectedEvent("Nueva_oferta"); // Usar valor del enum
    } else if (context?.jobOfferId) {
      setTitle("Oferta de trabajo disponible");
      if (workerData) {
        setMessage(getContextualMessage(workerData, "JOB_OFFER"));
      }
      setSelectedEvent("Nueva_oferta"); // Usar valor del enum
    }
  }, [recipientId, recipientName, context, workerData, user]);

  const handleSendMessage = async () => {
    // Validaciones de datos
    if (!title.trim()) {
      Alert.alert("Error", "Por favor ingresa un título");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Error", "Por favor ingresa un mensaje");
      return;
    }
    if (!recipientId) {
      Alert.alert("Error", "No se encontró el destinatario");
      return;
    }

    // Validaciones de usuario autenticado
    if (!user?.id) {
      Alert.alert("Error", "No hay sesión activa. Por favor, inicia sesión nuevamente.");
      return;
    }

    // Validar que el tipo de evento sea válido
    if (!Object.keys(eventTypes).includes(selectedEvent)) {
      Alert.alert("Error", "Tipo de mensaje no válido");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para el backend (exactamente como los espera)
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        senderId: user.id,
        recipientId: recipientId,
        event: selectedEvent, // TRABAJO, PAGO, MENSAJE, RECORDATORIO
      };

      console.log("📤 Enviando notificación:", {
        ...notificationData,
        recipientName: recipientName,
        eventType: eventTypes[selectedEvent]?.label // ← Ver tipo de evento
      });

      // Llamar al servicio real
      const result = await createNotification(notificationData);
      
      console.log("✅ Notificación creada exitosamente:", result);

      // Mostrar éxito con información específica
      Alert.alert(
        "🎉 ¡Mensaje enviado!", 
        `Tu ${eventTypes[selectedEvent].label.toLowerCase()} ha sido enviado exitosamente a ${recipientName?.split(" ")[0]}.`,
        [
          {
            text: "Perfecto",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      
      let errorMessage = "No se pudo enviar el mensaje. Intenta de nuevo.";
      
      // Manejar diferentes tipos de errores del backend
      if (error.status === 400) {
        if (error.response?.message?.includes("campos son requeridos")) {
          errorMessage = "Faltan datos requeridos. Verifica todos los campos.";
        } else if (error.response?.message?.includes("Evento no válido")) {
          errorMessage = "Tipo de mensaje no válido. Intenta de nuevo.";
        } else {
          errorMessage = error.response?.message || "Datos inválidos.";
        }
      } else if (error.status === 401) {
        errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
        navigation.navigate("Login");
      } else if (error.status === 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
      } else if (error.message?.includes("token")) {
        errorMessage = "Error de autenticación. Reinicia la aplicación.";
        navigation.navigate("Login");
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Sin conexión a internet. Verifica tu conexión.";
      }

      Alert.alert("❌ Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setMessage(suggestion.message);
    setTitle(suggestion.label.replace(/[🌟❓📞💼]/g, '').trim());
    
    // Mapear categorías a valores del enum correcto
    if (suggestion.category === 'offer' || suggestion.category === 'interest') {
      setSelectedEvent("Nueva_oferta");
    } else if (suggestion.category === 'interview') {
      setSelectedEvent("Nueva_oferta"); // También es una oferta de trabajo
    } else {
      setSelectedEvent("Nueva_oferta"); // Por defecto
    }
    
    // Scroll suave hacia el input del mensaje
    setTimeout(() => {
      // Aquí podrías hacer scroll si tienes una referencia
    }, 100);
  };

  const handleQuickReplyPress = (reply) => {
    // Si el mensaje está vacío, reemplazar. Si no, agregar al final
    if (!message.trim()) {
      setMessage(reply);
    } else {
      setMessage(prev => prev + "\n\n" + reply);
    }
  };

  const renderRecipientInfo = () => {
    // ✅ Verificar datos antes de renderizar
    if (!recipientName) {
      return (
        <View style={styles.recipientCard}>
          <Text style={styles.errorText}>No se encontró información del destinatario</Text>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.recipientCard,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
            opacity: slideAnim,
          }
        ]}
      >
        <View style={styles.recipientHeader}>
          <View style={styles.recipientAvatarContainer}>
            <View style={styles.recipientAvatar}>
              <Text style={styles.recipientInitial}>
                {recipientName[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.recipientDetails}>
            <Text style={styles.recipientName}>{recipientName}</Text>
            {recipientEmail && (
              <View style={styles.contactRow}>
                <View style={styles.contactIconContainer}>
                  <Icon name="email" size={14} color="#fff" />
                </View>
                <Text style={styles.contactText}>{recipientEmail}</Text>
              </View>
            )}
            {recipientPhone && (
              <View style={styles.contactRow}>
                <View style={styles.contactIconContainer}>
                  <Icon name="phone" size={14} color="#fff" />
                </View>
                <Text style={styles.contactText}>{recipientPhone}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.recipientBadge}>
            <Icon name="agriculture" size={16} color={COLORS.success} />
            <Text style={styles.badgeText}>Trabajador</Text>
          </View>
        </View>

        {workerProfile && (
          <View style={styles.workerInfo}>
            <View style={styles.divider} />
            
            {workerProfile.location && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="location-on" size={16} color={COLORS.error} />
                </View>
                <Text style={styles.infoText}>{workerProfile.location}</Text>
              </View>
            )}

            {workerProfile.skills && workerProfile.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsLabel}>
                  <Icon name="star" size={16} color={COLORS.warning} /> Habilidades
                </Text>
                <View style={styles.skillsWrapper}>
                  {workerProfile.skills.slice(0, 4).map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Icon name="check-circle" size={12} color={COLORS.success} />
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {workerProfile.skills.length > 4 && (
                    <View style={styles.moreSkillsChip}>
                      <Text style={styles.moreSkills}>
                        +{workerProfile.skills.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.availabilityContainer}>
              <Icon
                name={workerProfile.availability ? "check-circle" : "cancel"}
                size={18}
                color={workerProfile.availability ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.availabilityText,
                  { color: workerProfile.availability ? COLORS.success : COLORS.error },
                ]}>
                {workerProfile.availability ? "✅ Disponible ahora" : "⏰ No disponible"}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEventTypes = () => (
    <View style={styles.eventTypesSection}>
      <Text style={styles.sectionTitle}>
        <Icon name="category" size={18} color={COLORS.primary} /> Tipo de mensaje
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventTypesContainer}
        contentContainerStyle={styles.eventTypesContent}
      >
        {Object.entries(eventTypes).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.eventTypeButton,
              selectedEvent === key && {
                backgroundColor: config.color,
                shadowColor: config.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }
            ]}
            onPress={() => setSelectedEvent(key)}
            activeOpacity={0.8}
          >
            <Icon 
              name={config.icon} 
              size={20} 
              color={selectedEvent === key ? "#fff" : config.color} 
            />
            <Text
              style={[
                styles.eventTypeText,
                selectedEvent === key && styles.eventTypeTextActive,
              ]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessageSuggestions = () => (
    <View style={styles.suggestionsSection}>
      <View style={styles.suggestionHeader}>
        <Text style={styles.sectionTitle}>
          <Icon name="lightbulb-outline" size={18} color={COLORS.warning} /> Mensajes recomendados
        </Text>
        <TouchableOpacity 
          onPress={() => setShowSuggestions(!showSuggestions)}
          style={styles.toggleButton}
        >
          <Icon 
            name={showSuggestions ? "expand-less" : "expand-more"} 
            size={24} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {showSuggestions && contextualSuggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.suggestionsRow}>
            {contextualSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionCard, { borderColor: suggestion.color }]}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.8}
              >
                <View style={[styles.suggestionIconContainer, { backgroundColor: suggestion.color }]}>
                  <Icon name={suggestion.icon} size={20} color="#fff" />
                </View>
                <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                <Text style={styles.suggestionPreview} numberOfLines={2}>
                  {suggestion.message.substring(0, 50)}...
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderQuickReplies = () => (
    <View style={styles.quickRepliesSection}>
      <View style={styles.suggestionHeader}>
        <Text style={styles.sectionTitle}>
          <Icon name="flash-on" size={18} color={COLORS.accent} /> Respuestas rápidas
        </Text>
        <TouchableOpacity 
          onPress={() => setShowQuickReplies(!showQuickReplies)}
          style={styles.toggleButton}
        >
          <Icon 
            name={showQuickReplies ? "expand-less" : "expand-more"} 
            size={24} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {showQuickReplies && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickRepliesRow}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyChip}
                onPress={() => handleQuickReplyPress(reply)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  // ✅ Verificar datos antes de renderizar la pantalla completa
  if (!recipientId || !recipientName) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Error de navegación</Text>
          <Text style={styles.errorMessage}>No se recibieron los datos necesarios del destinatario</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header con gradiente */}
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>💬 Enviar Mensaje</Text>
              <Text style={styles.headerSubtitle}>Conecta con talento agrícola</Text>
            </View>
            <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
              <Icon name="help-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Recipient Info Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="person" size={18} color={COLORS.primary} /> Destinatario
            </Text>
            {renderRecipientInfo()}
          </View>

          {/* Message Suggestions */}
          {renderMessageSuggestions()}

          {/* Quick Replies */}
          {renderQuickReplies()}

          {/* Event Type Selection */}
          {renderEventTypes()}

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="title" size={18} color={COLORS.primary} /> Título del mensaje
            </Text>
            <View style={styles.inputCard}>
              <View style={styles.inputContainer}>
                <Icon name="edit" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Oportunidad de trabajo en cultivo de café"
                  placeholderTextColor={COLORS.textLight}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{title.length}/100 caracteres</Text>
              </View>
            </View>
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="message" size={18} color={COLORS.primary} /> Tu mensaje
            </Text>
            <View style={styles.inputCard}>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Escribe aquí tu mensaje personalizado o selecciona una sugerencia arriba..."
                  placeholderTextColor={COLORS.textLight}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={8}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{message.length}/500 caracteres</Text>
                <View style={styles.messageHints}>
                  <Icon name="lightbulb-outline" size={14} color={COLORS.warning} />
                  <Text style={styles.hintText}>Usa las sugerencias de arriba</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              loading && styles.sendButtonDisabled,
              { backgroundColor: eventTypes[selectedEvent].color }
            ]}
            onPress={handleSendMessage}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>
                  Enviando {eventTypes[selectedEvent].label.toLowerCase()}...
                </Text>
              </View>
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" style={styles.sendIcon} />
                <Text style={styles.sendButtonText}>
                  Enviar {eventTypes[selectedEvent].label} a {recipientName?.split(" ")[0]} 🚀
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomTabBar navigation={navigation} currentRoute="NewMessage" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ✅ Nuevos estilos para manejo de errores
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    position: 'relative',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryDark,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  recipientCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recipientHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  recipientAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  recipientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: '#fff',
  },
  recipientInitial: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  recipientBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "600",
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 16,
  },
  workerInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.error}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 22,
  },
  skillsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${COLORS.success}20`,
  },
  skillText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  moreSkillsChip: {
    backgroundColor: `${COLORS.info}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  moreSkills: {
    fontSize: 13,
    color: COLORS.info,
    fontWeight: "600",
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  suggestionsSection: {
    marginBottom: 28,
  },
  quickRepliesSection: {
    marginBottom: 28,
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggleButton: {
    padding: 4,
  },
  suggestionsRow: {
    flexDirection: "row",
    paddingLeft: 20,
    gap: 16,
  },
  suggestionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: 200,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  suggestionPreview: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  quickRepliesRow: {
    flexDirection: "row",
    paddingLeft: 20,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickReplyText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  eventTypesSection: {
    marginBottom: 28,
  },
  eventTypesContainer: {
    flexDirection: "row",
  },
  eventTypesContent: {
    paddingRight: 20,
  },
  eventTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#fff",
    marginRight: 12,
    minWidth: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTypeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginLeft: 8,
  },
  eventTypeTextActive: {
    color: "#fff",
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    lineHeight: 22,
  },
  textAreaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textArea: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 140,
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  messageHints: {
    flexDirection: "row",
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 6,
    fontStyle: "italic",
  },
  sendButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 12,
  },
  sendIcon: {
    marginRight: 12,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
});

export default NewMessageScreen;