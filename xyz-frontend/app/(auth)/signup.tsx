/**
 * @file app/(auth)/signup.tsx
 * @description Account creation screen.
 *
 * Architecture rules enforced:
 * - Zero direct API calls — all logic delegated to useSignUp hook
 * - KeyboardAvoidingView handled by ScreenWrapper internally
 * - All colours from constants/colors.ts — zero hardcoded hex values
 * - StyleSheet.create for all styles — zero inline style objects
 * - Expo Router <Link> for navigation between auth screens
 * - Inline field-level error messages — no alert() calls
 * - Password strength indicator (weak / medium / strong)
 * - On success → authStore updated → _layout.tsx auth gate redirects to (tabs)
 */

import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextInput } from 'react-native';
import { Link } from 'expo-router';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import { useSignUp } from '../../hooks/useAuth';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignUpScreen(): React.ReactElement {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const auth = useSignUp();

  const hasPassword = auth.password.length > 0;
  const isWeak = hasPassword && auth.passwordStrength === 'weak';
  const isMedium = auth.passwordStrength === 'medium';
  const isStrong = auth.passwordStrength === 'strong';

  const strengthLabel = isStrong ? 'Strong' : isMedium ? 'Medium' : 'Weak';

  return (
    <ScreenWrapper scrollable contentStyle={styles.screenContent}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.appName} accessibilityRole="header">
          {Config.appName}
        </Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Save packages, compare prices, and plan your next trip.
        </Text>
      </View>

      {/* ── Form ── */}
      <View style={styles.form}>
        {/* Full name */}
        <Input
          label="Full name"
          value={auth.fullName}
          onChangeText={auth.setFullName}
          placeholder="Rahul Sharma"
          error={auth.errors.fullName}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          editable={!auth.isPending}
        />

        {/* Email */}
        <Input
          ref={emailRef}
          label="Email"
          value={auth.email}
          onChangeText={auth.setEmail}
          placeholder="you@example.com"
          error={auth.errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!auth.isPending}
        />

        {/* Password */}
        <Input
          ref={passwordRef}
          label="Password"
          value={auth.password}
          onChangeText={auth.setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry={!showPassword}
          error={auth.errors.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          editable={!auth.isPending}
          rightIcon={
            <Text style={styles.passwordToggle}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />

        {/* Password strength indicator */}
        {hasPassword ? (
          <View
            style={styles.strengthBlock}
            accessibilityLabel={`Password strength: ${strengthLabel}`}
            accessibilityRole="progressbar"
          >
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>Password strength</Text>
              <Text
                style={[
                  styles.strengthValue,
                  isWeak && styles.strengthValueWeak,
                  isMedium && styles.strengthValueMedium,
                  isStrong && styles.strengthValueStrong,
                ]}
              >
                {strengthLabel}
              </Text>
            </View>
            <View style={styles.strengthMeter}>
              {/* Segment 1 — always filled when password has content */}
              <View
                style={[
                  styles.strengthSegment,
                  styles.strengthSegmentFirst,
                  isWeak && styles.strengthWeak,
                  isMedium && styles.strengthMedium,
                  isStrong && styles.strengthStrong,
                ]}
              />
              {/* Segment 2 — filled for medium and strong */}
              <View
                style={[
                  styles.strengthSegment,
                  (isMedium || isStrong) && styles.strengthMedium,
                  isStrong && styles.strengthStrong,
                ]}
              />
              {/* Segment 3 — filled only for strong */}
              <View
                style={[
                  styles.strengthSegment,
                  styles.strengthSegmentLast,
                  isStrong && styles.strengthStrong,
                ]}
              />
            </View>
          </View>
        ) : null}

        {/* Confirm password */}
        <Input
          ref={confirmPasswordRef}
          label="Confirm password"
          value={auth.confirmPassword}
          onChangeText={auth.setConfirmPassword}
          placeholder="Re-enter your password"
          secureTextEntry={!showConfirmPassword}
          error={auth.errors.confirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={auth.submit}
          editable={!auth.isPending}
          rightIcon={
            <Text style={styles.passwordToggle}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </Text>
          }
          onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
        />

        {/* Inline form-level error (e.g. email already in use) */}
        {auth.formError ? (
          <View
            style={styles.errorPanel}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.errorText}>{auth.formError}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Button
          label="Create account"
          onPress={auth.submit}
          loading={auth.isPending}
          style={styles.primaryButton}
        />
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            disabled={auth.isPending}
          >
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScreenWrapper>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 26,
  },
  appName: {
    color: Colors.primary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 18,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    flexGrow: 1,
  },
  passwordToggle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Password strength ──────────────────────────────────────
  strengthBlock: {
    marginBottom: 16,
    marginTop: -4,
  },
  strengthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strengthLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  strengthValue: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '800',
  },
  strengthValueWeak: {
    color: Colors.error,
  },
  strengthValueMedium: {
    color: Colors.warning,
  },
  strengthValueStrong: {
    color: Colors.success,
  },
  strengthMeter: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSegment: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    flex: 1,
    height: 6,
  },
  // Aliases for first/last to allow future margin overrides without duplication
  strengthSegmentFirst: {},
  strengthSegmentLast: {},
  strengthWeak: {
    backgroundColor: Colors.error,
  },
  strengthMedium: {
    backgroundColor: Colors.warning,
  },
  strengthStrong: {
    backgroundColor: Colors.success,
  },

  // ── Error panel ───────────────────────────────────────────
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    marginBottom: 14,
    padding: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 4,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 24,
    paddingTop: 28,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
