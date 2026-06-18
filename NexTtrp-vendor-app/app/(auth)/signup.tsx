/**
 * @file app/(auth)/signup.tsx
 * @description Vendor portal sign-up screen.
 *
 * Collects name, email, and password, then calls signUpAsVendor().
 * If Supabase email confirmation is enabled the vendor sees a
 * "Check your inbox" success state and can return to login.
 * If email confirmation is disabled the vendor is signed in immediately
 * and the root auth listener in _layout.tsx will redirect to (vendor).
 *
 * The company_owner role is passed as user metadata so the database
 * trigger (handle_new_user) can set it when creating the public.users row.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signUpAsVendor } from '../../lib/api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

// ── Email-sent success state ──────────────────────────────────────────────────

interface VerificationSentProps {
  email: string;
  onBackToLogin: () => void;
}

function VerificationSent({ email, onBackToLogin }: VerificationSentProps): React.ReactElement {
  return (
    <View style={successStyles.container}>
      <View style={successStyles.iconWrap}>
        <Ionicons name="mail-unread-outline" size={44} color={Colors.primary} />
      </View>
      <Text style={successStyles.title}>Check your inbox!</Text>
      <Text style={successStyles.body}>
        We sent a confirmation link to{'\n'}
        <Text style={successStyles.email}>{email}</Text>
      </Text>
      <Text style={successStyles.hint}>
        Click the link in the email to activate your vendor account, then sign in here.
      </Text>
      <Button
        label="Back to Sign In"
        onPress={onBackToLogin}
        fullWidth
        size="large"
        variant="primary"
      />
    </View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    padding: 8,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    fontWeight: '700',
    color: Colors.navy,
  },
  hint: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignUpScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // After successful signup requiring email verification
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!fullName.trim()) {
      setNameError('Full name is required.');
      valid = false;
    } else if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSignUp = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await signUpAsVendor(
        fullName.trim(),
        email.trim(),
        password,
      );

      if (error !== null || data === null) {
        Alert.alert('Sign Up Failed', error ?? 'Unable to create account. Please try again.');
        return;
      }

      if (data.needsEmailVerification) {
        // Show the "check your inbox" success state
        setVerificationEmail(email.trim());
      }
      // If needsEmailVerification is false, Supabase already issued a session.
      // The onAuthStateChange listener in _layout.tsx will fire SIGNED_IN and
      // redirect the vendor to (vendor) automatically — nothing to do here.
    } finally {
      setLoading(false);
    }
  };

  // ── Email-verification success view ────────────────────────────────────────

  if (verificationEmail != null) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VerificationSent
            email={verificationEmail}
            onBackToLogin={() => router.replace('/(auth)/login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Sign-up form ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoContainer}>
            <Ionicons name="briefcase" size={36} color={Colors.textWhite} />
          </View>
          <Text style={styles.brandName}>Toureez</Text>
          <Text style={styles.brandTagline}>Vendor Portal</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.heading}>Create Vendor Account</Text>
          <Text style={styles.subheading}>
            Join Toureez as a travel company and start reaching thousands of travelers.
          </Text>

          <Input
            label="Full Name"
            required
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words"
            autoComplete="name"
            error={nameError}
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            label="Email"
            required
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
            leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            label="Password"
            required
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={passwordError}
            hint="Use letters, numbers, and symbols for a stronger password."
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          <Input
            label="Confirm Password"
            required
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            error={confirmError}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
            rightIcon={
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
                onPress={() => setShowConfirm((v) => !v)}
              />
            }
          />

          <Button
            label="Create Account"
            onPress={() => void handleSignUp()}
            loading={loading}
            fullWidth
            size="large"
            variant="primary"
          />

          {/* Terms note */}
          <View style={styles.termsNote}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textLight} />
            <Text style={styles.termsText}>
              By creating an account you agree to Toureez's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.navy,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  termsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 17,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
