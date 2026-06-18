/**
 * @file app/reset-password.tsx
 * @description Handles Supabase password-recovery deep links for vendors.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { firstSearchParam, parseRecoveryLink } from '../lib/authRecovery';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { Colors } from '../constants/colors';

export default function ResetPasswordScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const incomingUrl = Linking.useURL();
  const params = useLocalSearchParams<{
    code?: string | string[];
    access_token?: string | string[];
    refresh_token?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const exchangedRef = React.useRef(false);

  React.useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    let cancelled = false;

    async function establishRecoverySession(): Promise<void> {
      setExchanging(true);
      setError('');

      const initialUrl = incomingUrl ?? await Linking.getInitialURL();
      const linkParams = parseRecoveryLink(initialUrl);
      const code = firstSearchParam(params.code) ?? linkParams.code;
      const accessToken = firstSearchParam(params.access_token) ?? linkParams.accessToken;
      const refreshToken = firstSearchParam(params.refresh_token) ?? linkParams.refreshToken;
      const linkError = firstSearchParam(params.error) ?? linkParams.error;
      const linkErrorDescription =
        firstSearchParam(params.error_description) ?? linkParams.errorDescription;

      try {
        if (linkError) {
          setError(linkErrorDescription ?? linkError);
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError('Reset link is invalid or has expired. Please request a new one.');
          }
          return;
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError('Reset link is invalid or has expired. Please request a new one.');
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError('Reset link is missing or has expired. Please request a new one.');
        }
      } finally {
        if (!cancelled) setExchanging(false);
      }
    }

    void establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [
    incomingUrl,
    params.access_token,
    params.code,
    params.error,
    params.error_description,
    params.refresh_token,
  ]);

  const handleReset = async (): Promise<void> => {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (exchanging) {
    return <FullScreenLoader message="Verifying reset link..." />;
  }

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successSub}>
            Your password has been changed. Log in with your new password to continue.
          </Text>
          <Button
            label="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(auth)/login')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back to login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Enter a new password for your vendor account.</Text>
        </View>

        <Input
          label="New Password"
          required
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          placeholder="At least 6 characters"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        <Input
          label="Confirm New Password"
          required
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setError('');
          }}
          placeholder="Repeat your new password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label={loading ? 'Updating...' : 'Update Password'}
          onPress={() => void handleReset()}
          loading={loading}
          fullWidth
          size="large"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24, gap: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: { marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.navy, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13, lineHeight: 18 },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
