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

export const getApprovedWorkersByEmployer = async (employerId) => {
  try {
    const response = await ApiClient.get(`/employer/${employerId}/approved-workers`);
    return response;
  } catch (error) {
    console.error('Error fetching approved workers by employer ID:', error);
    throw error;
  }
};


export const acceptApplication = async (applicationId, employerId, message = null) => {
  try {
    console.log("=== SERVICIO: ACEPTANDO APLICACIÓN ===");
    console.log("Application ID:", applicationId);
    console.log("Employer ID:", employerId);
    console.log("Message:", message);
    console.log("=====================================");

    const requestData = {
      employerId,
      ...(message && { message })
    };

    const response = await ApiClient.post(`/employer/applications/${applicationId}/accept`, requestData);

    return response.data;
  } catch (error) {
    console.error("=== SERVICIO: ERROR ACEPTANDO APLICACIÓN ===");
    console.error("Application ID:", applicationId);
    console.error("Error:", error);
    console.error("Response data:", error.response?.data);
    throw error;
  }
};

export const rejectApplication = async (applicationId, employerId, reason = null) => {
  try {
    console.log("=== SERVICIO: RECHAZANDO APLICACIÓN ===");
    console.log("Application ID:", applicationId);
    console.log("Employer ID:", employerId);
    console.log("Reason:", reason);
    console.log("======================================");

    const requestData = {
      employerId,
      ...(reason && { reason })
    };

    const response = await ApiClient.post(`/applications/${applicationId}/reject`, requestData);

    console.log("=== SERVICIO: APLICACIÓN RECHAZADA ===");
    console.log("Success:", response.data.success);
    console.log("Worker:", response.data.data?.application?.worker?.name, response.data.data?.application?.worker?.lastname);
    console.log("Reason:", response.data.data?.application?.reason);
    console.log("=====================================");

    return response.data;
  } catch (error) {
    console.error("=== SERVICIO: ERROR RECHAZANDO APLICACIÓN ===");
    console.error("Application ID:", applicationId);
    console.error("Error:", error);
    console.error("Response data:", error.response?.data);
    console.error("Response status:", error.response?.status);
    console.error("============================================");
    throw error;
  }
};

export const getApplicationHistory = async (applicationId) => {
  try {
    console.log("=== SERVICIO: OBTENIENDO HISTORIAL ===");
    console.log("Application ID:", applicationId);
    console.log("=====================================");

    const response = await ApiClient.get(`/applications/${applicationId}/history`);

    console.log("=== SERVICIO: HISTORIAL OBTENIDO ===");
    console.log("Success:", response.data.success);
    console.log("Current status:", response.data.data?.application?.currentStatus);
    console.log("History entries:", response.data.data?.application?.history?.length || 0);
    console.log("Worker:", response.data.data?.application?.worker?.name, response.data.data?.application?.worker?.lastname);
    console.log("Job:", response.data.data?.application?.jobOffer?.title);
    console.log("===================================");

    return response.data;
  } catch (error) {
    console.error("=== SERVICIO: ERROR HISTORIAL ===");
    console.error("Application ID:", applicationId);
    console.error("Error:", error);
    console.error("Response data:", error.response?.data);
    console.error("Response status:", error.response?.status);
    console.error("================================");
    throw error;
  }
};
