/**
 * @file components/dashboard/ConfirmActionSheet.tsx
 * @description Bottom-sheet confirmation modal for destructive/irreversible admin actions.
 *
 * Shows title, description, an optional text input (for rejection reasons),
 * a primary action button, and a cancel button.
 *
 * Usage:
 *   <ConfirmActionSheet
 *     visible={showSheet}
 *     title="Reject Vendor"
 *     description="This will notify the vendor. Reason is required."
 *     confirmLabel="Reject"
 *     confirmVariant="danger"
 *     requireReason
 *     onConfirm={(reason) => rejectVendor({ vendorId, reason: reason! })}
 *     onCancel={() => setShowSheet(false)}
 *   />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface ConfirmActionSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

const VARIANT_COLORS: Record<string, string> = {
  primary: Colors.primary,
  danger: Colors.error,
  success: Colors.success,
};

export function ConfirmActionSheet({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Enter reason…',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionSheetProps): React.ReactElement {
  const [reason, setReason] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  const canConfirm = !requireReason || reason.trim().length >= 5;

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm(requireReason ? reason.trim() : undefined);
  }, [canConfirm, onConfirm, reason, requireReason]);

  const accentColor = VARIANT_COLORS[confirmVariant] ?? Colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={styles.title}>{title}</Text>
            {description !== undefined && (
              <Text style={styles.description}>{description}</Text>
            )}

            {requireReason && (
              <TextInput
                style={styles.reasonInput}
                placeholder={reasonPlaceholder}
                placeholderTextColor={Colors.textLight}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                maxLength={500}
                autoFocus
                textAlignVertical="top"
              />
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: accentColor },
                (!canConfirm || loading) && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Please wait…' : confirmLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.backgroundSoft,
    minHeight: 80,
    marginTop: 4,
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
