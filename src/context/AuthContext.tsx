import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiClient from "../utils/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [hasWorkerProfile, setHasWorkerProfile] = useState(null);
  const [hasEmployerProfile, setHasEmployerProfile] = useState(null);

  useEffect(() => {
    checkUserLoggedIn();
    ApiClient.setAuthContext({ signOut });
  }, []);

  // Función para determinar perfiles basado en el usuario
  const checkUserProfiles = (userData) => {
    console.log("🔍 Checking user profiles for:", userData);
    
    if (!userData) {
      setHasWorkerProfile(false);
      setHasEmployerProfile(false);
      return;
    }
  
    // Nueva lógica más robusta para detectar perfiles
    const hasWP = !!userData.workerProfile;
    const hasEP = !!userData.employerProfile;
    
    setHasWorkerProfile(hasWP);
    setHasEmployerProfile(hasEP);
  
    console.log("📋 Profiles detected:", {
      worker: hasWP,
      employer: hasEP
    });
  };

  const checkUserLoggedIn = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("@user_token");
      const storedUser = await AsyncStorage.getItem("@user_data");

      if (storedToken && storedUser) {
        // ✅ Ya no verificamos expiración, si existe token y usuario, restauramos la sesión
        const parsedUser = JSON.parse(storedUser);
        console.log("✅ Restored user from storage:", parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        checkUserProfiles(parsedUser);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    setIsLoading(true);
    
    try {
      console.log("🔑 Attempting login with:", credentials);
      const response = await ApiClient.post('/auth/login', credentials);
      console.log("📡 Login API response:", response);
      
      if (response.success && response.data) {
        await signIn(response.data);
        return response;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data) => {
    try {
      console.log("📝 Signing in user:", data);
      
      await AsyncStorage.setItem("@user_token", data.token);
      
      // Obtener datos completos del usuario
      const response = await ApiClient.get(`/user/list/${data.user.id}`);
      const fullUser = response.data;
      
      console.log("👤 Full user data:", fullUser);
      
      await AsyncStorage.setItem("@user_data", JSON.stringify(fullUser));
      
      setUser(fullUser);
      setIsAuthenticated(true);
      checkUserProfiles(fullUser);
      
      console.log("✅ Sign in completed successfully");
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("@user_token");
      await AsyncStorage.removeItem("@user_data");
      setUser(null);
      setIsAuthenticated(false);
      setHasWorkerProfile(null);
      setHasEmployerProfile(null);
    } catch (error) {
      console.error("Error during sign out:", error);
      setUser(null);
      setIsAuthenticated(false);
      setHasWorkerProfile(null);
      setHasEmployerProfile(null);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      return { success: true, message: "Sesión cerrada correctamente" };
    } catch (error) {
      return { success: false, message: "Error al cerrar sesión", error: error };
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      console.log("🔄 Actualizando usuario en contexto:", updatedUserData);
      
      // Actualizar el estado del contexto
      setUser(updatedUserData);
      
      // Actualizar AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      console.log("✅ Usuario actualizado en contexto y AsyncStorage");
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
    }
  };

  // Función para refrescar datos del usuario desde AsyncStorage
  const refreshUserData = async () => {
    try {
      console.log("🔄 Refrescando datos del usuario...");
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("✅ Datos del usuario refrescados");
        return parsedUser;
      }
    } catch (error) {
      console.error("❌ Error refrescando datos del usuario:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        hasWorkerProfile,
        hasEmployerProfile,
        login,
        signIn,
        signOut,
        logout,
        updateUser,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};