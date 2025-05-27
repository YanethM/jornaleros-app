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