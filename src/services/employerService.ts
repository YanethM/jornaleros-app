import ApiClient from "../utils/api";

export async function getEmployers() {
  try {
    const result = await ApiClient.get("/employer");
    console.log("Employer response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching employers:", error);
    throw error;
  }
}

export async function getEmployerById(employerId) {
  try {
    const result = await ApiClient.get(`/employer/${employerId}`);
    console.log("Employer response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching employer by ID:", error);
    throw error;
  }
}

export async function getWorkersByEmployerId(employerId) {
  try {
    const result = await ApiClient.get(`/employer/${employerId}/workers`);
    console.log("Workers response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching workers by employer ID:", error);
    throw error;
  }
}

export const updateEmployerProfile = async (employerProfileId, updateData) => {
  try {
    console.log("=== SERVICIO: ENVIANDO DATOS ===");
    console.log("URL:", `/api/employer-profiles/${employerProfileId}`);
    console.log("Datos a enviar:", updateData);
    console.log("===============================");

    // Validar que los datos requeridos no estén vacíos
    if (!updateData.phone || updateData.phone.trim() === '') {
      throw new Error("El teléfono no puede estar vacío");
    }
    if (!updateData.organization || updateData.organization.trim() === '') {
      throw new Error("La organización no puede estar vacía");
    }

    const response = await ApiClient.put(`/employer/${employerProfileId}`, updateData);
    
    console.log("=== SERVICIO: RESPUESTA RECIBIDA ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    console.log("Usuario actualizado:", {
      phone: response.data.user?.phone,
      organization: response.data.organization,
      // Ubicación se mantiene
      country: response.data.user?.country?.name,
      departmentState: response.data.user?.departmentState?.name,
      city: response.data.user?.city?.name
    });
    console.log("===================================");

    return response.data;
  } catch (error) {
    console.error("=== SERVICIO: ERROR ===");
    console.error("Error:", error);
    console.error("Response data:", error.response?.data);
    console.error("Response status:", error.response?.status);
    console.error("Request data:", error.config?.data);
    console.error("======================");
    
    throw error;
  }
};
