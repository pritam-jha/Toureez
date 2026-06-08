/**
 * @file app/(auth)/forgot-password.tsx
 * @description Password reset request screen for the Vendor Portal.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

export default function ForgotPasswordScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (): Promise<void> => {
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: Linking.createURL('/reset-password'),
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centeredBox}>
          <Ionicons name="mail-outline" size={56} color={Colors.primary} />
          <Text style={styles.sentTitle}>Check your email</Text>
          <Text style={styles.sentBody}>
            We sent a password reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email.trim()}</Text>
            {'\n\n'}
            Open the link in the email to set a new password.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>Back to Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSent(false)}
            activeOpacity={0.8}
            style={styles.ghostBtn}
          >
            <Text style={styles.ghostBtnTxt}>Use a different email</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backTxt}>Back to login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
        </View>

        <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
          <Ionicons name="mail-outline" size={18} color={Colors.navyLight} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={() => void handleSend()}
            editable={!loading}
          />
        </View>
        {error ? <Text style={styles.errorTxt}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={() => void handleSend()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textWhite} size="small" />
          ) : (
            <Text style={styles.primaryBtnTxt}>Send reset link</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24, gap: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTxt: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.navy, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapError: { borderColor: Colors.error },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 0 },
  errorTxt: { color: Colors.error, fontSize: 13, marginTop: -8 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnTxt: { color: Colors.textWhite, fontWeight: '700', fontSize: 15 },
  centeredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  sentTitle: { fontSize: 24, fontWeight: '800', color: Colors.navy, textAlign: 'center' },
  sentBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: { color: Colors.text, fontWeight: '700' },
  ghostBtn: { marginTop: 4 },
  ghostBtnTxt: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
