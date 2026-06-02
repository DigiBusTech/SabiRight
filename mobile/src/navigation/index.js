import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

import Onboarding from '../screens/Onboarding';
import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Login} /> 
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
