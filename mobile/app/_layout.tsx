import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncRemoteMoatData } from '../lib/offlineStorage';

const queryClient = new QueryClient();

function RootContent() {
  const { isDark, colors } = useTheme();

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
    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.5:5000';
    syncRemoteMoatData(apiBase).catch(() => {
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

