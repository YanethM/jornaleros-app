import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';
import ApiClient from '../utils/api'; // Ajusta la ruta según tu estructura

export function useApiCall(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleUserNotFound } = useAuth();

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Ejecutando llamada a API...');
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data || null);
        console.log('✅ API call exitosa:', result.data);
      } else {
        throw new Error(result.message || 'API call failed');
      }
    } catch (err) {
      console.error('❌ Error en API call:', err);
      setError(err);
      
      // Manejar errores de autenticación usando el nuevo sistema
      if (ApiClient.isAuthError(err)) {
        console.log('🚫 Error de autenticación detectado en useApiCall');
        
        // El ApiClient ya manejó el logout, solo mostrar alerta si es necesario
        Alert.alert(
          'Sesión Expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Asegurar que se ejecute el logout si no se hizo automáticamente
                if (handleUserNotFound) {
                  handleUserNotFound();
                }
              }
            }
          ]
        );
        return;
      }

      // Manejar otros tipos de errores específicos
      if (err.code === 'NETWORK_ERROR') {
        Alert.alert(
          'Error de Conexión',
          'No se pudo conectar al servidor. Verifica tu conexión a internet.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Para errores 400 (datos incorrectos)
      if (err.status === 400) {
        Alert.alert(
          'Datos Incorrectos',
          err.message || 'Por favor, verifica la información ingresada.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Para errores 404 (recurso no encontrado) que no son de autenticación
      if (err.status === 404 && !ApiClient.isAuthError(err)) {
        Alert.alert(
          'No Encontrado',
          err.message || 'El recurso solicitado no fue encontrado.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Para errores 500 (servidor)
      if (err.status === 500) {
        Alert.alert(
          'Error del Servidor',
          'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Para otros errores, mostrar mensaje genérico
      Alert.alert(
        'Error',
        err.message || 'Ha ocurrido un error inesperado.',
        [{ text: 'OK' }]
      );

    } finally {
      setLoading(false);
    }
  }, [apiFunction, handleUserNotFound]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Función para ejecutar sin mostrar alertas automáticas
  const executeSilent = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data || null);
        return result;
      } else {
        throw new Error(result.message || 'API call failed');
      }
    } catch (err) {
      setError(err);
      
      // Solo manejar errores de autenticación automáticamente
      if (ApiClient.isAuthError(err)) {
        if (handleUserNotFound) {
          handleUserNotFound();
        }
      }
      
      throw err; // Re-lanzar para que el componente lo maneje
    } finally {
      setLoading(false);
    }
  }, [apiFunction, handleUserNotFound]);

  return { 
    data, 
    loading, 
    error, 
    execute, 
    executeSilent, // Nueva función para ejecución sin alertas automáticas
    reset,
    // Utilidades adicionales
    isAuthError: error ? ApiClient.isAuthError(error) : false,
    isNetworkError: error?.code === 'NETWORK_ERROR',
    isServerError: error?.status >= 500,
  };
}

// Hook especializado para llamadas que requieren autenticación
export function useAuthenticatedApiCall(apiFunction) {
  const baseHook = useApiCall(apiFunction);
  const { isAuthenticated } = useAuth();

  // Wrapper que verifica autenticación antes de ejecutar
  const executeWithAuthCheck = useCallback(async (...args) => {
    if (!isAuthenticated) {
      Alert.alert(
        'No Autenticado',
        'Debes iniciar sesión para realizar esta acción.',
        [{ text: 'OK' }]
      );
      return;
    }

    return baseHook.execute(...args);
  }, [isAuthenticated, baseHook.execute]);

  return {
    ...baseHook,
    execute: executeWithAuthCheck,
  };
}

// Hook para múltiples llamadas a API en paralelo
export function useParallelApiCalls(apiFunctions) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const { handleUserNotFound } = useAuth();

  const executeAll = useCallback(async (...argsArrays) => {
    try {
      setLoading(true);
      setErrors([]);
      
      const promises = apiFunctions.map((apiFunction, index) => {
        const args = argsArrays[index] || [];
        return apiFunction(...args);
      });

      const results = await Promise.allSettled(promises);
      
      const successData = [];
      const errorList = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successData[index] = result.value.data;
          } else {
            errorList[index] = new Error(result.value.message || 'API call failed');
          }
        } else {
          errorList[index] = result.reason;
          
          // Manejar errores de autenticación
          if (ApiClient.isAuthError(result.reason)) {
            if (handleUserNotFound) {
              handleUserNotFound();
            }
          }
        }
      });

      setData(successData);
      setErrors(errorList);

    } catch (err) {
      console.error('Error en llamadas paralelas:', err);
      setErrors([err]);
    } finally {
      setLoading(false);
    }
  }, [apiFunctions, handleUserNotFound]);

  const reset = useCallback(() => {
    setData([]);
    setErrors([]);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    errors,
    executeAll,
    reset,
    hasErrors: errors.length > 0,
    hasAuthErrors: errors.some(error => error && ApiClient.isAuthError(error)),
  };
}