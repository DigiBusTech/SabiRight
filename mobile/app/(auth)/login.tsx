import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../../components/BrandLogo';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    if (!isLogin && (!acceptedTerms || !acceptedDisclaimer)) {
      Alert.alert('Agreement Required', 'Accept the Terms and Conditions and legal guidance disclaimer to create an account.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
              terms_accepted: true,
              legal_disclaimer_accepted: true,
              legal_acceptance_at: new Date().toISOString()
            }
          }
        });
        if (error) throw error;

        // The profile row is created server-side by the auth trigger.
        Alert.alert('Welcome!', 'Your account has been created successfully.');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ArrowLeft size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.headerBox}>
          <View style={styles.brandRow}>
            <BrandLogo height={40} />
          </View>
          <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
            {isLogin ? 'Sign In to Your Account' : 'Create Free Account'}
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textMuted }]}>
            {isLogin ? 'Access your AI cases, legal briefs & credits.' : 'Get 10 free daily credits for civic guidance.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          {!isLogin && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <User size={18} color={colors.textMuted} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Chidi Okafor"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
          )}

          {!isLogin && (
            <View style={styles.legalGroup}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms(value => !value)}
                style={styles.legalRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                {acceptedTerms
                  ? <CheckSquare size={20} color={colors.primary} />
                  : <Square size={20} color={colors.textMuted} />}
                <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                  I accept the{' '}
                  <Text
                    style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
                    onPress={() => Linking.openURL('https://www.sabiright.ng/terms')}
                  >
                    Terms and Conditions
                  </Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAcceptedDisclaimer(value => !value)}
                style={styles.legalRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedDisclaimer }}
              >
                {acceptedDisclaimer
                  ? <CheckSquare size={20} color={colors.primary} />
                  : <Square size={20} color={colors.textMuted} />}
                <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                  I understand SabiRight provides guidance, not legal representation.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Mail size={18} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="citizen@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={[styles.textInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAuth}
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setIsLogin(!isLogin);
              setAcceptedTerms(false);
              setAcceptedDisclaimer(false);
            }}
            style={styles.toggleRow}
          >
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={[styles.toggleLink, { color: colors.primary }]}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 20,
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBox: {
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogoImage: {
    width: 160,
    height: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  authSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    gap: 16,
  },
  legalGroup: {
    gap: 12,
    marginTop: 2,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    color: '#f8fafc',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  toggleRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  toggleLink: {
    color: '#38bdf8',
    fontWeight: '700',
  },
});
