/**
 * @file components/common/ScreenWrapper.tsx
 * @description Layout wrapper for all screens — Premium Light 3D theme.
 *
 * - Warm white/light background
 * - SafeAreaView + KeyboardAvoidingView + optional ScrollView
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  contentStyle?: ViewStyle;
  withPadding?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  showGlow?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  backgroundColor = Colors.backgroundBase,
  contentStyle,
  withPadding = true,
  edges = ['top', 'left', 'right'],
  showGlow = false,
}) => {
  const paddingStyle: ViewStyle = withPadding
    ? { paddingHorizontal: 20 }
    : {};

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={edges}
    >
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

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
