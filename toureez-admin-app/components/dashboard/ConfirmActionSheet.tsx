/**
 * @file components/dashboard/ConfirmActionSheet.tsx
 * @description Bottom-sheet confirmation modal for destructive admin actions.
 *
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Radius,
  Shadows,
  Spacing,
} from '../../constants/theme';
import { Button, ButtonVariant } from '../ui/Button';

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

const VARIANT_MAP: Record<NonNullable<ConfirmActionSheetProps['confirmVariant']>, ButtonVariant> = {
  primary: 'primary',
  danger: 'danger',
  success: 'success',
};

export function ConfirmActionSheet({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Enter reason...',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionSheetProps): React.ReactElement {
  const [reason, setReason] = useState('');
  const translateY = useRef(new Animated.Value(360)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const canConfirm = !requireReason || reason.trim().length >= 5;

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 360,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm(requireReason ? reason.trim() : undefined);
  }, [canConfirm, onConfirm, reason, requireReason]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.kav}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.handle} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{title}</Text>
              {description !== undefined && description.length > 0 && (
                <Text style={styles.description}>{description}</Text>
              )}

              {requireReason && (
                <View style={styles.reasonWrap}>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder={reasonPlaceholder}
                    placeholderTextColor={Colors.textLight}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    autoFocus
                    textAlignVertical="top"
                  />
                  <Text style={styles.reasonHint}>
                    Minimum 5 characters / {reason.trim().length}/500
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.actions}>
              <View style={styles.cancelWrap}>
                <Button
                  variant="ghost"
                  size="lg"
                  onPress={onCancel}
                  disabled={loading}
                  fullWidth
                >
                  {cancelLabel}
                </Button>
              </View>
              <View style={styles.confirmWrap}>
                <Button
                  variant={VARIANT_MAP[confirmVariant]}
                  size="lg"
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  loading={loading}
                  fullWidth
                >
                  {confirmLabel}
                </Button>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.lg,
    minHeight: 280,
    maxHeight: '80%',
    ...(Shadows.lg as object),
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reasonWrap: { marginTop: Spacing.sm, gap: Spacing.xs },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 96,
  },
  reasonHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  cancelWrap: { width: 110 },
  confirmWrap: { flex: 1 },
});
