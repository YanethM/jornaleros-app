import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL;
};

export async function getCultivationPhasesByCropId(cropId: string) {
  const apiUrl = getApiUrl();
  const CROP_PHASES_API_URL = `${apiUrl}/phase/by-crop/${cropId}`;
  console.log("Crop Phases API URL:", CROP_PHASES_API_URL);

  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const response = await fetch(CROP_PHASES_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("Cultivation Phases:", data);
    return data;
  } catch (error) {
    console.error("Error fetching cultivation phases by crop ID:", error);
    throw error;
  }
}

export async function getCultivationPhaseById(phaseId: string) {
  const apiUrl = getApiUrl();
  const CROP_PHASES_API_URL = `${apiUrl}/phase/list/${phaseId}`;
  console.log("Crop Phases API URL:", CROP_PHASES_API_URL);

  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const response = await fetch(CROP_PHASES_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("Cultivation Phase:", data);
    return data;
  } catch (error) {
    console.error("Error fetching cultivation phase by ID:", error);
    throw error;
  }
}

export async function updateCultivationPhase(phaseId: string, phaseData: any) {
  const apiUrl = getApiUrl();
  const CROP_PHASES_API_URL = `${apiUrl}/phase/update/${phaseId}`;
  console.log("Update Crop Phase API URL:", CROP_PHASES_API_URL);

  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const response = await fetch(CROP_PHASES_API_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(phaseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    const data = await response.json();
    console.log("Updated Cultivation Phase:", data);
    return data;
  } catch (error) {
    console.error("Error updating cultivation phase:", error);
    throw error;
  }
}

export async function deleteCultivationPhase(phaseId: string) {
  const apiUrl = getApiUrl();
  const CROP_PHASES_API_URL = `${apiUrl}/phase/delete/${phaseId}`;
  console.log("Delete Crop Phase API URL:", CROP_PHASES_API_URL);

  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }

    const response = await fetch(CROP_PHASES_API_URL, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        response: errorData,
      };
    }

    console.log("Cultivation phase deleted successfully");
  } catch (error) {
    console.error("Error deleting cultivation phase:", error);
    throw error;
  }
}