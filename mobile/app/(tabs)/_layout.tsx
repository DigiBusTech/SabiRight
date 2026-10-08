import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Shield, MessageSquare, Users, AlertTriangle, User, Bell } from 'lucide-react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Dynamic tab bar height based on safe area insets
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 16);
  const tabHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }: { color: any }) => <Shield size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="civic"
        options={{
          title: 'SabiRight AI',
          tabBarIcon: ({ color }: { color: any }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Advocates',
          tabBarIcon: ({ color }: { color: any }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="traffic"
        options={{
          title: 'SabiMove',
          tabBarIcon: ({ color }: { color: any }) => <AlertTriangle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }: { color: any }) => <Bell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: any }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
