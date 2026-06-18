/**
 * @file app/chat.tsx
 * @description AI travel assistant chat screen, powered by Gemini.
 */

import React, { useCallback, useRef, useState } from 'react';
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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors } from '../constants/colors';
import { sendChatMessage, type ChatMessage } from '../lib/api/chat';

const MAX_HISTORY = 10;

interface ChatBubbleData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: ChatBubbleData = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your Toureez travel assistant. Ask me about destinations, bookings, or travel tips and I'll do my best to help.",
};

function ChatBubble({ message }: { message: ChatBubbleData }): React.ReactElement {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen(): React.ReactElement {
  const [messages, setMessages] = useState<ChatBubbleData[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatBubbleData>>(null);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as never);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatBubbleData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsSending(true);

    // Build history from the conversation so far (excluding the welcome message),
    // capped to the last MAX_HISTORY turns to keep the request small.
    setMessages((prev) => {
      const history: ChatMessage[] = prev
        .filter((item) => item.id !== WELCOME_MESSAGE.id)
        .slice(-MAX_HISTORY)
        .map((item) => ({ role: item.role, content: item.content }));

      void sendChatMessage(trimmed, history)
        .then((response) => {
          const replyContent =
            response.data?.reply ?? response.error ?? "Sorry, I couldn't get a response. Please try again.";

          setMessages((current) => [
            ...current,
            { id: `assistant-${Date.now()}`, role: 'assistant', content: replyContent },
          ]);
        })
        .finally(() => {
          setIsSending(false);
        });

      return prev;
    });
  }, [draft, isSending]);

  const renderMessage: ListRenderItem<ChatBubbleData> = useCallback(
    ({ item }) => <ChatBubble message={item} />,
    []
  );

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
              Travel Assistant
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Powered by Gemini
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {isSending ? (
          <View style={styles.typingRow}>
            <LoadingSpinner size="small" />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        ) : null}

        <View style={styles.composer}>
          <Input
            placeholder="Ask about trips, bookings, destinations..."
            value={draft}
            onChangeText={setDraft}
            multiline
            containerStyle={styles.composerInput}
            editable={!isSending}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || isSending) && styles.sendButtonDisabled,
              pressed ? styles.pressed : null,
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || isSending}
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
  bubbleRowAssistant: {
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
  bubbleAssistant: {
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
  bubbleTextAssistant: {
    color: Colors.textPrimary,
  },
  typingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  typingText: {
    color: Colors.textLight,
    fontSize: 12,
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
  pressed: {
    opacity: 0.78,
  },
});
