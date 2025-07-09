import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LoginNavigationProp } from "../../navigation/types";
import { login, resendVerificationCode } from "../../services/authService";
import { checkStoredData } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import Icon from "react-native-vector-icons/MaterialIcons";

interface LoginScreenProps {
  navigation: LoginNavigationProp;
}

interface LoginError {
  code: string;
  message: string;
  field?: string;
  suggestions?: string[];
  loginError: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [currentError, setCurrentError] = useState<LoginError | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationSuccessModal, setShowVerificationSuccessModal] =
    useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);

  const { signIn } = useAuth();

  // Limpiar error de campo específico
  const clearFieldError = useCallback((field: "email" | "password") => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Configuración de errores memoizada
  const errorConfigs = useMemo(
    () => ({
      USER_NOT_FOUND: {
        icon: "person",
        color: "#FF6B6B",
        title: "Correo no encontrado",
        suggestions: [
          "Verifica que el correo esté escrito correctamente",
          "Si no tienes cuenta, regístrate primero",
          "Contacta soporte si crees que esto es un error",
        ],
        primaryAction: {
          text: "Crear Cuenta",
          action: () => {
            setShowErrorModal(false);
            navigation.navigate("Signup");
          },
        },
        secondaryAction: {
          text: "Intentar de nuevo",
          action: () => setShowErrorModal(false),
        },
      },
      INVALID_PASSWORD: {
        icon: "lock",
        color: "#FFA726",
        title: "Contraseña incorrecta",
        suggestions: [
          "Verifica que estés usando la contraseña correcta",
          "Asegúrate de que las mayúsculas estén correctas",
          'Usa "Olvidé mi contraseña" si no la recuerdas',
        ],
        primaryAction: {
          text: "Recuperar Contraseña",
          action: () => {
            setShowErrorModal(false);
            navigation.navigate("PasswordReset");
          },
        },
        secondaryAction: {
          text: "Intentar de nuevo",
          action: () => setShowErrorModal(false),
        },
      },
      ACCOUNT_NOT_VERIFIED: {
        icon: "email",
        color: "#42A5F5",
        title: "Cuenta no verificada",
        suggestions: [
          "Revisa tu bandeja de entrada y spam",
          "Reenvía el correo de verificación si es necesario",
          "Contacta soporte si no recibiste el correo",
        ],
        primaryAction: {
          text: "Reenviar Verificación",
          action: () => {
            setShowErrorModal(false);
            setVerificationEmail(email);
            setShowVerificationModal(true);
          },
        },
        secondaryAction: {
          text: "Cancelar",
          action: () => setShowErrorModal(false),
        },
      },
      ACCOUNT_LOCKED: {
        icon: "lock",
        color: "#EF5350",
        title: "Cuenta bloqueada",
        suggestions: [
          "Espera 30 minutos antes de intentar de nuevo",
          'Usa "Olvidé mi contraseña" para resetear',
          "Contacta soporte si necesitas ayuda inmediata",
        ],
        primaryAction: {
          text: "Resetear Contraseña",
          action: () => {
            setShowErrorModal(false);
            navigation.navigate("PasswordReset");
          },
        },
        secondaryAction: {
          text: "Entendido",
          action: () => setShowErrorModal(false),
        },
      },
      ACCOUNT_INACTIVE: {
        icon: "block",
        color: "#FF7043",
        title: "Cuenta desactivada",
        suggestions: [
          "Tu cuenta ha sido desactivada por un administrador",
          "Contacta al soporte técnico para más información",
          "Proporciona tu información de cuenta para verificación",
        ],
        primaryAction: {
          text: "Contactar Soporte",
          action: () => setShowErrorModal(false),
        },
        secondaryAction: {
          text: "Entendido",
          action: () => setShowErrorModal(false),
        },
      },
      DEFAULT: {
        icon: "error",
        color: "#FF5722",
        title: "Error de conexión",
        suggestions: [
          "Verifica tu conexión a internet",
          "Intenta de nuevo en unos momentos",
          "Contacta soporte si el problema persiste",
        ],
        primaryAction: {
          text: "Reintentar",
          action: () => setShowErrorModal(false),
        },
        secondaryAction: {
          text: "Cancelar",
          action: () => setShowErrorModal(false),
        },
      },
    }),
    [email, navigation]
  );

  // Obtener configuración de error
  const getErrorConfig = useCallback(
    (errorCode: string) => {
      return (
        errorConfigs[errorCode as keyof typeof errorConfigs] ||
        errorConfigs.DEFAULT
      );
    },
    [errorConfigs]
  );

  // Manejar errores de login
  const handleLoginError = useCallback((error: LoginError) => {
    if (error.field) {
      setFieldErrors({ [error.field]: error.message });
    }

    setCurrentError(error);
    setShowErrorModal(true);
  }, []);

  // Manejar login
  const handleLogin = useCallback(async () => {
    setFieldErrors({});

    // Validaciones locales
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "El correo electrónico es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Formato de correo electrónico inválido";
      }
    }

    if (!password.trim()) {
      errors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      await signIn(result.data);

      if (result.data.role === "WORKER") {
        navigation.reset({
          index: 0,
          routes: [{ name: "WorkerApp" }], // Coincide con tu RootStack
        });
      } else if (result.data.role === "EMPLOYER") {
        navigation.reset({
          index: 0,
          routes: [{ name: "EmployerApp" }], // Coincide con tu RootStack
        });
      } else {
        // Rol no reconocido - redirigir a pantalla pública
        navigation.reset({
          index: 0,
          routes: [{ name: "PublicHome" }],
        });
      }
    } catch (error: any) {
      if (error.loginError && error.code) {
        handleLoginError(error as LoginError);
      } else if (error.code && (error.status === 401 || error.status === 400)) {
        handleLoginError({
          code: error.code,
          message: error.message || "Error de autenticación",
          field: error.field,
          suggestions: error.suggestions,
          loginError: true,
        });
      } else {
        handleLoginError({
          code: "NETWORK_ERROR",
          message: "Error de conexión. Verifica tu internet.",
          loginError: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, navigation, handleLoginError]);
  // Manejar reenvío de verificación
  const handleResendVerification = useCallback(async () => {
    if (!verificationEmail) {
      setFieldErrors({ email: "Por favor ingresa tu correo electrónico" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationEmail)) {
      setFieldErrors({
        email: "Por favor ingresa un correo electrónico válido",
      });
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const response = await resendVerificationCode(verificationEmail);

      if (response.success) {
        setShowVerificationModal(false);
        setShowVerificationSuccessModal(true);
        setVerificationEmail("");
      } else {
        handleLoginError({
          code: "VERIFICATION_ERROR",
          message: response.message || "No se pudo reenviar el código",
          loginError: true,
        });
      }
    } catch (error) {
      handleLoginError({
        code: "VERIFICATION_ERROR",
        message: "No se pudo reenviar el código de verificación",
        loginError: true,
      });
    } finally {
      setIsSubmittingVerification(false);
    }
  }, [verificationEmail, handleLoginError]);

  // Handlers memoizados
  const handleSignupPress = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate("PasswordReset");
  }, [navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const openVerificationModal = useCallback(() => {
    setVerificationEmail(email);
    setShowVerificationModal(true);
  }, [email]);

  useEffect(() => {
    checkStoredData();
  }, []);

  // Renderizado optimizado de campos de entrada
  const renderEmailField = useMemo(
    () => (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={[styles.input, fieldErrors.email && styles.inputError]}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) clearFieldError("email");
          }}
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        {fieldErrors.email && (
          <View style={styles.errorContainer}>
            <Icon name="error" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{fieldErrors.email}</Text>
          </View>
        )}
      </View>
    ),
    [email, fieldErrors.email, clearFieldError]
  );

  const renderPasswordField = useMemo(
    () => (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contraseña</Text>
        <View
          style={[
            styles.passwordInputContainer,
            fieldErrors.password && styles.inputError,
          ]}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) clearFieldError("password");
            }}
            placeholder="********"
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}>
            <Icon
              name={showPassword ? "visibility-off" : "visibility"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {fieldErrors.password && (
          <View style={styles.errorContainer}>
            <Icon name="error" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{fieldErrors.password}</Text>
          </View>
        )}
      </View>
    ),
    [
      password,
      fieldErrors.password,
      showPassword,
      togglePasswordVisibility,
      clearFieldError,
    ]
  );

  // Renderizado optimizado de modales
  const renderErrorModal = useMemo(
    () => (
      <Modal
        visible={showErrorModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowErrorModal(false)}>
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            {currentError ? (
              (() => {
                const config = getErrorConfig(currentError.code);
                return (
                  <>
                    <View
                      style={[
                        styles.errorIconContainer,
                        { backgroundColor: config.color + "20" },
                      ]}>
                      <Icon name={config.icon} size={48} color={config.color} />
                    </View>

                    <Text style={styles.errorModalTitle}>{config.title}</Text>
                    <Text style={styles.errorModalMessage}>
                      {currentError.message}
                    </Text>

                    {config.suggestions && config.suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>
                          Sugerencias:
                        </Text>
                        {config.suggestions.map((suggestion, index) => (
                          <View key={index} style={styles.suggestionItem}>
                            <Icon name="lightbulb" size={16} color="#FFA726" />
                            <Text style={styles.suggestionText}>
                              {suggestion}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.errorModalButtons}>
                      <TouchableOpacity
                        style={[
                          styles.errorPrimaryButton,
                          { backgroundColor: config.color },
                        ]}
                        onPress={config.primaryAction.action}>
                        <Text style={styles.errorPrimaryButtonText}>
                          {config.primaryAction.text}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.errorSecondaryButton}
                        onPress={config.secondaryAction.action}>
                        <Text style={styles.errorSecondaryButtonText}>
                          {config.secondaryAction.text}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()
            ) : (
              <>
                <View
                  style={[
                    styles.errorIconContainer,
                    { backgroundColor: "#FF5722" + "20" },
                  ]}>
                  <Icon name="error" size={48} color="#FF5722" />
                </View>
                <Text style={styles.errorModalTitle}>Error</Text>
                <Text style={styles.errorModalMessage}>
                  Ha ocurrido un error inesperado
                </Text>
                <View style={styles.errorModalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.errorPrimaryButton,
                      { backgroundColor: "#FF5722" },
                    ]}
                    onPress={() => setShowErrorModal(false)}>
                    <Text style={styles.errorPrimaryButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    ),
    [showErrorModal, currentError, getErrorConfig]
  );

  const renderVerificationModal = useMemo(
    () => (
      <Modal
        visible={showVerificationModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowVerificationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Icon name="mark-email-unread" size={48} color="#284F66" />
            </View>

            <Text style={styles.modalTitle}>Verificar Cuenta</Text>
            <Text style={styles.modalDescription}>
              Tu cuenta aún no ha sido verificada. Ingresa tu correo para
              reenviar el código de verificación.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.modalInput}
                value={verificationEmail}
                onChangeText={setVerificationEmail}
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmittingVerification && styles.disabledButton,
                ]}
                onPress={handleResendVerification}
                disabled={isSubmittingVerification}>
                {isSubmittingVerification ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Reenviar Código</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationEmail("");
                }}
                disabled={isSubmittingVerification}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    ),
    [
      showVerificationModal,
      verificationEmail,
      isSubmittingVerification,
      handleResendVerification,
    ]
  );

  const renderVerificationSuccessModal = useMemo(
    () => (
      <Modal
        visible={showVerificationSuccessModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowVerificationSuccessModal(false)}>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <View
                style={[
                  styles.successIconCircle,
                  { backgroundColor: "#284F66" },
                ]}>
                <Icon name="send" size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.successTitle}>¡Código Reenviado!</Text>
            <Text style={styles.successMessage}>
              Hemos enviado un nuevo código de verificación a tu correo
              electrónico.
            </Text>

            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: "#284F66" }]}
              onPress={() => setShowVerificationSuccessModal(false)}>
              <Text style={styles.successButtonText}>Entendido</Text>
            </TouchableOpacity>

            <Text style={styles.successNote}>
              El código expirará en 15 minutos
            </Text>
          </View>
        </View>
      </Modal>
    ),
    [showVerificationSuccessModal]
  );

  return (
    <View style={styles.container}>
      <CustomHeaderNoAuth navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Bienvenido de nuevo</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
            </View>

            <View style={styles.formContainer}>
              {renderEmailField}
              {renderPasswordField}

              <View style={styles.linksContainer}>
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.verificationLink}
                  onPress={openVerificationModal}>
                  <Text style={styles.verificationLinkText}>
                    ¿No has verificado tu cuenta?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loginButtonText}>
                      Iniciando sesión...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <TouchableOpacity onPress={handleSignupPress}>
                  <Text style={styles.signupText}>
                    ¿No tienes cuenta?{" "}
                    <Text style={styles.signupLink}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {renderErrorModal}
        {renderVerificationModal}
        {renderVerificationSuccessModal}
      </KeyboardAvoidingView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // Centrado vertical del contenido
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20, // Cambio de paddingTop fijo a paddingVertical
    justifyContent: 'center', // Centrado vertical
    maxWidth: 400, // Ancho máximo para pantallas grandes
    alignSelf: 'center', // Centrado horizontal
    width: '100%',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
    paddingTop: 20, // Espaciado superior
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 8,
    textAlign: "center", // Asegurar centrado de texto
  },
  subtitle: {
    fontSize: 16,
    color: "#284F66",
    textAlign: "center", // Asegurar centrado de texto
  },
  formContainer: {
    width: '100%',
    alignItems: 'stretch', // Los elementos ocupan todo el ancho
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12, // Bordes más redondeados
    paddingHorizontal: 16,
    paddingVertical: 14, // Más padding vertical
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    width: '100%',
    // Sombra sutil para los inputs
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12, // Bordes más redondeados
    backgroundColor: "#fff",
    overflow: "hidden",
    width: '100%',
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14, // Más padding vertical
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  linksContainer: {
    marginBottom: 30,
    alignItems: 'center', // Centrar los enlaces
    gap: 10, // Espaciado entre enlaces
  },
  forgotPassword: {
    alignSelf: "center", // Centrar el enlace
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: "#284F66",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    textAlign: 'center',
  },
  verificationLink: {
    alignSelf: "center", // Centrar el enlace
  },
  verificationLinkText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    borderRadius: 12, // Bordes más redondeados
    alignItems: "center",
    marginBottom: 20,
    width: '100%',
    // Sombra más prominente para el botón principal
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    alignItems: 'center',
  },
  signupText: {
    color: "#284F66",
    fontSize: 14,
    textAlign: 'center',
  },
  signupLink: {
    color: "#284F66",
    fontWeight: "bold",
  },

  // Estilos para modal de errores (mantenidos pero con mejoras menores)
  errorModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(40, 79, 102, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20, // Padding para pantallas pequeñas
  },
  errorModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 12,
    textAlign: "center",
  },
  errorModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestionsContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#284F66",
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  errorModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  errorPrimaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  errorPrimaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorSecondaryButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  errorSecondaryButtonText: {
    color: "#284F66",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modales existentes (con mejoras menores)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  modalIconContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalInputContainer: {
    width: "100%",
    marginBottom: 25,
  },
  modalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#284F66",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  successIconContainer: {
    marginBottom: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#284F66",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 15,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  successButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    minWidth: 180,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  successNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default LoginScreen;
