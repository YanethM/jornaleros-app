import AsyncStorage from "@react-native-async-storage/async-storage";

const getApiUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  console.log('API URL:', url); 
  return url;
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
    console.log("🚨 Manejando error de autenticación - cerrando sesión...");
    
    try {
      await AsyncStorage.removeItem("@user_token");
      await AsyncStorage.removeItem("@user_data");
      
      if (this.authContext && this.authContext.signOut) {
        await this.authContext.signOut();
      }
      
      console.log("✅ Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Error al limpiar datos de autenticación:", error);
    }
  }

  // ✅ MEJORADO: Método para determinar si un error requiere logout automático
  isAuthErrorRequiringLogout(status, data, endpoint) {
    const errorCode = data?.code || data?.response?.code;
    const errorMessage = data?.message || data?.msg;

    // ✅ NO hacer logout automático para errores de login/registro
    const isAuthEndpoint = endpoint?.includes('/auth/login') || 
                          endpoint?.includes('/auth/register') ||
                          endpoint?.includes('/auth/forgot-password') ||
                          endpoint?.includes('/auth/reset-password');

    if (isAuthEndpoint) {
      console.log("🔍 Error en endpoint de autenticación - NO hacer logout automático");
      return false;
    }

    // Errores 401 - Solo para tokens realmente inválidos
    if (status === 401) {
      return (
        errorCode === "TOKEN_INVALID" ||
        errorCode === "AUTH_HEADER_MISSING" ||
        errorCode === "TOKEN_MISSING" ||
        errorCode === "TOKEN_EXPIRED" ||
        errorMessage?.includes("Token inválido") ||
        errorMessage?.includes("Token expirado")
      );
    }

    // Errores 404 - Usuario no encontrado (para endpoints que requieren usuario existente)
    if (status === 404) {
      return (
        errorCode === "USER_NOT_FOUND" ||
        errorMessage === "Usuario no encontrado." ||
        errorMessage?.includes("Usuario no encontrado")
      );
    }

    // Errores 403 - No autorizado
    if (status === 403) {
      return (
        errorCode === "ACCESS_DENIED" ||
        errorCode === "FORBIDDEN" ||
        errorMessage?.includes("No autorizado")
      );
    }

    return false;
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

      if (!response.ok) {
        // ✅ Determinar si requiere logout basado en endpoint y tipo de error
        const endpoint = url.replace(getApiUrl(), '');
        const requiresLogout = this.isAuthErrorRequiringLogout(response.status, data, endpoint);
        
        if (requiresLogout) {
          console.log(`🚨 Error de sesión detectado: ${response.status} - ${data?.code || 'Unknown'}`, data);
          await this.handleAuthError();
          
          throw {
            status: response.status,
            message: "Sesión expirada. Por favor, inicia sesión nuevamente.",
            code: "AUTH_ERROR",
            originalError: data,
            isAuthError: true,
          };
        }

        // ✅ Para errores de login/validación, NO marcar como authError
        const isLoginError = endpoint?.includes('/auth/login') && 
                           (response.status === 401 || response.status === 400);

        throw {
          status: response.status,
          message: data.message || data.msg || "Request failed",
          code: data.code,
          data,
          field: data.field, // ✅ NUEVO: Campo específico con error
          suggestions: data.suggestions, // ✅ NUEVO: Sugerencias del backend
          isAuthError: false, // ✅ Errores de login no son errores de sesión
          loginError: isLoginError, // ✅ NUEVO: Marcar específicamente errores de login
        };
      }

      return {
        success: true,
        data,
        status: response.status,
      };

    } catch (error) {
      console.error("API request error:", error);

      // Si ya es un error que procesamos arriba, re-lanzarlo
      if (error.hasOwnProperty('isAuthError') || error.hasOwnProperty('loginError')) {
        throw error;
      }

      // Para errores de red u otros errores no HTTP
      throw {
        status: 0,
        message: error.message || "Error de conexión",
        code: "NETWORK_ERROR",
        data: null,
        isAuthError: false,
        loginError: false,
        originalError: error,
      };
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

  async patch(endpoint, data, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(
      `${apiUrl}${endpoint}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async delete(endpoint, includeAuth = true) {
    const apiUrl = getApiUrl();
    return this.request(`${apiUrl}${endpoint}`, { method: "DELETE" }, includeAuth);
  }

  // ✅ Método actualizado para verificar errores de autenticación
  static isAuthError(error) {
    return error?.isAuthError === true;
  }

  // ✅ NUEVO: Método para verificar errores de login específicamente
  static isLoginError(error) {
    return error?.loginError === true;
  }

  async updateToken(newToken) {
    try {
      await AsyncStorage.setItem("@user_token", newToken);
      console.log("✅ Token actualizado exitosamente");
    } catch (error) {
      console.error("Error actualizando token:", error);
    }
  }

  async hasValidToken() {
    try {
      const token = await AsyncStorage.getItem("@user_token");
      return !!token;
    } catch (error) {
      console.error("Error verificando token:", error);
      return false;
    }
  }
}

export default ApiClient.getInstance();