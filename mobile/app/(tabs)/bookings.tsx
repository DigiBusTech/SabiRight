import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const { data = [], isLoading, refetch, isRefetching, isError, error } = useQuery({
    queryKey: ['my-bookings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch(`/api/bookings/user/${user!.id}`);
      if (!res.ok) throw new Error(`Could not load bookings (HTTP ${res.status})`);
      return res.json();
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder, backgroundColor: colors.surfaceCard }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Bookings</Text>
      </View>

      {!user ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>Sign in to see your bookings.</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>{error instanceof Error ? error.message : 'Bookings are unavailable.'}</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(booking: any) => booking.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Briefcase size={28} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>No bookings yet.</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace')} style={[styles.cta, { backgroundColor: colors.primary }]}>
                <Text style={styles.ctaText}>Find a professional</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: any) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/booking/[id]', params: { id: item.id, name: item.title || 'Consultation' } })}
              style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title || 'Consultation'}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={[styles.status, { color: colors.primary, backgroundColor: colors.primarySoft }]}>
                {String(item.status || 'pending').toUpperCase()}
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 19, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  cta: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  ctaText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  status: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
});
