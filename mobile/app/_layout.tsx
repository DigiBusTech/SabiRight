import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../lib/api';
import { syncRemoteMoatData } from '../lib/offlineStorage';
import { registerMobilePush } from '../lib/pushNotifications';

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

function RootContent() {
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;
    registerMobilePush(user.id).catch(error => {
      console.error('[MobilePush] Could not register push token:', error);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/notifications');
    });
    return () => responseListener.remove();
  }, [user?.id, router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bookings" />
        <Stack.Screen
          name="case-file/[id]"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            headerShown: true,
            title: 'Consultation Room',
            headerStyle: { backgroundColor: colors.surfaceCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Sync admin-managed MOAT statutory context on startup so it's available offline
  useEffect(() => {
    syncRemoteMoatData(API_BASE_URL).catch(() => {
      // Network unavailable — offline data from last sync will be used
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootContent />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
