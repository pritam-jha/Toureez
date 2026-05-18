/**
 * @file app/(auth)/login.tsx
 * @description Login screen — email/password + Google OAuth.
 *
 * Architecture rules enforced:
 * - Zero direct API calls — all logic delegated to useSignIn hook
 * - KeyboardAvoidingView handled by ScreenWrapper internally
 * - All colours from constants/colors.ts — zero hardcoded hex values
 * - StyleSheet.create for all styles — zero inline style objects
 * - Expo Router <Link> for navigation between auth screens
 * - Inline error messages — no alert() calls
 * - Email format + non-empty password validated before submit
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
import { useSignIn } from '../../hooks/useAuth';

// ── Google "G" badge icon ─────────────────────────────────────────────────────
// Pure React Native — no third-party icon library required.
// Uses the Google brand blue with a bold "G" to clearly identify the provider.

function GoogleIcon(): React.ReactElement {
  return (
    <View style={googleIconStyles.badge}>
      <Text style={googleIconStyles.letter}>G</Text>
    </View>
  );
}

const googleIconStyles = StyleSheet.create({
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  letter: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.info,
    lineHeight: 14,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LoginScreen(): React.ReactElement {
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useSignIn();

  const isBusy = auth.isPending || auth.isGooglePending;

  return (
    <ScreenWrapper scrollable contentStyle={styles.screenContent}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.appName} accessibilityRole="header">
          {Config.appName}
        </Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Compare trusted travel packages across India.
        </Text>
      </View>

      {/* ── Form ── */}
      <View style={styles.form}>
        <Input
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
          editable={!isBusy}
        />

        <Input
          ref={passwordRef}
          label="Password"
          value={auth.password}
          onChangeText={auth.setPassword}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          error={auth.errors.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={auth.submit}
          editable={!isBusy}
          rightIcon={
            <Text style={styles.passwordToggle}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          }
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />

        {/* Inline form-level error (e.g. wrong credentials) */}
        {auth.formError ? (
          <View
            style={styles.errorPanel}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.errorText}>{auth.formError}</Text>
          </View>
        ) : null}

        {/* Forgot password link */}
        <View style={styles.forgotRow}>
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              disabled={isBusy}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Primary CTA */}
        <Button
          label="Sign in"
          onPress={auth.submit}
          loading={auth.isPending}
          disabled={auth.isGooglePending}
          style={styles.primaryButton}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google OAuth */}
        <Button
          label="Sign in with Google"
          onPress={auth.signInWithGoogle}
          loading={auth.isGooglePending}
          disabled={auth.isPending}
          variant="outline"
          leftIcon={<GoogleIcon />}
        />
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Sign up"
            disabled={isBusy}
          >
            <Text style={styles.footerLink}>Sign up</Text>
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
    paddingTop: 32,
    paddingBottom: 32,
  },
  appName: {
    color: Colors.primary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 20,
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
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 22,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 2,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: Colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
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
