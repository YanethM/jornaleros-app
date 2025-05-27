import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('@user_token');
      const userData = await AsyncStorage.getItem('@user_data');
      
      console.log('=== AsyncStorage Data ===');
      console.log('Token exists:', !!token);
      console.log('Token:', token);
      console.log('User data exists:', !!userData);
      console.log('User data:', userData ? JSON.parse(userData) : null);
      console.log('========================');
      
      return {
        token,
        userData: userData ? JSON.parse(userData) : null
      };
    } catch (error) {
      console.error('Error checking stored data:', error);
      return null;
    }
  };