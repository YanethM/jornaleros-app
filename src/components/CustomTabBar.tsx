// CustomTabBar.tsx - Alternative with absolute positioning
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  navigation: any;
  currentRoute: string;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ navigation, currentRoute }) => {
  const insets = useSafeAreaInsets();
  
  const tabs = [
    { name: 'Home', icon: 'home', label: 'Inicio' },
    { name: 'Terrenos', icon: 'map', label: 'Terrenos' },
    { name: 'WorkerSearch', icon: 'search', label: 'Trabajadores' },
    { name: 'Mensajes', icon: 'chatbubble', label: 'Mensajes' },
    { name: 'Profile', icon: 'person', label: 'Perfil' },
  ];

  const handleTabPress = (tabName: string) => {
    navigation.navigate('EmployerTabs', {
      screen: tabName
    });
  };

  return (
    <View style={[styles.container]}>
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.name)}
          >
            <Ionicons
              name={isActive ? tab.icon : `${tab.icon}-outline` as any}
              size={24}
              color='#274F66'
            />
            <Text style={[
              styles.label,
              { color: '#274F66' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // Posición absoluta
    bottom: 0,           // Pegado al fondo
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 5,
    paddingBottom: 10,
    height: 70,
    zIndex: 1000,       // Por encima de otros elementos
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomTabBar;