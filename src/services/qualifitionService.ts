import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiClient from "../utils/api";

export const getQualificationQuestionsByRole = async (
  roleType = "Trabajador"
) => {
  try {
    const response = await ApiClient.get(`/qualification/role/${roleType}`);
    console.log("Qualification questions API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching qualification questions:", error);
    throw error;
  }
};

export const deleteQualificationQuestion = async (questionId) => {
  try {
    console.log("Deleting qualification question with ID:", questionId);
    const response = await ApiClient.delete(
      `/qualification/delete-question/${questionId}`
    );
    console.log("Qualification question deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting qualification question:", error);
    throw error;
  }
}

export const getQualificationQuestionsByEmployer = async (
  roleType = "Productor"
) => {
  try {
    const response = await ApiClient.get(`/qualification/role/${roleType}`);
    console.log("Qualification questions API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching qualification questions:", error);
    throw error;
  }
};

export const createQualificationQuestion = async (questionData) => {
  try {
    console.log("Creating qualification question with data:", questionData);
    const response = await ApiClient.post(
      "/qualification/create-question",
      questionData
    );
    console.log("Qualification question created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating qualification question:", error);
    throw error;
  }
};

export const getAllQuestions = async () => {
  try {
    const response = await ApiClient.get("/qualification/list-question");
    console.log("All qualification questions API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all qualification questions:", error);
    throw error;
  }
};

export const createQualification = async (qualificationData) => {
  try {
    console.log("Creating qualification with data:", qualificationData);
    const response = await ApiClient.post(
      "/qualification/create-rating",
      qualificationData
    );
    console.log("Qualification created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating qualification:", error);
    throw error;
  }
};

export const getWorkerAverageRating = async (workerId) => {
  try {
    const response = await ApiClient.get(
      `/qualification/average-rating/${workerId}`
    );
    console.log("Worker average rating response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching worker average rating:", error);
    throw error;
  }
};

export const getQualificationsByProfile = async (
  profileId,
  type = "worker"
) => {
  try {
    const response = await ApiClient.get(
      `/qualification/profile/${profileId}?type=${type}`
    );
    console.log("Profile qualifications response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching profile qualifications:", error);
    throw error;
  }
};

export const checkWorkerRating = async (workerProfileId) => {
  try {
    const response = await ApiClient.get(
      `/qualification/check-rating/${workerProfileId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking worker rating:", error);
    throw error;
  }
};

export const getMyEmployers = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const response = await ApiClient.get(`/worker/me/employers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("My employers response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my employers:", error);
    throw error;
  }
};

export const getMyRating = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const workerProfileId = user.workerProfile?.id;

    if (!workerProfileId) {
      throw new Error("El usuario no tiene perfil de trabajador");
    }

    const response = await ApiClient.get(
      `/qualification/average-rating/${workerProfileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My rating response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my rating:", error);
    throw error;
  }
};

/**
 * Obtiene las calificaciones detalladas del usuario logueado
 */
export const getMyDetailedRating = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const workerProfileId = user.workerProfile?.id;

    if (!workerProfileId) {
      throw new Error("El usuario no tiene perfil de trabajador");
    }

    // Usando la nueva ruta detallada
    const response = await ApiClient.get(
      `/qualification/rating/${workerProfileId}/detailed`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My detailed rating response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my detailed rating:", error);
    throw error;
  }
};

/**
 * Obtiene estadísticas rápidas de calificación del usuario logueado
 */
export const getMyQuickRatingStats = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const workerProfileId = user.workerProfile?.id;

    if (!workerProfileId) {
      return {
        success: true,
        data: {
          hasRatings: false,
          averageRating: 0,
          totalRatings: 0,
          message: "No tiene perfil de trabajador",
        },
      };
    }

    const response = await ApiClient.get(
      `/qualification/rating/${workerProfileId}/quick`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My quick rating stats response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my quick rating stats:", error);
    throw error;
  }
};

/**
 * Obtiene todas las calificaciones recibidas por el usuario logueado
 */
export const getMyQualifications = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const workerProfileId = user.workerProfile?.id;

    if (!workerProfileId) {
      throw new Error("El usuario no tiene perfil de trabajador");
    }

    const response = await ApiClient.get(
      `/qualification/profile/${workerProfileId}?type=worker`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My qualifications response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my qualifications:", error);
    throw error;
  }
};

export const checkMyRatingStatus = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const workerProfileId = user.workerProfile?.id;

    if (!workerProfileId) {
      return {
        success: true,
        data: {
          alreadyRated: false,
          hasWorkerProfile: false,
          message: "No tiene perfil de trabajador",
        },
      };
    }

    const response = await ApiClient.get(
      `/qualification/check-rating/${workerProfileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My rating status response:", response.data);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        hasWorkerProfile: true,
      },
    };
  } catch (error) {
    console.error("Error checking my rating status:", error);
    throw error;
  }
};

