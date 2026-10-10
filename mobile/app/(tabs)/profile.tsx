import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch, Share, Modal, ActivityIndicator, Linking, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { useCredits } from '../../hooks/useCredits';
import { useChatStorage, formatBytes } from '../../components/ChatHistoryModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Coins, 
  Globe, 
  Share2, 
  LogOut, 
  ShieldCheck, 
  MapPin, 
  Moon, 
  Sun,
  RefreshCw,
  Link2,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Bell,
  X,
  ArrowUpRight,
  Sparkles
} from 'lucide-react-native';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency?: string;
  bonus?: number;
  description?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  active: boolean;
  instructions?: string;
  description?: string;
  fields?: { name: string; label?: string; type?: string; required?: boolean }[];
}

interface MobilePlan {
  id: string;
  name: string;
  type: string;
  userType: string;
  price: number;
  credits: number;
  monthlyCredits?: number;
  storageMb?: number;
  billingCycle?: string;
  description?: string;
  features?: string[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { available, total, used, planCredits, planName, renewalDate, isLoading: creditsLoading, refresh: refreshCredits } = useCredits();
  const { data: storage } = useChatStorage();
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [pendingLinkExpiresAt, setPendingLinkExpiresAt] = useState<number | null>(null);
  const [linkedChannelsBeforeCode, setLinkedChannelsBeforeCode] = useState<Record<string, string>>({});
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod | null>(null);
  const [manualPaymentData, setManualPaymentData] = useState<Record<string, any> | null>(null);
  const [manualFieldValues, setManualFieldValues] = useState<Record<string, string>>({});
  const [manualFiles, setManualFiles] = useState<Record<string, DocumentPicker.DocumentPickerAsset>>({});
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

  // Fetch linked channels
  const { data: linkedChannels = [], refetch: refetchLinks, isLoading: linkedChannelsLoading } = useQuery<{ channel: string; linked_at: string }[]>({
    queryKey: ['channel-links', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch('/api/channels/links');
      if (!res.ok) throw new Error(`Could not load linked channels (HTTP ${res.status})`);
      return res.json();
    },
    refetchInterval: pendingLinkExpiresAt ? 3_000 : false
  });

  useEffect(() => {
    if (!pendingLinkExpiresAt) return;
    const timeout = setTimeout(() => setPendingLinkExpiresAt(null), Math.max(0, pendingLinkExpiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [pendingLinkExpiresAt]);

  useEffect(() => {
    if (!pendingLinkExpiresAt) return;
    const newlyLinked = linkedChannels.find(link =>
      linkedChannelsBeforeCode[link.channel] !== link.linked_at
    );
    if (!newlyLinked) return;
    setPendingLinkExpiresAt(null);
    Alert.alert(
      `${newlyLinked.channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'} connected`,
      'Your bot now shares your SabiRight account credits and chat history.'
    );
  }, [linkedChannels, linkedChannelsBeforeCode, pendingLinkExpiresAt]);

  // Fetch credit packages
  const { data: creditPackages = [], isLoading: packagesLoading, error: packagesError } = useQuery<CreditPackage[]>({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const res = await apiFetch('/api/credit-packages');
      if (!res.ok) throw new Error(`Could not load credit packages (HTTP ${res.status})`);
      const packages = await res.json();
      if (!Array.isArray(packages)) throw new Error('The credit package response was invalid.');
      return packages;
    }
  });

  const { data: paymentMethods = [], isLoading: paymentMethodsLoading, error: paymentMethodsError } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await apiFetch('/api/payment-methods');
      if (!res.ok) throw new Error(`Could not load payment methods (HTTP ${res.status})`);
      const methods = await res.json();
      if (!Array.isArray(methods)) throw new Error('The payment method response was invalid.');
      return methods;
    }
  });

  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery<MobilePlan[]>({
    queryKey: ['mobile-plans'],
    queryFn: async () => {
      const res = await apiFetch('/api/plans');
      if (!res.ok) throw new Error(`Could not load plans (HTTP ${res.status})`);
      const allPlans = await res.json();
      if (!Array.isArray(allPlans)) throw new Error('The plan response was invalid.');
      return allPlans.filter((plan: MobilePlan) => plan.userType === 'user');
    }
  });

