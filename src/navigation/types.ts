import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

// STACK NAVIGATOR - Todas las pantallas de la aplicación
export type RootStackParamList = {
  // Pantallas públicas
  Onboarding: undefined;
  Tutorial: undefined;
  Login: undefined;
  Signup: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  
  // Pantallas comunes
  MainApp: undefined;
  Notifications: undefined;
  MessageDetail: { messageId: string };
  
  // Pantalla de selección de rol
  RoleSelection: undefined;
  
  // Pantallas del Empleador/Productor
  Home: undefined;
  Profile: undefined;
  AddTerrain: undefined;
  EditTerrain: { farmId: string };
  TerrainDetail: { farmId: string };
  AddMessage: undefined;
  Terrenos: undefined;
  WorkerList: undefined;
  CreateJobOffer: undefined;
  JobOffers: undefined;
  JobOfferDetail: { jobOfferId: string };
  EditJobOffer: { jobOfferId: string };
  
  
  // Pantallas del Trabajador
  WorkerHome: undefined;
  WorkerJobs: undefined;
  WorkerProfile: undefined;
  MyApplications: undefined;
  MyJobs: undefined;
  Skills: undefined;
  JobDetail: { jobOfferId: string };
  WorkerNotifications: undefined;
};

// TAB NAVIGATOR DEL EMPLEADOR
export type EmployerTabParamList = {
  Home: undefined;
  Terrenos: undefined;
  Notifications: undefined;
  Profile: undefined;
  WorkerList: undefined;
  JobOffers: undefined;
};

// TAB NAVIGATOR DEL TRABAJADOR
export type WorkerTabParamList = {
  WorkerHome: undefined;
  WorkerJobs: undefined;
  WorkerApplications: undefined;
  WorkerProfile: undefined;
};

// LEGACY - Mantener compatibilidad con código existente
export type TabParamList = EmployerTabParamList;

// =============================================================================
// NAVIGATION PROPS - Stack Navigator
// =============================================================================

// Pantallas públicas
export type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, "Onboarding">;
export type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
export type SignupNavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;
export type AboutNavigationProp = NativeStackNavigationProp<RootStackParamList, "About">;
export type ContactNavigationProp = NativeStackNavigationProp<RootStackParamList, "Contact">;
export type TutorialNavigationProp = NativeStackNavigationProp<RootStackParamList, "Tutorial">;

// Pantallas del empleador
export type AddTerrainNavigationProp = NativeStackNavigationProp<RootStackParamList, "AddTerrain">;
export type AddMessageNavigationProp = NativeStackNavigationProp<RootStackParamList, "AddMessage">;
export type TerrainDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "TerrainDetail">;
export type EditTerrainNavigationProp = NativeStackNavigationProp<RootStackParamList, "EditTerrain">;
export type CreateJobOfferNavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateJobOffer">;
export type EditJobOfferNavigationProp = NativeStackNavigationProp<RootStackParamList, "EditJobOffer">;

// Pantallas del trabajador
export type WorkerHomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "WorkerHome">;
export type WorkerJobsNavigationProp = NativeStackNavigationProp<RootStackParamList, "WorkerJobs">;
export type WorkerProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, "WorkerProfile">;
export type JobDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "JobDetail">;
export type WorkerNotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList, "WorkerNotifications">;
export type WorkerApplicationsNavigationProp = NativeStackNavigationProp<RootStackParamList, "MyApplications">;
export type WorkerSkillsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Skills">;
export type WorkerMyJobsNavigationProp = NativeStackNavigationProp<RootStackParamList, "MyJobs">;
export type WorkerJobDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "JobOfferDetail">;

// =============================================================================
// NAVIGATION PROPS - Tab Navigator
// =============================================================================

// Tabs del empleador
export type HomeTabNavigationProp = BottomTabNavigationProp<EmployerTabParamList, "Home">;
export type WorkerListNavigationProp = BottomTabNavigationProp<EmployerTabParamList, "WorkerList">;
export type JobOffersNavigationProp = BottomTabNavigationProp<EmployerTabParamList, "JobOffers">;

// Tabs del trabajador
export type WorkerHomeTabNavigationProp = BottomTabNavigationProp<WorkerTabParamList, "WorkerHome">;
export type WorkerJobsTabNavigationProp = BottomTabNavigationProp<WorkerTabParamList, "WorkerJobs">;
export type WorkerApplicationsTabNavigationProp = BottomTabNavigationProp<WorkerTabParamList, "WorkerApplications">;
export type WorkerProfileTabNavigationProp = BottomTabNavigationProp<WorkerTabParamList, "WorkerProfile">;

// =============================================================================
// ROUTE PROPS - Para acceder a parámetros de rutas
// =============================================================================

export type CreateJobOfferRouteProp = RouteProp<RootStackParamList, "CreateJobOffer">;
export type EditJobOfferRouteProp = RouteProp<RootStackParamList, "EditJobOffer">;
export type MessageDetailRouteProp = RouteProp<RootStackParamList, "MessageDetail">;
export type JobOfferDetailRouteProp = RouteProp<RootStackParamList, "JobOfferDetail">;
export type TerrainDetailRouteProp = RouteProp<RootStackParamList, "TerrainDetail">;
export type EditTerrainRouteProp = RouteProp<RootStackParamList, "EditTerrain">;

// =============================================================================
// UTILITY TYPES - Para parámetros comunes
// =============================================================================

export type JobOfferParams = {
  jobOfferId: string;
};

export type TerrainParams = {
  farmId: string;
};

export type WorkerParams = {
  workerId: string;
};

export type ApplicationParams = {
  applicationId: string;
};

export type MessageParams = {
  messageId: string;
};