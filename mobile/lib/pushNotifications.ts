import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from './api';

function getProjectId(): string | undefined {
  return process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    || Constants.easConfig?.projectId
    || Constants.expoConfig?.extra?.eas?.projectId;
}

export async function isMobilePushRegistered(userId: string): Promise<boolean> {
  return !!(await AsyncStorage.getItem(`sabiright_expo_push:${userId}`));
}

export async function registerMobilePush(userId: string, requestPermission = false): Promise<void> {
  if (!Device.isDevice) {
    console.info('[MobilePush] Push notifications require a physical device.');
    return;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[MobilePush] Set EXPO_PUBLIC_EAS_PROJECT_ID to enable native push notifications.');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SabiRight notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38bdf8'
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && requestPermission) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    console.info('[MobilePush] Notification permission was not granted.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const response = await apiFetch(`/api/notifications/${userId}/push/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ provider: 'expo', endpoint: token })
  });
  if (!response.ok) {
    throw new Error(`Could not register native push token (HTTP ${response.status})`);
  }

  await AsyncStorage.setItem(`sabiright_expo_push:${userId}`, token);
}

export async function unregisterMobilePush(userId: string): Promise<void> {
  const token = await AsyncStorage.getItem(`sabiright_expo_push:${userId}`);
  if (!token) return;

  const response = await apiFetch(`/api/notifications/${userId}/push/unsubscribe`, {
    method: 'POST',
    body: JSON.stringify({ provider: 'expo', endpoint: token })
  });
  if (!response.ok) {
    throw new Error(`Could not unregister native push token (HTTP ${response.status})`);
  }

  await AsyncStorage.removeItem(`sabiright_expo_push:${userId}`);
}
