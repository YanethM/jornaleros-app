import AsyncStorage from "@react-native-async-storage/async-storage";

const ApiClient = () => {
  return process.env.EXPO_PUBLIC_API_URL;
};

// Interfaces actualizadas para coincidir con el backend
interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sentAt: string;
  sender: {
    id: string;
    name: string;
    lastname: string;
  };
  receiver: {
    id: string;
    name: string;
    lastname: string;
  };
}

interface Conversation {
  otherUser: {
    id: string;
    name: string;
    lastname: string;
    email: string;
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

// Obtener conversaciones del usuario actual
export async function getConversations() {
  const apiUrl = ApiClient();
  
  try {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const CONVERSATIONS_API_URL = `${apiUrl}/notification/conversations`;
    console.log("📱 Conversations API URL:", CONVERSATIONS_API_URL);

    const response = await fetch(CONVERSATIONS_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response || typeof response !== "object") {
      throw new Error("Respuesta de la API inválida");
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Server returned non-JSON response:", text.substring(0, 100));
      throw new Error("El servidor devolvió una respuesta no JSON");
    }

    const data = await response.json();
    console.log("📱 Raw API response:", data);

    if (!response.ok) {
      console.error("❌ API Error:", {
        status: response.status,
        error: data.message || "Unknown error",
      });
      throw new Error(data.message || "Error al obtener conversaciones");
    }

    // ✅ FIXED: Handle the correct response structure from backend
    // Backend returns: {success: true, data: [conversations...]}
    if (!data.success || !Array.isArray(data.data)) {
      console.error("❌ Invalid response format:", data);
      throw new Error("Formato de respuesta inválido");
    }

    const conversationsArray = data.data;
    console.log("📱 Successfully parsed backend response, length:", conversationsArray.length);

    // Validate and transform response data
    const conversations = conversationsArray.map((item, index) => {
      // Validate required fields
      if (!item.otherUser || !item.otherUser.id) {
        console.warn(`⚠️ Invalid conversation at index ${index}: missing otherUser.id`, item);
        return null;
      }

      return {
        otherUser: {
          id: item.otherUser.id,
          name: item.otherUser.name || "",
          lastname: item.otherUser.lastname || "",
          email: item.otherUser.email || "",
        },
        lastMessage: {
          content: item.lastMessage?.content || "",
          sentAt: item.lastMessage?.sentAt || new Date().toISOString(),
          senderId: item.lastMessage?.senderId || "",
        },
        unreadCount: item.unreadCount || 0,
        messageCount: item.messageCount || 0,
        lastMessageTime: item.lastMessageTime || new Date().toISOString(),
      };
    }).filter(Boolean); // Remove null items from validation failures

    console.log(`✅ Conversaciones procesadas: ${conversations.length} válidas de ${conversationsArray.length} totales`);
    
    // ✅ IMPORTANT: Return the same structure that the component expects
    return {
      success: true,
      data: conversations
    };

  } catch (error) {
    console.error("❌ Error obteniendo conversaciones:", error);
    return {
      success: false,
      data: [],
      error: error.message || "Error desconocido"
    };
  }
}

// Obtener mensajes entre dos usuarios
export const getMessagesBetweenUsers = async (userId1, userId2) => {
  try {
    // Validate input parameters
    if (!userId1 || !userId2) {
      throw new Error("Both user IDs are required");
    }

    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const apiUrl = ApiClient();
    // Updated to match the backend route
    const MESSAGES_API_URL = `${apiUrl}/notification/messages/between/${userId1}/${userId2}`;
    
    console.log("📥 Messages API URL:", MESSAGES_API_URL);
    console.log("📥 Fetching messages between users:", { userId1, userId2 });

    const response = await fetch(MESSAGES_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "❌ Server returned non-JSON response:",
        text.substring(0, 100)
      );
      throw new Error("Server returned unexpected response");
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", {
        status: response.status,
        error: data.message || "Unknown error",
        url: MESSAGES_API_URL,
      });
      throw new Error(data.message || "Failed to fetch messages");
    }

    console.log(`✅ Successfully fetched ${data.data?.length || 0} messages`);
    
