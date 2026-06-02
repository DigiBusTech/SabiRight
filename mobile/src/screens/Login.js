import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { auth, db } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch profile to verify
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      
      if (!profileDoc.exists()) {
        console.log('No profile found for user');
      }

      // Navigation is handled by AuthContext state in a real app, 
      // but here we can manually navigate if needed for testing
      // navigation.replace('Dashboard');
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your SabiRight account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={theme.colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={theme.colors.textLight} /> : <Eye size={20} color={theme.colors.textLight} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, !!loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={!!loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  form: {
    // Removed gap for compatibility
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textLight,
    fontSize: 15,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default Login;
