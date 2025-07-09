import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeader from './CustomHeader';

const ScreenLayout = ({ 
  children, 
  navigation, 
  showTabBar = false, 
  tabBarComponent = null,
  currentRoute = null
}) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <CustomHeader navigation={navigation} />
        <View style={[
          styles.content,
          showTabBar && styles.contentWithTabBar
        ]}>
          {children}
        </View>
        {showTabBar && tabBarComponent && 
          React.cloneElement(tabBarComponent, { 
            navigation, 
            currentRoute 
          })
        }
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentWithTabBar: {
    paddingBottom: 80, // Espacio para el TabBar
  },
});

export default ScreenLayout;