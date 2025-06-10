import ApiClient from "../utils/api";

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
    console.error("Error fetching available job offers:", error);
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
