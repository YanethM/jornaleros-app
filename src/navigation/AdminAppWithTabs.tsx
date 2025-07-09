import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminCropTypesScreen from "../screens/admin/AdminCropTypesScreen";
import UsersAppScreen from "../screens/admin/UsersAppScreen";
import QualificationQuestionsScreen from "../screens/admin/QualificationQuestions";

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
      id="AdminAppTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case "AdminHome":
              iconName = focused ? "home" : "home-outline";
              break;
            case "CropTypes":
              // Mejor icono para "Trabajos" - representa trabajo/empleo
              iconName = focused ? "briefcase" : "briefcase-outline";
              break;
            case "UsersApp":
              // Mejor icono para "Postulaciones" - representa personas/candidatos
              iconName = focused ? "people" : "people-outline";
              break;
            case "QualificationQuestions":
              // Mantiene el icono de mensajes que ya estaba bien
              iconName = focused ? "chatbubble" : "chatbubble-outline";
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
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: "Inicio"
        }}
      />
      <Tab.Screen
        name="CropTypes"
        component={AdminCropTypesScreen}
        options={{
          tabBarLabel: "Cultivos"
        }}
      />
      <Tab.Screen
        name="UsersApp"
        component={UsersAppScreen}
        options={{
          tabBarLabel: "Usuarios"
        }}
      />
      <Tab.Screen
        name="QualificationQuestions"
        component={QualificationQuestionsScreen}
        options={{
          tabBarLabel: "Evaluaciones"
        }}
      />
    </Tab.Navigator>
  );
}