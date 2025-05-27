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
} from "react-native";
import { LoginNavigationProp } from "../../navigation/types";
import { login } from "../../services/authService";
import { checkStoredData } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";

interface LoginScreenProps {
  navigation: LoginNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const handleSignupPress = () => {
    console.log("Navigating to Signup"); // Añade esto
    navigation.navigate("Signup");
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        console.log("Login result:", result); // Para debugging
        console.log("User data from login:", result.data); 
        await signIn(result.data);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error en login:", error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setIsLoading(false);
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

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
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#284F66",
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
});

export default LoginScreen;
