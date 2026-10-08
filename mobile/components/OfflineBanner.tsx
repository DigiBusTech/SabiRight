import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';

export function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <WifiOff size={14} color="#f59e0b" />
      <Text style={styles.bannerText}>
        Offline Checkpoint Mode Active — Serving Grounded Rights Locally
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
});

