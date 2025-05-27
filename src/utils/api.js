import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL;
};

class ApiClient {
  static instance;
  authContext = null;

  constructor() {}

  static getInstance() {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setAuthContext(authContext) {
    this.authContext = authContext;
  }

  async getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = await AsyncStorage.getItem("@user_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async handleAuthError() {
    // Clear auth data and redirect to login
    await AsyncStorage.removeItem("@user_token");
    await AsyncStorage.removeItem("@user_data");
    
    if (this.authContext && this.authContext.signOut) {
      await this.authContext.signOut();
    }
  }

  async request(url, options = {}, includeAuth = true) {
    try {
      const headers = await this.getHeaders(includeAuth);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Parse response
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle auth errors
      if (response.status === 401) {
        const errorCode = data.code || data.response?.code;
        if (errorCode === "TOKEN_EXPIRED" || errorCode === "TOKEN_INVALID" || errorCode === "AUTH_HEADER_MISSING") {
          await this.handleAuthError();
          throw new Error("Session expired. Please login again.");
        }
      }

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || data.msg || "Request failed",
          data,
        };
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error("API request error:", error);
      
      // If it's an auth error, make sure to handle it
      if (error.status === 401) {
        await this.handleAuthError();
      }
      
      throw error;
    }
  }

  async get(endpoint, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(`${apiUrl}${endpoint}`, { method: "GET" }, includeAuth);
  }

  async post(endpoint, data, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(
      `${apiUrl}${endpoint}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async put(endpoint, data, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(
      `${apiUrl}${endpoint}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async delete(endpoint, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(`${apiUrl}${endpoint}`, { method: "DELETE" }, includeAuth);
  }
}

export default ApiClient.getInstance();