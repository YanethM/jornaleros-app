import ApiClient from "../utils/api";


interface GetJobOffersWithApplicationsParams {
  page?: number;
  limit?: number;
  status?: 'Activo' | 'Inactivo' | 'En_curso' | 'Finalizado';
  sortBy?: 'createdAt' | 'title' | 'salary' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
}

export interface JobOfferFilters {
  cropType?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  includesLodging?: boolean;
  includesFood?: boolean;
  startDate?: string;
  endDate?: string;
  phase?: string;
  duration?: string;
}

export interface JobOfferCreateData {
  title: string;
  description: string;
  salary: number;
  city: string;
  state: string;
  country: string;
  village?: string;
  farmId: string;
  cropTypeId: string;
  phaseId: string;
  startDate: string;
  endDate: string;
  duration: string;
  paymentType: string;
  paymentMode: string;
  includesFood: boolean;
  includesLodging: boolean;
  workersNeeded: number;
}

export async function getJobOffersByEmployerId(employerId: string) {
  try {
    const result = await ApiClient.get(
      `/job-offer/list-by-employer/${employerId}`
    );
    console.log("Job offers by employer ID response:", result.data);

    return result.data;
  } catch (error) {
    console.error("Error fetching job offers by employer ID:", error);
    throw error;
  }
}

export async function getJobOfferById(jobOfferId: string) {
  try {
    const result = await ApiClient.get(`/job-offer/${jobOfferId}`);
    console.log("Job offer response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching job offer by ID:", error);
    throw error;
  }
}

export async function editJobOfferById(jobOfferId: string, data: any) {
  try {
    const result = await ApiClient.put(`/job-offer/${jobOfferId}`, data);
    console.log("Job offer edited response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error editing job offer by ID:", error);
    throw {
      message:
        error.response?.data?.msg || error.message || "Error desconocido",
      status: error.response?.status,
      data: error.response?.data,
    };
  }
}

export async function deleteJobOfferById(jobOfferId: string) {
  try {
    const result = await ApiClient.delete(`/job-offer/${jobOfferId}`);
    console.log("Job offer deleted response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error deleting job offer by ID:", error);
    throw error;
  }
}

export async function changeStatusJobOfferById(
  jobOfferId: string,
  status: string
) {
  try {
    const result = await ApiClient.put(`/job-offer/status/${jobOfferId}`, {
      status,
    });
    console.log("Job offer status changed response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error changing job offer status by ID:", error);
    throw error;
  }
}

export async function getActiveJobOffersByLoggedEmployerId() {
  try {
    const result = await ApiClient.get(`/job-offer/active-by-employer`);
    console.log(
      "Active job offers by logged employer ID response:",
      result.data
    );
    return result.data;
  } catch (error) {
    console.error(
      "Error fetching active job offers by logged employer ID:",
      error
    );
    throw error;
  }
}

export async function getAvailableJobOffers() {
  try {
    const result = await ApiClient.get(`/job-offer/available`);
    console.log("Available job offers response:", result.data);

    // ✅ Solo agrega esta línea para extraer jobOffers
    return result.data.jobOffers || [];
  } catch (error) {
    console.error("Error fetching available job offers:", error);
    throw error;
  }
}

export async function getAvailableJobOffersNoAuth() {
  try {
    const result = await ApiClient.get(`/job-offer/public/available`);
    console.log("Available job offers response:", result.data);
    return result.data.jobOffers || [];
  } catch (error) {
    console.error("Error fetching public available job offers:", error);
    throw error;
  }
}

export async function getJobOfferByIdNoAuth(jobOfferId: string) {
  try {
    const result = await ApiClient.get(`/job-offer/public/${jobOfferId}`);
    console.log("Job offer response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching job offer by ID:", error);
    throw error;
  }
}

export async function getJobOffersWithApplications(
  params?: GetJobOffersWithApplicationsParams
) {
  try {
    // Construir query string con parámetros
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/job-offer/with-applications${queryString ? `?${queryString}` : ''}`;
    
    const result = await ApiClient.get(url);
    console.log("Job offers with applications response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching job offers with applications:", error);
    throw error;
  }
}

export async function getJobOffersApplicationsStats() {
  try {
    const result = await ApiClient.get('/job-offer/applications-stats');
    console.log("Job offers applications stats response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching job offers applications stats:", error);
    throw error;
  }
}

export async function getAvailableJobOffersForWorker(filters = {}) {
  try {
    const result = await ApiClient.get(`/job-offer/available-for-worker`, {
      params: filters
    });
    
    console.log("Available job offers for worker response:", result.data);
    
    // 🔥 CORRECCIÓN: Devolver la estructura completa, no solo jobOffers
    return result.data;
    
  } catch (error) {
    console.error("Error fetching available-for-worker job offers for worker:", error);
    throw error;
  }
}