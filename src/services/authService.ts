import ApiClient from "../utils/api";

// ✅ Interfaces para tipos de datos
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

export interface VerifyOtpData {
  email: string;
  code: string;
  token: string;
}

export interface ResetPasswordWithTokenData {
  token: string;
  password: string;
}

// ✅ Función de registro
export async function register(data: RegisterData) {
  try {
    console.log("Datos del registro:", data);
    const result = await ApiClient.post("/auth/signup", data, false);
    console.log("Resultado del registro:", result);
    
    return {
      success: true,
      data: {
        token: result.data.token,
        user: result.data.user,
      },
      message: result.data.msg || "Usuario registrado correctamente",
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

// ✅ Función de verificación de código (después del registro)
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

// ✅ Función de reenvío de código de verificación (CORREGIDA)
export async function resendVerificationCode(email: string) {
  try {
    const result = await ApiClient.post("/auth/resend-verification-code", { email }, false);
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

// ✅ Función de login (CORREGIDA)
export async function login(data: LoginData) {
  try {
    const result = await ApiClient.post("/auth/login", data, false);
    
    // El backend devuelve { success: true, data: { token, user } }
    return {
      success: true,
      data: {
        token: result.data.data?.token || result.data.token,
        user: result.data.data?.user || result.data.user,
      },
      message: result.data.message || "Login exitoso",
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

// ✅ Función de logout
export async function logout() {
  try {
    const result = await ApiClient.post("/auth/logout", {});
    return {
      success: true,
      data: result.data,
      message: "Sesión cerrada correctamente",
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

// ✅ NUEVA: Función para solicitar recuperación de contraseña
export async function requestPasswordReset(email: string) {
  try {
    const result = await ApiClient.post("/auth/request-password-reset", { email }, false);
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código de recuperación enviado",
      token: result.data.token,
    };
  } catch (error: any) {
    console.error("Error solicitando recuperación de contraseña:", error);
    return {
      success: false,
      message: error.message || "Error al solicitar recuperación de contraseña",
      data: null,
      error: error,
    };
  }
}

// ✅ NUEVA: Función para verificar código OTP de recuperación
export async function verifyOtpCode(data: VerifyOtpData) {
  try {
    const result = await ApiClient.post("/auth/verify-otp-code", data, false);
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código verificado correctamente",
      valid: result.data.valid,
      token: result.data.token,
    };
  } catch (error: any) {
    console.error("Error verificando código OTP:", error);
    return {
      success: false,
      message: error.message || "Error al verificar código",
      data: null,
      error: error,
    };
  }
}

// ✅ NUEVA: Función para restablecer contraseña
export async function resetPassword(data: ResetPasswordWithTokenData) {
  try {
    const result = await ApiClient.post("/auth/reset-password", data, false);
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Contraseña restablecida correctamente",
    };
  } catch (error: any) {
    console.error("Error restableciendo contraseña:", error);
    return {
      success: false,
      message: error.message || "Error al restablecer contraseña",
      data: null,
      error: error,
    };
  }
}

// ✅ NUEVA: Función para refrescar token
export async function refreshToken(refreshToken: string) {
  try {
    const result = await ApiClient.post("/auth/refresh-token", { refreshToken }, false);
    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      },
      message: "Token refrescado correctamente",
    };
  } catch (error: any) {
    console.error("Error refrescando token:", error);
    return {
      success: false,
      message: error.message || "Error al refrescar token",
      data: null,
      error: error,
    };
  }
}

// ✅ NUEVA: Función para cambiar contraseña (usuario autenticado)
export async function changePassword(data: ChangePasswordData) {
  try {
    const result = await ApiClient.post("/auth/change-password", data, true); // true = requiere auth
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Contraseña cambiada correctamente",
    };
  } catch (error: any) {
    console.error("Error cambiando contraseña:", error);
    return {
      success: false,
      message: error.message || "Error al cambiar contraseña",
      data: null,
      error: error,
    };
  }
}

// ✅ NUEVA: Función para verificar si el token es válido
export async function verifyToken() {
  try {
    const result = await ApiClient.get("/auth/verify-token", true); // true = requiere auth
    return {
      success: true,
      data: result.data,
      valid: true,
    };
  } catch (error: any) {
    console.error("Token inválido:", error);
    return {
      success: false,
      valid: false,
      message: error.message || "Token inválido",
      error: error,
    };
  }
}

// ✅ Objeto de servicio de autenticación para exportación por defecto
const authService = {
  register,
  verifyCode,
  resendVerificationCode,
  login,
  logout,
  requestPasswordReset,
  verifyOtpCode,
  resetPassword,
  refreshToken,
  changePassword,
  verifyToken,
};

export default authService;