export const hasEmployerProfile = async () => {
  try {
    const userData = await AsyncStorage.getItem("@user_data");

    if (!userData) {
      return false;
    }

    const user = JSON.parse(userData);
    return !!user.employerProfile?.id;
  } catch (error) {
    console.error("Error checking employer profile:", error);
    return false;
  }
};

export const getMyEmployerQuickRatingStats = async (userId) => {
  try {
    const response = await ApiClient.get(
      `/qualification/users/${userId}/rating/quick`
    );
    return {
      success: true,
      data: {
        hasRatings: response.data.totalRatings > 0,
        averageRating: response.data.averageRating || 0,
        totalRatings: response.data.totalRatings || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching employer rating stats:", error);
    return {
      success: false,
      data: {
        error: error.message,
      },
    };
  }
};
/**
 * Obtiene las calificaciones detalladas del empleador logueado
 */
export const getMyEmployerDetailedRating = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const employerProfileId = user.employerProfile?.id;

    if (!employerProfileId) {
      throw new Error("El usuario no tiene perfil de empleador");
    }

    const response = await ApiClient.get(
      `/qualification/employer/${employerProfileId}/detailed`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My employer detailed rating response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my employer detailed rating:", error);
    throw error;
  }
};

/**
 * Obtiene todas las calificaciones recibidas por el empleador logueado
 */
export const getMyEmployerQualifications = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    const userData = await AsyncStorage.getItem("@user_data");

    if (!token || !userData) {
      throw new Error("Usuario no autenticado");
    }

    const user = JSON.parse(userData);
    const employerProfileId = user.employerProfile?.id;

    if (!employerProfileId) {
      throw new Error("El usuario no tiene perfil de empleador");
    }

    const response = await ApiClient.get(
      `/qualification/profile/${employerProfileId}?type=employer`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My employer qualifications response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my employer qualifications:", error);
    throw error;
  }
};

export const getMyEvaluationsService = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("Usuario no autenticado");
    }

    const response = await ApiClient.get("/qualification/my-evaluations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("My evaluations service response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my evaluations:", error);
    throw error;
  }
};

/**
 * Obtiene estadísticas básicas de evaluación del usuario logueado
 * Versión rápida y optimizada - funciona para trabajadores y empleadores
 */
export const getMyRatingStatsService = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");

    if (!token) {
      throw new Error("Usuario no autenticado");
    }

    const response = await ApiClient.get("/qualification/my-rating-stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("My rating stats service response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching my rating stats:", error);
    throw error;
  }
};

export const getUsersByRatingRange = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'rating',
      order = 'desc'
    } = options;

    const token = await AsyncStorage.getItem("@user_token");
    
    if (!token) {
      throw new Error("Usuario no autenticado");
    }

    // Construir parámetros de consulta
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      order
    });

    const response = await ApiClient.get(
      `/qualification/users/rating-ranges?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Users by rating range response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching users by rating range:", error);
    throw error;
  }
};

/**
 * Obtiene estadísticas rápidas de usuarios por rating
 */
export const getUsersRatingQuickStats = async () => {
  try {
    const token = await AsyncStorage.getItem("@user_token");
    
    if (!token) {
      throw new Error("Usuario no autenticado");
    }

    const response = await ApiClient.get(
      "/qualification/users/rating-stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Users rating quick stats response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching users rating quick stats:", error);
    throw error;
  }
};

/**
 * Obtiene usuarios por categoría específica
 * @param {string} category - Categoría: 'high' (3+), 'low' (<3), 'unrated' (sin calificaciones)
 * @param {Object} options - Opciones de consulta
 * @param {number} options.page - Página actual (default: 1)
 * @param {number} options.limit - Límite de resultados (default: 20)
 * @param {string} options.userType - Tipo de usuario: 'Trabajador', 'Empleador', 'all' (default: 'all')
 */
export const getUsersBySpecificCategory = async (category, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      userType = 'all'
    } = options;

    // Validar categoría
    if (!['high', 'low', 'unrated'].includes(category)) {
      throw new Error('Categoría no válida. Use: high, low, unrated');
    }

    const token = await AsyncStorage.getItem("@user_token");
    
    if (!token) {
      throw new Error("Usuario no autenticado");
    }

    // Construir parámetros de consulta
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userType
    });

    const response = await ApiClient.get(
      `/qualification/users/category/${category}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`Users by category ${category} response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching users by category ${category}:`, error);
    throw error;
  }
};

