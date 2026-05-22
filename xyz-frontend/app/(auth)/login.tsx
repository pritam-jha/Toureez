/**
 * @file app/(auth)/login.tsx
 * @description Login screen — clean minimal sage green design.
 * All hooks and functionality preserved.
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

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon(): React.ReactElement {
  return (
    <View style={googleStyles.badge}>
      <Text style={googleStyles.letter}>G</Text>
    </View>
  );
}

const googleStyles = StyleSheet.create({
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  letter: {
    fontSize: 12,
    fontWeight: '700',
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>{Config.appName}</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Welcome back
        </Text>
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

        {auth.formError ? (
          <View style={styles.errorPanel} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{auth.formError}</Text>
          </View>
        ) : null}

        {/* Forgot password */}
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

        {/* Sign in button */}
        <Button
          label="Sign in"
          onPress={auth.submit}
          loading={auth.isPending}
          disabled={auth.isGooglePending}
          fullWidth
          style={styles.primaryButton}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google OAuth */}
        <Button
          label="Sign in with Google"
          onPress={auth.signInWithGoogle}
          loading={auth.isGooglePending}
          disabled={auth.isPending}
          variant="secondary"
          leftIcon={<GoogleIcon />}
          fullWidth
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
            <Text style={styles.footerLink}> Sign up</Text>
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
    alignItems: 'center',
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // 3D shadow
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
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 2,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: Colors.surfaceBorder,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
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
