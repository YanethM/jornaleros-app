import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import WorkerListScreen from '../screens/productor/WorkerListScreen';
import { JobOffersScreen } from '../screens/productor/JobOffersScreen';

const Stack = createNativeStackNavigator();

const AppWithTabs = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabScreens" component={TabNavigator} />
      <Stack.Screen name="WorkerList" component={WorkerListScreen} />
      <Stack.Screen name="JobOffer" component={JobOffersScreen} />
    </Stack.Navigator>
  );
};

export default AppWithTabs;