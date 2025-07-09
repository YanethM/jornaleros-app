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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import ScreenLayout from "../../components/ScreenLayout";
import {
  getConversations,
  getMessagesBetweenUsers,
  markMessagesAsRead,
  sendMessageAPI,
} from "../../services/messagesService";

const COLORS = {
  primary: "#274F66",
  primaryLight: "#3D6B85",
  primaryDark: "#1A3A4A",
  secondary: "#F59E0B",
  accent: "#EC4899",
  background: "#F8FAFC",
  backgroundDark: "#1E293B",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textLight: "#64748B",
  textInverse: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  online: "#22C55E",
  offline: "#94A3B8",
  glass: "rgba(255, 255, 255, 0.25)",
  glassBackground: "rgba(255, 255, 255, 0.1)",
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.2)",
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Conversation {
  otherUser: {
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
  };
  lastMessage: {
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
  messageCount: number;
  lastMessageTime: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sentAt: string;
  isRead?: boolean;
  isDelivered?: boolean;
}

interface MessageState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  loadingMessages: boolean;
  sending: boolean;
  refreshing: boolean;
  error: string | null;
}

type MessageAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_MESSAGES"; payload: boolean }
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "SET_SELECTED_CONVERSATION"; payload: Conversation | null }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_SENDING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_REFRESHING"; payload: boolean }
  | { type: "MARK_MESSAGES_READ"; payload: string };

const messageReducer = (
  state: MessageState,
  action: MessageAction
): MessageState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_LOADING_MESSAGES":
      return { ...state, loadingMessages: action.payload };
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload, loading: false };
    case "SET_SELECTED_CONVERSATION":
      return { ...state, selectedConversation: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload, loadingMessages: false };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_SENDING":
      return { ...state, sending: action.payload };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
        loadingMessages: false, // 🔧 CORREGIDO: Limpiar también loadingMessages
        sending: false,
      };
    case "SET_REFRESHING":
      return { ...state, refreshing: action.payload };
    case "MARK_MESSAGES_READ":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.senderId === action.payload ? { ...msg, isRead: true } : msg
        ),
        conversations: state.conversations.map((conv) =>
          conv.otherUser.id === action.payload
            ? { ...conv, unreadCount: 0 }
            : conv
        ),
      };
    default:
      return state;
  }
};

const initialState: MessageState = {
  conversations: [],
  selectedConversation: null,
  messages: [],
  loading: false,
  loadingMessages: false,
  sending: false,
  refreshing: false,
  error: null,
};

const MessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const [newMessage, setNewMessage] = useState("");
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadConversations = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await getConversations();

      if (result.success && result.data) {
        dispatch({ type: "SET_CONVERSATIONS", payload: result.data });
      } else {
        throw new Error(result.error || "Error al cargar conversaciones");
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      Alert.alert("Error", "No se pudieron cargar las conversaciones");
    }
  }, []);

  // 🔧 CORREGIDO: Función separada para actualizar conversaciones sin loading
  const updateConversationsQuietly = useCallback(async () => {
    try {
      const result = await getConversations();
      if (result.success && result.data) {
        // Solo actualizar las conversaciones sin activar loading
        dispatch({ type: "SET_CONVERSATIONS", payload: result.data });
      }
    } catch (error) {
      console.warn("⚠️ Could not update conversations:", error);
      // No mostrar error al usuario para esta actualización silenciosa
    }
  }, []);

  const loadMessages = useCallback(
    async (userId: string) => {
      try {
        dispatch({ type: "SET_LOADING_MESSAGES", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        console.log(`📱 Loading messages between ${user?.id} and ${userId}`);

        const result = await getMessagesBetweenUsers(user.id, userId);

        if (result.success && result.data) {
          console.log(`✅ Loaded ${result.data.length} messages successfully`);
          dispatch({ type: "SET_MESSAGES", payload: result.data });

          try {
            const markReadResult = await markMessagesAsRead(userId, user.id);
            if (markReadResult.success) {
              console.log(
                `✅ Marked ${
                  markReadResult.data?.markedCount || 0
                } messages as read`
              );
              dispatch({ type: "MARK_MESSAGES_READ", payload: userId });
            }
          } catch (markReadError) {
            console.warn("⚠️ Could not mark messages as read:", markReadError);
          }
        } else {
          console.error("❌ Error loading messages:", result.error);
          throw new Error(result.error || "Error al cargar mensajes");
        }
      } catch (error) {
        console.error("❌ Error in loadMessages:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        Alert.alert(
          "Error",
          "No se pudieron cargar los mensajes. Intenta nuevamente."
        );
      } finally {
        dispatch({ type: "SET_LOADING_MESSAGES", payload: false });
      }
    },
    [user?.id]
  );

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !state.selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      dispatch({ type: "SET_SENDING", payload: true });

      console.log(
        `📤 Sending message to ${state.selectedConversation.otherUser.name}`
      );

      const messageData = {
        content: messageText,
        receiverId: state.selectedConversation.otherUser.id,
      };

      const result = await sendMessageAPI(messageData);

      if (result.success && result.data) {
        console.log("✅ Message sent successfully");

        // Add message to current conversation
        dispatch({ type: "ADD_MESSAGE", payload: result.data });

        // Update conversations list with new last message
        const updatedConversations = state.conversations.map((conv) =>
          conv.otherUser.id === state.selectedConversation?.otherUser.id
            ? {
                ...conv,
                lastMessage: {
                  content: messageText,
                  sentAt: new Date().toISOString(),
                  senderId: user.id,
                },
                lastMessageTime: new Date().toISOString(),
                messageCount: conv.messageCount + 1,
              }
            : conv
        );

        dispatch({ type: "SET_CONVERSATIONS", payload: updatedConversations });

        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error("❌ Error sending message:", result.error);
        setNewMessage(messageText); // Restore message on error
        throw new Error(result.error || "Error al enviar mensaje");
      }
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      setNewMessage(messageText); // Restore message on error
      dispatch({ type: "SET_ERROR", payload: error.message });
      Alert.alert("Error", "No se pudo enviar el mensaje. Intenta nuevamente.");
    } finally {
      dispatch({ type: "SET_SENDING", payload: false });
    }
  }, [newMessage, state.selectedConversation, state.conversations, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  const handleRefreshMessages = useCallback(async () => {
    if (state.selectedConversation) {
      dispatch({ type: "SET_REFRESHING", payload: true });
      try {
        await loadMessages(state.selectedConversation.otherUser.id);
      } catch (error) {
        console.error("❌ Error refreshing messages:", error);
      } finally {
        dispatch({ type: "SET_REFRESHING", payload: false });
      }
    }
  }, [state.selectedConversation, loadMessages]);

  const handleOpenConversation = useCallback(
    async (conversation: Conversation) => {
      try {
        console.log(
          `📱 Opening conversation with ${conversation.otherUser.name}`
        );

        // Set selected conversation and show modal immediately
        dispatch({ type: "SET_SELECTED_CONVERSATION", payload: conversation });
        setShowMessagesModal(true);

        // Load messages
        await loadMessages(conversation.otherUser.id);

        // Update conversations quietly after a delay
        setTimeout(() => {
          updateConversationsQuietly();
        }, 1000);
      } catch (error) {
        console.error("❌ Error opening conversation:", error);
        Alert.alert("Error", "No se pudo abrir la conversación");
        setShowMessagesModal(false);
      }
    },
    [loadMessages, updateConversationsQuietly]
  );

  // Función para generar avatar con iniciales
  const getInitials = (name: string, lastname: string) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : "";
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  };

  // Función para formatear el tiempo
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hoy";
    } else if (diffDays === 2) {
      return "Ayer";
    } else if (diffDays <= 7) {
      return messageDate.toLocaleDateString("es-ES", { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  // Función para truncar mensaje largo
  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const fullName = `${item.otherUser.name} ${item.otherUser.lastname}`;
    const initials = getInitials(item.otherUser.name, item.otherUser.lastname);
    const isMyMessage = item.lastMessage.senderId === user?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleOpenConversation(item)}>
        {/* Avatar con iniciales */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Información de la conversación */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.conversationTime}>
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text style={styles.conversationLastMessage} numberOfLines={1}>
              {isMyMessage && <Text style={styles.youPrefix}>Tú: </Text>}
              {truncateMessage(item.lastMessage.content)}
            </Text>

            {/* Badge de mensajes no leídos */}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Email del usuario (información adicional) */}
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.otherUser.email}
          </Text>
        </View>

        {/* Indicador de estado de lectura para mensajes propios */}
        {isMyMessage && (
          <View style={styles.messageStatusContainer}>
            <Icon
              name="done-all"
              size={16}
              color={item.unreadCount === 0 ? COLORS.success : COLORS.textLight}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.theirMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}>
          <Text
            style={
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            }>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}>
              {new Date(item.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isMyMessage && (
              <Icon
                name={item.isRead ? "done-all" : "done"}
                size={16}
                color={item.isRead ? COLORS.success : COLORS.textLight}
                style={styles.messageStatus}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.textInverse} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mensajes</Text>

          <View style={styles.headerButton} />
        </View>

        {/* Lista principal de conversaciones */}
        <FlatList
          data={state.conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.otherUser.id}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={loadConversations}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons
                name="chatbubbles-outline"
                size={80}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyListText}>No hay conversaciones</Text>
            </View>
          }
        />

        {/* Modal de mensajes */}
        <Modal
          visible={showMessagesModal}
          animationType="slide"
          onRequestClose={() => setShowMessagesModal(false)}
          transparent={false}>
          {/* Área de mensajes */}
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
            <View style={styles.modalContainer}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowMessagesModal(false)}>
                  <Icon name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>
                    {state.selectedConversation?.otherUser.name}{" "}
                    {state.selectedConversation?.otherUser.lastname}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {state.selectedConversation?.otherUser.email}
                  </Text>
                  {state.messages.length > 0 && (
                    <Text style={styles.messageCount}>
                      {state.messages.length} mensaje
                      {state.messages.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>

                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.messagesWrapper}>
                {state.loadingMessages ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={50}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.loadingText}>Cargando mensajes...</Text>
                  </View>
                ) : state.messages.length === 0 ? (
                  <View style={styles.emptyMessagesContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={60}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.emptyMessagesText}>
                      No hay mensajes aún
                    </Text>
                    <Text style={styles.emptyMessagesSubtext}>
                      Envía el primer mensaje para comenzar la conversación
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={state.refreshing}
                        onRefresh={handleRefreshMessages}
                        tintColor={COLORS.primary}
                      />
                    }
                    onContentSizeChange={() =>
                      scrollViewRef.current?.scrollToEnd({ animated: true })
                    }>
                    {state.messages.map((message) => (
                      <View key={message.id}>
                        {renderMessageItem({ item: message })}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Input de mensaje */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  disabled={state.sending || !newMessage.trim()}>
                  <Icon
                    name="send"
                    size={24}
                    color={
                      newMessage.trim() ? COLORS.primary : COLORS.textLight
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textInverse,
  },
  conversationsList: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  youPrefix: {
    fontWeight: "500",
    color: COLORS.textLight,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: "bold",
  },
  messageStatusContainer: {
    marginLeft: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 4,
  },
  modalHeaderInfo: {
    flex: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  messageCount: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: "500",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  myMessageText: {
    color: COLORS.textInverse,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  theirMessageTime: {
    color: COLORS.textLight,
  },
  messageStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MessagesScreen;
