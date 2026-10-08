import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Briefcase } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-bookings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch(`/api/bookings/user/${user!.id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder, backgroundColor: colors.surfaceCard }]}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Consultations</Text>
      </View>

      {!user ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>Sign in to see your consultations.</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(b: any) => b.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Briefcase size={28} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>No consultations yet.</Text>
              <TouchableOpacity onPress={() => router.replace('/(tabs)/marketplace')} style={[styles.cta, { backgroundColor: colors.primary }]}>
                <Text style={styles.ctaText}>Find an advocate</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  back: { padding: 6, marginRight: 6 },
  title: { fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  cta: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  ctaText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  status: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
});
