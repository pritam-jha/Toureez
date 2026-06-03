/**
 * @file app/(auth)/login.tsx
 * Enterprise admin sign-in screen.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Shadows, Spacing } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { signInWithEmail } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function LoginScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { user } = await signInWithEmail(email.trim(), password);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(user, session);
      router.replace('/(admin)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrap}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <Text style={styles.logoGlyph}>✈</Text>
              </View>
              <Text style={styles.appName}>NEXTTRP Admin</Text>
              <Text style={styles.appSubtitle}>
                Platform Management Console
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardSubtitle}>
                Use your administrator credentials to continue
              </Text>

              <View style={styles.fields}>
                <Input
                  label="Email"
                  placeholder="admin@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                />
                <Input
                  label="Password"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {error !== null && error.length > 0 && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>!</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!canSubmit}
                onPress={handleLogin}
              >
                Sign In
              </Button>
            </View>

            <Text style={styles.footer}>
              This portal is restricted to NEXTTRP platform administrators.
              {'\n'}Unauthorized access attempts are logged.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1426' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxxl,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: Spacing.xxl,
  },
  brand: { alignItems: 'center', gap: Spacing.sm },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadows.md as object),
  },
  logoGlyph: { fontSize: 32, color: Colors.textWhite },
  appName: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 0,
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Shadows.md as object),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -10,
    marginBottom: 2,
  },
  fields: { gap: Spacing.md },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  errorIcon: { fontSize: 14, color: Colors.error },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    lineHeight: 18,
  },
});
