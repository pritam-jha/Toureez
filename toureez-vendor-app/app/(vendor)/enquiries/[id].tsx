/**
 * @file app/(vendor)/enquiries/[id].tsx
 * @description Vendor enquiry thread — reply to a traveler's question about
 * a package. All messages are relayed through Toureez; no personal contact
 * details are shared.
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { Header } from '../../../components/ui/Header';
import { ListLoader } from '../../../components/ui/LoadingSpinner';
import { useScreenBack } from '../../../hooks/useScreenBack';
import {
  useSendEnquiryReply,
  useSetEnquiryStatus,
  useVendorEnquiryDetail,
} from '../../../hooks/useVendorEnquiries';
import { Colors } from '../../../constants/colors';
import type { EnquiryMessage } from '../../../types';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MessageBubble({ message }: { message: EnquiryMessage }): React.ReactElement {
  const isVendor = message.sender_role === 'vendor';
  return (
    <View style={[styles.bubbleRow, isVendor ? styles.bubbleRowVendor : styles.bubbleRowUser]}>
      <View style={[styles.bubble, isVendor ? styles.bubbleVendor : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isVendor ? styles.bubbleTextVendor : styles.bubbleTextUser]}>
          {message.message}
        </Text>
      </View>
      <Text style={styles.bubbleTime}>{formatTimestamp(message.created_at)}</Text>
    </View>
  );
}

export default function VendorEnquiryThreadScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const onBack = useScreenBack();

  const enquiryQuery = useVendorEnquiryDetail(id);
  const sendReply = useSendEnquiryReply();
  const setStatus = useSetEnquiryStatus();
  const [draft, setDraft] = useState('');

  const enquiry = enquiryQuery.data;

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || !id) return;

    setDraft('');
    sendReply.mutate({ enquiryId: id, message: trimmed });
  }, [draft, id, sendReply]);

  const handleToggleStatus = useCallback(() => {
    if (!enquiry || !id) return;
    setStatus.mutate({ enquiryId: id, status: enquiry.status === 'open' ? 'closed' : 'open' });
  }, [enquiry, id, setStatus]);

  const renderItem = useCallback(
    ({ item }: { item: EnquiryMessage }) => <MessageBubble message={item} />,
    [],
  );

  return (
    <View style={styles.flex}>
      <Header
        title={enquiry?.package?.title ?? 'Enquiry'}
        subtitle={enquiry ? (enquiry.status === 'open' ? 'Open' : 'Closed') : undefined}
        showBack
        onBack={onBack}
        rightAction={
          enquiry ? (
            <Pressable
              onPress={handleToggleStatus}
              disabled={setStatus.isPending}
              accessibilityRole="button"
              accessibilityLabel={enquiry.status === 'open' ? 'Mark as closed' : 'Reopen enquiry'}
              style={styles.statusBtn}
            >
              <Ionicons
                name={enquiry.status === 'open' ? 'checkmark-done-outline' : 'refresh-outline'}
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {enquiryQuery.isLoading ? (
          <ListLoader />
        ) : enquiryQuery.isError || !enquiry ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={40} color={Colors.textLight} />
            <Text style={styles.errorText}>Failed to load this enquiry.</Text>
            <Pressable style={styles.retryBtn} onPress={() => void enquiryQuery.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={enquiry.messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a reply..."
            placeholderTextColor={Colors.textLight}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!sendReply.isPending}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (!draft.trim() || sendReply.isPending) && styles.sendBtnDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || sendReply.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send reply"
          >
            <Ionicons name="send" size={18} color={Colors.textWhite} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bubbleRow: {
    marginBottom: 14,
    maxWidth: '82%',
  },
  bubbleRowVendor: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowUser: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleVendor: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.backgroundWhite,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextVendor: {
    color: Colors.textWhite,
  },
  bubbleTextUser: {
    color: Colors.text,
  },
  bubbleTime: {
    marginTop: 4,
    fontSize: 10,
    color: Colors.textLight,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.backgroundWhite,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  pressed: { opacity: 0.7 },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
});
