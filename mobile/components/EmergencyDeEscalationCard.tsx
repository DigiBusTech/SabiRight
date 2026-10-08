import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldCheck, ChevronDown, ChevronUp, Quote } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { StatutoryCard } from '../lib/offlineStorage';

interface Props {
  card: StatutoryCard;
  width?: number;
  initialExpanded?: boolean;
}

export function EmergencyDeEscalationCard({ card, width, initialExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const { colors, isDark } = useTheme();

  return (
    <View style={[
      styles.cardContainer,
      {
        backgroundColor: colors.surfaceCard,
        borderColor: colors.surfaceBorder,
      },
      width ? { width, marginRight: 12 } : null
    ]}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        style={styles.cardHeader}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <ShieldCheck size={20} color={colors.primary} />
          </View>
          <View style={styles.titleCol}>
            <View style={styles.metaRow}>
              <Text style={[styles.sectionBadge, { color: colors.primary }]}>{card.section}</Text>
              <Text style={[styles.statuteText, { color: colors.textMuted }]} numberOfLines={1}>{card.statute}</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={expanded ? undefined : 2}>
              {card.title}
            </Text>
          </View>
        </View>

        <View style={styles.chevronBox}>
          {expanded ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>

      {/* Summary is always visible or previewed */}
      <Text style={[styles.summaryText, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 3}>
        {card.summary}
      </Text>

      {/* What to say callout */}
      <View style={[styles.whatToSayBox, { backgroundColor: isDark ? '#020617' : '#f1f5f9', borderColor: colors.surfaceBorder }]}>
        <View style={styles.whatToSayLabelRow}>
          <Quote size={12} color={colors.accent} />
          <Text style={[styles.whatToSayLabel, { color: colors.accent }]}>
            WHAT TO SAY TO OFFICER:
          </Text>
        </View>
        <Text style={[styles.whatToSayText, { color: colors.textPrimary }]} numberOfLines={expanded ? undefined : 3}>
          "{card.whatToSay}"
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    height: 40,
    width: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statuteText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 20,
  },
  chevronBox: {
    paddingLeft: 4,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  whatToSayBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  whatToSayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  whatToSayLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  whatToSayText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

