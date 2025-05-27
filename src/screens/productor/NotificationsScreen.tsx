import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import {
  getContextualMessage,
  EMPLOYER_MESSAGES,
} from "../../utils/employerMessages";
import ScreenLayout from "../../components/ScreenLayout";

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
  online: "#10B981",
  offline: "#94A3B8",
};

const { width: screenWidth } = Dimensions.get("window");

// Types
interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    phone?: string;
    city?: {
      name: string;
    };
    departmentState?: {
      name: string;
    };
    isOnline?: boolean;
    lastSeen?: string;
  };
  applicationStatus: string;
  availability: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: string;
  isRead: boolean;
  messageType?: "text" | "system";
  isDelivered?: boolean;
}

interface MessageState {
  workers: Worker[];
  selectedWorker: Worker | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  refreshing: boolean;
  error: string | null;
  typingUsers: Set<string>;
  unreadCounts: Map<string, number>;
}

interface MessageAction {
  type:
    | "SET_LOADING"
    | "SET_WORKERS"
    | "SET_SELECTED_WORKER"
    | "SET_MESSAGES"
    | "ADD_MESSAGE"
    | "SET_SENDING"
    | "SET_ERROR"
    | "SET_REFRESHING"
    | "SET_TYPING"
    | "REMOVE_TYPING"
    | "UPDATE_UNREAD_COUNT"
    | "MARK_MESSAGES_READ";
  payload?: any;
}

interface MessagesScreenProps {
  navigation: any;
  route?: {
    params?: {
      selectedWorkerId?: string;
      workerName?: string;
    };
  };
}

