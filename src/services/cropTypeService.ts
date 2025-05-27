import ApiClient from "../utils/api";

export async function getCropType() {
  try {
    const result = await ApiClient.get("/crop-type");
    
    console.log("Crop Type:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching crop type:", error);
    throw error;
  }
}

export async function getCropTypeById(cropTypeId) {
  try {
    console.log("Fetching crop type by ID...");
    
    const result = await ApiClient.get(`/crop-type/${cropTypeId}`);
    
    console.log("Crop Type:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching crop type by ID:", error);
    throw error;
  }
}