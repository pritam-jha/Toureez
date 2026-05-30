/**
 * @file app/(auth)/login.tsx
 * @description NEXTTRP login screen.
 */

import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { useSignIn } from '../../hooks/useAuth';

function GoogleIcon(): React.ReactElement {
  return (
    <View style={googleStyles.badge}>
      <Text style={googleStyles.letter}>G</Text>
    </View>
  );
}

export default function LoginScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useSignIn();
  const heroInset = React.useMemo(
    () => StyleSheet.create({ value: { paddingTop: insets.top + 20 } }).value,
    [insets.top]
  );
  const isBusy = auth.isPending || auth.isGooglePending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, heroInset]}>
            <View style={styles.heroGradientEnd} />
            <Ionicons name="airplane" size={24} color={Colors.textWhite} />
            <Text style={styles.logoText}>NEXTTRP</Text>
            <Text style={styles.tagline}>Travel More, Spend Less</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              Welcome back
            </Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

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
                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.primary} />}
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
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />}
                rightIcon={
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.primary}
                  />
                }
                onRightIconPress={() => setShowPassword((current) => !current)}
              />

              {auth.formError ? (
                <View style={styles.errorPanel} accessibilityRole="alert">
                  <Text style={styles.errorText}>{auth.formError}</Text>
                </View>
              ) : null}

              <View style={styles.forgotRow}>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity accessibilityRole="link" disabled={isBusy}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Button
                label="Sign In"
                onPress={auth.submit}
                loading={auth.isPending}
                disabled={auth.isGooglePending}
                fullWidth
                style={styles.primaryButton}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                label="Sign in with Google"
                onPress={auth.signInWithGoogle}
                loading={auth.isGooglePending}
                disabled={auth.isPending}
                variant="outline"
                leftIcon={<GoogleIcon />}
                fullWidth
                style={styles.googleButton}
                labelStyle={styles.googleButtonText}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to NEXTTRP?</Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity accessibilityRole="link" disabled={isBusy}>
                  <Text style={styles.footerLink}> Create account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const googleStyles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  letter: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: 32,
    paddingHorizontal: 20,
    position: 'relative',
  },
  heroGradientEnd: {
    backgroundColor: Colors.navyMedium,
    bottom: 0,
    height: 96,
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
  },
  logoText: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  tagline: {
    color: Colors.textWhite,
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
  content: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  title: {
    color: Colors.navy,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  form: {
    marginTop: 24,
  },
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 20,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 4,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: Colors.divider,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  googleButton: {
    borderColor: Colors.navy,
  },
  googleButtonText: {
    color: Colors.navy,
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
