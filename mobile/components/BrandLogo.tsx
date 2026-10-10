import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function BrandLogo({ height = 36 }: { height?: number }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.row, { height }]}>
      <Image
        source={require('../assets/sabiright-icon.png')}
        style={{ width: height, height, tintColor: isDark ? colors.textPrimary : undefined }}
        resizeMode="contain"
        accessibilityLabel="SabiRight icon"
      />
      <Text style={[styles.name, { color: colors.textPrimary, fontSize: height * 0.48 }]}>
        SabiRight
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
