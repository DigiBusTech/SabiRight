import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch, Share, Modal, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { available, total, used, planCredits, planName, renewalDate, isLoading: creditsLoading, refresh: refreshCredits } = useCredits();
  const { data: storage } = useChatStorage();
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Fetch linked channels
  const { data: linkedChannels = [], refetch: refetchLinks } = useQuery<{ channel: string; linked_at: string }[]>({
    queryKey: ['channel-links', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch('/api/channels/links');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Fetch credit packages
  const { data: creditPackages = [], isLoading: packagesLoading } = useQuery<CreditPackage[]>({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const res = await apiFetch('/api/credit-packages');
      if (!res.ok) {
        return [
          { id: 'cp-starter', name: 'Starter Civic Pack', credits: 50, price: 500, bonus: 0 },
          { id: 'cp-standard', name: 'Standard Citizen Pack', credits: 200, price: 1800, bonus: 20 },
          { id: 'cp-pro', name: 'Pro Legal Pack', credits: 500, price: 4000, bonus: 50 }
        ];
      }
      return res.json();
    }
  });

  const referralCode = profile?.referralCode || `SABI${(user?.id || 'CITIZEN').substring(0, 6).toUpperCase()}`;

  const handlePurchasePackage = async (pkg: CreditPackage) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase credits.');
      return;
    }

    setPurchasingId(pkg.id);
    try {
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'paystack',
          type: 'credit_purchase',
          amount: pkg.price,
          currency: 'NGN',
          description: `Purchase ${pkg.name} (${pkg.credits} credits)`,
          metadata: {
            packageId: pkg.id,
            credits: pkg.credits + (pkg.bonus || 0)
          }
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

  const handleLinkChannels = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to link your WhatsApp or Telegram accounts.');
      return;
    }
    setLinkingLoading(true);
    try {
      const res = await apiFetch('/api/channels/link-code', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const code = data.code;
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
              } catch {}
            }
          }
        ]
      );
    } catch {
      Alert.alert('Could not create link code', 'Please check your connection and try again.');
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
            <TouchableOpacity
              onPress={() => setShowPackagesModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 10,
                marginTop: 10
              }}
            >
              <Coins size={15} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                Top Up Credits
              </Text>
            </TouchableOpacity>
          )}

          {user && storage && (
            <View style={[styles.creditsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: 10 }]}>
              <View>
                <Text style={[styles.creditsLabel, { color: colors.textPrimary }]}>Chat Storage</Text>
                <Text style={[styles.creditsSub, { color: colors.textMuted }]}>Encrypted local & cloud legal moat</Text>
              </View>
              <Text style={[styles.creditsValue, { color: colors.textPrimary }]}>{formatBytes(storage.used)} / {formatBytes(storage.limit)}</Text>
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

            <TouchableOpacity
              onPress={handleLinkChannels}
              disabled={linkingLoading}
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
                {linkingLoading ? 'Generating Code...' : 'Get Link Code for WhatsApp / Telegram'}
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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/bookings')}
          style={[styles.settingsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }]}
        >
          <Text style={[styles.settingItemLabel, { color: colors.textPrimary }]}>My Consultations & Booking History</Text>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>View</Text>
        </TouchableOpacity>

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
                {creditPackages.map((pkg) => {
                  const isBusy = purchasingId === pkg.id;
                  const totalPackageCredits = pkg.credits + (pkg.bonus || 0);

                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      activeOpacity={0.8}
                      disabled={purchasingId !== null}
                      onPress={() => handlePurchasePackage(pkg)}
                      style={[
                        styles.packageCard,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.packageName, { color: colors.textPrimary }]}>{pkg.name}</Text>
                          {pkg.bonus ? (
                            <View style={[styles.bonusBadge, { backgroundColor: colors.successSoft }]}>
                              <Text style={[styles.bonusBadgeText, { color: colors.success }]}>+{pkg.bonus} Free</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800', marginTop: 2 }}>
                          {totalPackageCredits} AI Credits
                        </Text>
                        {pkg.description ? (
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{pkg.description}</Text>
                        ) : null}
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={[styles.packagePrice, { color: colors.textPrimary }]}>
                          ₦{pkg.price.toLocaleString()}
                        </Text>
                        <View style={[styles.buyBtn, { backgroundColor: colors.primary }]}>
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
                Secured by Paystack. Credits are instantly credited to your unified SabiRight account.
              </Text>
            </View>
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
