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

export async function getAllFarms() {
  try {
    const result = await ApiClient.get("/farm");
    console.log("All farms response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching all farms:", error);
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
    console.log("🚀 Requesting farm deletion for farmId:", farmId);

    // Incluir razón opcional en el body
    const requestBody = reason ? { reason } : {};

    const response = await ApiClient.post(
      `/farm/${farmId}/request-deletion`,
      requestBody
    );

    console.log("✅ Deletion request response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error in requestFarmDeletion:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al enviar solicitud de eliminación"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    enhancedError.code = error.response?.data?.code || error.code;

    throw enhancedError;
  }
};

export const checkDeletionStatus = async (farmId) => {
  try {
    console.log("🔍 Checking deletion status for farmId:", farmId);

    const response = await ApiClient.get(`/farm/${farmId}/deletion-status`);

    console.log("✅ Deletion status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error checking deletion status:", error);

    // Return safe default instead of throwing
    return {
      success: true,
      data: {
        hasRequest: false,
        status: "none",
      },
    };
  }
};

export const deleteFarm = async (farmId) => {
  try {
    console.log("🗑️ Deleting farm with ID:", farmId);

    const response = await ApiClient.delete(`/farm/${farmId}`);

    console.log("✅ Farm deletion response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error deleting farm:", error);

    const enhancedError = new Error(
      error.response?.data?.msg || error.message || "Error al eliminar finca"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    enhancedError.code = error.response?.data?.code || error.code;

    throw enhancedError;
  }
};

export const getFarmById = async (farmId) => {
  try {
    console.log("📋 Fetching farm by ID:", farmId);

    const response = await ApiClient.get(`/farm/list/${farmId}`);

    console.log("✅ Farm fetch response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error fetching farm:", error);
  }
};

export const getFarmPhasesByCrop = async (farmId) => {
  try {
    console.log("📊 Fetching farm phases for crop in farmId:", farmId);

    const response = await ApiClient.get(`/farm/list/active-phases/${farmId}`);

    console.log("✅ Farm phases response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching farm phases:", error);
    throw new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al obtener fases de cultivo"
    );
  }
};

export const manageDeletionRequest = async (
  requestId,
  action,
  adminNotes = null
) => {
  try {
    console.log("🔧 Managing deletion request:", requestId, action);

    const response = await ApiClient.patch(
      `/farm/deletion-requests/${requestId}`,
      {
        action,
        adminNotes,
      }
    );

    console.log("✅ Manage request response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error managing deletion request:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al gestionar solicitud"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

export const listDeletionRequests = async (
  status = "all",
  page = 1,
  limit = 10
) => {
  try {
    console.log("📋 Listing deletion requests");

    const params = new URLSearchParams({
      status,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await ApiClient.get(`/farm/deletion-requests?${params}`);

    console.log("✅ List requests response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error listing deletion requests:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al listar solicitudes"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ Función existente mejorada - Obtener todas las solicitudes de eliminación (para admins)
export const getAllDeletionRequests = async (filters = {}) => {
  try {
    console.log("📋 Fetching all deletion requests with filters:", filters);

    // Construir parámetros de consulta
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/farm/deletion-requests?${queryString}` : '/farm/deletion-requests';

    const response = await ApiClient.get(url);

    console.log("✅ All deletion requests response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error fetching all deletion requests:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al obtener solicitudes de eliminación"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ NUEVA - Obtener solicitudes de eliminación pendientes (versión simplificada para admins)
export const getPendingDeletionRequests = async () => {
  try {
    console.log("⏳ Fetching pending deletion requests");

    const response = await ApiClient.get('/farm/deletion-requests?status=pending');

    console.log("✅ Pending deletion requests response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error fetching pending deletion requests:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al obtener solicitudes pendientes"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ NUEVA - Obtener solicitudes de eliminación por usuario
export const getUserDeletionRequests = async (userId = null) => {
  try {
    let targetUserId = userId;

    // Si no se proporciona userId, obtenerlo del AsyncStorage
    if (!targetUserId) {
      const userData = await AsyncStorage.getItem("@user_data");
      if (userData) {
        const user = JSON.parse(userData);
        targetUserId = user?.id;
      }
    }

    if (!targetUserId) {
      throw new Error("No se pudo obtener el ID del usuario");
    }

    console.log("👤 Fetching deletion requests for user:", targetUserId);

    // Para obtener las solicitudes del usuario, podemos usar el endpoint con filtros
    // o crear una ruta específica en el backend
    const response = await ApiClient.get(`/farm/deletion-requests?userId=${targetUserId}`);

    console.log("✅ User deletion requests response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error fetching user deletion requests:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al obtener solicitudes del usuario"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ NUEVA - Obtener detalles de una solicitud específica
export const getDeletionRequestDetails = async (requestId) => {
  try {
    console.log("🔍 Fetching deletion request details for ID:", requestId);

    const response = await ApiClient.get(`/farm/deletion-requests/${requestId}`);

    console.log("✅ Deletion request details response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error fetching deletion request details:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al obtener detalles de la solicitud"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ MEJORADA - Gestionar solicitud de eliminación con mejor manejo de errores
export const manageDeletionRequestEnhanced = async (requestId, action, adminNotes = null) => {
  try {
    console.log("🔧 Managing deletion request:", { requestId, action, adminNotes });

    // Validar acción
    const validActions = ['approve', 'reject', 'cancel'];
    if (!validActions.includes(action)) {
      throw new Error(`Acción no válida. Use: ${validActions.join(', ')}`);
    }

    const response = await ApiClient.patch(
      `/farm/deletion-requests/${requestId}`,
      {
        action,
        adminNotes: adminNotes || null,
      }
    );

    console.log("✅ Manage request enhanced response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error managing deletion request:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al gestionar solicitud"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;
    enhancedError.code = error.response?.data?.code || error.code;

    throw enhancedError;
  }
};

// ✅ NUEVA - Obtener estadísticas de solicitudes de eliminación (para dashboard admin)
export const getDeletionRequestsStats = async () => {
  try {
    console.log("📊 Fetching deletion requests statistics");

    // Hacer múltiples llamadas para obtener estadísticas
    const [pendingResponse, approvedResponse, rejectedResponse] = await Promise.allSettled([
      ApiClient.get('/farm/deletion-requests?status=pending&limit=1'),
      ApiClient.get('/farm/deletion-requests?status=approved&limit=1'),
      ApiClient.get('/farm/deletion-requests?status=rejected&limit=1'),
    ]);

    const stats = {
      pending: pendingResponse.status === 'fulfilled' ? 
        pendingResponse.value?.data?.data?.pagination?.total || 0 : 0,
      approved: approvedResponse.status === 'fulfilled' ? 
        approvedResponse.value?.data?.data?.pagination?.total || 0 : 0,
      rejected: rejectedResponse.status === 'fulfilled' ? 
        rejectedResponse.value?.data?.data?.pagination?.total || 0 : 0,
    };

    stats.total = stats.pending + stats.approved + stats.rejected;

    console.log("✅ Deletion requests stats:", stats);
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("💥 Error fetching deletion requests stats:", error);

    return {
      success: false,
      data: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      }
    };
  }
};

// ✅ NUEVA - Cancelar solicitud de eliminación (para usuarios)
export const cancelDeletionRequest = async (farmId) => {
  try {
    console.log("❌ Canceling deletion request for farmId:", farmId);

    const response = await ApiClient.delete(`/farm/${farmId}/request-deletion`);

    console.log("✅ Cancel deletion request response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error canceling deletion request:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al cancelar solicitud"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ NUEVA - Búsqueda y filtrado avanzado de solicitudes
export const searchDeletionRequests = async (searchParams = {}) => {
  try {
    console.log("🔍 Searching deletion requests with params:", searchParams);

    const params = new URLSearchParams();

    // Filtros disponibles
    if (searchParams.status) params.append('status', searchParams.status);
    if (searchParams.farmName) params.append('farmName', searchParams.farmName);
    if (searchParams.userEmail) params.append('userEmail', searchParams.userEmail);
    if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
    if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
    if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder);

    const response = await ApiClient.get(`/farm/deletion-requests?${params.toString()}`);

    console.log("✅ Search deletion requests response:", response.data);
    return response.data;
  } catch (error) {
    console.error("💥 Error searching deletion requests:", error);

    const enhancedError = new Error(
      error.response?.data?.msg ||
        error.message ||
        "Error al buscar solicitudes"
    );
    enhancedError.status = error.response?.status || error.status || 500;
    enhancedError.data = error.response?.data || error.data;

    throw enhancedError;
  }
};

// ✅ NUEVA - Función de utilidad para formatear solicitudes para el frontend
export const formatDeletionRequestsForDisplay = (requests) => {
  try {
    return requests.map(request => ({
      id: request.id,
      farmId: request.farmId,
      farmName: request.farm?.name || 'Finca sin nombre',
      farmSize: request.farm?.size || 0,
      userName: request.user ? `${request.user.name} ${request.user.lastname}`.trim() : 'Usuario desconocido',
      userEmail: request.user?.email || 'Sin email',
      status: request.status?.toLowerCase() || 'unknown',
      reason: request.reason || 'Sin razón especificada',
      adminNotes: request.adminNotes || null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      processedAt: request.processedAt,
      // Campos calculados para la UI
      statusDisplay: getStatusDisplayText(request.status),
      statusColor: getStatusColor(request.status),
      timeAgo: calculateTimeAgo(request.createdAt),
      canBeProcessed: request.status?.toLowerCase() === 'pending',
    }));
  } catch (error) {
    console.error("Error formatting deletion requests:", error);
    return [];
  }
};

const getStatusDisplayText = (status) => {
  const statusMap = {
    'pending': 'Pendiente',
    'approved': 'Aprobada',
    'rejected': 'Rechazada',
    'cancelled': 'Cancelada',
  };
  return statusMap[status?.toLowerCase()] || 'Desconocido';
};

const getStatusColor = (status) => {
  const colorMap = {
    'pending': '#F59E0B', // warning
    'approved': '#10B981', // success
    'rejected': '#EF4444', // error
    'cancelled': '#6B7280', // gray
  };
  return colorMap[status?.toLowerCase()] || '#6B7280';
};

const calculateTimeAgo = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    return `Hace ${Math.floor(diffInDays / 30)} meses`;
  } catch (error) {
    return 'Fecha inválida';
  }
};