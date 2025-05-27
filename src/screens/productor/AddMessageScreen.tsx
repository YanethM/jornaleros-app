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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_COLOR = "#284F66";

// Tipos de eventos según tu backend
const eventTypes = {
  TRABAJO: "Trabajo",
  PAGO: "Pago",
  MENSAJE: "Mensaje",
  RECORDATORIO: "Recordatorio",
};

const AddMessageScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("MENSAJE");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipients, setRecipients] = useState([]); // Lista de posibles destinatarios
  const [showRecipientsList, setShowRecipientsList] = useState(false);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setRecipients([
        { id: "1", name: "Juan Pérez", email: "juan@example.com" },
        { id: "2", name: "María García", email: "maria@example.com" },
        { id: "3", name: "Carlos López", email: "carlos@example.com" },
      ]);
    } catch (error) {
      console.error("Error loading recipients:", error);
    }
  };

  const handleSelectRecipient = (recipient) => {
    setRecipientId(recipient.id);
    setRecipientName(recipient.name);
    setShowRecipientsList(false);
  };

  const handleSendMessage = async () => {
    // Validaciones
    if (!title.trim()) {
      Alert.alert("Error", "Por favor ingresa un título");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Error", "Por favor ingresa un mensaje");
      return;
    }
    if (!recipientId) {
      Alert.alert("Error", "Por favor selecciona un destinatario");
      return;
    }

    setLoading(true);

    try {
        // TODO: Implementar el servicio para crear notificación
        const notificationData = {
          title: title.trim(),
          message: message.trim(),
          senderId: user?.id,
          recipientId: recipientId,
          event: selectedEvent,
        };
  
        // Aquí llamarías a tu servicio:
        // await createNotification(notificationData);
  
        // Simulación de envío exitoso
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        Alert.alert(
          "Éxito",
          "Mensaje enviado correctamente",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "No se pudo enviar el mensaje. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }
  

  const renderRecipientsList = () => {
    if (!showRecipientsList) return null;

    return (
      <View style={styles.recipientsList}>
        <ScrollView style={styles.recipientsScrollView}>
          {recipients.map((recipient) => (
            <TouchableOpacity
              key={recipient.id}
              style={styles.recipientItem}
              onPress={() => handleSelectRecipient(recipient)}
            >
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientInitial}>
                  {recipient.name[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientNameText}>{recipient.name}</Text>
                <Text style={styles.recipientEmail}>{recipient.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScreenLayout navigation={navigation}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo Mensaje</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Recipient Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Para:</Text>
            <TouchableOpacity
              style={styles.recipientSelector}
              onPress={() => setShowRecipientsList(!showRecipientsList)}
            >
              <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.recipientText, !recipientName && styles.placeholderText]}>
                {recipientName || "Seleccionar destinatario"}
              </Text>
              <Icon name={showRecipientsList ? "expand-less" : "expand-more"} size={24} color="#666" />
            </TouchableOpacity>
            {renderRecipientsList()}
          </View>

          {/* Event Type Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Tipo de mensaje:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventTypesContainer}>
              {Object.entries(eventTypes).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.eventTypeButton,
                    selectedEvent === key && styles.eventTypeButtonActive
                  ]}
                  onPress={() => setSelectedEvent(key)}
                >
                  <Text style={[
                    styles.eventTypeText,
                    selectedEvent === key && styles.eventTypeTextActive
                  ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Título:</Text>
            <View style={styles.inputContainer}>
              <Icon name="title" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa el título del mensaje"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Mensaje:</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Escribe tu mensaje aquí..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" style={styles.sendIcon} />
                <Text style={styles.sendButtonText}>Enviar Mensaje</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  recipientSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  recipientText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
  },
  placeholderText: {
    color: "#999",
  },
  recipientsList: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8ECF0",
    maxHeight: 200,
  },
  recipientsScrollView: {
    padding: 8,
  },
  recipientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  recipientInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  recipientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recipientNameText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  recipientEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  eventTypesContainer: {
    flexDirection: "row",
  },
  eventTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8ECF0",
    marginRight: 8,
  },
  eventTypeButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  eventTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  eventTypeTextActive: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 14,
  },
  textAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  textArea: {
    fontSize: 15,
    color: "#333",
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  sendButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default AddMessageScreen;