// Reducer para manejar el estado complejo
const messageReducer = (
  state: MessageState,
  action: MessageAction
): MessageState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_WORKERS":
      return { ...state, workers: action.payload, loading: false };
    case "SET_SELECTED_WORKER":
      return { ...state, selectedWorker: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        sending: false,
      };
    case "SET_SENDING":
      return { ...state, sending: action.payload };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
        sending: false,
      };
    case "SET_REFRESHING":
      return { ...state, refreshing: action.payload };
    case "SET_TYPING":
      return {
        ...state,
        typingUsers: new Set([...state.typingUsers, action.payload]),
      };
    case "REMOVE_TYPING":
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(action.payload);
      return { ...state, typingUsers: newTypingUsers };
    case "UPDATE_UNREAD_COUNT":
      const newUnreadCounts = new Map(state.unreadCounts);
      newUnreadCounts.set(action.payload.userId, action.payload.count);
      return { ...state, unreadCounts: newUnreadCounts };
    case "MARK_MESSAGES_READ":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.senderId === action.payload ? { ...msg, isRead: true } : msg
        ),
      };
    default:
      return state;
  }
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagePollingRef = useRef<NodeJS.Timeout>();

  // Estado inicial
  const initialState: MessageState = {
    workers: [],
    selectedWorker: null,
    messages: [],
    loading: true,
    sending: false,
    refreshing: false,
    error: null,
    typingUsers: new Set(),
    unreadCounts: new Map(),
  };

  const [state, dispatch] = useReducer(messageReducer, initialState);

  // Parámetros de navegación
  const selectedWorkerId = route?.params?.selectedWorkerId;
  const workerName = route?.params?.workerName;

  // Animación para typing indicator
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Efectos
  useEffect(() => {
    loadWorkers();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedWorkerId && state.workers.length > 0) {
      const worker = state.workers.find((w) => w.id === selectedWorkerId);
      if (worker) {
        dispatch({ type: "SET_SELECTED_WORKER", payload: worker });
        loadMessages(worker.user.id);
      }
    }
  }, [selectedWorkerId, state.workers]);

  // Polling para mensajes en tiempo real
  useEffect(() => {
    if (state.selectedWorker) {
      const pollMessages = () => {
        loadMessages(state.selectedWorker!.user.id, false);
      };

      messagePollingRef.current = setInterval(pollMessages, 5000);

      return () => {
        if (messagePollingRef.current) {
          clearInterval(messagePollingRef.current);
        }
      };
    }
  }, [state.selectedWorker]);

  // Animación de typing
  useEffect(() => {
    if (state.typingUsers.size > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [state.typingUsers.size]);

  const generateSuggestions = (worker: Worker, messageCount: number) => {
    const baseSuggestions = [
      {
        label: "🌟 Mostrar interés",
        message: getContextualMessage(worker, "INITIAL_INTEREST"),
        category: "interest",
      },
      {
        label: "❓ Solicitar información",
        message: getContextualMessage(worker, "REQUEST_INFO"),
        category: "info",
      },
      {
        label: "📞 Programar entrevista",
        message: getContextualMessage(worker, "INTERVIEW_REQUEST"),
        category: "interview",
      },
      {
        label: "💼 Hacer oferta",
        message: getContextualMessage(worker, "JOB_OFFER"),
        category: "offer",
      },
    ];

    const conversationSuggestions = [];

    if (messageCount === 0) {
      conversationSuggestions.push(baseSuggestions[0]);
    } else if (messageCount < 3) {
      conversationSuggestions.push(baseSuggestions[1], baseSuggestions[2]);
    } else {
      conversationSuggestions.push(baseSuggestions[3]);
      conversationSuggestions.push({
        label: "🔄 Seguimiento",
        message: getContextualMessage(worker, "FOLLOW_UP"),
        category: "followup",
      });
    }

    return [...conversationSuggestions, ...baseSuggestions];
  };

  // Funciones memoizadas
  const suggestions = useMemo(() => {
    if (!state.selectedWorker) return [];
    return generateSuggestions(state.selectedWorker, state.messages.length);
  }, [state.selectedWorker, state.messages.length]);

  // Funciones de utilidad
  const getUserData = useCallback(async () => {
    try {
      const result = await ApiClient.get(`/user/list/${user.id}`);
      if (!result.success || !result.data) {
        throw new Error("Error al obtener datos del usuario");
      }
      return result.data;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      throw error;
    }
  }, [user.id]);

  // Funciones principales
  const loadWorkers = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      if (!user || !user.id) {
        throw new Error("No hay usuario autenticado");
      }

      const fullUserData = await getUserData();

      if (!fullUserData.employerProfile) {
        throw new Error("El usuario no tiene perfil de empleador");
      }

      const employerId = fullUserData.employerProfile.id;
      const result = await ApiClient.get(`/employer/${employerId}/workers`);

      const workersData = result.data || [];

      // Simular estado online/offline
      const workersWithStatus = workersData.map((worker: Worker) => ({
        ...worker,
        user: {
          ...worker.user,
          isOnline: Math.random() > 0.5,
          lastSeen: new Date(
            Date.now() - Math.random() * 3600000
          ).toISOString(),
        },
      }));

      dispatch({ type: "SET_WORKERS", payload: workersWithStatus });

      // Cargar contadores de mensajes no leídos
      workersWithStatus.forEach((worker: Worker) => {
        dispatch({
          type: "UPDATE_UNREAD_COUNT",
          payload: {
            userId: worker.user.id,
            count: Math.floor(Math.random() * 5),
          },
        });
      });
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
      Alert.alert("Error", "No se pudieron cargar los trabajadores");
    }
  };

  const loadMessages = async (recipientId: string, showLoading = true) => {
    try {
      if (showLoading) {
        dispatch({ type: "SET_LOADING", payload: true });
      }

      // Simular llamada a API real
      const mockMessages: Message[] = [
        {
          id: "1",
          content:
            "¡Hola! Estoy muy interesado en el trabajo que publicaste. Mi experiencia encaja perfectamente con lo que buscan.",
          senderId: recipientId,
          recipientId: user.id,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true,
          isDelivered: true,
          messageType: "text",
        },
        {
          id: "2",
          content:
            "Perfecto, me parece muy bien tu perfil. ¿Cuándo podrías empezar a trabajar?",
          senderId: user.id,
          recipientId: recipientId,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: true,
          isDelivered: true,
          messageType: "text",
        },
        {
          id: "3",
          content:
            "Podría empezar la próxima semana. ¿Podrías contarme más sobre el horario y las responsabilidades específicas?",
          senderId: recipientId,
          recipientId: user.id,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          isRead: false,
          isDelivered: true,
          messageType: "text",
        },
      ];

      dispatch({ type: "SET_MESSAGES", payload: mockMessages });

      // Marcar mensajes como leídos
      dispatch({ type: "MARK_MESSAGES_READ", payload: recipientId });
      dispatch({
        type: "UPDATE_UNREAD_COUNT",
        payload: { userId: recipientId, count: 0 },
      });

      // Scroll al final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      if (showLoading) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !state.selectedWorker || state.sending) {
      return;
    }

    try {
      dispatch({ type: "SET_SENDING", payload: true });

      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        senderId: user.id,
        recipientId: state.selectedWorker.user.id,
        timestamp: new Date().toISOString(),
        isRead: false,
        isDelivered: false,
        messageType: "text",
      };

      // Optimistic update
      dispatch({ type: "ADD_MESSAGE", payload: message });
      setNewMessage("");

      // Simular envío a API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actualizar mensaje como entregado
      const deliveredMessage = { ...message, isDelivered: true };
      dispatch({
        type: "SET_MESSAGES",
        payload: [...state.messages, deliveredMessage],
      });

      // Scroll al final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simular respuesta automática (para demo)
      setTimeout(() => {
        simulateIncomingMessage();
      }, 3000);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
      Alert.alert("Error", "No se pudo enviar el mensaje");
    }
  };

  const simulateIncomingMessage = () => {
    if (!state.selectedWorker) return;

    const responses = [
      "Gracias por la información. Suena muy bien.",
      "Perfecto, estaré esperando más detalles.",
      "¿Podríamos coordinar una llamada para hablar mejor?",
      "Me interesa mucho esta oportunidad.",
    ];

    const message: Message = {
      id: (Date.now() + Math.random()).toString(),
      content: responses[Math.floor(Math.random() * responses.length)],
      senderId: state.selectedWorker.user.id,
      recipientId: user.id,
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: true,
      messageType: "text",
    };

    dispatch({ type: "ADD_MESSAGE", payload: message });

    // Simular typing indicator
    dispatch({ type: "SET_TYPING", payload: state.selectedWorker.user.id });
    setTimeout(() => {
      dispatch({
        type: "REMOVE_TYPING",
        payload: state.selectedWorker.user.id,
      });
    }, 2000);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      // Aquí enviarías el estado de typing al servidor
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Aquí enviarías que dejaste de escribir al servidor
    }, 2000);
  };

  const onRefresh = useCallback(async () => {
    dispatch({ type: "SET_REFRESHING", payload: true });
    try {
      await loadWorkers();
      if (state.selectedWorker) {
        await loadMessages(state.selectedWorker.user.id, false);
      }
    } finally {
      dispatch({ type: "SET_REFRESHING", payload: false });
    }
  }, [state.selectedWorker]);

  // Componentes
  const MessageSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.suggestionsRow}>
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => {
                setNewMessage(suggestion.message);
                setShowSuggestions(false);
                textInputRef.current?.focus();
              }}>
              <Text style={styles.suggestionText}>{suggestion.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const QuickReplies = () => {
    const quickReplies = [
      "👍 Perfecto",
      "🤔 Déjame pensarlo",
      "📞 Llamemos",
      "📅 ¿Cuándo empezamos?",
      "💰 ¿Y el salario?",
      "📍 ¿Dónde es?",
      "⏰ ¿Horarios?",
      "🚗 ¿Transporte?",
    ];

    return (
      <View style={styles.quickRepliesContainer}>
        <Text style={styles.quickRepliesTitle}>Respuestas rápidas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickRepliesRow}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyChip}
                onPress={() => {
                  setNewMessage(reply);
                  textInputRef.current?.focus();
                }}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const TypingIndicator = () => {
    if (state.typingUsers.size === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Animated.View
          style={[styles.typingDots, { opacity: typingAnimation }]}>
          <Text style={styles.typingText}>
            {state.selectedWorker?.user.name} está escribiendo
          </Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </Animated.View>
      </View>
    );
  };

  const OnlineStatus = ({
    isOnline,
    lastSeen,
  }: {
    isOnline?: boolean;
    lastSeen?: string;
  }) => (
    <View style={styles.onlineStatusContainer}>
      <View
        style={[
          styles.onlineIndicator,
          { backgroundColor: isOnline ? COLORS.online : COLORS.offline },
        ]}
      />
      <Text style={styles.onlineStatusText}>
        {isOnline ? "En línea" : `Visto ${formatRelativeTime(lastSeen)}`}
      </Text>
    </View>
  );

  // Funciones de utilidad
  const getWorkerFullName = (worker: Worker) => {
    return `${worker.user.name} ${worker.user.lastname}`.trim();
  };

  const getWorkerLocation = (worker: Worker) => {
    const cityName = worker.user.city?.name || "";
    const stateName = worker.user.departmentState?.name || "";
    if (cityName && stateName) {
      return `${cityName}, ${stateName}`;
    }
    return cityName || stateName || "Ubicación no especificada";
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "hace tiempo";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "ahora";
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;

    return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Renderizado de elementos
  const renderWorkerItem = ({ item }: { item: Worker }) => {
    const unreadCount = state.unreadCounts.get(item.user.id) || 0;

    return (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => {
          dispatch({ type: "SET_SELECTED_WORKER", payload: item });
          setShowWorkerDropdown(false);
          loadMessages(item.user.id);
        }}>
        <View style={styles.workerItemInfo}>
          <View style={styles.workerAvatarContainer}>
            <View style={styles.workerAvatar}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.onlineIndicator,
                styles.avatarOnlineIndicator,
                {
                  backgroundColor: item.user.isOnline
                    ? COLORS.online
                    : COLORS.offline,
                },
              ]}
            />
          </View>
          <View style={styles.workerDetails}>
            <View style={styles.workerNameRow}>
              <Text style={styles.workerItemName}>
                {getWorkerFullName(item)}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.workerItemLocation}>
              {getWorkerLocation(item)}
            </Text>
            <View style={styles.workerStatusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.availability
                      ? COLORS.success
                      : COLORS.error,
                  },
                ]}
              />
              <Text style={styles.workerStatusText}>
                {item.availability ? "Disponible" : "No disponible"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user.id;
    const showTimestamp =
      index === 0 ||
      new Date(item.timestamp).getTime() -
        new Date(state.messages[index - 1].timestamp).getTime() >
        300000; // 5 min

    return (
      <View style={styles.messageWrapper}>
        {showTimestamp && (
          <Text style={styles.timestampSeparator}>
            {formatMessageTime(item.timestamp)}
          </Text>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}>
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}>
              {new Date(item.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.isDelivered ? "checkmark-done" : "checkmark"}
                size={14}
                color={
                  item.isRead ? COLORS.success : "rgba(255, 255, 255, 0.7)"
                }
                style={styles.messageStatus}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (state.loading && state.workers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name="chatbubble-outline"
          size={48}
          color={COLORS.textLight}
        />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {state.selectedWorker
                ? getWorkerFullName(state.selectedWorker)
                : "Mensajes"}
            </Text>
            {state.selectedWorker && (
              <OnlineStatus
                isOnline={state.selectedWorker.user.isOnline}
                lastSeen={state.selectedWorker.user.lastSeen}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setShowWorkerDropdown(true)}>
            <Ionicons name="people" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Contenido principal */}
        {state.selectedWorker ? (
          <>
            {/* Lista de Mensajes */}
            <ScrollView
              style={styles.messagesContainer}
              ref={scrollViewRef}
              refreshControl={
                <RefreshControl
                  refreshing={state.refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }>
              <FlatList
                data={state.messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              <TypingIndicator />
            </ScrollView>

            {/* Sugerencias de mensaje */}
            {suggestions.length > 0 && <MessageSuggestions />}

            {/* Input de Nuevo Mensaje */}
            <View style={styles.messageInputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={textInputRef}
                  style={styles.messageInput}
                  placeholder="Escribe tu mensaje..."
                  value={newMessage}
                  onChangeText={handleTyping}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newMessage.trim() || state.sending) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={sendMessage}
                  disabled={!newMessage.trim() || state.sending}>
                  <Ionicons
                    name={state.sending ? "hourglass" : "send"}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Respuestas rápidas */}
            <QuickReplies />
          </>
        ) : (
          /* Estado vacío */
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[COLORS.primary + "20", COLORS.secondary + "20"]}
              style={styles.emptyIconContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={64}
                color={COLORS.primary}
              />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Selecciona un trabajador</Text>
            <Text style={styles.emptySubtitle}>
              Elige un trabajador de la lista para comenzar una conversación
            </Text>
            <TouchableOpacity
              style={styles.selectWorkerButton}
              onPress={() => setShowWorkerDropdown(true)}>
              <Text style={styles.selectWorkerButtonText}>
                Ver trabajadores
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal de Selección de Trabajador */}
        <Modal
          visible={showWorkerDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWorkerDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[COLORS.surface, COLORS.background]}
                style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Trabajador</Text>
                <TouchableOpacity
                  onPress={() => setShowWorkerDropdown(false)}
                  style={styles.modalCloseButton}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </LinearGradient>

              <FlatList
                data={state.workers}
                renderItem={renderWorkerItem}
                keyExtractor={(item) => item.id}
                style={styles.workersList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={state.refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                  />
                }
              />
            </View>
          </View>
        </Modal>

        {/* Error Alert */}
        {state.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity
              onPress={() => dispatch({ type: "SET_ERROR", payload: null })}
              style={styles.errorCloseButton}>
              <Ionicons name="close" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.surface,
  },
  headerAction: {
    padding: 8,
  },
  onlineStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageWrapper: {
    marginBottom: 8,
  },
  timestampSeparator: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textLight,
    marginVertical: 16,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center",
  },
  messageContainer: {
    maxWidth: screenWidth * 0.75,
    marginBottom: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    padding: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.surface,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  theirMessageTime: {
    color: COLORS.textLight,
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingContainer: {
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: "row",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textLight,
    marginHorizontal: 1,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  messageInputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: COLORS.background,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  selectWorkerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  selectWorkerButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  workersList: {
    maxHeight: 500,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workerItemInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  workerDetails: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  workerItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "600",
  },
  workerItemLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  workerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  workerStatusText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  quickRepliesContainer: {
    backgroundColor: `${COLORS.primary}08`,
    paddingVertical: 12,
  },
  quickRepliesTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 20,
    marginBottom: 8,
    fontWeight: "500",
  },
  quickRepliesRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 6,
  },
  quickReplyChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReplyText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },
  errorContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
});

export default MessagesScreen;
