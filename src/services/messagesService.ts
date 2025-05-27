import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL;
};

interface Message {
  id: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  time: string;
  isRead: boolean;
}

export async function getMessages() {
  const apiUrl = getApiUrl();

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

    const MESSAGES_API_URL = `${apiUrl}/notification/list-by-user/${userId}`;
    console.log("Messages API URL:", MESSAGES_API_URL);

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
    console.log("Messages response:", messages);

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export async function createNotification(notificationData) {
  const apiUrl = getApiUrl();
  const NOTIFICATION_API_URL = `${apiUrl}/notification/create`;
  console.log("Create Notification API URL:", NOTIFICATION_API_URL);
  
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
    console.log("Notification created:", data);
    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}


export const EVENT_TYPES = {
  TRABAJO: "TRABAJO",
  PAGO: "PAGO",
  MENSAJE: "MENSAJE",
  SISTEMA: "SISTEMA",
  ALERTA: "ALERTA",
  RECORDATORIO: "RECORDATORIO",
};