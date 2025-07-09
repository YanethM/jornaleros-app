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

export const extractCropTypesFromOptimizedResponse = (responseData) => {
  if (!responseData || !responseData.cultivos) {
    console.warn('⚠️ No hay datos de cultivos en la respuesta');
    return [];
  }

  const extractedCropTypes = responseData.cultivos.map(({ cultivo, fasesActivas, totalFases }) => ({
    id: cultivo.id,
    name: cultivo.name,
    phases: fasesActivas || [],
    phasesCount: totalFases || 0,
    hasActivePhases: totalFases > 0
  }));

  console.log(`🌱 Cultivos extraídos: ${extractedCropTypes.length}`);
  extractedCropTypes.forEach((ct, index) => {
    console.log(`  ${index + 1}. ${ct.name}: ${ct.phasesCount} fases`);
  });

  return extractedCropTypes;
};

export async function createCropType(cropTypeData) {
  try {
    console.log("Creating new crop type...", cropTypeData);
    
    const result = await ApiClient.post("/crop-type", cropTypeData);
    
    console.log("Crop Type created:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error creating crop type:", error);
    
    // Manejar errores específicos
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const { status, data } = error.response;
      
      if (status === 400 && data.msg) {
        throw new Error(data.msg);
      }
      
      if (status === 500) {
        throw new Error("Error interno del servidor. Por favor, inténtelo de nuevo más tarde.");
      }
    }
    
    throw error;
  }
}

export async function deleteCropType(cropTypeId) {
  try {
    console.log("Deleting crop type with ID:", cropTypeId);
    
    const result = await ApiClient.delete(`/crop-type/delete/${cropTypeId}`);
    
    console.log("Crop Type deleted:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error deleting crop type:", error);
    
    // Manejar errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 404) {
        throw new Error("Tipo de cultivo no encontrado.");
      }
      
      if (status === 500) {
        throw new Error("Error interno del servidor. Por favor, inténtelo de nuevo más tarde.");
      }
    }
    
    throw error;
  }
}