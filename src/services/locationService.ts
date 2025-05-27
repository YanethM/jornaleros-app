import ApiClient from "../utils/api";

export const getCountries = async () => {
  try {
    const response = await ApiClient.get("/locations/countries");
    console.log("Countries API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

export const getDepartmentsByCountry = async (countryId) => {
  console.log("getDepartmentsByCountry called with:", countryId);

  if (!countryId) {
    console.warn("getDepartmentsByCountry called without countryId");
    return { success: false, data: [], message: "No countryId provided" };
  }

  try {
    // First, try with path parameters (/:countryId)
    let url = `/locations/department-states/${countryId}`;
    console.log("Making API request to:", url);

    try {
      const response = await ApiClient.get(url);
      console.log(`Departments API response data:`, response.data);
      return response.data;
    } catch (pathError) {
      console.error("Path parameter approach failed:", pathError);

      // If path parameter approach fails, try with query parameters
      url = `/locations/department-states?countryId=${countryId}`;
      console.log("Trying alternative API request to:", url);

      const response = await ApiClient.get(url);
      console.log(
        `Departments API response from alternative approach:`,
        response.data
      );
      return response.data;
    }
  } catch (error) {
    console.error(
      `Error fetching departments for countryId ${countryId}:`,
      error
    );

    // Enhanced error logging
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }

    throw error;
  }
};

export const getMunicipalitiesByDepartment = async (departmentId) => {
  if (!departmentId) {
    console.warn("getMunicipalitiesByDepartment called without departmentId");
    return { success: false, data: [] };
  }

  try {
    // Try both path and query parameter approaches
    try {
      // Try path parameter approach first
      const url = `/locations/municipalities/${departmentId}`;
      const response = await ApiClient.get(url);
      return response.data;
    } catch (pathError) {
      // Fallback to query parameter approach
      const url = `/locations/municipalities?departmentId=${departmentId}`;
      const response = await ApiClient.get(url);
      return response.data;
    }
  } catch (error) {
    console.error(
      `Error fetching municipalities for departmentId ${departmentId}:`,
      error
    );
    throw error;
  }
};

export const getVillagesByMunicipality = async (municipalityId) => {
  if (!municipalityId) {
    console.warn("getVillagesByMunicipality called without municipalityId");
    return { success: false, data: [] };
  }
  try {
    // Try path parameter approach first
    const url = `/locations/villages/${municipalityId}`;
    const response = await ApiClient.get(url);
    return response.data;
  } catch (pathError) {
    // Fallback to query parameter approach
    const url = `/locations/villages?municipalityId=${municipalityId}`;
    const response = await ApiClient.get(url);
    return response.data;
  }
};
