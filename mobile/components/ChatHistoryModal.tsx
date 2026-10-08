import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Trash2, X, HardDrive } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';

export interface StoredChat { id: string; title: string; createdAt: string }
export interface StorageInfo { used: number; limit: number; remaining: number; chatCount: number }

export const formatBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(1)} KB`);

export function useChatStorage() {
  const { user } = useAuth();
  return useQuery<StorageInfo>({
    queryKey: ['chat-storage', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiFetch('/api/sabiguard/storage');
      if (!res.ok) throw new Error('storage');
      return res.json();
    },
  });
}

interface Props {
  visible: boolean;
  activeChatId: string | null;
  onClose: () => void;
  onNew: () => void;
  onSelect: (chatId: string) => void;
  onDeleted: (chatId: string) => void;
}

export default function ChatHistoryModal({ visible, activeChatId, onClose, onNew, onSelect, onDeleted }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: storage } = useChatStorage();

  const { data: chats = [], isLoading } = useQuery<StoredChat[]>({
    queryKey: ['chat-list', user?.id],
    enabled: !!user?.id && visible,
    queryFn: async () => {
      const res = await apiFetch(`/api/sabiguard/chats?userId=${user!.id}`);
      if (!res.ok) throw new Error('chats');
      return res.json();
    },
  });

  const pct = storage ? Math.min(100, Math.round((storage.used / Math.max(1, storage.limit)) * 100)) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : colors.primary;

  const remove = (chat: StoredChat) => {
    Alert.alert('Delete chat', 'This frees up your storage space.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await apiFetch(`/api/sabiguard/chats/${chat.id}`, { method: 'DELETE' });
          if (!res.ok) { Alert.alert('Could not delete chat'); return; }
          queryClient.invalidateQueries({ queryKey: ['chat-list', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['chat-storage', user?.id] });
          onDeleted(chat.id);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Chat History</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color={colors.textMuted} /></TouchableOpacity>
        </View>

        <View style={[styles.storageCard, { backgroundColor: colors.surfaceCard, borderColor: colors.surfaceBorder }]}>
          <View style={styles.storageRow}>
            <HardDrive size={16} color={colors.primary} />
            <Text style={[styles.storageLabel, { color: colors.textPrimary }]}>Chat storage</Text>
            <Text style={[styles.storageValue, { color: colors.textMuted }]}>
              {storage ? `${formatBytes(storage.used)} / ${formatBytes(storage.limit)}` : '--'}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
          {pct >= 90 && (
            <Text style={styles.warn}>Almost full. Delete old chats or upgrade your plan for more space.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => { onNew(); onClose(); }}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.newBtnText}>New chat</Text>
        </TouchableOpacity>

        {!user ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Sign in to save your chats.</Text>
        ) : isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No saved chats yet.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chatRow,
                  { backgroundColor: colors.surfaceCard, borderColor: item.id === activeChatId ? colors.primary : colors.surfaceBorder },
                ]}
                onPress={() => { onSelect(item.id); onClose(); }}
              >
                <MessageSquare size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.chatTitle, { color: colors.textPrimary }]}>{item.title || 'Chat'}</Text>
                  <Text style={[styles.chatDate, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => remove(item)} hitSlop={10}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  storageCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  storageLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  storageValue: { fontSize: 12 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  warn: { color: '#ef4444', fontSize: 11, marginTop: 8 },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, marginBottom: 12 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  chatTitle: { fontSize: 14, fontWeight: '600' },
  chatDate: { fontSize: 11, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 13 },
});
