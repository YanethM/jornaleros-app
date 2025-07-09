import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import {
  RootStackParamList,
  EmployerStackParamList,
  WorkerStackParamList,
  AdminStackParamList,
} from "./src/navigation/types";

import SplashScreen from "./src/screens/public/SplashScreen";
import OnboardingScreen from "./src/screens/public/OnboardingScreen";
import PublicHome from "./src/screens/public/PublicHome";

// Tab Navigators
import TabNavigator from "./src/navigation/TabNavigator";
import WorkerTabNavigator from "./src/navigation/WorkerAppWithTabs";
import AdminTabNavigator from "./src/navigation/AdminAppWithTabs"; // ← AGREGADO

// Employer screens
import AddTerrainScreen from "./src/screens/productor/AddTerrainScreen";
import EditTerrain from "./src/screens/productor/EditTerrain";
import TerrainDetail from "./src/screens/productor/TerrainDetail";
import CreateJobOfferScreen from "./src/screens/productor/CreateJobOffer";
import JobOffersScreen from "./src/screens/productor/JobOffersScreen";
import JobOfferDetail from "./src/screens/productor/JobOfferDetail";
import EditJobOfferScreen from "./src/screens/productor/EditJobOffer";
import WorkerListScreen from "./src/screens/productor/WorkerListScreen";
import NewMessageScreen from "./src/screens/productor/NewMessageScreen";
import PublicHomePreview from "./src/screens/productor/PublicHomePreview";
import WorkerProfileByEmployer from "./src/screens/productor/WorkerProfileByEmployer";
import WorkerProfileApplication from "./src/screens/productor/WorkerProfileApplication";
import JobOfferWithApplication from "./src/screens/productor/JobOfferWithApplication";
import AddMessageScreen from "./src/screens/productor/AddMessageScreen";
import RateWorker from "./src/screens/productor/RateWorker";
import JobApplications from "./src/screens/productor/JobApplications";
import HomeScreen from "./src/screens/productor/AppWithTabs/TabNavigator/HomeScreen";
import TutorialApp from "./src/screens/productor/TutorialApp";

// Worker screens
import WorkerJobOfferDetail from "./src/screens/worker/WorkerJobOfferDetail";
import WorkerMessage from "./src/screens/worker/WorkerMessage";
import RateProducer from "./src/screens/worker/RateProducer";
import WorkerJobsScreen from "./src/screens/worker/WorkerJobScreen";
import WorkerApplicationDetail from "./src/screens/worker/WorkerApplicationDetail";
import MyJobsScreen from "./src/screens/worker/MyJobs";

// Admin Screens
import AdminHomeScreen from "./src/screens/admin/AdminHomeScreen";
import AdminCropTypesScreen from "./src/screens/admin/AdminCropTypesScreen";
import UsersAppScreen from "./src/screens/admin/UsersAppScreen";

// Public screens
import AboutScreen from "./src/screens/public/AboutScreen";
import ContactScreen from "./src/screens/public/ContactScreen";
import Terms from "./src/screens/public/TermsScreen";
import CancelAccount from "./src/screens/public/CancelAccount";
import TutorialScreen from "./src/screens/public/TutorialScreen";
import RegisterScreen from "./src/screens/auth/Register";
import LoginScreen from "./src/screens/auth/Login";
import PasswordResetScreen from "./src/screens/auth/PasswordResetScreen";
import VerifyEmailScreen from "./src/screens/auth/VerifyEmailScreen";
import WorkerJobOfferDetailNoAuth from "./src/screens/public/WorkerJobOfferDetailNoAuth";
import CancelApplication from "./src/screens/worker/CancelApplication";
import EmployerRating from "./src/screens/worker/EmployerRating";
import CreateCropTypeScreen from "./src/screens/admin/CreateCropTypeScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import UserDetail from "./src/screens/admin/UserDetail";
import CropTypePhaseScreen from "./src/screens/admin/CropTypePhaseScreen";
import AdminFarmsManagement from "./src/screens/admin/AdminFarmsManagement";
import ReportsScreen from "./src/screens/admin/ReportsScreen";
import ReportDetailScreen from "./src/screens/admin/ReportDetail";
import AdminDeletionRequests from "./src/screens/admin/AdminDeletionRequests";
import { AdminUserRating } from "./src/screens/admin/AdminUserRating";

// ✅ DECLARAR TODOS LOS STACK NAVIGATORS
const RootStack = createNativeStackNavigator<RootStackParamList>();
const EmployerStack = createNativeStackNavigator<EmployerStackParamList>();
const WorkerStack = createNativeStackNavigator<WorkerStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>(); // ← AGREGADO

// Employer Stack Navigator with Tab Navigator as the main screen
function EmployerAppWithTabs() {
  return (
    <EmployerStack.Navigator screenOptions={{ headerShown: false }}>
      <EmployerStack.Screen name="EmployerTabs" component={TabNavigator} />
      <EmployerStack.Screen name="AddTerrain" component={AddTerrainScreen} />
      <EmployerStack.Screen name="EditTerrain" component={EditTerrain} />
      <EmployerStack.Screen name="TerrainDetail" component={TerrainDetail} />
      <EmployerStack.Screen name="AddMessage" component={AddMessageScreen} />
      <EmployerStack.Screen
        name="CreateJobOffer"
        component={CreateJobOfferScreen}
      />
      <EmployerStack.Screen name="JobOffers" component={JobOffersScreen} />
      <EmployerStack.Screen name="JobOfferDetail" component={JobOfferDetail} />
      <EmployerStack.Screen
        name="EditJobOffer"
        component={EditJobOfferScreen}
      />
      <EmployerStack.Screen name="WorkerList" component={WorkerListScreen} />
      <EmployerStack.Screen name="NewMessage" component={NewMessageScreen} />
      <EmployerStack.Screen
        name="PublicHomePreview"
        component={PublicHomePreview}
      />
      <EmployerStack.Screen
        name="WorkerProfileByEmployer"
        component={WorkerProfileByEmployer}
      />
      <EmployerStack.Screen
        name="WorkerProfileApplication"
        component={WorkerProfileApplication}
      />
      <EmployerStack.Screen
        name="JobOfferWithApplication"
        component={JobOfferWithApplication}
      />
      <EmployerStack.Screen
        name="JobApplications"
        component={JobApplications}
      />
      <EmployerStack.Screen name="RateWorker" component={RateWorker} />
    </EmployerStack.Navigator>
  );
}

// Worker Stack Navigator with Tab Navigator as the main screen
function WorkerAppWithTabs() {
  return (
    <WorkerStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkerStack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      <WorkerStack.Screen name="Skills" component={RateProducer} />
      <WorkerStack.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="WorkerJobOfferDetail"
        component={WorkerJobOfferDetail}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="WorkerNotifications"
        component={CancelApplication}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="WorkerMessage"
        component={WorkerMessage}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="RateProducer"
        component={RateProducer}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="CancelApplications"
        component={CancelApplication}
        options={{ headerShown: false }}
      />
      <WorkerStack.Screen
        name="EmployerRating"
        component={EmployerRating}
        options={{ headerShown: false }}
      />
    </WorkerStack.Navigator>
  );
}

// ✅ ADMIN STACK NAVIGATOR CORREGIDO
function AdminAppWithTabs() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <AdminStack.Screen
        name="CreateCropType"
        component={CreateCropTypeScreen}
      />
      <AdminStack.Screen
        name="FarmsManagement"
        component={AdminFarmsManagement}
      />
      <AdminStack.Screen
        name="AdminCropTypes"
        component={AdminCropTypesScreen}
      />
      <AdminStack.Screen name="CropTypePhase" component={CropTypePhaseScreen} />
      <AdminStack.Screen name="UserDetail" component={UserDetail} />
      <AdminStack.Screen name="Reports" component={ReportsScreen} />
      <AdminStack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <AdminStack.Screen
        name="AdminDeletionRequests"
        component={AdminDeletionRequests}
      />
      <AdminStack.Screen name="AdminUserRating" component={AdminUserRating} />
    </AdminStack.Navigator>
  );
}

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
      console.log("🔍 Checking onboarding status:", {
        seen,
        type: typeof seen,
      });

      const hasCompleted = seen === "true";
      setHasSeenOnboarding(hasCompleted);

      console.log("✅ Onboarding status set to:", hasCompleted);
      console.log(
        "📍 Will navigate to:",
        hasCompleted ? "PublicHome" : "Onboarding"
      );
    } catch (error) {
      console.error("❌ Error checking onboarding status:", error);
      setHasSeenOnboarding(false);
    }
  };

  const getUserRole = () => {
    if (!user) return null;

    // Verificar si es administrador primero
    if (typeof user.role === "string") {
      const roleName = user.role.toLowerCase();
      if (roleName === "administrador" || roleName === "admin") {
        return "administrador";
      }
      return roleName;
    } else if (user.role && user.role.name) {
      const roleName = user.role.name.toLowerCase();
      if (roleName === "administrador" || roleName === "admin") {
        return "administrador";
      }
      return roleName;
    }

    // Fallback a la lógica existente
    const workerProfileExists = hasWorkerProfile === true;
    const employerProfileExists = hasEmployerProfile === true;

    if (workerProfileExists) return "trabajador";
    if (employerProfileExists) return "empleador";

    return "trabajador";
  };

  if (isLoading || hasSeenOnboarding === null) {
    return <SplashScreen />;
  }

  if (user) {
    const userRole = getUserRole();
    const isWorker = userRole === "trabajador";
    const isEmployer = userRole === "empleador";
    const isAdmin = userRole === "administrador";

    console.log("🔍 User role detected:", userRole);

    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main app screens based on role */}
        {isAdmin ? (
          <RootStack.Screen name="AdminApp" component={AdminAppWithTabs} />
        ) : isWorker ? (
          <RootStack.Screen name="WorkerApp" component={WorkerAppWithTabs} />
        ) : (
          <RootStack.Screen
            name="EmployerApp"
            component={EmployerAppWithTabs}
          />
        )}

        {/* Shared screens that all roles might need */}
        <RootStack.Screen name="About" component={AboutScreen} />
        <RootStack.Screen name="Contact" component={ContactScreen} />
        <RootStack.Screen name="Terms" component={Terms} />
        <RootStack.Screen name="CancelAccount" component={CancelAccount} />
        <RootStack.Screen name="TutorialApp" component={TutorialApp} />
      </RootStack.Navigator>
    );
  }

  // Public screens
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenOnboarding ? "PublicHome" : "Onboarding"}>
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <RootStack.Screen name="Tutorial" component={TutorialScreen} />
      <RootStack.Screen name="PublicHome" component={PublicHome} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={RegisterScreen} />
      <RootStack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <RootStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <RootStack.Screen name="About" component={AboutScreen} />
      <RootStack.Screen name="Contact" component={ContactScreen} />
      <RootStack.Screen name="Terms" component={Terms} />
      <RootStack.Screen
        name="WorkerJobOfferDetailNoAuth"
        component={WorkerJobOfferDetailNoAuth}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
