import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  FlatList, 
  StyleSheet, 
  useWindowDimensions, 
  NativeSyntheticEvent,
  NativeScrollEvent 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, ArrowRight, Shield, Scale, Award } from 'lucide-react-native';
import { OFFLINE_LEGAL_MOAT } from '../lib/offlineStorage';
import { EmergencyDeEscalationCard } from '../components/EmergencyDeEscalationCard';
import { SplashScreenPreloader } from '../components/SplashScreenPreloader';
import { BrandLogo } from '../components/BrandLogo';

interface HeroSlide {
  id: string;
  image: any;
  title: string;
  description: string;
  badge: string;
  tagColor: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'citizens',
    image: require('../assets/hero-citizens.png'),
    title: 'Know your rights. Instantly.',
    description: 'Stopped at a checkpoint? Get the exact steps. No data needed.',
    badge: 'CITIZEN FIRST-AID',
    tagColor: '#38bdf8',
  },
  {
    id: 'justice',
    image: require('../assets/hero-justice.png'),
    title: 'Backed by the law',
    description: 'Every answer cites the 1999 Constitution and Police Act 2020.',
    badge: 'CONSTITUTION',
    tagColor: '#facc15',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);
  const carouselRef = useRef<FlatList<HeroSlide>>(null);

  const carouselWidth = width - 36;

  useEffect(() => {
    if (!loading && user) router.replace('/(tabs)');
  }, [user, loading]);

  // Auto-play horizontal hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % HERO_SLIDES.length;
        carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleSlideChange = (index: number) => {
    setActiveSlideIndex(index);
    carouselRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / carouselWidth);
    if (index >= 0 && index < HERO_SLIDES.length && index !== activeSlideIndex) {
      setActiveSlideIndex(index);
    }
  };

  const handleProceedAuth = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) }
        ]}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <BrandLogo height={34} />
            <View style={[styles.statusBadge, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>Works offline</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Your legal first-aid, in your pocket.
          </Text>
        </View>

        {/* Hero Carousel Showcase with Interactive Tabs */}
        <View style={styles.heroShowcase}>
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSlideChange(0)}
              style={[
                styles.tabButton, 
                activeSlideIndex === 0 && [styles.tabButtonActive, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]
              ]}
            >
              <Shield size={14} color={activeSlideIndex === 0 ? colors.primary : colors.textMuted} />
              <Text style={[
                styles.tabText, 
                { color: activeSlideIndex === 0 ? colors.textPrimary : colors.textMuted },
                activeSlideIndex === 0 && styles.tabTextActive
              ]}>
                First-Aid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSlideChange(1)}
              style={[
                styles.tabButton, 
                activeSlideIndex === 1 && [styles.tabButtonActive, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]
              ]}
            >
              <Scale size={14} color={activeSlideIndex === 1 ? colors.accent : colors.textMuted} />
              <Text style={[
                styles.tabText, 
                { color: activeSlideIndex === 1 ? colors.textPrimary : colors.textMuted },
                activeSlideIndex === 1 && styles.tabTextActive
              ]}>
                The Law
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auto-playing Horizontal Carousel */}
          <FlatList
            ref={carouselRef}
            data={HERO_SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={carouselWidth}
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item }) => (
              <View style={[styles.heroCard, { width: carouselWidth, backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
                <Image
                  source={item.image}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={[styles.heroOverlay, { backgroundColor: colors.surfaceCard, borderTopColor: colors.surfaceBorder }]}>
                  <Text style={[styles.heroCardTitle, { color: colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.heroCardDesc, { color: colors.textMuted }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Carousel Slide Indicators */}
          <View style={styles.carouselPagination}>
            {HERO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.carouselDot,
                  activeSlideIndex === i 
                    ? [styles.carouselDotActive, { backgroundColor: colors.primary }] 
                    : [styles.carouselDotInactive, { backgroundColor: colors.surfaceBorder }]
                ]}
              />
            ))}
          </View>
        </View>

        {/* Emergency Checkpoint Cards */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CHECKPOINT CARDS - SWIPE</Text>
          <View style={[styles.badgeOffline, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <AlertTriangle size={11} color={colors.danger} />
            <Text style={[styles.badgeOfflineText, { color: colors.danger }]}>Offline</Text>
          </View>
        </View>

        <FlatList
          data={OFFLINE_LEGAL_MOAT.slice(0, 6)}
          keyExtractor={(_, i) => "card-${i}"}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={carouselWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingRight: 6 }}
          style={styles.cardsContainer}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <View style={{ width: carouselWidth }}>
              <EmergencyDeEscalationCard card={item} initialExpanded={false} />
            </View>
          )}
        />

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            activeOpacity={0.85} 
            onPress={handleProceedAuth} 
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Sign in / Sign up</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => router.push('/(tabs)')} 
            style={[styles.guestBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.guestBtnText, { color: colors.textMuted }]}>
              Continue as guest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Partnerships */}
        <View style={styles.footerPartnerships}>
          <View style={styles.partnerBadge}>
            <Award size={14} color={colors.textMuted} />
            <Text style={[styles.partnerText, { color: colors.textMuted }]}>
              Backed by Startup Nigeria
            </Text>
          </View>
          <View style={[styles.partnerDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.partnerBadge}>
            <Shield size={14} color={colors.textMuted} />
            <Text style={[styles.partnerText, { color: colors.textMuted }]}>
              NDPC Compliant
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    {showPreloader && <SplashScreenPreloader onFinish={() => setShowPreloader(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12 },
  header: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  headerLogo: { width: 145, height: 36 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, lineHeight: 16 },
  heroShowcase: { marginBottom: 20 },
  tabBar: {
    flexDirection: 'row', borderRadius: 14, padding: 3,
    marginBottom: 10, borderWidth: 1,
  },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 11 },
  tabButtonActive: {},
  tabText: { fontSize: 12, fontWeight: '600' },
  tabTextActive: { fontWeight: '700' },
  heroCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, marginRight: 0 },
  heroImage: { width: '100%', height: 180 },
  heroOverlay: { padding: 14, borderTopWidth: 1 },
  heroCardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  heroCardDesc: { fontSize: 12, lineHeight: 16 },
  carouselPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
  },
  carouselDotActive: {
    width: 20,
  },
  carouselDotInactive: {
    width: 6,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  badgeOffline: {
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  badgeOfflineText: { fontSize: 10, fontWeight: '700' },
  cardsContainer: { gap: 10, marginBottom: 16 },
  disclaimerContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  disclaimerHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionsSection: { gap: 10, marginTop: 4, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: '#2563eb', height: 52, borderRadius: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  guestBtn: {
    height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  guestBtnText: { fontSize: 13, fontWeight: '600' },
  footerPartnerships: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  partnerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  partnerDivider: {
    width: 1,
    height: 12,
  },
});

