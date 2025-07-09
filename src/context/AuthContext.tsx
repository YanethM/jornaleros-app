import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiClient from "../utils/api";
import { useNavigation } from "@react-navigation/native";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasWorkerProfile, setHasWorkerProfile] = useState(null);
  const [hasEmployerProfile, setHasEmployerProfile] = useState(null);

  useEffect(() => {
    checkUserLoggedIn();
    ApiClient.setAuthContext({ signOut: handleUserNotFound });
  }, []);

  // Función para manejar cuando el usuario no es encontrado (401/404)
  const handleUserNotFound = async () => {
    console.log("🚫 Usuario no encontrado - cerrando sesión automáticamente");
    await signOut();
  };

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

  // Función para validar el token con el servidor
  const validateToken = async (token, userId) => {
    try {
      console.log("🔍 Validando token con el servidor...");
      
      // Intentar obtener datos del usuario para validar el token
      const response = await ApiClient.get(`/user/list/${userId}`);
      
      if (response.success && response.data) {
        console.log("✅ Token válido, usuario encontrado");
        return response.data;
      } else {
        throw new Error('Token inválido');
      }
    } catch (error) {
      console.error("❌ Error validando token:", error);
      
      // Si el error es USER_NOT_FOUND o 401/404, el token no es válido
      if (
        error.response?.status === 401 || 
        error.response?.status === 404 ||
        error.data?.code === "USER_NOT_FOUND" ||
        error.message?.includes("Usuario no encontrado")
      ) {
        console.log("🚫 Token inválido o usuario no encontrado");
        throw new Error('Token inválido');
      }
      
      // Para otros errores, asumir que es un problema temporal de red
      throw error;
    }
  };

  const checkUserLoggedIn = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem("@user_token");
      const storedUser = await AsyncStorage.getItem("@user_data");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("📱 Datos encontrados en storage, validando con servidor...");
        
        try {
          // Validar el token con el servidor
          const validatedUser = await validateToken(storedToken, parsedUser.id);
          
          console.log("✅ Sesión restaurada exitosamente:", validatedUser);
          setUser(validatedUser);
          setIsAuthenticated(true);
          checkUserProfiles(validatedUser);
          
          // Actualizar datos en AsyncStorage con la información más reciente
          await AsyncStorage.setItem("@user_data", JSON.stringify(validatedUser));
          
        } catch (validationError) {
          console.log("❌ Token inválido, limpiando sesión...");
          await signOut();
        }
      } else {
        console.log("📱 No hay datos de sesión almacenados");
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
      console.log("🚪 Cerrando sesión...");
      
      // Limpiar datos de AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem("@user_token"),
        AsyncStorage.removeItem("@user_data"),
        // Si tienes otros datos relacionados con la sesión, límpialos aquí también
        // AsyncStorage.removeItem("@other_session_data"),
      ]);
      
      // Resetear estado de autenticación
      setUser(null);
      setIsAuthenticated(false);
      setHasWorkerProfile(null);
      setHasEmployerProfile(null);
      
      console.log("✅ Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error during sign out:", error);
      
      // Aún así limpiar el estado local para evitar estados inconsistentes
      setUser(null);
      setIsAuthenticated(false);
      setHasWorkerProfile(null);
      setHasEmployerProfile(null);
      
      // Re-lanzar el error para que logout() pueda manejarlo
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await signOut();
      return { success: true, message: "Sesión cerrada correctamente" };
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      return { 
        success: false, 
        message: "Error al cerrar sesión", 
        error: error.message || error 
      };
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      console.log("🔄 Actualizando usuario en contexto:", updatedUserData);
      
      // Actualizar el estado del contexto
      setUser(updatedUserData);
      
      // Actualizar AsyncStorage
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUserData));
      
      console.log("✅ Usuario actualizado en contexto y AsyncStorage");
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
    }
  };

  // Función para refrescar datos del usuario desde el servidor
  const refreshUserData = async () => {
    try {
      console.log("🔄 Refrescando datos del usuario desde el servidor...");
      
      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }
      
      const response = await ApiClient.get(`/user/list/${user.id}`);
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        checkUserProfiles(updatedUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
        console.log("✅ Datos del usuario refrescados desde el servidor");
        return updatedUser;
      } else {
        throw new Error("Error obteniendo datos del usuario");
      }
    } catch (error) {
      console.error("❌ Error refrescando datos del usuario:", error);
      
      // Si el error es de usuario no encontrado, cerrar sesión
      if (
        error.response?.status === 401 || 
        error.response?.status === 404 ||
        error.data?.code === "USER_NOT_FOUND"
      ) {
        await handleUserNotFound();
      }
      
      throw error;
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
        refreshUserData,
        handleUserNotFound, // Exportar para uso en otros lugares
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