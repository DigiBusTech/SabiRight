import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BrandLogo } from './BrandLogo';

interface Props {
  onFinish?: () => void;
  autoHideDuration?: number;
}

export function SplashScreenPreloader({ onFinish, autoHideDuration = 2200 }: Props) {
  const [visible, setVisible] = useState(true);

  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseRing, { toValue: 1.6, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseRing, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();

    const timer = setTimeout(() => triggerSplitExit(), autoHideDuration);
    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  const triggerSplitExit = () => {
    Animated.timing(contentFade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
      setVisible(false);
      if (onFinish) onFinish();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, { opacity: contentFade }]}>
      <View style={styles.centerBox}>
        <TouchableOpacity activeOpacity={0.9} onPress={triggerSplitExit} style={styles.touchTarget}>
          <View style={styles.ringWrapper}>
            <Animated.View style={[styles.pulseHalo, { transform: [{ scale: pulseRing }], opacity: pulseOpacity }]} />
            <Animated.View style={[styles.emblemBox, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
              <Image
                source={require('../assets/sabiright-icon.png')}
                style={[styles.emblemImage, { tintColor: '#ffffff' }]}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <View style={styles.badgePill}>
            <View style={styles.greenDot} />
            <Text style={styles.badgeText}>AI CIVIC SUPER-APP</Text>
          </View>

          <BrandLogo height={42} />

          <Text style={styles.subtitle}>Know your rights. Take the next step.</Text>

          <View style={styles.statutoryBox}>
            <Text style={styles.statutoryText}>Grounded in Nigerian law</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', zIndex: 10000, elevation: 10000 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  touchTarget: { alignItems: 'center', width: '100%' },
  ringWrapper: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pulseHalo: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#38bdf8' },
  emblemBox: { width: 96, height: 96, borderRadius: 26, backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#38bdf8', alignItems: 'center', justifyContent: 'center', padding: 10 },
  emblemImage: { width: '100%', height: '100%' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(56, 189, 248, 0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', marginBottom: 10 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  badgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  subtitle: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 17, maxWidth: 280, marginBottom: 14 },
  statutoryBox: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statutoryText: { color: '#cbd5e1', fontSize: 10, fontWeight: '600' },
});
