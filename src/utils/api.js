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

      // ✅ MODIFICADO: Solo manejo errores de token realmente inválidos
      if (response.status === 401) {
        const errorCode = data.code || data.response?.code;
        
        // ❌ ELIMINADO: TOKEN_EXPIRED del manejo automático
        // Solo hacer logout si el token es inválido o falta, NO por expiración
        if (errorCode === "TOKEN_INVALID" || 
            errorCode === "AUTH_HEADER_MISSING" || 
            errorCode === "TOKEN_MISSING") {
          
          console.log("🚨 Token inválido detectado, cerrando sesión...");
          await this.handleAuthError();
          throw new Error("Invalid token. Please login again.");
        }
        
        // Para otros errores 401 (como TOKEN_EXPIRED), simplemente lanzar el error
        // sin hacer logout automático
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
      
      // ❌ ELIMINADO: El manejo automático de errores 401 genéricos
      // Ya no hacemos logout automático por cualquier error 401
      
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