import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { FileText, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react-native';

export default function CaseFileDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: caseFile, isLoading } = useQuery({
    queryKey: ['case-file', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/case-files/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.backBtn}>
          <ArrowLeft size={18} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Case Brief ({caseFile?.case_ref || 'Case'})</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.refGroup}>
              <FileText size={20} color="#38bdf8" />
              <Text style={styles.caseRefText}>{caseFile?.case_ref}</Text>
            </View>
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>
                {caseFile?.urgency_level || 'Medium'} Urgency
              </Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>
            EXECUTIVE LEGAL SUMMARY
          </Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryContent}>
              {caseFile?.issue_summary}
            </Text>
          </View>

          <View style={styles.groundingRow}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.groundingText}>Grounded in 1999 Constitution of Nigeria</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/marketplace')}
          style={styles.connectBtn}
        >
          <Text style={styles.connectBtnText}>Connect with Matched Advocate</Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerPlaceholder: {
    width: 38,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  refGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caseRefText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  urgencyBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f87171',
    textTransform: 'uppercase',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: '#020617',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  summaryContent: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  groundingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  groundingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  connectBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  connectBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});

