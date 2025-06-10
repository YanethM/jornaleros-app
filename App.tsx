import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

import SplashScreen from "./src/screens/public/SplashScreen";
import OnboardingScreen from "./src/screens/public/OnboardingScreen";
import PublicHome from "./src/screens/public/PublicHome"; // 🎯 NUEVA PANTALLA
import AboutScreen from "./src/screens/public/AboutScreen";
import ContactScreen from "./src/screens/public/ContactScreen";
import TutorialScreen from "./src/screens/public/TutorialScreen";
import TutorialApp from "./src/screens/productor/TutorialApp";
import Terms from "./src/screens/public/TermsScreen";

// Pantallas del Empleador/Productor
import AddTerrainScreen from "./src/screens/productor/AddTerrainScreen";
import TerrainDetail from "./src/screens/productor/TerrainDetail";
import AddMessageScreen from "./src/screens/productor/AddMessageScreen";
import TerrainScreen from "./src/screens/productor/TerrainScreen";
import HomeScreen from "./src/screens/productor/AppWithTabs/TabNavigator/HomeScreen";
import NotificationsScreen from "./src/screens/productor/MessagesScreen";
import WorkerListScreen from "./src/screens/productor/WorkerListScreen";
import CreateJobOfferScreen from "./src/screens/productor/CreateJobOffer";
import JobOffersScreen from "./src/screens/productor/JobOffersScreen";
import JobOfferDetail from "./src/screens/productor/JobOfferDetail";
import EditJobOffer from "./src/screens/productor/EditJobOffer";
import JobApplications from "./src/screens/productor/JobApplications";

// 🎯 PANTALLAS DEL TRABAJADOR
import WorkerProfileScreen from "./src/screens/worker/WorkerProfileScreen";
import MyJobsScreen from "./src/screens/worker/MyJobs";

// Navegación
import WorkerAppWithTabs from "./src/navigation/WorkerAppWithTabs";
import TabNavigator from "./src/navigation/TabNavigator";
import EditTerrain from "./src/screens/productor/EditTerrain";

