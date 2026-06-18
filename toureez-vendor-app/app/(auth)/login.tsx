/**
 * @file app/(auth)/login.tsx
 * @description Vendor portal login screen.
 *
 * Only users with the company_owner role may sign in here.
 * The signIn() function in lib/api/auth.ts enforces this at the API layer.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { signIn } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';

export default function LoginScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let valid = true;

    setEmailError('');
    setPasswordError('');

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
    }

    return valid;
  };

  const handleSignIn = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: user, error } = await signIn(email.trim(), password);

      if (error !== null || user === null) {
        Alert.alert('Sign In Failed', error ?? 'Unable to sign in. Please try again.');
        return;
      }

      // Hydrate the auth store — _layout.tsx auth gate will redirect to (vendor)
      const { data: { session } } = await supabase.auth.getSession();
      setSession(user, session);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
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
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Sign in to manage your travel packages and bookings.
          </Text>

          <Input
            label="Email"
            required
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
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
            placeholder="Your password"
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            error={passwordError}
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

          <Button
            label="Sign In"
            onPress={() => void handleSignIn()}
            loading={loading}
            fullWidth
            size="large"
            variant="primary"
          />

          <View style={styles.vendorNote}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textLight} />
            <Text style={styles.vendorNoteText}>
              This portal is exclusively for registered vendors.
            </Text>
          </View>
        </View>

        {/* Sign-up link */}
        <View style={styles.signUpRow}>
          <Text style={styles.signUpPrompt}>New to Toureez Vendor?</Text>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Create a new vendor account"
          >
            <Text style={styles.signUpLink}>Create Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    gap: 32,
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
  vendorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  vendorNoteText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signUpPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
