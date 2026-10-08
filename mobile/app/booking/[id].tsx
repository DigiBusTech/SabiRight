import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Send, FileText } from 'lucide-react-native';

export default function BookingChatScreen() {
  const { id, name } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/bookings/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['booking-messages', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/bookings/${id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 3000
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiFetch(`/api/bookings/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          senderId: user?.id,
          isAdminMessage: false
        })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-messages', id] });
      setInputText('');
    }
  });

  const handleSend = () => {
    if (!inputText.trim() || sendMutation.isPending) return;
    sendMutation.mutate(inputText.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerName}>{name || booking?.title || 'Advocate Consultation'}</Text>
          <Text style={styles.headerSub}>● Direct Consultation ? Fees agreed directly</Text>
        </View>

        {booking?.caseFile && (
          <View style={styles.intakeCard}>
            <View style={styles.intakeHeader}>
              <View style={styles.intakeTitleRow}>
                <FileText size={14} color="#c084fc" />
                <Text style={styles.intakeTitle}>
                  Intake Brief ({booking.caseFile.case_ref})
                </Text>
              </View>
              <Text style={styles.intakeUrgency}>
                {booking.caseFile.urgency_level}
              </Text>
            </View>
            <Text style={styles.intakeSummary} numberOfLines={2}>
              {booking.caseFile.issue_summary}
            </Text>
          </View>
        )}

        <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Consultation room active. Message your advocate to discuss terms and next steps.
              </Text>
            </View>
          ) : (
            messages.map((m: any) => {
              const isMe = m.senderId === user?.id;
              return (
                <View
                  key={m.id || Math.random()}
                  style={[
                    styles.chatBubble,
                    isMe ? styles.bubbleMe : styles.bubbleThem
                  ]}
                >
                  <Text style={styles.chatText}>{m.message}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type message to advocate..."
            placeholderTextColor="#64748b"
            style={styles.inputField}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sendMutation.isPending}
            style={styles.sendBtn}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
    color: '#34d399',
    marginTop: 2,
    fontWeight: '600',
  },
  intakeCard: {
    margin: 12,
    padding: 12,
    backgroundColor: 'rgba(88, 28, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 16,
  },
  intakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  intakeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intakeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d8b4fe',
  },
  intakeUrgency: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f87171',
    textTransform: 'uppercase',
  },
  intakeSummary: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatBubble: {
    marginBottom: 10,
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#020617',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sendBtn: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

