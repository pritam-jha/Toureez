/**
 * @file components/ui/ScreenWrapper.tsx
 * @description Base screen wrapper providing safe area insets and scroll support.
 *
 * Use ScreenWrapper for all vendor portal screens to ensure consistent
 * padding, background color, and safe area handling across iOS and Android.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Whether to render content in a scrollable container */
  scrollable?: boolean;
  /** Pull-to-refresh callback (requires scrollable=true) */
  onRefresh?: () => void;
  /** Whether a refresh is currently in progress */
  refreshing?: boolean;
  /** Additional styles applied to the outermost container */
  style?: ViewStyle;
  /** Additional styles applied to the content container */
  contentStyle?: ViewStyle;
  /** Whether to apply keyboard-avoiding behavior (useful for forms) */
  keyboardAvoiding?: boolean;
  /** Background colour override */
  backgroundColor?: string;
  /** Whether to disable bottom safe area padding (e.g. for tab screens) */
  disableBottomInset?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
  keyboardAvoiding = false,
  backgroundColor = Colors.background,
  disableBottomInset = false,
}) => {
  const insets = useSafeAreaInsets();

  const paddingBottom = disableBottomInset ? 0 : insets.bottom;

  const content = scrollable ? (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: paddingBottom + 24 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh != null ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.static,
        { backgroundColor, paddingBottom },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const inner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor, paddingTop: insets.top },
        style,
      ]}
    >
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  outer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  static: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
