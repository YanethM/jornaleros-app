import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiClient from "../utils/api";

export async function getAvailableWorkers() {
  try {
    const result = await ApiClient.get(`/worker/list/available`);
    console.log("Available workers by employer ID response:", result.data);

    return result.data;
  } catch (error) {
    console.error("Error fetching available workers by employer ID:", error);
    throw error;
  }
}

export async function getWorkerApplications(workerId: string) {
  try {
    const result = await ApiClient.get(`/worker/${workerId}/application`);
    console.log("Worker applications response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching worker applications:", error);
    throw error;
  }
}

export async function getRecommendedJobOffers(workerId: string) {
  try {
    const result = await ApiClient.get(`/worker/${workerId}/recommended-jobs`);
    console.log("Recommended job offers response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching recommended job offers:", error);
    throw error;
  }
}

export const getWorkerById = async (id) => {
  try {
    const response = await ApiClient.get(`/worker/complete/${id}`); // o la ruta correspondiente
    console.log("Raw API response:", response.data); // Agrega este log
    return response.data;
  } catch (error) {
    console.error("Error in getWorkerById:", error);
    throw error;
  }
};

export async function getWorkerProfile(workerId: string) {
  const controller = new AbortController();

  try {
    const token = await AsyncStorage.getItem("@user_token");

    const response = await ApiClient.get(`/worker/${workerId}`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
console.log("Worker profile response:", response.data);

    if (!response.data) {
      console.warn("Empty server response");
      return getDefaultWorkerProfile();
    }

    return normalizeWorkerProfile(response.data);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    return getDefaultWorkerProfile();
  }
}

// Función para obtener un perfil por defecto
function getDefaultWorkerProfile() {
  return {
    id: "default",
    name: "Trabajador",
    skills: [],
    experience: 0,
    rating: 0,
    location: "Desconocida",
    available: false,
    isDefault: true, // Bandera para identificar perfiles por defecto
  };
}

// Función para normalizar los datos del trabajador
function normalizeWorkerProfile(data) {
  return {
    id: data.id || "default",
    name: data.name || "Trabajador",
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Number(data.experience) || 0,
    rating: Number(data.rating) || 0,
    location: data.location || "Desconocida",
    available: Boolean(data.available),
    isDefault: false,
  };
}
export async function getWorkersByEmployerId(employerId: string) {
  try {
    const result = await ApiClient.get(`/worker/list/${employerId}`);
    console.log("Workers by employer ID response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching workers by employer ID:", error);
    throw error;
  }
}

export async function getWorkerSkills(workerId: string) {
  try {
    const result = await ApiClient.get(`/worker/${workerId}/skills`);
    console.log("Worker skills response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching worker skills:", error);
    throw error;
  }
}

export async function getWorkerReviews(workerId: string) {
  try {
    const result = await ApiClient.get(`/worker/${workerId}/reviews`);
    console.log("Worker reviews response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching worker reviews:", error);
    throw error;
  }
}

export async function addWorkerSkill(
  workerId: string,
  data: {
    cropTypeId: string;
    experienceLevel?: string;
    yearsOfExperience?: number;
    certified?: boolean;
  }
) {
  try {
    const payload = {
      cropTypeId: data.cropTypeId,
      experienceLevel: data.experienceLevel || "Básico",
      yearsOfExperience: data.yearsOfExperience || 0,
      certified: data.certified || false,
    };

    const result = await ApiClient.post(`/worker/${workerId}/skills`, payload);
    return result.data;
  } catch (error) {
    console.error("Error adding worker skill:", error);
    throw new Error(
      error.response?.data?.msg || "Error al agregar la habilidad"
    );
  }
}

export const removeWorkerSkill = async (skillId: string) => {
  try {
    const response = await ApiClient.delete(`/worker/skills/${skillId}`);
    console.log(`/worker/skills/${skillId}`);

    console.log("API DELETE success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API DELETE error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Unknown error" };
  }
};

export async function updateWorkerProfile(workerId: string, data: any) {
  try {
    const result = await ApiClient.put(`/worker/${workerId}`, data);
    console.log("Worker profile updated response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error updating worker profile:", error);
    throw error;
  }
}

export async function getAvailableWorkersByEmployerCountry() {
  try {
    console.log("🔍 Calling getAvailableWorkersByEmployerCountry:");
    // Asegurar que la URL sea correcta
    const result = await ApiClient.get(`/worker/available-by-country`);
    console.log("✅ Available workers by employer country response:", result);
    console.log("📊 Response data structure:", {
      status: result.status,
      dataKeys: result.data ? Object.keys(result.data) : "No data",
      // ✅ CORRECCIÓN: Acceder a result.data.data.workers
      workersCount: result.data?.data?.workers?.length || 0,
    });

    // ✅ CORRECCIÓN: Manejar la estructura de respuesta correcta
    if (result.data && result.data.success && result.data.data) {
      // Los datos están en result.data.data, no en result.data
      const responseData = result.data.data;

      return {
        workers: responseData.workers || [],
        total: responseData.total || 0,
        employerCountry: responseData.employerCountry || "No especificado",
      };
    } else if (result.status === 200) {
      return {
        workers: [],
        total: 0,
        employerCountry: "No especificado",
      };
    } else {
      throw new Error(`Respuesta inesperada del servidor: ${result.status}`);
    }
  } catch (error) {
    console.error(
      "❌ Error fetching available workers by employer country:",
      error
    );
    // Log más detallado del error
    if (error.response) {
      console.error("📋 Error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error("🌐 Network error - no response received:", error.request);
    } else {
      console.error("⚙️ Request setup error:", error.message);
    }
    // Throw con información más específica
    throw {
      message:
        error.response?.data?.msg || error.message || "Error de conexión",
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };
  }
}


export async function getWorkerEmployers(workerId: string){
  try {
    const result = await ApiClient.get(`/worker/${workerId}/employers`);
    console.log("Worker employers response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching worker employers:", error);
    throw error;
  }
}

export async function getWorkerEmployersSimple(workerId: string) {
  try {
    const result = await ApiClient.get(`/worker/${workerId}/employers/simple`);
    console.log("Worker employers simple response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching worker employers (simple):", error);
    throw error;
  }
}

export async function getMyApplications() {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const result = await ApiClient.get(`/worker/me/applications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("My applications response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching my applications:", error);
    throw error;
  }
}

export async function getMyAcceptedApplications() {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const result = await ApiClient.get(`/worker/me/applications/accepted`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("My applications response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching my applications:", error);
    throw error;
  }
}