import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { confirmAccountCancellation, requestAccountCancellation } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CancelAccountProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface RequestCancellationData {
  reason?: string;
  token?: string; // Agregar token si es necesario
}

interface ConfirmCancellationData {
  code: string;
  token?: string; // Agregar token si es necesario
}

const CancelAccount: React.FC<CancelAccountProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [reason, setReason] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Log para verificar que las props lleguen correctamente
  useEffect(() => {
    console.log('CancelAccount props:', { onCancel: !!onCancel, onSuccess: !!onSuccess });
  }, [onCancel, onSuccess]);

  // Contador regresivo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'confirm' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            Alert.alert(
              'Código Expirado',
              'El código de verificación ha expirado. Debes solicitar uno nuevo.',
              [{ text: 'OK', onPress: () => setStep('request') }]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Verificar si el usuario aún existe al montar el componente
  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const token = await AsyncStorage.getItem('@user_token');
        if (!token) {
          // No hay token, redirigir inmediatamente
          console.log('No token found, redirecting to PublicHome');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error checking user token:', error);
        // En caso de error, también redirigir
        onSuccess?.();
      }
    };

    checkUserExists();
  }, [onSuccess]);

  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@user_token',
        '@user_data',
        '@refresh_token'
      ]);
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestCancellation = async () => {
    setShowWarningModal(true);
  };

  const getAuthToken = async (): Promise<string> => {
    try {
      // Usar la misma clave que el AuthContext
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        throw new Error('No token found');
      }
      console.log('Auth token retrieved successfully');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  };

  const confirmRequestCancellation = async () => {
    setShowWarningModal(false);
    setLoading(true);

    try {
      // Obtener el token de autenticación
      const token = await getAuthToken();
      
      const requestData: RequestCancellationData = {
        reason: reason.trim() || undefined,
        token // Pasar el token explícitamente si es necesario
      };

      const response = await requestAccountCancellation(requestData);

      if (response.success) {
        setEmail(response.data?.email || '');
        setStep('confirm');
        setTimeLeft(15 * 60);
        Alert.alert(
          'Código Enviado',
          `Se ha enviado un código de verificación a ${response.data?.email}. Válido por ${response.expiresIn || '15 minutos'}.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      
      if (error.message === 'No token found') {
        Alert.alert('Error', 'Sesión expirada. Por favor inicia sesión nuevamente.');
        onCancel?.();
      } else if (
        error.status === 404 || 
        error?.data?.code === 'USER_NOT_FOUND' ||
        error?.message?.includes('Usuario no encontrado')
      ) {
        // Usuario ya fue eliminado, limpiar storage y redirigir
        console.log('User not found, clearing data and redirecting');
        await clearUserData();
        
        // Redirección directa como respaldo
        setTimeout(() => {
          console.log('Direct redirect after 100ms');
          onSuccess?.();
        }, 100);
        
        Alert.alert(
          'Cuenta no encontrada',
          'Tu cuenta ya fue eliminada. Serás redirigido.',
          [{
            text: 'OK',
            onPress: () => {
              console.log('Redirecting to PublicHome from 404 handler');
              onSuccess?.();
            }
          }]
        );
      } else {
        Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }

    Alert.alert(
      '⚠️ CONFIRMACIÓN FINAL',
      'Esta acción eliminará PERMANENTEMENTE tu cuenta y todos tus datos. No podrás recuperar esta información. ¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'SÍ, ELIMINAR',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            try {
              // Obtener el token de autenticación
              const token = await getAuthToken();
              
              const confirmData: ConfirmCancellationData = {
                code: code.trim(),
                token // Pasar el token explícitamente si es necesario
              };

              const response = await confirmAccountCancellation(confirmData);

              if (response.success) {
                Alert.alert(
                  'Cuenta Eliminada',
                  'Tu cuenta ha sido eliminada exitosamente. Serás redirigido a la pantalla principal.',
                  [{ text: 'OK', onPress: onSuccess }]
                );
              } else {
                Alert.alert('Error', response.message || 'Error al confirmar la cancelación');
              }
            } catch (error) {
              if (error.message === 'No token found') {
                Alert.alert('Error', 'Sesión expirada. Por favor inicia sesión nuevamente.');
                onCancel?.(); // Regresar a la pantalla anterior
              } else {
                Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
              }
              console.error('Error confirming cancellation:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderRequestStep = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="warning" size={48} color="#284F66" />
        <Text style={styles.title}>Cancelar Cuenta</Text>
        <Text style={styles.subtitle}>
          Esta acción eliminará permanentemente tu cuenta y todos los datos asociados
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ ADVERTENCIA IMPORTANTE</Text>
        <Text style={styles.warningText}>
          Al cancelar tu cuenta se eliminarán de forma PERMANENTE:
        </Text>
        <View style={styles.warningList}>
          <Text style={styles.warningItem}>• Tu perfil completo e información personal</Text>
          <Text style={styles.warningItem}>• Historial de trabajos y aplicaciones</Text>
          <Text style={styles.warningItem}>• Mensajes y notificaciones</Text>
          <Text style={styles.warningItem}>• Calificaciones y reviews</Text>
          <Text style={styles.warningItem}>• Granjas y ofertas de trabajo</Text>
          <Text style={styles.warningItem}>• Cualificaciones y habilidades</Text>
        </View>
        <Text style={styles.warningFooter}>
          Esta acción NO se puede deshacer. No podrás recuperar estos datos.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Razón de cancelación (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Cuéntanos por qué quieres cancelar tu cuenta..."
          placeholderTextColor="#9ca3af"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{reason.length}/500</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Mantener Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.disabledButton]}
          onPress={handleRequestCancellation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#ffffff" />
              <Text style={styles.deleteButtonText}>Continuar con Cancelación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="mail" size={48} color="#059669" />
        <Text style={styles.title}>Confirmar Cancelación</Text>
        <Text style={styles.subtitle}>
          Hemos enviado un código de verificación a {email}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>Tiempo restante:</Text>
        <Text style={[
          styles.timerValue,
          timeLeft < 300 && styles.timerWarning // Menos de 5 minutos
        ]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Código de verificación</Text>
        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor="#9ca3af"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="numeric"
          textAlign="center"
          maxLength={6}
          autoFocus
        />
        <Text style={styles.codeHint}>
          Ingresa el código de 6 dígitos que recibiste por email
        </Text>
      </View>

      <View style={styles.finalWarning}>
        <Ionicons name="skull" size={24} color="#284F66" />
        <Text style={styles.finalWarningText}>
          Una vez confirmes, tu cuenta será eliminada INMEDIATAMENTE y de forma PERMANENTE
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep('request')}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.disabledButton]}
          onPress={handleConfirmCancellation}
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.deleteButtonText}>ELIMINAR CUENTA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={() => setStep('request')}
        disabled={loading || timeLeft > 0}
      >
        <Text style={[
          styles.resendButtonText,
          (loading || timeLeft > 0) && styles.disabledText
        ]}>
          ¿No recibiste el código? Enviar nuevo código
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
      />
      {step === 'request' ? renderRequestStep() : renderConfirmStep()}
      
      {/* Modal de advertencia final */}
      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#284F66" />
            <Text style={styles.modalTitle}>⚠️ ÚLTIMA ADVERTENCIA</Text>
            <Text style={styles.modalText}>
              Estás a punto de iniciar el proceso de eliminación de tu cuenta.
              {'\n\n'}
              Esta acción es IRREVERSIBLE y eliminará todos tus datos permanentemente.
              {'\n\n'}
              ¿Estás seguro de que quieres continuar?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={styles.modalCancelText}>No, mantener cuenta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmRequestCancellation}
              >
                <Text style={styles.modalConfirmText}>Sí, continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#284F66',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#284F66',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#1a365d',
    marginBottom: 12,
  },
  warningList: {
    marginBottom: 12,
  },
  warningItem: {
    fontSize: 14,
    color: '#1a365d',
    marginBottom: 6,
  },
  warningFooter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#284F66',
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f9fafb',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    backgroundColor: '#f0f9ff',
  },
  codeHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  timerWarning: {
    color: '#284F66',
  },
  finalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#284F66',
  },
  finalWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#284F66',
    marginLeft: 12,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#284F66',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#059669',
    textDecorationLine: 'underline',
  },
  disabledText: {
    color: '#9ca3af',
    textDecorationLine: 'none',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#284F66',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#284F66',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default CancelAccount;