import { RootStackParamList } from "./src/navigation/types";
import LoginScreen from "./src/screens/auth/Login";
import RegisterScreen from "./src/screens/auth/Register";
import WorkerSearch from "./src/screens/productor/WorkerSearch";
import WorkerJobOfferDetail from "./src/screens/worker/WorkerJobOfferDetail";
import WorkerMessage from "./src/screens/worker/WorkerMessage";
import RateProducer from "./src/screens/worker/RateProducer";
import MessagesScreen from "./src/screens/productor/MessagesScreen";
import NewMessageScreen from "./src/screens/productor/NewMessageScreen";
import WorkerJobsScreen from "./src/screens/worker/WorkerJobScreen";
import CancelApplication from "./src/screens/worker/CancelApplication";
import WorkerApplicationsScreen from "./src/screens/worker/WorkerApplicationScreen";
import WorkerProfileByEmployer from "./src/screens/productor/WorkerProfileByEmployer";
import WorkerProfileApplication from "./src/screens/productor/WorkerProfileApplication";
import WorkerApplicationDetail from "./src/screens/worker/WorkerApplicationDetail";
import WorkerJobOfferDetailNoAuth from "./src/screens/public/WorkerJobOfferDetailNoAuth";
import PasswordResetScreen from "./src/screens/auth/PasswordResetScreen";
import VerifyEmailScreen from "./src/screens/auth/VerifyEmailScreen";
import PublicHomePreview from "./src/screens/productor/PublicHomePreview";
import EditProfileEmployer from "./src/screens/productor/EditProfileEmployer";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, isLoading, hasWorkerProfile, hasEmployerProfile } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem("@has_seen_onboarding");
      setHasSeenOnboarding(!!seen);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setHasSeenOnboarding(false);
    }
  };

  const getUserRole = () => {
    if (!user) return null;

    // Debug: agregar logs para ver qué está pasando
    console.log("🔍 Debug getUserRole:", {
      user: user?.id,
      userRole: user?.role,
      hasWorkerProfile,
      hasEmployerProfile,
    });

    if (typeof user.role === "string") {
      return user.role.toLowerCase();
    } else if (user.role && user.role.name) {
      return user.role.name.toLowerCase();
    }

    const workerProfileExists = hasWorkerProfile === true;
    const employerProfileExists = hasEmployerProfile === true;

    if (workerProfileExists) return "trabajador";
    if (employerProfileExists) return "empleador";

    return "trabajador"; // Default seguro
  };

  if (isLoading || hasSeenOnboarding === null) {
    return <SplashScreen />;
  }

  if (user) {
    const userRole = getUserRole();
    const isWorker = userRole === "trabajador";
    const isEmployer = userRole === "empleador";

    // Debug: ver los roles calculados
    console.log("🎭 Roles calculados:", { userRole, isWorker, isEmployer });

    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 🏠 PANTALLA PRINCIPAL */}
        {isWorker ? (
          <Stack.Screen name="MainApp" component={WorkerAppWithTabs} />
        ) : (
          <Stack.Screen name="MainApp" component={TabNavigator} />
        )}

        {/* 🌟 PANTALLAS COMUNES - SIEMPRE DISPONIBLES */}
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Terms" component={Terms} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="TutorialApp" component={TutorialApp} />

        {/* 🎯 PANTALLAS DEL TRABAJADOR */}
        <Stack.Screen name="MyJobs" component={MyJobsScreen} />
        <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
        <Stack.Screen name="WorkerMessage" component={WorkerMessage} />
        <Stack.Screen name="RateProducer" component={RateProducer} />
        <Stack.Screen name="WorkerJobs" component={WorkerJobsScreen} />
        <Stack.Screen name="CancelApplication" component={CancelApplication} />
        <Stack.Screen
          name="WorkerApplications"
          component={WorkerApplicationsScreen}
        />
        <Stack.Screen
          name="WorkerApplicationDetail"
          component={WorkerApplicationDetail}
        />
        <Stack.Screen
          name="WorkerJobOfferDetail"
          component={WorkerJobOfferDetail}
        />

        {/* PANTALLAS DE MENSAJES DEL TRABAJADOR */}

        {/* 🏭 PANTALLAS DEL EMPLEADOR */}
        <Stack.Screen name="AddTerrain" component={AddTerrainScreen} />
        <Stack.Screen name="EditTerrain" component={EditTerrain} />
        <Stack.Screen name="TerrainDetail" component={TerrainDetail} />
        <Stack.Screen name="AddMessage" component={AddMessageScreen} />
        <Stack.Screen name="Terrenos" component={TerrainScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="WorkerList" component={WorkerListScreen} />
        <Stack.Screen name="CreateJobOffer" component={CreateJobOfferScreen} />
        <Stack.Screen name="JobOffers" component={JobOffersScreen} />
        <Stack.Screen name="EditJobOffer" component={EditJobOffer} />
        <Stack.Screen name="JobApplications" component={JobApplications} />
        <Stack.Screen name="Mensajes" component={MessagesScreen} />
        <Stack.Screen name="NewMessage" component={NewMessageScreen} />
        <Stack.Screen name="WorkerSearch" component={WorkerSearch} />
        <Stack.Screen name="JobOfferDetail" component={JobOfferDetail} />
        <Stack.Screen name="PublicHomePreview" component={PublicHomePreview} />
        <Stack.Screen name="EditProfileEmployer" component={EditProfileEmployer} />
        <Stack.Screen
          name="WorkerProfileByEmployer"
          component={WorkerProfileByEmployer}
        />
        <Stack.Screen
          name="WorkerProfileApplication"
          component={WorkerProfileApplication}
        />
        {/* <Stack.Screen name="Reports" component={ReportsScreen} /> */}
      </Stack.Navigator>
    );
  }

  // PANTALLAS PÚBLICAS - PublicHome como vista principal
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenOnboarding ? "PublicHome" : "Tutorial"}>
      {/* 🎯 ONBOARDING FLOW */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />

      {/* 🏠 PANTALLA PRINCIPAL PÚBLICA */}
      <Stack.Screen name="PublicHome" component={PublicHome} />

      {/* 🔐 AUTENTICACIÓN */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={RegisterScreen} />
      <Stack.Screen
        name="PasswordReset"
        component={PasswordResetScreen}
        options={{
          title: "Recuperar Contraseña",
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{
          title: "Verificar Email",
        }}
      />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Terms" component={Terms} />

      {/* 📄 DETALLE DE OFERTAS PÚBLICAS */}
      <Stack.Screen
        name="WorkerJobOfferDetailNoAuth"
        component={WorkerJobOfferDetailNoAuth}
      />
      {/* 🔍 PANTALLAS ADICIONALES PÚBLICAS */}
      <Stack.Screen
        name="AllJobs"
        component={JobOffersScreen}
        options={{ title: "Todas las ofertas" }}
      />
      <Stack.Screen
        name="CategoryJobs"
        component={JobOffersScreen}
        options={{ title: "Ofertas por categoría" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
