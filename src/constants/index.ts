export const COLORS = {
    primary: '#2196F3',
    secondary: '#FFC107',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#00BCD4',
    light: '#F5F5F5',
    dark: '#333333',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  };
  
  // Tamaños de fuente
  export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  };
  
  // Espaciado
  export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  };
  
  // Configuración de API
  export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://dev-pasoco-back.ariadna.co',
    TIMEOUT: 10000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  };
  
  // Claves de almacenamiento
  export const STORAGE_KEYS = {
    USER_TOKEN: '@UserToken',
    USER_DATA: '@UserData',
    APP_SETTINGS: '@AppSettings',
  };
  
  // Mensajes de error comunes
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu internet.',
    GENERIC_ERROR: 'Algo salió mal. Por favor, intenta nuevamente.',
    AUTH_ERROR: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
    VALIDATION_ERROR: 'Por favor, verifica la información ingresada.',
  };