/**
 * Obtiene solo usuarios con calificaciones altas (3+ estrellas)
 * @param {Object} options - Opciones de consulta (mismas que getUsersBySpecificCategory)
 */
export const getHighRatedUsers = async (options = {}) => {
  return await getUsersBySpecificCategory('high', options);
};

/**
 * Obtiene solo usuarios con calificaciones bajas (< 3 estrellas)
 * @param {Object} options - Opciones de consulta (mismas que getUsersBySpecificCategory)
 */
export const getLowRatedUsers = async (options = {}) => {
  return await getUsersBySpecificCategory('low', options);
};

/**
 * Obtiene solo usuarios sin calificaciones
 * @param {Object} options - Opciones de consulta (mismas que getUsersBySpecificCategory)
 */
export const getUnratedUsers = async (options = {}) => {
  return await getUsersBySpecificCategory('unrated', options);
};

/**
 * Obtiene todos los trabajadores ordenados por rating
 * @param {Object} options - Opciones de consulta
 */
export const getWorkersByRating = async (options = {}) => {
  const updatedOptions = {
    ...options,
    sortBy: 'rating',
    order: 'desc'
  };
  
  const response = await getUsersByRatingRange(updatedOptions);
  
  // Filtrar solo trabajadores de todas las categorías
  const allWorkers = [
    ...response.data.categories.highRated.users.filter(u => u.userType === 'Trabajador'),
    ...response.data.categories.lowRated.users.filter(u => u.userType === 'Trabajador'),
    ...response.data.categories.unrated.users.filter(u => u.userType === 'Trabajador')
  ];

  // Ordenar por rating
  allWorkers.sort((a, b) => b.averageRating - a.averageRating);

  return {
    ...response,
    data: {
      ...response.data,
      workers: allWorkers,
      totalWorkers: allWorkers.length
    }
  };
};

/**
 * Obtiene todos los empleadores ordenados por rating
 * @param {Object} options - Opciones de consulta
 */
export const getEmployersByRating = async (options = {}) => {
  const updatedOptions = {
    ...options,
    sortBy: 'rating',
    order: 'desc'
  };
  
  const response = await getUsersByRatingRange(updatedOptions);
  
  // Filtrar solo empleadores de todas las categorías
  const allEmployers = [
    ...response.data.categories.highRated.users.filter(u => u.userType === 'Empleador'),
    ...response.data.categories.lowRated.users.filter(u => u.userType === 'Empleador'),
    ...response.data.categories.unrated.users.filter(u => u.userType === 'Empleador')
  ];

  // Ordenar por rating
  allEmployers.sort((a, b) => b.averageRating - a.averageRating);

  return {
    ...response,
    data: {
      ...response.data,
      employers: allEmployers,
      totalEmployers: allEmployers.length
    }
  };
};

/**
 * Busca usuarios por nombre y rating
 * @param {string} searchTerm - Término de búsqueda para el nombre
 * @param {Object} options - Opciones de búsqueda
 */
export const searchUsersByNameAndRating = async (searchTerm, options = {}) => {
  try {
    const response = await getUsersByRatingRange(options);
    
    if (!searchTerm || searchTerm.trim() === '') {
      return response;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Filtrar usuarios por nombre en todas las categorías
    const filterUsersByName = (users) => {
      return users.filter(user => 
        user.name.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower)
      );
    };

    const filteredData = {
      ...response.data,
      categories: {
        highRated: {
          ...response.data.categories.highRated,
          users: filterUsersByName(response.data.categories.highRated.users),
          count: filterUsersByName(response.data.categories.highRated.users).length
        },
        lowRated: {
          ...response.data.categories.lowRated,
          users: filterUsersByName(response.data.categories.lowRated.users),
          count: filterUsersByName(response.data.categories.lowRated.users).length
        },
        unrated: {
          ...response.data.categories.unrated,
          users: filterUsersByName(response.data.categories.unrated.users),
          count: filterUsersByName(response.data.categories.unrated.users).length
        }
      }
    };

    return {
      ...response,
      data: filteredData
    };
  } catch (error) {
    console.error("Error searching users by name and rating:", error);
    throw error;
  }
};