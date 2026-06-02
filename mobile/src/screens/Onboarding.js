import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { ArrowRight, Shield, Scale, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const Onboarding = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>Sabi<Text style={styles.brandHighlight}>Right</Text></Text>
        </View>

        <View style={styles.illustrationContainer}>
          {/* We use Lucide icons as placeholders for feature images since we don't have local assets yet */}
          <View style={styles.iconCircle}>
             <Shield size={100} color={theme.colors.primary} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Know the Law.{"\n"}Beat the Traffic.</Text>
          <Text style={styles.subtitle}>
            The essential toolkit for the modern citizen. Legal aid, smart traffic, and verified jobs in one place.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  brand: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  brandHighlight: {
    color: theme.colors.primary,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.35,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: theme.roundness.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Onboarding;
