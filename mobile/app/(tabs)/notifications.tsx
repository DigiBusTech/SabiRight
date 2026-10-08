import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Check, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { isMobilePushRegistered, registerMobilePush, unregisterMobilePush } from '../../lib/pushNotifications';

interface MobileNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/notifications/${user.id}?limit=50&offset=0`);
      if (!response.ok) throw new Error(`Could not load notifications (HTTP ${response.status})`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('[MobileNotifications] Could not load notifications:', error);
      Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    isMobilePushRegistered(user.id)
      .then(setPushEnabled)
      .catch(error => console.error('[MobilePush] Could not read registration status:', error));
  }, [user?.id]);

  const togglePush = async () => {
    if (!user?.id) return;
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unregisterMobilePush(user.id);
        setPushEnabled(false);
        Alert.alert('Notifications disabled', 'This device will no longer receive push alerts.');
      } else {
        await registerMobilePush(user.id, true);
        const registered = await isMobilePushRegistered(user.id);
        setPushEnabled(registered);
        Alert.alert(
          registered ? 'Notifications enabled' : 'Notifications not enabled',
          registered
            ? 'This device can now receive SabiRight push alerts.'
            : 'Allow notifications and configure the EAS project ID to enable alerts.'
        );
      }
    } catch (error) {
      Alert.alert('Could not update notifications', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setPushBusy(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    try {
      const response = await apiFetch(`/api/notifications/${user.id}/read/${notificationId}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Could not mark notification as read (HTTP ${response.status})`);
      setNotifications(current => current.map(item =>
        item.id === notificationId ? { ...item, isRead: true } : item
      ));
    } catch (error) {
      Alert.alert('Could not update notification', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      const response = await apiFetch(`/api/notifications/${user.id}/read-all`, { method: 'POST' });
      if (!response.ok) throw new Error(`Could not mark notifications as read (HTTP ${response.status})`);
      setNotifications(current => current.map(item => ({ ...item, isRead: true })));
    } catch (error) {
      Alert.alert('Could not update notifications', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{totalCount} total</Text>
          </View>
          <TouchableOpacity
            onPress={loadNotifications}
            disabled={loading}
            accessibilityLabel="Refresh notifications"
            style={[styles.iconButton, { borderColor: colors.surfaceBorder }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <RefreshCw size={18} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={togglePush}
          disabled={pushBusy || !user}
          style={[styles.pushCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}
        >
          <Bell size={20} color={colors.primary} />
          <View style={styles.pushText}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {pushEnabled ? 'Native push alerts enabled' : 'Enable native push alerts'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {pushBusy ? 'Updating…' : 'Receive private alerts on this device'}
            </Text>
          </View>
        </TouchableOpacity>

        {notifications.some(item => !item.isRead) && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAll}>
            <Check size={16} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
          </TouchableOpacity>
        )}

        {loading && notifications.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : notifications.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <Bell size={30} color={colors.textMuted} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>You’re all caught up</Text>
          </View>
        ) : notifications.map(notification => (
          <View
            key={notification.id}
            style={[
              styles.notification,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.surfaceBorder,
                opacity: notification.isRead ? 0.78 : 1
              }
            ]}
          >
            <View style={styles.notificationHeading}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, flex: 1 }]}>
                {notification.title}
              </Text>
              {!notification.isRead && (
                <TouchableOpacity
                  onPress={() => markAsRead(notification.id)}
                  accessibilityLabel="Mark notification as read"
                >
                  <Check size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{notification.message}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {new Date(notification.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headingText: { gap: 3 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pushCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pushText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  markAll: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  markAllText: { fontSize: 13, fontWeight: '700' },
  loader: { marginTop: 48 },
  empty: { minHeight: 150, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notification: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  notificationHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  message: { fontSize: 14, lineHeight: 20 },
});
