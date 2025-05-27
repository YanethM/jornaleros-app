import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeaderWorker from './CustomHeaderWorker';

const ScreenLayoutWorker = ({ children, navigation }) => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <CustomHeaderWorker navigation={navigation} />
        <View style={styles.content}>
          {children}
        </View>
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
});

export default ScreenLayoutWorker;