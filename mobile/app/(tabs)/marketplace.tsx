import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { Search, MapPin, Star, ShieldCheck, MessageCircle, ArrowRight, Scale } from 'lucide-react-native';

const SORTS = [{ k: 'top', label: 'Top rated' }, { k: 'verified', label: 'Verified first' }, { k: 'az', label: 'A-Z' }];
const CITIES = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];

export default function MarketplaceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('top');

  const { data: services = [] } = useQuery({
    queryKey: ['marketplace-services', selectedCity],
    queryFn: async () => {
      const cityQuery = selectedCity !== 'All' ? `?city=${encodeURIComponent(selectedCity)}` : '';
      const res = await apiFetch(`/api/services${cityQuery}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const filtered = services.filter((s: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.specialization?.toLowerCase().includes(q);
  }).sort((a: any, b: any) => {
    if (sortBy === 'az') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'verified') return Number(!!b.verified) - Number(!!a.verified) || Number(b.rating || 0) - Number(a.rating || 0);
    return Number(b.rating || 0) - Number(a.rating || 0);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header & Filters */}
      <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.surfaceBorder }]}>
        <View style={styles.titleRow}>
          <Scale size={20} color={colors.primary} />
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>Verified Legal Advocates</Text>
        </View>
        <Text style={[styles.subtitleText, { color: colors.textMuted }]}>Find verified advocates near you</Text>

        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by specialty, name, or area..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {CITIES.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedCity(c)}
              style={[
                styles.cityChip,
                { borderColor: colors.surfaceBorder },
                selectedCity === c 
                  ? [styles.cityChipActive, { backgroundColor: colors.primary }] 
                  : [styles.cityChipInactive, { backgroundColor: colors.surface }]
              ]}
            >
              <Text style={[
                styles.cityChipText,
                selectedCity === c ? styles.cityChipTextActive : [styles.cityChipTextInactive, { color: colors.textMuted }]
              ]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>SORT</Text>
          {SORTS.map(s => (
            <TouchableOpacity key={s.k} onPress={() => setSortBy(s.k)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: sortBy === s.k ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: sortBy === s.k ? '#ffffff' : colors.textMuted }}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>{filtered.length} advocate{filtered.length === 1 ? '' : 's'}</Text>
      </View>

      {/* Advocates List */}
      <ScrollView 
        style={styles.scrollList} 
        contentContainerStyle={[
          styles.scrollListContent,
          { paddingBottom: insets.bottom + 90 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No advocates found matching criteria.</Text>
          </View>
        ) : (
          filtered.map((pro: any, idx: number) => {
            const cleanPhone = (pro.contactPhone || '').replace(/[^0-9]/g, '');
            return (
              <View key={`${pro.id}-${idx}`} style={[styles.proCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
                <View style={styles.proCardTop}>
                  <View style={styles.proInfoCol}>
                    <View style={styles.proNameRow}>
                      <Text style={[styles.proName, { color: colors.textPrimary }]}>{pro.name}</Text>
                      {pro.verified && <ShieldCheck size={16} color={colors.primary} />}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      {pro.verified && <Text style={{ fontSize: 10, fontWeight: '800', color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>VERIFIED</Text>}
                      {!!pro.type && <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>{String(pro.type).toUpperCase()}</Text>}
                    </View>
                    <Text style={[styles.proSpecialty, { color: colors.primary }]}>{pro.specialization || pro.type}</Text>
                    <View style={styles.proLocationRow}>
                      <MapPin size={12} color={colors.textMuted} />
                      <Text style={[styles.proLocationText, { color: colors.textSecondary }]}>{pro.location}</Text>
                    </View>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{pro.rating || '5.0'}</Text>
                  </View>
                </View>

                {pro.description && (
                  <Text style={[styles.proDescription, { color: colors.textMuted }]} numberOfLines={2}>
                    {pro.description}
                  </Text>
                )}

                <View style={[styles.proActionsRow, { borderTopColor: colors.surfaceBorder }]}>
                  <View style={styles.actionsLeft}>
                    {cleanPhone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)}
                        style={styles.waBtn}
                      >
                        <MessageCircle size={14} color="#10b981" />
                        <Text style={styles.waBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/booking/[id]', params: { id: pro.id, name: pro.name } })}
                    style={[styles.consultBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.consultBtnText}>Consult</Text>
                    <ArrowRight size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitleText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchBar: {
    marginTop: 12,
    backgroundColor: '#020617',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 13,
  },
  cityScroll: {
    marginTop: 10,
  },
  cityChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  cityChipInactive: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#ffffff',
  },
  cityChipTextInactive: {
    color: '#94a3b8',
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  proCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  proCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  proInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  proNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  proSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 2,
  },
  proLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  proLocationText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  proDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 10,
    lineHeight: 18,
  },
  proActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  consultBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consultBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

