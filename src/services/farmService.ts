import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiClient from "../utils/api";

export async function getFarms() {
  try {
    const userData = await AsyncStorage.getItem("@user_data");
    
    if (!userData) {
      throw new Error("No se encontraron datos de usuario en AsyncStorage");
    }

    const user = JSON.parse(userData);
    const userId = user?.id;
    
    if (!userId) {
      throw new Error("No se encontró el ID del usuario");
    }

    const result = await ApiClient.get(`/farm/list/owned/${userId}`);
    console.log("Farm response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching farms:", error);
    throw error;
  }
}

export async function getFarmByemployerId(employerId) {
  console.log("Owner ID:", employerId);

  try {
    const result = await ApiClient.get(`/farm/list/owned/${employerId}`);
    console.log("Farm response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching farms:", error);
    throw error;
  }
}

export async function createFarm(farmData) {
  try {
    console.log("Creating farm with data:", farmData);
    
    const result = await ApiClient.post("/farm", farmData);
    console.log("Farm creation response:", result.data);
    
    if (!result.success) {
      throw new Error(result.data?.msg || "Error al crear el terreno");
    }
    
    console.log("Farm created successfully:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error creating farm:", error);
    throw error;
  }
}

export async function getFarmById(farmId) {
  try {
    console.log("Fetching farm by ID:", farmId);
    
    const result = await ApiClient.get(`/farm/list/${farmId}`);
    console.log("Farm response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching farm by ID:", error);
    throw error;
  }
}

export async function updateFarm(farmId, farmData) {
  try {
    const result = await ApiClient.put(`/farm/update/${farmId}`, farmData);
    console.log("Farm updated successfully:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error updating farm:", error);
    throw error;
  }
}

export async function deleteFarm(farmId) {
  try {
    const result = await ApiClient.delete(`/farm/delete/${farmId}`);
    console.log("Farm deleted successfully:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error deleting farm:", error);
    throw error;
  }
}