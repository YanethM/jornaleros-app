import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  PasswordReset: undefined; 
  VerifyEmail: { email: string; fromRegistration?: boolean };
  Tutorial: undefined;
  TutorialApp: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  PublicHome: undefined;
  PublicHomePreview: undefined;
  RoleSelection: undefined;
  EmployerApp: undefined;
  WorkerApp: undefined;
  Notifications: undefined;
  MessageDetail: { messageId: string };
  EmployerStack: undefined;
  WorkerStack: undefined;
  WorkerJobOfferDetailNoAuth: { jobId: string; fromPublic?: boolean };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PasswordReset: undefined;
  VerifyEmail: { email: string; fromRegistration?: boolean };
};


// TAB NAVIGATOR DEL EMPLEADOR
export type EmployerTabParamList = {
  Home: undefined;
  Terrenos: undefined;
  WorkerSearch: undefined;
  Mensajes: undefined;
  Profile: undefined;
};

// STACK NAVIGATOR DEL EMPLEADOR (pantallas específicas)
export type EmployerStackParamList = {
  EmployerTabs: undefined;
  AddTerrain: undefined;
  EditTerrain: { farmId: string };
  TerrainDetail: { farmId: string };
  AddMessage: {
    recipientId?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    workerProfile?: any;
    context?: any;
  };
  NewMessage: { workerId: string };
  CreateJobOffer: undefined;
  JobOffers: undefined;
  JobOfferDetail: { jobOfferId: string };
  EditJobOffer: { jobOfferId: string };
  WorkerList: undefined;
  WorkerProfileByEmployer: { workerId: string };
  WorkerProfileApplication: { workerId: string };
  PublicHomePreview: undefined;
};

// TAB NAVIGATOR DEL TRABAJADOR
export type WorkerTabParamList = {
  WorkerHome: undefined;
  WorkerJobs: undefined;
  MyApplications: undefined;
  WorkerProfile: undefined;
};

// STACK NAVIGATOR DEL TRABAJADOR (pantallas específicas)
export type WorkerStackParamList = {
  WorkerTabs: undefined;
  Skills: undefined;
  MyJobs: undefined;
  WorkerJobOfferDetail: { jobOfferId: string };
  WorkerNotifications: undefined;
  WorkerMessage: { messageId: string };
  RateProducer: { producerId: string };
  CancelApplications: undefined;
};

// =============================================================================
// NAVIGATION PROPS - Root Stack Navigator
// =============================================================================

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Pantallas públicas
export type OnboardingNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;
export type LoginNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export type SignupNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Signup"
>;

// ✅ CORREGIDO: Usando NativeStackNavigationProp y RootStackParamList
export type PasswordResetNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PasswordReset"
>;

export type VerifyEmailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;
export type AboutNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "About"
>;
export type ContactNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Contact"
>;
export type TutorialNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Tutorial"
>;
export type TutorialAppNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TutorialApp"
>;
export type TermsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Terms"
>;
export type PublicHomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PublicHome"
>;

export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type AuthLoginNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export type AuthSignupNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Signup"
>;

export type AuthPasswordResetNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "PasswordReset"
>;

export type AuthVerifyEmailNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "VerifyEmail"
>;

export type WorkerJobOfferDetailNoAuthNavigationProp =
  NativeStackNavigationProp<RootStackParamList, "WorkerJobOfferDetailNoAuth">;
// =============================================================================
// NAVIGATION PROPS - Employer Stack
// =============================================================================

export type EmployerStackNavigationProp =
  NativeStackNavigationProp<EmployerStackParamList>;

// Navegación compuesta para pantallas del empleador (acceso a Root + Employer)
export type EmployerCompositeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Pantallas específicas del empleador
export type AddTerrainNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "AddTerrain">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type AddMessageNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "AddMessage">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type TerrainDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "TerrainDetail">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type EditTerrainNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "EditTerrain">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type CreateJobOfferNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "CreateJobOffer">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type JobOfferDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "JobOfferDetail">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type EditJobOfferNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "EditJobOffer">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerSearchNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<EmployerTabParamList, "WorkerSearch">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type MensajesNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<EmployerTabParamList, "Mensajes">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type NewMessageNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "NewMessage">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type PublicHomePreviewNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "PublicHomePreview">,
  NativeStackNavigationProp<RootStackParamList>
>;

// =============================================================================
// NAVIGATION PROPS - Worker Stack
// =============================================================================

export type WorkerStackNavigationProp =
  NativeStackNavigationProp<WorkerStackParamList>;

// Navegación compuesta para pantallas del trabajador
export type WorkerCompositeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Pantallas específicas del trabajador
export type WorkerHomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerHome">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerJobsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerJobs">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerProfile">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerNotificationsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "WorkerNotifications">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerApplicationsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "MyApplications">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerSkillsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "Skills">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerMyJobsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "MyJobs">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerJobDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "WorkerJobOfferDetail">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerMessageNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "WorkerMessage">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type RateProducerNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "RateProducer">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type CancelApplicationsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkerStackParamList, "CancelApplications">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerProfileByEmployerNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "WorkerProfileByEmployer">,
  NativeStackNavigationProp<RootStackParamList>
>;
// =============================================================================
// TAB NAVIGATION PROPS
// =============================================================================

// Tabs del empleador
export type HomeTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<EmployerTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerListNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "WorkerList">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type JobOffersNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EmployerStackParamList, "JobOffers">,
  NativeStackNavigationProp<RootStackParamList>
>;

// Tabs del trabajador
export type WorkerHomeTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerHome">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerJobsTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerJobs">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerApplicationsTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "MyApplications">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkerProfileTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<WorkerTabParamList, "WorkerProfile">,
  NativeStackNavigationProp<RootStackParamList>
>;

// =============================================================================
// ROUTE PROPS - Para acceder a parámetros de rutas
// =============================================================================

export type CreateJobOfferRouteProp = RouteProp<
  EmployerStackParamList,
  "CreateJobOffer"
>;
export type EditJobOfferRouteProp = RouteProp<
  EmployerStackParamList,
  "EditJobOffer"
>;
export type MessageDetailRouteProp = RouteProp<
  RootStackParamList,
  "MessageDetail"
>;
export type JobOfferDetailRouteProp = RouteProp<
  EmployerStackParamList,
  "JobOfferDetail"
>;
export type TerrainDetailRouteProp = RouteProp<
  EmployerStackParamList,
  "TerrainDetail"
>;
export type EditTerrainRouteProp = RouteProp<
  EmployerStackParamList,
  "EditTerrain"
>;
export type WorkerMessageRouteProp = RouteProp<
  WorkerStackParamList,
  "WorkerMessage"
>;
export type RateProducerRouteProp = RouteProp<
  WorkerStackParamList,
  "RateProducer"
>;
export type AddMessageRouteProp = RouteProp<
  EmployerStackParamList,
  "AddMessage"
>;

export type WorkerProfileApplicationRouteProp = RouteProp<
  EmployerStackParamList,
  "WorkerProfileApplication"
>;
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

export type AddMessageParams = {
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  workerProfile?: any;
  context?: any;
};

// =============================================================================
// NAVIGATION HELPERS - Para uso común
// =============================================================================

// Helper para navegar desde cualquier parte de la app al login
export type NavigateToLogin = () => void;

// Helper para resetear la navegación
export type ResetNavigation = (routeName: keyof RootStackParamList) => void;

// Legacy - Mantener compatibilidad con código existente
export type TabParamList = EmployerTabParamList;
