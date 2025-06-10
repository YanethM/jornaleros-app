// screens/auth/PasswordResetScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { requestPasswordReset, verifyOtpCode, resetPassword } from '../../services/authService';

interface PasswordResetScreenProps {
  navigation: any;
  route: any;
}

// Estados del flujo
enum ResetStep {
  EMAIL = 'email',
  VERIFY_CODE = 'verify_code', 
  NEW_PASSWORD = 'new_password',
  SUCCESS = 'success'
}

const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState<ResetStep>(ResetStep.EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para cada paso
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Token del backend
  const [resetToken, setResetToken] = useState('');

  // 📧 PASO 1: Solicitar código de recuperación
  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo válido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestPasswordReset(email);
      
      if (response.success) {
        setResetToken(response.token);
        setCurrentStep(ResetStep.VERIFY_CODE);
        Alert.alert(
          'Código enviado',
          'Hemos enviado un código de verificación a tu correo electrónico'
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔢 PASO 2: Verificar código OTP
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtpCode({
        email,
        code: verificationCode,
        token: resetToken
      });
      
      if (response.success && response.valid) {
        setCurrentStep(ResetStep.NEW_PASSWORD);
      } else {
        Alert.alert('Error', response.message || 'Código incorrecto');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔐 PASO 3: Establecer nueva contraseña
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword({
        token: resetToken,
        password: newPassword
      });
      
      if (response.success) {
        setCurrentStep(ResetStep.SUCCESS);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 Renderizar contenido según el paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case ResetStep.EMAIL:
        return (
          <View style={styles.stepContainer}>
            <Icon name="mail-outline" size={64} color="#284F66" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Recuperar Contraseña</Text>
            <Text style={styles.stepDescription}>
              Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña
            </Text>
            
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

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleRequestReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case ResetStep.VERIFY_CODE:
        return (
          <View style={styles.stepContainer}>
            <Icon name="security" size={64} color="#FF9800" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Verificar Código</Text>
            <Text style={styles.stepDescription}>
              Ingresa el código de 6 dígitos que enviamos a {email}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código de verificación</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentStep(ResetStep.EMAIL)}
            >
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        );

      case ResetStep.NEW_PASSWORD:
        return (
          <View style={styles.stepContainer}>
            <Icon name="lock-outline" size={64} color="#4CAF50" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Nueva Contraseña</Text>
            <Text style={styles.stepDescription}>
              Ingresa tu nueva contraseña
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la contraseña"
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  <Icon
                    name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case ResetStep.SUCCESS:
        return (
          <View style={styles.stepContainer}>
            <Icon name="check-circle" size={64} color="#4CAF50" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>¡Contraseña Cambiada!</Text>
            <Text style={styles.stepDescription}>
              Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#284F66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
      </View>

      <View style={styles.content}>
        {renderStepContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#284F66',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepIcon: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#284F66',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#284F66',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#284F66',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PasswordResetScreen;