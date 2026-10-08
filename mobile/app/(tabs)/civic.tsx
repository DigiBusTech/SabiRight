import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  StyleSheet 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCredits } from '../../hooks/useCredits';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../lib/api';
import { 
  OFFLINE_LEGAL_MOAT, 
  getGuestOfflineCreditsRemaining, 
  consumeGuestOfflineCredit, 
  getCachedUserCreditsOffline, 
  recordOfflineCreditDeduction 
} from '../../lib/offlineStorage';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import ChatMarkdown from '../../components/ChatMarkdown';
import ChatHistoryModal, { useChatStorage } from '../../components/ChatHistoryModal';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Globe, 
  Check, 
  X,
  History
} from 'lucide-react-native';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'English', label: 'English', subtitle: 'Official Federal Law' },
  { code: 'Nigerian Pidgin', label: 'Pidgin', subtitle: 'Street-Level Rights' },
  { code: 'Hausa', label: 'Hausa', subtitle: 'Dokokin Najeriya' },
  { code: 'Yoruba', label: 'Yorùbá', subtitle: 'Àwọn Ẹ̀tọ́ Òfin' },
  { code: 'Igbo', label: 'Igbo', subtitle: 'Ikike Iwu Obodo' },
];

export default function CivicChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, profile } = useAuth();
  const { refresh: refreshCredits } = useCredits();
  const queryClient = useQueryClient();
  const { data: chatStorage } = useChatStorage();
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUrgent, setIsUrgent] = useState(params.urgent === 'true');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.language || 'English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionIdRef = useRef(`mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (params.urgent === 'true') {
      setIsUrgent(true);
      setMessages([
        {
          id: 'welcome-urgent',
          role: 'assistant',
          content: "🚨 URGENT EMERGENCY MODE ACTIVE\n\nStay calm. Keep your hands visible. State what is happening right now (e.g., 'Police stopped me at checkpoint and asking for phone search'). I will give you immediate, step-by-step statutory rights."
        }
      ]);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I am your SabiRight AI Agent. How can I help you with your civic enquiry in ${profile?.city || 'Nigeria'} today?`
        }
      ]);
    }
  }, [params.urgent]);

  const welcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I am your SabiRight AI Agent. How can I help you with your civic enquiry in ${profile?.city || 'Nigeria'} today?`
  });

  const startNewChat = () => {
    setChatId(null);
    sessionIdRef.current = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages([welcomeMessage()]);
  };

  const openChat = async (id: string) => {
    try {
      const res = await apiFetch(`/api/sabiguard/chats/${id}/messages`);
      if (!res.ok) throw new Error('load');
      const rows = await res.json();
      setChatId(id);
      setMessages([
        welcomeMessage(),
        ...rows.map((m: any) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || ''
        }))
      ]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Alert.alert('Could not open chat', 'Please try again.');
    }
  };

  const handleToggleTTS = async (messageId: string, text: string) => {
    try {
      if (speakingId === messageId) {
        await Speech.stop();
        setSpeakingId(null);
        return;
      }
      await Speech.stop();
      setSpeakingId(messageId);

      // Clean markdown formatting before speaking out loud
      const cleanText = text.replace(/[*_#"`]/g, '').trim();
      Speech.speak(cleanText, {
        language: 'en-NG',
        pitch: 1.0,
        rate: 0.92,
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    } catch (err) {
      console.warn('TTS error:', err);
      setSpeakingId(null);
    }
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleToggleRecord = async () => {
    if (transcribing) return;
    try {
      if (!isRecording) {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Microphone needed', 'Allow microphone access in Settings to use voice input.');
          return;
        }
        await Speech.stop();
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
        return;
      }

      setIsRecording(false);
      setTranscribing(true);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording');

      const blob = await (await fetch(uri)).blob();
      const audioBase64 = await blobToBase64(blob);
      const res = await apiFetch('/api/ai/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/mp4',
          language: selectedLanguage
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error === 'Voice transcription is not configured' ? 'Voice is not set up on the server yet.' : 'Transcription failed');
      }
      const data = await res.json();
      const spoken = (data.text || '').trim();
      if (!spoken) {
        Alert.alert('Nothing heard', 'We could not hear any speech. Please try again.');
      } else {
        setInputText(prev => (prev ? `${prev} ${spoken}` : spoken));
      }
    } catch (err) {
      console.warn('Voice input error:', err);
      setIsRecording(false);
      Alert.alert('Voice input failed', (err as any)?.message || 'Please try again or type your question.');
    } finally {
      setTranscribing(false);
    }
  };
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      let activeChatId = chatId;
      if (user?.id && !activeChatId) {
        const created = await apiFetch('/api/sabiguard/chats', {
          method: 'POST',
          body: JSON.stringify({ title: text.slice(0, 40) })
        });
        if (created.ok) {
          activeChatId = (await created.json()).id;
          setChatId(activeChatId);
        }
      }

      const res = await apiFetch('/api/ai/civic/chat', {
        method: 'POST',
        timeoutMs: 60000,
        body: JSON.stringify({
          message: text,
          language: selectedLanguage,
          sessionId: sessionIdRef.current,
          chatId: activeChatId || undefined,
          urgent: isUrgent,
          city: profile?.city || 'Lagos'
        })
      });

      if (res.status === 402) {
        setMessages((prev: ChatMessage[]) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: '⚠️ You are out of credits. Open Profile > Top Up Credits to recharge credits or upgrade your plan to continue chatting with SabiRight AI.' }]);
        return;
      }
      if (res.status === 413) {
        setMessages((prev: ChatMessage[]) => [...prev, { id: 'a-' + Date.now(), role: 'assistant', content: 'Your chat storage is full. Open History to delete old chats, or upgrade your plan for more space.' }]);
        return;
      }
      if (!res.ok) throw new Error('Server offline');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.answer || "Please consult a verified advocate."
      };
      setMessages((prev: ChatMessage[]) => [...prev, assistantMsg]);
    } catch (e: any) {
      // Offline fallback handling with strict credit policies
      const isGuest = !user?.id;
      if (isGuest) {
        const remaining = await getGuestOfflineCreditsRemaining();
        if (remaining <= 0) {
          setMessages((prev: ChatMessage[]) => [
            ...prev,
            {
              id: `fb-${Date.now()}`,
              role: 'assistant',
              content: '⚠️ You have used all 10 free offline credits for this guest session.\n\nPlease connect to the internet and create an account or sign in to continue using SabiRight, or restart your session.'
            }
          ]);
          return;
        }
        await consumeGuestOfflineCredit();
      } else {
        const cachedBal = await getCachedUserCreditsOffline(user.id);
        if (cachedBal !== null && cachedBal <= 0) {
          setMessages((prev: ChatMessage[]) => [
            ...prev,
            {
              id: `fb-${Date.now()}`,
              role: 'assistant',
              content: '⚠️ You have exhausted your available plan credits.\n\nPlease connect online to upgrade your plan or top up your credits.'
            }
          ]);
          return;
        }
        await recordOfflineCreditDeduction(user.id, 1);
      }

      const queryLower = text.toLowerCase();
      const matched = OFFLINE_LEGAL_MOAT.find(card => 
        queryLower.includes('phone') && card.section.includes('37') ||
        queryLower.includes('bail') && card.section.includes('66') ||
        queryLower.includes('arrest') && card.section.includes('38') ||
        queryLower.includes('police')
      ) || OFFLINE_LEGAL_MOAT[0];

      const footerNote = isGuest
        ? `\n\n*(Offline Mode • Free guest session • Chats not saved)*`
        : `\n\n*(Offline Mode • 1 credit deducted • Will sync when online)*`;

      const fallbackMsg: ChatMessage = {
        id: `fb-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ [Offline Statutory Guidance]\n\n*${matched.title} (${matched.statute} - ${matched.section})*\n\n${matched.summary}\n\n💬 What to say:\n"${matched.whatToSay}"${footerNote}`
      };
      setMessages((prev: ChatMessage[]) => [...prev, fallbackMsg]);
    } finally {
      refreshCredits();
      queryClient.invalidateQueries({ queryKey: ['chat-storage', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-list', user?.id] });
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSynthesizeBrief = async () => {
    if (messages.length <= 1) {
      Alert.alert('More Context Needed', 'Please describe your dispute first.');
      return;
    }

    setLoading(true);
    try {
      const historyPayload = messages.map((m: ChatMessage) => ({ role: m.role, content: m.content }));
      const res = await apiFetch('/api/case-files/synthesize', {
        method: 'POST',
        body: JSON.stringify({
          history: historyPayload,
          userId: user?.id,
          channel: 'mobile'
        })
      });

      const data = await res.json();
      if (data.success && data.caseRef) {
        Alert.alert(
          'Pre-Case Brief Generated!',
          `Case Ref: ${data.caseRef}\n\nYour dispute has been summarized. Would you like to view verified lawyers in your area now?`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'View Lawyers', onPress: () => router.push('/(tabs)/marketplace') }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Synthesis Error', 'Unable to reach case synthesizer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.surfaceBorder }]}>
          <View style={styles.headerTitleBlock}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={16} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>SabiRight Agent</Text>
            </View>
            <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Nigerian law • {selectedLanguage}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowHistory(true)}
              style={[styles.briefBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <History size={12} color={colors.textSecondary} />
              {chatStorage && chatStorage.limit > 0 && (
                <Text style={[styles.briefBadgeText, { color: colors.textSecondary }]}>
                  {Math.min(100, Math.round((chatStorage.used / chatStorage.limit) * 100))}%
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsUrgent(!isUrgent)}
              style={[
                styles.modeBadge,
                isUrgent ? styles.modeBadgeUrgent : [styles.modeBadgeNormal, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]
              ]}
            >
              <ShieldAlert size={12} color={isUrgent ? '#ef4444' : colors.textMuted} />
              <Text style={[
                styles.modeBadgeText,
                isUrgent ? styles.modeBadgeTextUrgent : { color: colors.textSecondary }
              ]}>
                {isUrgent ? 'Urgent' : 'Detailed'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSynthesizeBrief}
              style={[styles.briefBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            >
              <FileText size={12} color={colors.primary} />
              <Text style={[styles.briefBadgeText, { color: colors.primary }]}>Brief</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Thread */}
        <ScrollView 
          ref={scrollViewRef} 
          style={styles.messagesScroll}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: 16 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m: ChatMessage, mi: number) => {
            const isAssis = m.role === 'assistant';
            const isSpeaking = speakingId === m.id;

            return (
              <View 
                key={`${m.id}-${mi}`} 
                style={[
                  styles.chatBubble,
                  isAssis 
                    ? [styles.bubbleAssistant, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }] 
                    : styles.bubbleUser
                ]}
              >
                {isAssis ? (
                  <ChatMarkdown content={m.content.replace('[SHOW_PROFESSIONALS]', '')} color={colors.textPrimary} accent={colors.primary} />
                ) : (
                  <Text style={[styles.messageText, styles.textUser]}>{m.content}</Text>
                )}

                {/* Speaker TTS Icon for Assistant messages */}
                {isAssis && (
                  <View style={styles.bubbleFooter}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleToggleTTS(m.id, m.content)}
                      style={[
                        styles.speakerButton,
                        isSpeaking && { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                      ]}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX size={14} color={colors.primary} />
                          <Text style={[styles.speakerText, { color: colors.primary }]}>Stop</Text>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} color={colors.textMuted} />
                          <Text style={[styles.speakerText, { color: colors.textMuted }]}>Listen</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {loading && (
            <View style={[styles.loadingBubble, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Consulting legal statutes & 1999 Constitution...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Recording Active Status Banner */}
        {isRecording && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Listening... tap the mic to finish</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={[
          styles.inputBar, 
          { 
            backgroundColor: colors.surfaceCard, 
            borderTopColor: colors.surfaceBorder,
            paddingBottom: 10
          }
        ]}>
          {/* Language Selector Button */}
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={[styles.langButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            accessibilityLabel="Select Language"
          >
            <Globe size={16} color={colors.primary} />
            <Text style={[styles.langBtnText, { color: colors.textPrimary }]}>
              {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'Eng'}
            </Text>
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isUrgent ? "Describe situation right now..." : "Ask any Nigerian legal question..."}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.inputField, 
              { 
                backgroundColor: colors.inputBg, 
                borderColor: colors.inputBorder,
                color: colors.textPrimary
              }
            ]}
          />

          {/* Voice to Text Microphone Button */}
          <TouchableOpacity
            onPress={handleToggleRecord}
            style={[
              styles.micButton,
              isRecording 
                ? styles.micButtonRecording 
                : [styles.micButtonNormal, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]
            ]}
            accessibilityLabel="Voice to text"
          >
            {transcribing ? <ActivityIndicator size="small" color={colors.primary} /> : isRecording ? <MicOff size={18} color="#ffffff" /> : <Mic size={18} color={colors.primary} />}
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            style={[
              styles.sendButton,
              inputText.trim() && !loading ? styles.sendButtonActive : [styles.sendButtonDisabled, { backgroundColor: colors.surfaceBorder }]
            ]}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ChatHistoryModal
        visible={showHistory}
        activeChatId={chatId}
        onClose={() => setShowHistory(false)}
        onNew={startNewChat}
        onSelect={openChat}
        onDeleted={(id) => { if (id === chatId) startNewChat(); }}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Globe size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Language</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguageModal(false);
                    }}
                    style={[
                      styles.langOption,
                      isSelected ? [styles.langOptionActive, { backgroundColor: colors.primarySoft, borderColor: colors.primary }] : null
                    ]}
                  >
                    <View>
                      <Text style={[styles.langOptionLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                        {lang.label}
                      </Text>
                      <Text style={[styles.langOptionSub, { color: colors.textMuted }]}>
                        {lang.subtitle}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeBadgeNormal: {
    borderWidth: 1,
  },
  modeBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeBadgeTextUrgent: {
    color: '#ef4444',
  },
  briefBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  briefBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  chatBubble: {
    marginBottom: 12,
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#ffffff',
    fontWeight: '500',
  },
  textAssistant: {
    fontWeight: '400',
  },
  bubbleFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  speakerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  speakerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingBubble: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  recordingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  inputBar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: 90,
  },
  micButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonNormal: {
    borderWidth: 1,
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#2563eb',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalList: {
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langOptionActive: {
    borderWidth: 1,
  },
  langOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  langOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
});

