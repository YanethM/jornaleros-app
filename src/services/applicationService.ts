import ApiClient from "../utils/api";

export async function createApplication(jobOfferId, applicationData) {
  try {
    console.log("📝 Creating application for job:", jobOfferId);
    console.log("📋 Application data:", applicationData);
    
    // Estructura de datos mejorada para la aplicación
    const payload = {
      jobOfferId: jobOfferId,
      userId: applicationData.userId,
      // Incluir workerId si está disponible
      ...(applicationData.workerId && { workerId: applicationData.workerId }),
      // Otros campos opcionales
      coverLetter: applicationData.coverLetter || null,
      additionalInfo: applicationData.additionalInfo || null,
    };
    
    console.log("📤 Sending application payload:", payload);
    const result = await ApiClient.post(`/application/${jobOfferId}`, payload);
    console.log("✅ Application created successfully:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ Error creating application:", error);
    throw error;
  }
}

// 🔥 Función para obtener aplicaciones por job offer
export async function getApplicationsByJobOffer(jobOfferId) {
  try {
    const result = await ApiClient.get(`/application/job/${jobOfferId}`);
    return result.data || [];
  } catch (error) {
    console.error("Error fetching applications by job offer:", error);
    if (error.status === 404 || error.response?.status === 404) {
      return []; // Retornar array vacío si no hay aplicaciones
    }
    throw error;
  }
}

// 🔥 Función para obtener una aplicación específica
export async function getApplicationById(applicationId) {
  try {
    const result = await ApiClient.get(`/application/${applicationId}`);
    return result.data;
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    throw error;
  }
}

// 🔥 Función para actualizar estado de aplicación
export async function updateApplicationStatus(applicationId, status) {
  try {
    const result = await ApiClient.put(`/application/${applicationId}/status`, {
      status
    });
    return result.data;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}

// 🔥 Función para eliminar aplicación
export async function deleteApplication(applicationId) {
  try {
    const result = await ApiClient.delete(`/application/${applicationId}`);
    return result.data;
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
}

// 🔥 Función para obtener aplicaciones por usuario (método alternativo)
export async function getApplicationByUser(userId) {
  try {
    console.log("Fetching applications for user:", userId);
    const result = await ApiClient.get(`/application/worker/${userId.workerProfile.id}`);
    console.log("Applications by user response:", result.data);
    return result.data || [];
  } catch (error) {
    console.error("Error fetching applications by user:", error);
    
    // Si es error 404, significa que el usuario no tiene aplicaciones
    // Esto es un estado normal, no un error
    if (error.status === 404 || error.response?.status === 404) {
      console.log("No applications found for user (404) - returning empty array");
      return []; // Usuario sin aplicaciones
    }
    
    // Para otros errores, sí propagamos el error
    throw error;
  }
}

export async function cancelApplication(applicationId) {
  try {
    console.log("Canceling application with ID:", applicationId);
    const result = await ApiClient.delete(`/application/${applicationId}`);
    console.log("Application canceled response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error canceling application:", error);
    throw error;
  }
}

// 🔥 Nueva función auxiliar para verificar si existe una aplicación específica
export async function checkUserApplicationForJob(userId, jobOfferId) {
  try {
    const userApplications = await getApplicationByUser(userId);
    
    // Buscar aplicación específica para este trabajo
    const existingApplication = userApplications.find(app => {
      const appJobId = app.jobOfferId || app.jobOffer?.id || app.jobOffer?._id;
      return appJobId === jobOfferId;
    });
    
    return existingApplication || null;
  } catch (error) {
    console.error("Error checking user application for job:", error);
    return null;
  }
}