  const onlineProviderTypes = ['paystack', 'flutterwave', 'bachs'];
  const availablePaymentMethods = paymentMethods.filter((method, index, allMethods) =>
    method.active &&
    onlineProviderTypes.includes(method.type) &&
    allMethods.findIndex(candidate => candidate.active && candidate.type === method.type) === index
  );
  const manualPaymentMethods = paymentMethods.filter(method =>
    method.active && !onlineProviderTypes.includes(method.type) && method.type !== 'stripe'
  );
  const selectablePaymentMethods = [...availablePaymentMethods, ...manualPaymentMethods];
  const selectedMethod = selectablePaymentMethods.find(method => method.id === selectedPaymentProvider)
    || selectablePaymentMethods[0];

  const referralCode = profile?.referralCode || `SABI${(user?.id || 'CITIZEN').substring(0, 6).toUpperCase()}`;

  const handlePurchasePackage = async (pkg: CreditPackage) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase credits.');
      return;
    }
    if (!selectedMethod) {
      Alert.alert('Payment unavailable', 'No supported active payment provider is configured.');
      return;
    }

    const paymentData = {
      type: 'credit_purchase',
      amount: pkg.price,
      currency: 'NGN',
      description: `Purchase ${pkg.name} (${pkg.credits} credits)`,
      metadata: { packageId: pkg.id, credits: pkg.credits + (pkg.bonus || 0) }
    };
    if (manualPaymentMethods.some(method => method.id === selectedMethod.id)) {
      setManualPaymentMethod(selectedMethod);
      setManualPaymentData(paymentData);
      setManualFieldValues({});
      setManualFiles({});
      setShowPackagesModal(false);
      setShowManualPaymentModal(true);
      return;
    }

    setPurchasingId(pkg.id);
    try {
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedMethod.type,
          ...paymentData
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initiate payment');
      }

      const data = await res.json();
      const authUrl = data.authorizationUrl || data.redirectUrl;

      if (authUrl) {
        setShowPackagesModal(false);
        await Linking.openURL(authUrl);
      } else {
        throw new Error('Payment gateway did not provide a checkout URL');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Could not start payment. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchasePlan = async (plan: MobilePlan) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to select a plan.');
      return;
    }
    if (plan.price <= 0) {
      Alert.alert('Free plan', 'Your current free allowance is available on this account.');
      return;
    }
    if (!selectedMethod) {
      Alert.alert('Payment unavailable', 'No supported active payment provider is configured.');
      return;
    }

    const paymentData = {
      type: 'subscription',
      currency: 'NGN',
      description: `${plan.name} plan`,
      metadata: { planId: plan.id }
    };
    if (manualPaymentMethods.some(method => method.id === selectedMethod.id)) {
      setManualPaymentMethod(selectedMethod);
      setManualPaymentData(paymentData);
      setManualFieldValues({});
      setManualFiles({});
      setShowPlansModal(false);
      setShowManualPaymentModal(true);
      return;
    }

    setPurchasingId(`plan:${plan.id}`);
    try {
      const response = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedMethod.type,
          ...paymentData
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Could not start checkout (HTTP ${response.status})`);
      }
      const checkout = await response.json();
      const checkoutUrl = checkout.authorizationUrl || checkout.redirectUrl;
      if (!checkoutUrl) throw new Error('The payment provider did not return a checkout link.');
      setShowPlansModal(false);
      await Linking.openURL(checkoutUrl);
    } catch (error) {
      Alert.alert('Plan checkout error', error instanceof Error ? error.message : 'Could not start checkout.');
    } finally {
      setPurchasingId(null);
    }
  };

  const pickManualPaymentFile = async (fieldName: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        setManualFiles(current => ({ ...current, [fieldName]: result.assets[0] }));
      }
    } catch (error) {
      Alert.alert('File selection failed', error instanceof Error ? error.message : 'Could not select a file.');
    }
  };

  const submitManualPayment = async () => {
    if (!manualPaymentMethod || !manualPaymentData) return;
    const fields = manualPaymentMethod.fields || [];
    if (!fields.length && !manualPaymentMethod.instructions?.trim()) {
      Alert.alert('Payment method unavailable', 'This manual payment method has no instructions configured. Please contact support.');
      return;
    }
    const missingField = fields.find(field => {
      if (!field.required) return false;
      return field.type === 'file'
        ? !manualFiles[field.name]
        : !manualFieldValues[field.name]?.trim();
    });
    if (missingField) {
      Alert.alert('Required information', `Please complete ${missingField.label || missingField.name}.`);
      return;
    }

    setPurchasingId('manual-payment');
    try {
      const submittedFields = await Promise.all(fields.map(async field => {
        let value = manualFieldValues[field.name] || '';
        const file = manualFiles[field.name];
        if (file) {
          const form = new FormData();
          form.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream'
          } as any);
          const uploadResponse = await apiFetch('/api/upload', { method: 'POST', body: form });
          if (!uploadResponse.ok) throw new Error(`Could not upload ${file.name}.`);
          const uploaded = await uploadResponse.json();
          value = uploaded.url;
        }
        return {
          name: field.name,
          type: field.type || 'text',
          required: !!field.required,
          value
        };
      }));

      const response = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: manualPaymentMethod.id,
          ...manualPaymentData,
          metadata: { ...manualPaymentData.metadata, manualFields: submittedFields }
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Could not submit payment for approval.');
      }

      setShowManualPaymentModal(false);
      setManualPaymentMethod(null);
      setManualPaymentData(null);
      Alert.alert('Payment submitted', 'Your payment details were sent for review. Your plan or credits will update after approval.', [
        { text: 'OK', onPress: () => queryClient.invalidateQueries({ queryKey: ['pending-payments'] }) }
      ]);
    } catch (error) {
      Alert.alert('Payment error', error instanceof Error ? error.message : 'Could not submit payment.');
    } finally {
      setPurchasingId(null);
    }
  };

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['credit-packages'] }),
        queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
        queryClient.invalidateQueries({ queryKey: ['mobile-plans'] }),
        refetchLinks(),
        refreshCredits()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkChannels = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to link your WhatsApp or Telegram accounts.');
      return;
    }
    setLinkingLoading(true);
    try {
      const existingLinks = linkedChannels;
      const res = await apiFetch('/api/channels/link-code', { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Could not create link code (HTTP ${res.status})`);
      }
      const data = await res.json();
      const code = data.code;
      setLinkedChannelsBeforeCode(Object.fromEntries(existingLinks.map(link => [link.channel, link.linked_at])));
      setPendingLinkExpiresAt(data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 10 * 60 * 1000);
      const message = `link ${code}`;

      Alert.alert(
        'Link WhatsApp / Telegram',
        `Send the following message to the SabiRight bot on WhatsApp or Telegram within 10 minutes:\n\n${message}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share / Send Code',
            onPress: async () => {
              try {
                await Share.share({
                  message: `link ${code}`,
                  title: 'Link SabiRight Bot'
                });
              } catch {
                Alert.alert('Could not open share sheet', `Your link command is: ${message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Could not create link code', error instanceof Error ? error.message : 'Please check your connection and try again.');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkChannel = (channel: string) => {
    Alert.alert(
      `Unlink ${channel.toUpperCase()}`,
      `Are you sure you want to unlink your ${channel.toUpperCase()} channel from this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/channels/links/${channel}`, { method: 'DELETE' });
              if (res.ok) {
                refetchLinks();
                Alert.alert('Unlinked', `Your ${channel.toUpperCase()} account has been unlinked.`);
              }
            } catch {
              Alert.alert('Error', 'Failed to unlink channel. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        } 
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 }
        ]} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshProfile} tintColor={colors.primary} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
          <View style={styles.userRow}>
            <View style={[styles.avatarBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <User size={28} color={colors.primary} />
            </View>
            <View style={styles.userInfoCol}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{profile?.displayName || user?.email?.split('@')[0] || 'Citizen'}</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'Registered Citizen'}</Text>
              <View style={styles.userCityRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={[styles.userCityText, { color: colors.textSecondary }]}>{profile?.city || 'Lagos'}, Nigeria</Text>
              </View>
            </View>
          </View>

          {/* Plan & Credits Block */}
          <View style={[styles.creditsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.creditsLeft}>
              <Coins size={18} color="#f59e0b" />
              <View>
                <Text style={[styles.creditsLabel, { color: colors.textPrimary }]}>
                  {planName || 'Citizen Free'}
                </Text>
                <Text style={[styles.creditsSub, { color: colors.textMuted }]}>
                  {renewalDate ? `Renews on ${new Date(renewalDate).toLocaleDateString()}` : 'Standard allowance'}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.creditsValue, { color: colors.primary }]}>
                  {!user ? 'Sign in' : creditsLoading ? '...' : available === null ? '--' : `${available} Left`}
                </Text>
                <TouchableOpacity onPress={() => refreshCredits()} style={{ padding: 4 }}>
                  <RefreshCw size={13} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {used !== null && (
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  Used: {used}
                </Text>
              )}
            </View>
          </View>

          {/* Top Up Credits Button */}
          {user && (
            <View style={styles.purchaseActions}>
              <TouchableOpacity
                onPress={() => setShowPackagesModal(true)}
                style={[styles.purchaseAction, { backgroundColor: colors.primary }]}
              >
                <Coins size={15} color="#ffffff" />
                <Text style={styles.purchaseActionText}>Top up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPlansModal(true)}
                style={[styles.purchaseAction, { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1 }]}
              >
                <Sparkles size={15} color={colors.primary} />
                <Text style={[styles.purchaseActionText, { color: colors.primary }]}>View plans</Text>
              </TouchableOpacity>
            </View>
          )}

          {user && storage && (
            <View style={[styles.creditsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: 10 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.creditsLabel, { color: colors.textPrimary }]}>Chat Storage</Text>
                <Text style={[styles.creditsSub, { color: colors.textMuted }]} numberOfLines={1}>Saved chat history</Text>
              </View>
              <Text
                style={[styles.creditsValue, { color: colors.textPrimary, flexShrink: 1, textAlign: 'right' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {formatBytes(storage.used)} / {formatBytes(storage.limit)}
              </Text>
            </View>
          )}
        </View>

        {/* WhatsApp & Telegram Bot Omnichannel Linking */}
        {user && (
          <View style={[styles.settingsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Link2 size={16} color={colors.primary} />
                <Text style={[styles.settingItemLabel, { color: colors.textPrimary, fontWeight: '800' }]}>
                  Omnichannel Bot Sync
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                Sync credits, legal discovery files and chats with WhatsApp & Telegram
              </Text>
            </View>

            {/* Existing links */}
            {linkedChannels.length > 0 && (
              <View style={{ marginBottom: 12, gap: 6 }}>
                {linkedChannels.map((link) => (
                  <View 
                    key={link.channel}
                    style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      borderWidth: 1
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color={colors.success} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'capitalize' }}>
                        {link.channel} Linked
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUnlinkChannel(link.channel)}>
                      <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700' }}>Unlink</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {pendingLinkExpiresAt && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
                Waiting for you to send the link command to the bot. This code expires in 10 minutes.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleLinkChannels}
              disabled={linkingLoading || linkedChannelsLoading || !!pendingLinkExpiresAt}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
                borderWidth: 1,
                paddingVertical: 12,
                borderRadius: 10
              }}
            >
              <MessageSquare size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                {linkingLoading ? 'Generating Code...' : pendingLinkExpiresAt ? 'Waiting for Bot Connection...' : 'Get Link Code for WhatsApp / Telegram'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Theme & Preferences Card */}
        <View style={[styles.settingsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.settingItemLeft}>
              {isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color="#f59e0b" />}
              <Text style={[styles.settingItemLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            style={[styles.settingItem, { borderBottomColor: colors.surfaceBorder }]}
          >
            <View style={styles.settingItemLeft}>
              <Bell size={18} color={colors.primary} />
              <Text style={[styles.settingItemLabel, { color: colors.textPrimary }]}>Notifications</Text>
            </View>
            <Text style={[styles.settingItemValue, { color: colors.primary }]}>Manage</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.settingItemLeft}>
              <Globe size={18} color={colors.textMuted} />
              <Text style={[styles.settingItemLabel, { color: colors.textPrimary }]}>Active Language</Text>
            </View>
            <Text style={[styles.settingItemValue, { color: colors.primary }]}>{profile?.language || 'English'}</Text>
          </View>

          <View style={[styles.settingItem, styles.settingItemNoBorder]}>
            <View style={styles.settingItemLeft}>
              <ShieldCheck size={18} color={colors.success} />
              <Text style={[styles.settingItemLabel, { color: colors.textPrimary }]}>Civic Legal Grounding</Text>
            </View>
            <Text style={[styles.statutoryBadge, { color: colors.success }]}>Constitution Verified</Text>
          </View>
        </View>

        {/* Referral Card */}
        <View style={[styles.referralCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
          <View style={styles.referralHeader}>
            <Text style={[styles.referralTitle, { color: colors.textPrimary }]}>
              🎁 Invite Citizens & Earn Credits
            </Text>
            <Share2 size={16} color={colors.primary} />
          </View>
          <Text style={[styles.referralDesc, { color: colors.textMuted }]}>
            Share your citizen referral code with friends. You both receive 20 bonus credits when they join.
          </Text>

          <View style={[styles.referralCodeBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.referralCodeText, { color: colors.primary }]}>{referralCode}</Text>
            <TouchableOpacity 
              onPress={() => Alert.alert('Copied!', `Referral code ${referralCode} copied.`)}
              style={styles.copyBtn}
            >
              <Text style={styles.copyBtnText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignOut}
          style={[styles.signOutBtn, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Credit Packages Top-Up Modal */}
      <Modal
        visible={showPackagesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPackagesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Top Up Credits</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Purchase credits for AI queries, traffic alerts & legal discovery</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPackagesModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {packagesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <Text style={[styles.paymentLabel, { color: colors.textMuted }]}>PAY WITH</Text>
                {paymentMethodsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
                ) : paymentMethodsError ? (
                  <Text style={[styles.emptyMessage, { color: colors.danger }]}>
                    {paymentMethodsError instanceof Error ? paymentMethodsError.message : 'Payment methods are unavailable.'}
                  </Text>
                ) : selectablePaymentMethods.length === 0 ? (
                  <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                    No active payment methods are configured. Please contact support.
                  </Text>
                ) : (
                  <View style={styles.providerOptions}>
                    {selectablePaymentMethods.map(method => (
                      <TouchableOpacity
                        key={method.id}
                        onPress={() => setSelectedPaymentProvider(method.id)}
                        style={[
                          styles.providerOption,
                          {
                            backgroundColor: selectedMethod?.id === method.id ? colors.primarySoft : colors.surface,
                            borderColor: selectedMethod?.id === method.id ? colors.primary : colors.surfaceBorder
                          }
                        ]}
                      >
                        <Text style={{ color: selectedMethod?.id === method.id ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                          {method.name}{manualPaymentMethods.some(item => item.id === method.id) ? ' · Manual' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {creditPackages.length === 0 && (
                  <Text style={[styles.emptyMessage, { color: packagesError ? colors.danger : colors.textMuted }]}>
                    {packagesError instanceof Error
                      ? packagesError.message
                      : 'No credit packages are currently available.'}
                  </Text>
                )}
                {creditPackages.map((pkg) => {
                  const isBusy = purchasingId === pkg.id;
                  const totalPackageCredits = pkg.credits + (pkg.bonus || 0);

                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      activeOpacity={0.8}
                      disabled={purchasingId !== null || !selectedMethod}
                      onPress={() => handlePurchasePackage(pkg)}
                      style={[
                        styles.packageCard,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.packageName, { color: colors.textPrimary }]}>{pkg.name}</Text>
                          {pkg.bonus ? (
                            <View style={[styles.bonusBadge, { backgroundColor: colors.successSoft }]}>
                              <Text style={[styles.bonusBadgeText, { color: colors.success }]}>+{pkg.bonus} bonus</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800', marginTop: 2 }}>
                          {totalPackageCredits} credits
                        </Text>
                        {pkg.description ? (
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>{pkg.description}</Text>
                        ) : null}
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 }}>
                        <Text style={[styles.packagePrice, { color: colors.textPrimary }]}>
                          ₦{pkg.price.toLocaleString()}
                        </Text>
                        <View style={[styles.buyBtn, { backgroundColor: selectedMethod ? colors.primary : colors.textMuted }]}>
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={styles.buyBtnText}>Pay</Text>
                              <ArrowUpRight size={13} color="#ffffff" />
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                Checkout is secured by your selected provider. Credits are added after payment confirmation.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPlansModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlansModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Plans</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Compare credits, storage and benefits</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPlansModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {plansLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
            ) : plansError ? (
              <Text style={[styles.emptyMessage, { color: colors.danger }]}>
                {plansError instanceof Error ? plansError.message : 'Plans are unavailable.'}
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {plans.map(plan => {
                  const isBusy = purchasingId === `plan:${plan.id}`;
                  const monthlyCredits = plan.monthlyCredits ?? plan.credits;
                  return (
                    <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                      <View style={styles.planHeading}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.packageName, { color: colors.textPrimary }]}>{plan.name}</Text>
                          <Text style={[styles.planAllocation, { color: colors.primary }]}>
                            {monthlyCredits} credits · {plan.storageMb ?? 0.5} MB storage
                          </Text>
                        </View>
                        <Text style={[styles.packagePrice, { color: colors.textPrimary }]}>
                          {plan.price > 0 ? `₦${plan.price.toLocaleString()}` : 'Free'}
                        </Text>
                      </View>
                      {plan.description ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 }}>{plan.description}</Text>
                      ) : null}
                      {!!plan.features?.length && (
                        <View style={styles.planFeatures}>
                          {plan.features.slice(0, 4).map((feature, index) => (
                            <Text key={`${plan.id}-feature-${index}`} style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                              • {feature}
                            </Text>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handlePurchasePlan(plan)}
                        disabled={purchasingId !== null || (plan.price > 0 && !selectedMethod)}
                        style={[styles.planButton, { backgroundColor: plan.price > 0 && selectedMethod ? colors.primary : colors.primarySoft }]}
                      >
                        {isBusy ? <ActivityIndicator size="small" color="#ffffff" /> : (
                          <Text style={{ color: plan.price > 0 && selectedMethod ? '#ffffff' : colors.primary, fontSize: 12, fontWeight: '800' }}>
                            {plan.price > 0 ? 'Choose plan' : 'Free plan'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {plans.length === 0 && (
                  <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>No citizen plans are currently available.</Text>
                )}
                {selectablePaymentMethods.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.paymentLabel, { color: colors.textMuted }]}>PAY WITH</Text>
                    <View style={styles.providerOptions}>
                      {selectablePaymentMethods.map(method => (
                        <TouchableOpacity
                          key={method.id}
                          onPress={() => setSelectedPaymentProvider(method.id)}
                          style={[
                            styles.providerOption,
                            {
                              backgroundColor: selectedMethod?.id === method.id ? colors.primarySoft : colors.surface,
                              borderColor: selectedMethod?.id === method.id ? colors.primary : colors.surfaceBorder
                            }
                          ]}
                        >
                          <Text style={{ color: selectedMethod?.id === method.id ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                            {method.name}{manualPaymentMethods.some(item => item.id === method.id) ? ' · Manual' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showManualPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{manualPaymentMethod?.name || 'Manual payment'}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Follow the instructions, then submit your payment details.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowManualPaymentModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {manualPaymentMethod?.instructions ? (
                <Text style={[styles.manualInstructions, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
                  {manualPaymentMethod.instructions}
                </Text>
              ) : null}
              {manualPaymentMethod?.description ? (
                <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
                  {manualPaymentMethod.description}
                </Text>
              ) : null}
              {(manualPaymentMethod?.fields || []).map(field => (
                <View key={field.name} style={{ marginBottom: 12 }}>
                  <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                    {field.label || field.name}{field.required ? ' *' : ''}
                  </Text>
                  {field.type === 'file' ? (
                    <TouchableOpacity
                      onPress={() => pickManualPaymentFile(field.name)}
                      style={[styles.manualField, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
                    >
                      <Text numberOfLines={1} style={{ color: manualFiles[field.name] ? colors.textPrimary : colors.textMuted, fontSize: 13 }}>
                        {manualFiles[field.name]?.name || 'Choose receipt or supporting file'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      value={manualFieldValues[field.name] || ''}
                      onChangeText={value => setManualFieldValues(current => ({ ...current, [field.name]: value }))}
                      placeholder={field.label || field.name}
                      placeholderTextColor={colors.textMuted}
                      keyboardType={field.type === 'number' ? 'numeric' : field.type === 'email' ? 'email-address' : 'default'}
                      multiline={field.type === 'textarea'}
                      style={[
                        styles.manualField,
                        { borderColor: colors.surfaceBorder, backgroundColor: colors.surface, color: colors.textPrimary }
                      ]}
                    />
                  )}
                </View>
              ))}
              {!manualPaymentMethod?.fields?.length && !manualPaymentMethod?.instructions && (
                <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                  This payment method has no payment instructions configured. Please contact support.
                </Text>
              )}
              <TouchableOpacity
                disabled={purchasingId === 'manual-payment'}
                onPress={submitManualPayment}
                style={[styles.planButton, { backgroundColor: colors.primary, marginTop: 4 }]}
              >
                {purchasingId === 'manual-payment'
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>Submit for review</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  profileCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  userCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCityText: {
    fontSize: 12,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  creditsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  creditsSub: {
    fontSize: 10,
    marginTop: 1,
  },
  creditsValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  purchaseActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  purchaseAction: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  purchaseActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingItemNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingItemLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItemValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statutoryBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  referralCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  referralTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  referralDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  referralCodeText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  copyBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  providerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  providerOption: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyMessage: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 18,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  planHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planAllocation: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  planFeatures: {
    gap: 4,
    marginTop: 8,
  },
  manualInstructions: {
    fontSize: 13,
    lineHeight: 20,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  manualField: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  planButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: 9,
    marginTop: 10,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '800',
  },
  packagePrice: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  bonusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  buyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
