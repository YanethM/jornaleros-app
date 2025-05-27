import ApiClient from "../utils/api";

export async function createApplication(jobOfferId: string, data: any) {
  try {
    const result = await ApiClient.post(`/application/${jobOfferId}`, data);
    console.log("Application created response:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
}

export async function cancelApplication(
    applicationId: string
  ) {
    try {
      const result = await ApiClient.delete(
        `/application/${applicationId}`
      );
      console.log("Application canceled response:", result.data);
      return result.data;
    } catch (error) {
      console.error("Error canceling application:", error);
      throw error;
    }
  }