import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCredits } from '../../hooks/useCredits';
import { useTheme } from '../../context/ThemeContext';
import { ShieldAlert, Sparkles, Users, ArrowRight, Coins } from 'lucide-react-native';
import { OFFLINE_LEGAL_MOAT } from '../../lib/offlineStorage';
import { EmergencyDeEscalationCard } from '../../components/EmergencyDeEscalationCard';
import { BrandLogo } from '../../components/BrandLogo';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { available, refresh: refreshCredits } = useCredits();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const cardWidth = Math.min(width - 32, 500);
  const snapInterval = cardWidth + 12;

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await refreshCredits();
    } finally {
      setRefreshing(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    if (index !== activeCardIndex && index >= 0 && index < OFFLINE_LEGAL_MOAT.length) {
      setActiveCardIndex(index);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 }
        ]} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <BrandLogo height={34} />
            <Text style={[styles.welcomeSubtitle, { color: colors.textMuted }]}>
              {profile?.displayName ? `Hi, ${profile.displayName.split(' ')[0]}` : 'Your rights, made clear'}
            </Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.creditsChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
          >
            <Coins size={14} color={colors.primary} />
            <Text style={[styles.creditsText, { color: colors.primary }]}>{available === null ? '...' : available} Credits</Text>
          </TouchableOpacity>
        </View>

        {/* Big Red Urgent Checkpoint Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push({ pathname: '/(tabs)/civic', params: { urgent: 'true' } })}
          style={styles.emergencyCard}
        >
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyTagRow}>
              <ShieldAlert size={18} color="#ffffff" />
              <Text style={styles.emergencyTagText}>
                KNOW YOUR RIGHTS
              </Text>
            </View>
            <Text style={styles.emergencyTitle}>
              Stopped at a checkpoint?
            </Text>
            <Text style={styles.emergencyDesc}>
              Clear, practical next steps.
            </Text>
          </View>
          <View style={styles.emergencyArrow}>
            <ArrowRight size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Quick Nav Cards */}
        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/civic')}
            style={[styles.quickCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: colors.primarySoft }]}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>Ask SabiRight AI</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Ask a question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/marketplace')}
            style={[styles.quickCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Users size={20} color="#c084fc" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>Find a Lawyer</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Find local help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statutorySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>Offline rights guide</Text>
            <Text style={[styles.sectionHeaderSub, { color: colors.textMuted }]}>Works offline</Text>
          </View>
          <FlatList
            data={OFFLINE_LEGAL_MOAT}
            keyExtractor={(_, index) => `legal-card-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item }) => (
              <EmergencyDeEscalationCard card={item} width={cardWidth} initialExpanded={false} />
            )}
          />
          <View style={styles.paginationRow}>
            {OFFLINE_LEGAL_MOAT.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dotIndicator,
                  { backgroundColor: index === activeCardIndex ? colors.primary : colors.surfaceBorder },
                  index === activeCardIndex && styles.dotActive
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLogo: {
    width: 140,
    height: 34,
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  creditsChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  emergencyCard: {
    backgroundColor: '#dc2626',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyLeft: {
    flex: 1,
    paddingRight: 10,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emergencyTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fee2e2',
    letterSpacing: 0.8,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  emergencyDesc: {
    fontSize: 12,
    color: '#fecaca',
    marginTop: 4,
    lineHeight: 16,
  },
  emergencyArrow: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickIconBox: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  quickSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statutorySection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  carouselContainer: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
  },
});
