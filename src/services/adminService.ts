import ApiClient from "../utils/api";

export async function getAdminDashboardStats() {
  try {
    const result = await ApiClient.get("/admin/dashboard-stats");
    return result.data;
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
}

// Estadísticas generales para el dashboard de reportes
export async function getGeneralStats() {
  try {
    const result = await ApiClient.get("/admin/reports/general-stats");
    return result.data;
  } catch (error) {
    console.error("Error fetching general stats:", error);
    throw error;
  }
}

// Reporte de postulaciones
export async function getApplicationsReport(filters = {}) {
  try {
    const result = await ApiClient.get("/admin/reports/applications", {
      params: filters
    });
    return result.data;
  } catch (error) {
    console.error("Error fetching applications report:", error);
    throw error;
  }
}

// Reporte de gestión de fincas
export async function getFarmsReport(filters = {}) {
  try {
    const result = await ApiClient.get("/admin/reports/farms", {
      params: filters
    });
    return result.data;
  } catch (error) {
    console.error("Error fetching farms report:", error);
    throw error;
  }
}

// Reporte de rendimiento de personal
export async function getWorkersReport(filters = {}) {
  try {
    const result = await ApiClient.get("/admin/reports/workers", {
      params: filters
    });
    return result.data;
  } catch (error) {
    console.error("Error fetching workers report:", error);
    throw error;
  }
}

// Reporte de análisis de cultivos
export async function getCropsReport(filters = {}) {
  try {
    const result = await ApiClient.get("/admin/reports/crops", {
      params: filters
    });
    return result.data;
  } catch (error) {
    console.error("Error fetching crops report:", error);
    throw error;
  }
}

// Reporte de trabajadores con calificaciones bajas
export async function getLowRatedWorkersReport(filters = {}) {
  try {
    const result = await ApiClient.get("/admin/reports/low-rated-workers", {
      params: filters
    });
    return result.data;
  } catch (error) {
    console.error("Error fetching low rated workers report:", error);
    throw error;
  }
}

// Exportar reporte
export async function exportReport(reportData) {
  try {
    const result = await ApiClient.post("/admin/reports/export", reportData);
    return result.data;
  } catch (error) {
    console.error("Error exporting report:", error);
    throw error;
  }
}