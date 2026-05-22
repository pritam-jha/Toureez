/**
 * @file app/(auth)/signup.tsx
 * @description Signup screen — sage green design system.
 * All hooks, password strength indicator, and functionality preserved.
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
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>{Config.appName}</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Create account
        </Text>
        <Text style={styles.subtitle}>
          Save packages, compare prices, and plan your next trip.
        </Text>
      </View>

      {/* ── Form ── */}
      <View style={styles.form}>
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

        {/* Password strength */}
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
              <View
                style={[
                  styles.strengthSegment,
                  isWeak && styles.strengthWeak,
                  isMedium && styles.strengthMedium,
                  isStrong && styles.strengthStrong,
                ]}
              />
              <View
                style={[
                  styles.strengthSegment,
                  (isMedium || isStrong) && styles.strengthMedium,
                  isStrong && styles.strengthStrong,
                ]}
              />
              <View
                style={[
                  styles.strengthSegment,
                  isStrong && styles.strengthStrong,
                ]}
              />
            </View>
          </View>
        ) : null}

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

        {auth.formError ? (
          <View style={styles.errorPanel} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{auth.formError}</Text>
          </View>
        ) : null}

        <Button
          label="Create account"
          onPress={auth.submit}
          loading={auth.isPending}
          fullWidth
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
            <Text style={styles.footerLink}> Sign in</Text>
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
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    flexGrow: 1,
  },
  passwordToggle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  strengthValueWeak: { color: Colors.error },
  strengthValueMedium: { color: Colors.warning },
  strengthValueStrong: { color: Colors.success },
  strengthMeter: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSegment: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 8,
    flex: 1,
    height: 6,
  },
  strengthWeak: { backgroundColor: Colors.error },
  strengthMedium: { backgroundColor: Colors.warning },
  strengthStrong: { backgroundColor: Colors.success },

  // ── Error panel ───────────────────────────────────────────
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.20)',
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
    paddingTop: 24,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
