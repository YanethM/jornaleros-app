import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/productor/AppWithTabs/TabNavigator/HomeScreen";
import NotificationsScreen from "../screens/productor/MessagesScreen";
import ProfileScreen from "../screens/productor/ProfileScreen";
import TerrainScreen from "../screens/productor/TerrainScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Terrenos") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Mensajes") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#284F66",
        tabBarInactiveTintColor: "#284F66",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          paddingBottom: 10,
          paddingTop: 10,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen
        name="Terrenos"
        component={TerrainScreen}
        options={{ title: "Terrenos" }}
      />
      <Tab.Screen
        name="Mensajes"
        component={NotificationsScreen}
        options={{ title: "Mensajes" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;