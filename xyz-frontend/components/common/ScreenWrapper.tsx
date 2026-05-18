/**
 * @file components/common/ScreenWrapper.tsx
 * @description Layout wrapper applied to every screen in the app.
 *
 * Handles safe area insets, keyboard avoidance, and scroll behaviour
 * in one place. Screens wrap their content in this component rather
 * than managing SafeAreaView and KeyboardAvoidingView individually.
 */

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScreenWrapperProps {
  /** Screen content */
  children: React.ReactNode;
  /** Whether to wrap content in a ScrollView (default: false) */
  scrollable?: boolean;
  /** Background colour override (default: Colors.background) */
  backgroundColor?: string;
  /** Additional style for the inner content container */
  contentStyle?: ViewStyle;
  /** Whether to add horizontal padding (default: true) */
  withPadding?: boolean;
  /**
   * Safe area edges to apply insets to.
   * Default: ['top', 'left', 'right'] — bottom is excluded so tab bar
   * content doesn't get double-padded.
   */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Screen layout wrapper providing safe area insets and keyboard avoidance.
 *
 * @example
 * // Non-scrollable screen (e.g. login)
 * <ScreenWrapper>
 *   <LoginForm />
 * </ScreenWrapper>
 *
 * @example
 * // Scrollable screen (e.g. package detail)
 * <ScreenWrapper scrollable>
 *   <PackageDetail />
 * </ScreenWrapper>
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  backgroundColor = Colors.background,
  contentStyle,
  withPadding = true,
  edges = ['top', 'left', 'right'],
}) => {
  const paddingStyle: ViewStyle = withPadding
    ? { paddingHorizontal: 16 }
    : {};

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={edges}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              paddingStyle,
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, paddingStyle, contentStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
  },
});
