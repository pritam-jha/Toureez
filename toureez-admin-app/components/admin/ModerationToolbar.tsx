/**
 * @file components/admin/ModerationToolbar.tsx
 * @description Fixed bottom toolbar for admin moderation actions.
 *
 * Renders 2–4 buttons distributed across the toolbar.
 * - Destructive (`danger`) actions are kept on the left
 * - All other actions are right-aligned (primary actions on the far right)
 * - Each button can show its own loading spinner
 *
 *   <ModerationToolbar
 *     actions={[
 *       { label: 'Reject',  variant: 'danger',  onPress: openReject },
 *       { label: 'Approve', variant: 'success', onPress: handleApprove },
 *       { label: 'Verify',  variant: 'primary', onPress: handleVerify, disabled: vendor.is_verified },
 *     ]}
 *   />
 */

import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Radius,
  Shadows,
  Spacing,
  TouchTarget,
} from '../../constants/theme';

export type ModerationActionVariant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'muted';

export interface ModerationAction {
  label: string;
  variant?: ModerationActionVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ModerationToolbarProps {
  actions: ModerationAction[];
}

interface VariantColors {
  bg: string;
  border: string;
  text: string;
}

const VARIANT_COLORS: Record<ModerationActionVariant, VariantColors> = {
  primary: { bg: Colors.primary, border: Colors.primary, text: Colors.textWhite },
  success: { bg: Colors.success, border: Colors.success, text: Colors.textWhite },
  danger: { bg: Colors.surface, border: Colors.error, text: Colors.error },
  warning: { bg: Colors.warning, border: Colors.warning, text: Colors.text },
  muted: { bg: Colors.surface, border: Colors.border, text: Colors.textSecondary },
};

export function ModerationToolbar({
  actions,
}: ModerationToolbarProps): React.ReactElement {
  // Group destructive actions to the left, everything else to the right
  const destructive = actions.filter((a) => a.variant === 'danger');
  const positive = actions.filter((a) => a.variant !== 'danger');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.leftCluster}>
          {destructive.map((action, idx) => (
            <ToolbarButton
              key={`destructive-${action.label}-${idx}`}
              action={action}
              flex={false}
            />
          ))}
        </View>
        <View style={styles.rightCluster}>
          {positive.map((action, idx) => (
            <ToolbarButton
              key={`positive-${action.label}-${idx}`}
              action={action}
              flex={positive.length > 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function ToolbarButton({
  action,
  flex,
}: {
  action: ModerationAction;
  flex: boolean;
}): React.ReactElement {
  const variant = action.variant ?? 'primary';
  const colors = VARIANT_COLORS[variant];
  const disabled = action.disabled || action.loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={action.onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        flex && styles.buttonFlex,
        disabled && styles.buttonDisabled,
      ]}
    >
      {action.loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Text
          style={[styles.buttonText, { color: colors.text }]}
          numberOfLines={1}
        >
          {action.label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    ...(Shadows.md as object),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.md,
    gap: Spacing.md,
  },
  leftCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rightCluster: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  button: {
    minHeight: TouchTarget.comfortable,
    minWidth: 96,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: { flex: 1, paddingHorizontal: Spacing.md },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
  },
});
