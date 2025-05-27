import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import ApiClient from "../utils/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUserLoggedIn();
    ApiClient.setAuthContext({ signOut });
  }, []);

  const checkTokenExpiration = async () => {
    try {
      const token = await AsyncStorage.getItem("@user_token");
      if (!token) {
        return false;
      }
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.log("Token expired, logging out...");
        await signOut();
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return false;
    }
  };

  const checkUserLoggedIn = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("@user_token");
      const storedUser = await AsyncStorage.getItem("@user_data");
      
      if (storedToken && storedUser) {
        // Check if token is still valid
        const isValid = await checkTokenExpiration();
        if (isValid) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Token is expired, clear data
          await signOut();
        }
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data) => {
    try {
      await AsyncStorage.setItem("@user_token", data.token);
      const response = await ApiClient.get(`/user/list/${data.user.id}`);
      const fullUser = response.data;
      await AsyncStorage.setItem("@user_data", JSON.stringify(fullUser));
      setUser(fullUser);
      setIsAuthenticated(true);
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
      // ❌ NO HACER ESTO: navigation.navigate("Login");
      // El App.tsx se encarga automáticamente cuando user = null
    } catch (error) {
      console.error("Error during sign out:", error);
      // Continue with sign out even if there's an error
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        checkTokenExpiration
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