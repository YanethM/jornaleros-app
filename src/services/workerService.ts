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
    const result = await ApiClient.get(`/worker/${workerId}/applications`);
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


export async function getWorkerProfile(workerId: string) {
  try {

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Tiempo de espera agotado")), 10000)
    );

    const result = await Promise.race([
      ApiClient.get(`/worker/${workerId}`),
      timeoutPromise
    ]);

    console.log("Worker response:", result.data);
    
    // Validar y normalizar la respuesta
    if (!result.data) {
      throw new Error("Respuesta vacía del servidor");
    }

    return normalizeWorkerProfile(result.data);
  } catch (error) {
    console.error("Error fetching worker by ID:", error);
    
    // Crear perfil por defecto para mantener la UI funcional
    if (error.message.includes("No hay conexión") || 
        error.message.includes("Tiempo de espera")) {
      return getDefaultWorkerProfile();
    }
    
    throw error;
  }
}

function normalizeWorkerProfile(profileData) {
  return {
    ...profileData,
    bio: profileData.bio || "",
    experienceYears: profileData.experienceYears || 0,
    hourlyRate: profileData.hourlyRate || 0,
    availability: profileData.availability !== false,
    user: {
      name: profileData.user?.name || "",
      lastname: profileData.user?.lastname || "",
      email: profileData.user?.email || "",
      phone: profileData.user?.phone || "",
      city: profileData.user?.city || "",
      departmentState: profileData.user?.departmentState || "",
    }
  };
}

function getDefaultWorkerProfile() {
  return {
    bio: "",
    experienceYears: 0,
    hourlyRate: 0,
    availability: true,
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    user: {
      name: "",
      lastname: "",
      email: "",
      phone: "",
      city: "",
      departmentState: ""
    }
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
      certified: data.certified || false
    };

    const result = await ApiClient.post(`/worker/${workerId}/skills`, payload);
    return result.data;
  } catch (error) {
    console.error("Error adding worker skill:", error);
    throw new Error(error.response?.data?.msg || "Error al agregar la habilidad");
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