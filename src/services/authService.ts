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

export interface RequestCancellationData {
  reason?: string;
}

export interface ConfirmCancellationData {
  code: string;
}

// ✅ Función de registro (mantenida igual)
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

// ✅ Función de verificación de código (mantenida igual)
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

// ✅ Función de reenvío de código de verificación (CORREGIDA para lanzar errores)
export async function resendVerificationCode(email: string) {
  try {
    console.log('📧 Reenviando código de verificación para:', email);
    const result = await ApiClient.post("/auth/resend-verification-code", { email }, false);
    console.log('✅ Código reenviado exitosamente');
    
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código reenviado correctamente",
    };
  } catch (error: any) {
    console.error("❌ Error reenviando código:", error);
    
    // Para reenvío de verificación, lanzar error para manejo en frontend
    if (error.loginError || error.status === 401 || error.status === 400) {
      throw error;
    }
    
    return {
      success: false,
      message: error.message || "Error al reenviar código",
      data: null,
      error: error,
    };
  }
}

// ✅ Función de login (CORREGIDA - Lanza errores directamente)
export async function login(data: LoginData) {
  try {
    console.log('🔑 Iniciando proceso de login...');
    const result = await ApiClient.post("/auth/login", data, false);
    console.log('✅ Login exitoso:', result.data);
    
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
    console.error("❌ Error en el servicio de inicio de sesión:", error);
    
    // ✅ CAMBIO IMPORTANTE: Re-lanzar errores de login para que el frontend los maneje
    // Esto permite que los modales personalizados funcionen correctamente
    throw error;
  }
}

// ✅ Función de logout (mantenida igual)
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

// ✅ NUEVA: Función para solicitar recuperación de contraseña (mantenida igual)
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

// ✅ NUEVA: Función para verificar código OTP de recuperación (mantenida igual)
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

// ✅ NUEVA: Función para restablecer contraseña (mantenida igual)
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

// ✅ NUEVA: Función para refrescar token (mantenida igual)
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

// ✅ NUEVA: Función para cambiar contraseña (mantenida igual)
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

// ✅ NUEVA: Función para verificar si el token es válido (mantenida igual)
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

// ✅ Funciones de cancelación de cuenta (mantenidas igual)
export async function requestAccountCancellation(data: RequestCancellationData) {
  try {
    const result = await ApiClient.post("/auth/request-cancellation", data, true); // true = requiere auth
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Código de confirmación enviado a tu correo",
      expiresIn: result.data.expiresIn,
    };
  } catch (error: any) {
    console.error("Error solicitando cancelación de cuenta:", error);
    return {
      success: false,
      message: error.message || "Error al procesar la solicitud de cancelación",
      data: null,
      error: error,
    };
  }
}

export async function confirmAccountCancellation(data: ConfirmCancellationData) {
  try {
    const result = await ApiClient.post("/auth/confirm-cancellation", data, true); // true = requiere auth
    return {
      success: true,
      data: result.data,
      message: result.data.msg || "Cuenta cancelada exitosamente",
      timestamp: result.data.timestamp,
    };
  } catch (error: any) {
    console.error("Error confirmando cancelación de cuenta:", error);
    return {
      success: false,
      message: error.message || "Error al confirmar la cancelación",
      data: null,
      error: error,
    };
  }
}

// ✅ Funciones auxiliares para mensajes de error (mantenidas para compatibilidad)
export const getLoginErrorMessage = (errorCode, field) => {
  switch (errorCode) {
    case 'USER_NOT_FOUND':
      return 'No existe una cuenta registrada con este correo electrónico.';
    case 'INVALID_PASSWORD':
      return 'La contraseña ingresada es incorrecta.';
    case 'ACCOUNT_NOT_VERIFIED':
      return 'Tu cuenta no ha sido verificada. Revisa tu correo electrónico.';
    case 'ACCOUNT_INACTIVE':
      return 'Tu cuenta ha sido desactivada. Contacta al soporte técnico.';
    case 'ACCOUNT_LOCKED':
      return 'Cuenta bloqueada temporalmente por múltiples intentos fallidos.';
    case 'INVALID_EMAIL_FORMAT':
      return 'El formato del correo electrónico no es válido.';
    case 'MISSING_CREDENTIALS':
      return 'Por favor ingresa tu correo electrónico y contraseña.';
    default:
      return 'Error de inicio de sesión. Intenta de nuevo.';
  }
};

// Función auxiliar para obtener sugerencias basadas en el error (mantenida igual)
export const getLoginErrorSuggestions = (errorCode) => {
  switch (errorCode) {
    case 'USER_NOT_FOUND':
      return [
        'Verifica que el correo esté escrito correctamente',
        'Si no tienes cuenta, regístrate primero',
        'Contacta soporte si crees que esto es un error'
      ];
    case 'INVALID_PASSWORD':
      return [
        'Verifica que estés usando la contraseña correcta',
        'Asegúrate de que las mayúsculas estén correctas',
        'Usa "Olvidé mi contraseña" si no la recuerdas'
      ];
    case 'ACCOUNT_NOT_VERIFIED':
      return [
        'Revisa tu bandeja de entrada y spam',
        'Reenvía el correo de verificación si es necesario',
        'Contacta soporte si no recibiste el correo'
      ];
    case 'ACCOUNT_LOCKED':
      return [
        'Espera 30 minutos antes de intentar de nuevo',
        'Usa "Olvidé mi contraseña" para resetear',
        'Contacta soporte si necesitas ayuda inmediata'
      ];
    default:
      return [];
  }
};

// ✅ Exportación por defecto (mantenida igual)
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
  requestAccountCancellation,
  confirmAccountCancellation,
};

export default authService;