    return {
      success: true,
      data: data.data || [],
      meta: data.meta,
    };

  } catch (error) {
    console.error("❌ Network error in getMessagesBetweenUsers:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Enviar un nuevo mensaje
export async function sendMessageAPI(messageData) {
  const apiUrl = ApiClient();
  try {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    console.log("📤 Enviando mensaje:", messageData);

    const SEND_MESSAGE_API_URL = `${apiUrl}/notification/messages/send`;
    console.log("📤 Send Message API URL:", SEND_MESSAGE_API_URL);

    const response = await fetch(SEND_MESSAGE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("✅ Mensaje enviado:", data);
    return data;
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error);
    throw error;
  }
}

export const markMessagesAsRead = async (senderId, receiverId) => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const apiUrl = ApiClient();
    // Cambiamos la ruta para incluir ambos IDs
    const MARK_READ_API_URL = `${apiUrl}/notification/messages/mark-read/${senderId}/${receiverId}`;
    
    console.log("📖 Marking messages as read:", { senderId, receiverId });

    const response = await fetch(MARK_READ_API_URL, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Server returned non-JSON response:", text.substring(0, 100));
      throw new Error("Server returned unexpected response");
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error marking messages as read:", {
        status: response.status,
        error: data.message || "Unknown error",
      });
      throw new Error(data.message || "Failed to mark messages as read");
    }

    console.log("✅ Messages marked as read successfully:", data);
    
    return {
      success: true,
      data: data.data,
    };

  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Eliminar un mensaje (opcional)
export async function deleteMessage(messageId) {
  const apiUrl = ApiClient();
  try {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    console.log(`🗑️ Eliminando mensaje ${messageId}`);

    const DELETE_MESSAGE_API_URL = `${apiUrl}/notification/messages/notification/${messageId}`;
    console.log("🗑️ Delete Message API URL:", DELETE_MESSAGE_API_URL);

    const response = await fetch(DELETE_MESSAGE_API_URL, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("✅ Mensaje eliminado:", data);
    return data;
  } catch (error) {
    console.error("❌ Error eliminando mensaje:", error);
    throw error;
  }
}

// Función para obtener notificaciones (mantener la funcionalidad original)
export async function getMessages() {
  const apiUrl = ApiClient();
  try {
    const userData = await AsyncStorage.getItem("@user_data");
    const token = await AsyncStorage.getItem("@user_token");

    if (!userData) {
      throw new Error("No se encontraron datos de usuario en AsyncStorage");
    }

    const user = JSON.parse(userData);
    const userId = user?.id;

    if (!userId) {
      throw new Error("No se encontró el ID del usuario");
    }

    const MESSAGES_API_URL = `${apiUrl}/notification/messages/list-by-user/${userId}`;
    console.log("📱 Notifications API URL:", MESSAGES_API_URL);

    const response = await fetch(MESSAGES_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const messages = await response.json();
    console.log("✅ Notifications response:", messages);
    return messages;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    throw error;
  }
}

// Función para crear notificaciones (mantener la funcionalidad original)
export async function createNotification(notificationData) {
  const apiUrl = ApiClient();
  const NOTIFICATION_API_URL = `${apiUrl}/notification/create`;
  console.log("📤 Create Notification API URL:", NOTIFICATION_API_URL);

  try {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const response = await fetch(NOTIFICATION_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("✅ Notification created:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}

// Tipos de eventos para notificaciones
export const EVENT_TYPES = {
  Nueva_oferta: "Nueva_oferta",
  Aplicacion_aceptada: "Aplicacion_aceptada",
  Aplicacion_cancelada: "Aplicacion_cancelada",
  Evaluacion_recibida: "Evaluacion_recibida",
};

// Tipos de eventos legacy (mantener compatibilidad)
export const LEGACY_EVENT_TYPES = {
  TRABAJO: "TRABAJO",
  PAGO: "PAGO",
  MENSAJE: "MENSAJE",
  SISTEMA: "SISTEMA",
  ALERTA: "ALERTA",
  RECORDATORIO: "RECORDATORIO",
};
