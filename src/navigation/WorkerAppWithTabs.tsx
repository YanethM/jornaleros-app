import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import WorkerJobsScreen from "../screens/worker/WorkerJobScreen";
import WorkerHomeScreen from "../screens/worker/WorkerHomeScreen";
import WorkerApplicationsScreen from "../screens/worker/WorkerApplicationScreen";
import WorkerProfileScreen from "../screens/worker/WorkerProfileScreen";

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: "#274F66",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1A202C",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
};

export default function WorkerAppWithTabs() {
  return (
    <Tab.Navigator
      id="WorkerAppTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "WorkerHome":
              iconName = focused ? "home" : "home-outline";
              break;
            case "WorkerJobs":
              iconName = focused ? "briefcase" : "briefcase-outline";
              break;
            case "WorkerApplications":
              iconName = focused ? "document-text" : "document-text-outline";
              break;
            case "WorkerProfile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
          elevation: 8, // Android shadow
          shadowColor: "#000", // iOS shadow
          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}>
      <Tab.Screen
        name="WorkerHome"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: "Inicio",
        }}
      />
      <Tab.Screen
        name="WorkerJobs"
        component={WorkerJobsScreen}
        options={{
          tabBarLabel: "Trabajos",
        }}
      />
      <Tab.Screen
        name="WorkerApplications"
        component={WorkerApplicationsScreen}
        options={{
          tabBarLabel: "Postulaciones",
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: "Perfil",
        }}
      />
    </Tab.Navigator>
  );
}