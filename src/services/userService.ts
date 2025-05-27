import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL;
  };

  
export async function getUserData() {
    try {
      const apiUrl = getApiUrl();
      const token = await AsyncStorage.getItem("@user_token");
      const userData = await AsyncStorage.getItem("@user_data");
      console.log("Token:", token);
      console.log("User data:", userData);
      
      if (!userData) {
        throw new Error("No se encontraron datos de usuario en AsyncStorage");
      }
      
      const user = JSON.parse(userData);
      const userId = user?.id;
      const USER_API_URL = `${apiUrl}/user/list/${userId}`;
      
      console.log("User API URL:", USER_API_URL);
      
      if (!userId) {
        throw new Error("No se encontró el ID del usuario");
      }
      
      const response = await fetch(USER_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("User response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw {
          status: response.status,
          response: errorData,
        };
      }
      
      const userInfo = await response.json();
      console.log("User response:", userInfo);
      
      return userInfo;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }