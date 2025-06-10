import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBarWorker = ({ navigation, currentRoute }) => {
  const insets = useSafeAreaInsets();
  
  const tabs = [
    { name: 'WorkerHome', icon: 'home', label: 'Inicio' },
    { name: 'WorkerJobs', icon: 'briefcase', label: 'Trabajos' },
    { name: 'WorkerApplications', icon: 'document-text', label: 'Postulaciones' },
    { name: 'WorkerProfile', icon: 'person', label: 'Perfil' },
  ];

  const handleTabPress = (tabName) => {
    navigation.navigate('MainApp', {
      screen: 'TabScreens',
      params: {
        screen: tabName
      }
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.name)}
          >
            <Ionicons
              name={isActive ? tab.icon : `${tab.icon}-outline`}
              size={24}
              color={isActive ? '#284F66' : '284F66'}
            />
            <Text style={[
              styles.label,
              { color: isActive ? '#284F66' : '284F66' }
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 5,
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

export default CustomTabBarWorker;