import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';

interface UseApiCallResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<{ success: boolean; data?: T; message?: string }>
): UseApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { signOut } = useAuth();

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (result.success) {
        setData(result.data || null);
      } else {
        throw new Error(result.message || 'API call failed');
      }
    } catch (err: any) {
      setError(err);
      
      // Handle specific error cases
      if (err.message === 'Session expired. Please login again.') {
        Alert.alert(
          'Sesión Expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [{ text: 'OK', onPress: () => signOut() }]
        );
      }
    } finally {
      setLoading(false);
    }
  }, [apiFunction, signOut]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}