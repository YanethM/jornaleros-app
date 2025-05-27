import ApiClient from "../utils/api";

interface RegisterData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  roleId: string;
  phone: string;
  documentType: string;
  documentId: string;
  nationality: string;
  state: string;
  city: string;
  organization?: string;
  
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyCodeData {
  email: string;
  code: string;
}

export async function register(data: RegisterData) {
  try {
    console.log("Datos del registro:", data);
    
    const result = await ApiClient.post("/auth/signup", data, false);
    console.log("Resultado del registro:", result);
    
    return {
      success: true,
      data: {
        token: result.data.token,
        user: result.data.newUser || result.data.user,
      },
    };
  } catch (error: any) {
    console.error("Error en el servicio de registro:", error);
    return {
      success: false,
      message: error.message || "Error al registrarse",
      data: null,
      error: error,
    };
  }
}

export async function verifyCode(data: VerifyCodeData) {
  try {
    const result = await ApiClient.post("/auth/verify-code", data, false);
    
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código verificado correctamente",
    };
  } catch (error: any) {
    console.error("Error en el servicio de verificación:", error);
    return {
      success: false,
      message: error.message || "Error al verificar código",
      data: null,
      error: error,
    };
  }
}

export async function resendVerificationCode(email: string) {
  try {
    const result = await ApiClient.post("/auth/resend-code", { email }, false);
    
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código reenviado correctamente",
    };
  } catch (error: any) {
    console.error("Error reenviando código:", error);
    return {
      success: false,
      message: error.message || "Error al reenviar código",
      data: null,
      error: error,
    };
  }
}

export async function login(data: LoginData) {
  try {
    const result = await ApiClient.post("/auth/login", data, false);
    
    return {
      success: true,
      data: {
        token: result.data.token,
        user: result.data.user,
      },
    };
  } catch (error: any) {
    console.error("Error en el servicio de inicio de sesión:", error);
    return {
      success: false,
      message: error.message || "Error al iniciar sesión",
      data: null,
      error: error,
    };
  }
}

export async function logout() {
  try {
    const result = await ApiClient.post("/auth/logout", {});
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error al cerrar sesión",
      data: null,
      error: error,
    };
  }
}
