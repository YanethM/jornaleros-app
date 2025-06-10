// src/screens/auth/LoginScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const handleSignupPress = () => {
    console.log("Navigating to Signup");
    navigation.navigate("Signup");
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para modal de verificación (solo mantenemos este)
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationSuccessModal, setShowVerificationSuccessModal] = useState(false);
  
  // Estados para formulario de verificación
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      
      if (result.success) {
        console.log("Login result:", result);
        console.log("User data from login:", result.data); 
        await signIn(result.data);
      } else {
        // Verificar si el error es por cuenta no verificada
        if (result.message?.toLowerCase().includes('verificad') || 
            result.message?.toLowerCase().includes('verif')) {
          setVerificationEmail(email);
          setShowVerificationModal(true);
        } else {
          Alert.alert("Error", result.message);
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      
      // Manejar errores específicos
      if (error.response?.data?.message?.toLowerCase().includes('verificad')) {
        setVerificationEmail(email);
        setShowVerificationModal(true);
      } else {
        Alert.alert("Error", "Error de conexión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Navegación a pantalla de recuperación completa
  const handleForgotPassword = () => {
    navigation.navigate("PasswordReset");
  };

  // ✅ Implementación de reenvío de código de verificación
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationEmail)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const response = await resendVerificationCode(verificationEmail);
      
      if (response.success) {
        setIsSubmittingVerification(false);
        setShowVerificationModal(false);
        setShowVerificationSuccessModal(true);
        setVerificationEmail("");
      } else {
        setIsSubmittingVerification(false);
        Alert.alert("Error", response.message || "No se pudo reenviar el código");
      }
    } catch (error) {
      setIsSubmittingVerification(false);
      console.error("Error reenviando código:", error);
      Alert.alert("Error", "No se pudo reenviar el código de verificación");
    }
  };

  useEffect(() => {
    checkStoredData();
  }, []);

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
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              {/* ✅ Campo de contraseña con toggle de visibilidad */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Icon
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ✅ Enlaces mejorados */}
              <View style={styles.linksContainer}>
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.verificationLink}
                  onPress={() => setShowVerificationModal(true)}
                >
                  <Text style={styles.verificationLinkText}>
                    ¿No has verificado tu cuenta?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={require("../../../assets/google-icon.webp")}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  Continuar con Google
                </Text>
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

        {/* ✅ Solo modal de verificación de cuenta (simplificado) */}
        <Modal
          visible={showVerificationModal}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setShowVerificationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Icon name="mark-email-unread" size={48} color="#2196F3" />
              </View>

              <Text style={styles.modalTitle}>Verificar Cuenta</Text>
              <Text style={styles.modalDescription}>
                Tu cuenta aún no ha sido verificada. Ingresa tu correo para reenviar el código de verificación.
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
                  style={[styles.primaryButton, isSubmittingVerification && styles.disabledButton]}
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

        {/* ✅ Modal de éxito - Verificación reenviada */}
        <Modal
          visible={showVerificationSuccessModal}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setShowVerificationSuccessModal(false)}>
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <View style={[styles.successIconCircle, { backgroundColor: "#2196F3" }]}>
                  <Icon name="send" size={40} color="#fff" />
                </View>
              </View>

              <Text style={styles.successTitle}>¡Código Reenviado!</Text>
              <Text style={styles.successMessage}>
                Hemos enviado un nuevo código de verificación a tu correo electrónico.
              </Text>

              <TouchableOpacity
                style={[styles.successButton, { backgroundColor: "#2196F3" }]}
                onPress={() => setShowVerificationSuccessModal(false)}>
                <Text style={styles.successButtonText}>Entendido</Text>
              </TouchableOpacity>

              <Text style={styles.successNote}>
                El código expirará en 15 minutos
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 8,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#284F66",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  linksContainer: {
    marginBottom: 30,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: "#284F66",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  verificationLink: {
    alignSelf: "flex-end",
  },
  verificationLinkText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  signupText: {
    color: "#284F66",
    fontSize: 14,
  },
  signupLink: {
    color: "#284F66",
    fontWeight: "bold",
  },
  // Estilos para modales (solo verificación)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "90%",
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
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "90%",
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
    backgroundColor: "#FF9800",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF9800",
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
    backgroundColor: "#FF9800",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    minWidth: 180,
    shadowColor: "#FF9800",
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