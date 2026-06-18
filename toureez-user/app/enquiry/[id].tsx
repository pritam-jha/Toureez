/**
 * @file app/enquiry/[id].tsx
 * @description Enquiry thread — traveler's chat with a vendor about a package.
 * All messages are relayed through the backend; no personal contact details are shared.
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useEnquiryDetail, useSendEnquiryMessage } from '../../hooks/useEnquiries';
import type { EnquiryMessage } from '../../types';

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
  const isUser = message.sender_role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowVendor]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleVendor]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextVendor]}>
          {message.message}
        </Text>
      </View>
      <Text style={styles.bubbleTime}>{formatTimestamp(message.created_at)}</Text>
    </View>
  );
}

export default function EnquiryThreadScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const enquiryQuery = useEnquiryDetail(id);
  const sendMessage = useSendEnquiryMessage();
  const [draft, setDraft] = useState('');

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/enquiry' as never);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || !id) return;

    setDraft('');
    sendMessage.mutate({ enquiry_id: id, message: trimmed });
  }, [draft, id, sendMessage]);

  const renderMessage: ListRenderItem<EnquiryMessage> = useCallback(
    ({ item }) => <MessageBubble message={item} />,
    []
  );

  const enquiry = enquiryQuery.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={21} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {enquiry?.company.name ?? 'Enquiry'}
            </Text>
            {enquiry?.package ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {enquiry.package.title}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {enquiryQuery.isLoading ? (
          <View style={styles.state}>
            <LoadingSpinner />
            <Text style={styles.stateTitle}>Loading conversation</Text>
          </View>
        ) : enquiryQuery.isError || !enquiry ? (
          <View style={styles.state}>
            <Ionicons name="cloud-offline-outline" size={30} color={Colors.textTertiary} />
            <Text style={styles.stateTitle}>Could not load this enquiry</Text>
            <Button label="Retry" variant="outline" onPress={() => void enquiryQuery.refetch()} />
          </View>
        ) : (
          <FlatList
            data={enquiry.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            inverted={false}
          />
        )}

        <View style={styles.composer}>
          <Input
            placeholder="Type a message..."
            value={draft}
            onChangeText={setDraft}
            multiline
            containerStyle={styles.composerInput}
            editable={!sendMessage.isPending}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || sendMessage.isPending) && styles.sendButtonDisabled,
              pressed ? styles.pressed : null,
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={18} color={Colors.textWhite} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundBase,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bubbleRow: {
    marginBottom: 14,
    maxWidth: '82%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowVendor: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleVendor: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.textWhite,
  },
  bubbleTextVendor: {
    color: Colors.textPrimary,
  },
  bubbleTime: {
    color: Colors.textLight,
    fontSize: 10,
    marginTop: 4,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  composerInput: {
    flex: 1,
    marginBottom: 0,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
