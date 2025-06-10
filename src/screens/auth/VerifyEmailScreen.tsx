// src/screens/auth/VerifyEmailScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VerifyEmailNavigationProp, VerifyEmailRouteProp } from '../../navigation/types';
import { verifyCode, resendVerificationCode } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface VerifyEmailScreenProps {
  navigation: VerifyEmailNavigationProp;
  route: VerifyEmailRouteProp;
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ navigation, route }) => {
  const { email, fromRegistration = false } = route.params;
  const { signIn } = useAuth();

  // Estados
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Referencias para los inputs
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // ✅ Countdown para reenvío de código
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ✅ Función para manejar cambio en los inputs de código
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus al siguiente input si hay un valor
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verificar cuando se completan los 6 dígitos
    if (newCode.every(digit => digit !== '') && value) {
      handleVerifyCode(newCode.join(''));
    }
  };

  // ✅ Función para manejar backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Verificar código
  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyCode({ email, code: codeToVerify });
      
      if (response.success) {
        Alert.alert(
          '¡Verificación exitosa!',
          'Tu cuenta ha sido verificada correctamente',
          [
            {
              text: 'Continuar',
              onPress: () => {
                if (fromRegistration) {
                  // Si viene del registro, redirigir al login
                  navigation.navigate('Login');
                } else {
                  // Si viene de otro flujo, ir hacia atrás
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Código incorrecto');
        // Limpiar código en caso de error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      Alert.alert('Error', 'No se pudo verificar el código');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Reenviar código de verificación
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const response = await resendVerificationCode(email);
      
      if (response.success) {
        Alert.alert('Código enviado', 'Hemos enviado un nuevo código a tu correo electrónico');
        setCountdown(60); // 60 segundos antes de poder reenviar otra vez
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'No se pudo reenviar el código');
      }
    } catch (error) {
      console.error('Error reenviando código:', error);
      Alert.alert('Error', 'No se pudo reenviar el código');
    } finally {
      setIsResending(false);
    }
  };

  // ✅ Limpiar código
  const handleClearCode = () => {
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#284F66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificar Email</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Icono y título */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Icon name="mark-email-read" size={48} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>Verificar tu cuenta</Text>
            <Text style={styles.description}>
              Hemos enviado un código de verificación de 6 dígitos a:
            </Text>
            <Text style={styles.email}>{email}</Text>

            {/* Inputs para código */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : {},
                    isLoading ? styles.codeInputDisabled : {}
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!isLoading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Botón de verificar */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isLoading || code.join('').length !== 6) && styles.disabledButton
              ]}
              onPress={() => handleVerifyCode()}
              disabled={isLoading || code.join('').length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            {/* Botón de limpiar */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCode}
              disabled={isLoading}
            >
              <Text style={styles.clearButtonText}>Limpiar código</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>¿No recibiste el código?</Text>
              <View style={styles.divider} />
            </View>

            {/* Botón de reenviar */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                (isResending || countdown > 0) && styles.disabledButton
              ]}
              onPress={handleResendCode}
              disabled={isResending || countdown > 0}
            >
              {isResending ? (
                <ActivityIndicator color="#284F66" size="small" />
              ) : (
                <Text style={styles.resendButtonText}>
                  {countdown > 0 
                    ? `Reenviar código en ${countdown}s` 
                    : 'Reenviar código'
                  }
                </Text>
              )}
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Icon name="info-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                El código expira en 15 minutos. Si no lo encuentras, revisa tu carpeta de spam.
              </Text>
            </View>

            {/* Cambiar email */}
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.changeEmailButtonText}>
                ¿Quieres usar otro email?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#284F66',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#284F66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#284F66',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#284F66',
    marginBottom: 40,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%',
    maxWidth: 300,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#284F66',
    backgroundColor: '#fff',
  },
  codeInputFilled: {
    borderColor: '#284F66',
    backgroundColor: '#f8f9fa',
  },
  codeInputDisabled: {
    opacity: 0.6,
  },
  verifyButton: {
    backgroundColor: '#284F66',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
    shadowColor: '#284F66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  resendButton: {
    borderWidth: 1,
    borderColor: '#284F66',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  resendButtonText: {
    color: '#284F66',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  changeEmailButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  changeEmailButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default VerifyEmailScreen;