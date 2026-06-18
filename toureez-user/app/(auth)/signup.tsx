/**
 * @file app/(auth)/signup.tsx
 * @description Toureez signup screen.
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
import { useSignUp } from '../../hooks/useAuth';

export default function SignUpScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const auth = useSignUp();

  const heroInset = React.useMemo(
    () => StyleSheet.create({ value: { paddingTop: insets.top + 20 } }).value,
    [insets.top]
  );

  const hasPassword = auth.password.length > 0;
  const isWeak = hasPassword && auth.passwordStrength === 'weak';
  const isMedium = auth.passwordStrength === 'medium';
  const isStrong = auth.passwordStrength === 'strong';
  const strengthLabel = isStrong ? 'Strong' : isMedium ? 'Medium' : 'Weak';

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
            <Text style={styles.logoText}>Toureez</Text>
            <Text style={styles.tagline}>Travel More, Spend Less</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              Create Account
            </Text>
            <Text style={styles.subtitle}>Start planning smarter trips today</Text>

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
                leftIcon={<Ionicons name="person-outline" size={18} color={Colors.primary} />}
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
                onSubmitEditing={() => phoneRef.current?.focus()}
                editable={!auth.isPending}
                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.primary} />}
              />

              <Input
                ref={phoneRef}
                label="Phone"
                value={auth.phone}
                onChangeText={auth.setPhone}
                placeholder="10-digit mobile number"
                error={auth.errors.phone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
                editable={!auth.isPending}
                leftIcon={<Ionicons name="call-outline" size={18} color={Colors.primary} />}
              />

              <Input
                ref={cityRef}
                label="City"
                value={auth.city}
                onChangeText={auth.setCity}
                placeholder="Mumbai"
                error={auth.errors.city}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => stateRef.current?.focus()}
                editable={!auth.isPending}
                leftIcon={<Ionicons name="business-outline" size={18} color={Colors.primary} />}
              />

              <Input
                ref={stateRef}
                label="State"
                value={auth.state}
                onChangeText={auth.setState}
                placeholder="Maharashtra"
                error={auth.errors.state}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!auth.isPending}
                leftIcon={<Ionicons name="map-outline" size={18} color={Colors.primary} />}
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
                leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />}
                rightIcon={
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.primary}
                  />
                }
                onRightIconPress={() => setShowConfirmPassword((current) => !current)}
              />

              {auth.formError ? (
                <View style={styles.errorPanel} accessibilityRole="alert">
                  <Text style={styles.errorText}>{auth.formError}</Text>
                </View>
              ) : null}

              <Button
                label="Create Account"
                onPress={auth.submit}
                loading={auth.isPending}
                fullWidth
                style={styles.primaryButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity accessibilityRole="link" disabled={auth.isPending}>
                  <Text style={styles.footerLink}> Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: Colors.divider,
    borderRadius: 8,
    flex: 1,
    height: 6,
  },
  strengthWeak: {
    backgroundColor: Colors.error,
  },
  strengthMedium: {
    backgroundColor: Colors.warning,
  },
  strengthStrong: {
    backgroundColor: Colors.success,
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
  primaryButton: {
    marginTop: 4,
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
