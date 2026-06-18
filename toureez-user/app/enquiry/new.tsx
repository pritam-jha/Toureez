/**
 * @file app/enquiry/new.tsx
 * @description Composer for starting a new enquiry with a vendor about a package.
 * Messages are relayed through the backend — no personal contact details are shared.
 */

import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Colors } from '../../constants/colors';
import { useCreateEnquiry } from '../../hooks/useEnquiries';

export default function NewEnquiryScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ packageId?: string; packageTitle?: string }>();
  const packageId = typeof params.packageId === 'string' ? params.packageId : '';
  const packageTitle = typeof params.packageTitle === 'string' ? params.packageTitle : '';

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const createEnquiry = useCreateEnquiry();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as never);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please enter your question for the vendor.');
      return;
    }
    if (!packageId) {
      setError('This package could not be identified. Please go back and try again.');
      return;
    }

    setError('');
    createEnquiry.mutate(
      { package_id: packageId, message: trimmed },
      {
        onSuccess: (enquiry) => {
          router.replace({ pathname: '/enquiry/[id]' as never, params: { id: enquiry.id } });
        },
        onError: (err) => {
          setError(err.message || 'Failed to send your enquiry. Please try again.');
        },
      }
    );
  }, [createEnquiry, message, packageId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <Text style={styles.title} numberOfLines={1}>
            New Enquiry
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Your message is sent to the vendor through Toureez. Your phone number and email are
              never shared.
            </Text>
          </View>

          {packageTitle ? (
            <View style={styles.packageChip}>
              <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
              <Text style={styles.packageChipText} numberOfLines={1}>
                {packageTitle}
              </Text>
            </View>
          ) : null}

          <Input
            label="Your message"
            placeholder="Ask about availability, customisations, group discounts..."
            value={message}
            onChangeText={(value) => {
              setMessage(value);
              if (error) setError('');
            }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={styles.textArea}
            error={error}
            editable={!createEnquiry.isPending}
          />

          <Button
            label="Send Enquiry"
            onPress={handleSend}
            loading={createEnquiry.isPending}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>

      <Toast
        visible={Boolean(error) && !message.trim()}
        message={error}
        type="error"
        onHide={() => setError('')}
      />
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
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginHorizontal: 12,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    padding: 14,
  },
  infoText: {
    color: Colors.navy,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  packageChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  packageChipText: {
    color: Colors.navy,
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  pressed: {
    opacity: 0.78,
  },
});
