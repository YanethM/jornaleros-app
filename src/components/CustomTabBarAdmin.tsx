import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  navigation: any;
  state: {
    index: number;
    routes: any[];
  };
}

const CustomTabBarAdmin: React.FC<CustomTabBarProps> = ({ navigation, state }) => {
  const insets = useSafeAreaInsets();
  
  const tabs = [
    {
      name: 'AdminHome',
      label: 'Inicio',
      icon: 'home'
    },
    {
      name: 'CropTypes',
      label: 'Cultivos',
      icon: 'briefcase'
    },
    {
      name: 'UsersApp',
      label: 'Usuarios',
      icon: 'people'
    },
    {
      name: 'QualificationQuestions',
      label: 'Evaluaciones',
      icon: 'chatbubble'
    }
  ];

  const handleTabPress = (tabName: string, index: number) => {
    // Solo navegar si no es el tab activo
    if (state.index !== index) {
      navigation.navigate('AdminTabs', {
        screen: tabName
      });
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      {tabs.map((tab, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.name, index)}
          >
            <Ionicons
              name={isActive ? tab.icon : `${tab.icon}-outline` as any}
              size={24}
              color={isActive ? '#274F66' : '#718096'}
            />
            <Text style={[
              styles.label,
              { color: isActive ? '#274F66' : '#718096' }
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
    bottom: 0, // Pegado al fondo
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    height: 80,
    zIndex: 1000, // Por encima de otros elementos
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
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
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default CustomTabBarAdmin;