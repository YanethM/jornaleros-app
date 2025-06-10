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

export const requestFarmDeletion = async (farmId, reason = null) => {
  try {
    console.log('🚀 Requesting farm deletion for farmId:', farmId);
    
    // Incluir razón opcional en el body
    const requestBody = reason ? { reason } : {};
    
    const response = await ApiClient.post(`/farm/${farmId}/request-deletion`, requestBody);
    
    console.log('✅ Deletion request response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error in requestFarmDeletion:', error);
    
    const enhancedError = new Error(
      error.response?.data?.msg || 
      error.message || 
      'Error al enviar solicitud de eliminación'
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    enhancedError.code = error.response?.data?.code || error.code;
    
    throw enhancedError;
  }
};

export const checkDeletionStatus = async (farmId) => {
  try {
    console.log('🔍 Checking deletion status for farmId:', farmId);
    
    const response = await ApiClient.get(`/farm/${farmId}/deletion-status`);
    
    console.log('✅ Deletion status response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error checking deletion status:', error);
    
    // Return safe default instead of throwing
    return {
      success: true,
      data: {
        hasRequest: false,
        status: "none"
      }
    };
  }
};

export const deleteFarm = async (farmId) => {
  try {
    console.log('🗑️ Deleting farm with ID:', farmId);
    
    const response = await ApiClient.delete(`/farm/${farmId}`);
    
    console.log('✅ Farm deletion response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error deleting farm:', error);
    
    const enhancedError = new Error(
      error.response?.data?.msg || 
      error.message || 
      'Error al eliminar finca'
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    enhancedError.code = error.response?.data?.code || error.code;
    
    throw enhancedError;
  }
};

export const getFarmById = async (farmId) => {
  try {
    console.log('📋 Fetching farm by ID:', farmId);
    
    const response = await ApiClient.get(`/farm/list/${farmId}`);
    
    console.log('✅ Farm fetch response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error fetching farm:', error);
    
    const enhancedError = new Error(
      error.response?.data?.msg || 
      error.message || 
      'Error al cargar finca'
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    
    throw enhancedError;
  }
};

// NUEVAS FUNCIONES OPCIONALES PARA ADMINS

export const manageDeletionRequest = async (requestId, action, adminNotes = null) => {
  try {
    console.log('🔧 Managing deletion request:', requestId, action);
    
    const response = await ApiClient.patch(`/farm/deletion-requests/${requestId}`, {
      action,
      adminNotes
    });
    
    console.log('✅ Manage request response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error managing deletion request:', error);
    
    const enhancedError = new Error(
      error.response?.data?.msg || 
      error.message || 
      'Error al gestionar solicitud'
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    
    throw enhancedError;
  }
};

export const listDeletionRequests = async (status = 'all', page = 1, limit = 10) => {
  try {
    console.log('📋 Listing deletion requests');
    
    const params = new URLSearchParams({
      status,
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await ApiClient.get(`/farm/deletion-requests?${params}`);
    
    console.log('✅ List requests response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('💥 Error listing deletion requests:', error);
    
    const enhancedError = new Error(
      error.response?.data?.msg || 
      error.message || 
      'Error al listar solicitudes'
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    
    throw enhancedError;
  }
};