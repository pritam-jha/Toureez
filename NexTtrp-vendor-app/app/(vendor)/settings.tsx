/**
 * @file app/(vendor)/settings.tsx
 * @description Settings screen for the vendor portal.
 *
 * Allows vendors to update their profile (name, phone, city) and change
 * their Supabase password. Also provides sign-out and app metadata.
 *
 * Profile updates use updateProfile() from lib/api/auth.ts and refresh the
 * auth store session so the dashboard greeting stays in sync.
 */

import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { updateProfile, signOut } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useScreenBack } from '../../hooks/useScreenBack';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { Config } from '../../constants/config';

export default function SettingsScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const onBack = useScreenBack();

  // ── Password form ─────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Pre-fill when user loads
  useEffect(() => {
    if (user != null) {
      setFullName(user.full_name ?? '');
      setPhone(user.phone ?? '');
      setCity(user.city ?? '');
      setProfileDirty(false);
    }
  }, [user]);

  const markDirty = (): void => setProfileDirty(true);

  const handleSaveProfile = async (): Promise<void> => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }
    setProfileSaving(true);
    try {
      const { data: updatedUser, error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });

      if (error !== null || updatedUser === null) {
        Alert.alert('Save Failed', error ?? 'Could not update profile.');
        return;
      }

      // Re-fetch session to keep auth store current
      const { data: { session } } = await supabase.auth.getSession();
      setSession(updatedUser, session);
      setProfileDirty(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (!newPassword) {
      Alert.alert('Validation', 'New password is required.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error !== null) {
        Alert.alert('Change Failed', error.message);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => { void signOut(); },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Settings"
        showBack
        onBack={onBack}
        rightAction={
          profileDirty ? (
            <Pressable
              onPress={() => void handleSaveProfile()}
              disabled={profileSaving}
              hitSlop={8}
            >
              <Text style={[styles.saveLink, profileSaving && styles.saveLinkDisabled]}>
                Save
              </Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile section ────────────────────────────────────────── */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          <Text style={styles.sectionSubtitle}>
            This information is shown to travelers who view your packages.
          </Text>

          {/* Avatar placeholder */}
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {user?.full_name
                  ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'V'}
              </Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.avatarName}>{user?.full_name ?? 'Vendor'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="briefcase" size={11} color={Colors.primary} />
                <Text style={styles.roleText}>Vendor</Text>
              </View>
            </View>
          </View>

          <Input
            label="Full Name"
            required
            value={fullName}
            onChangeText={(v) => { setFullName(v); markDirty(); }}
            placeholder="Your full name"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />
          <Input
            label="Phone"
            value={phone}
            onChangeText={(v) => { setPhone(v); markDirty(); }}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textSecondary} />}
          />
          <Input
            label="City"
            value={city}
            onChangeText={(v) => { setCity(v); markDirty(); }}
            placeholder="e.g. Mumbai"
            autoCapitalize="words"
            leftIcon={<Ionicons name="location-outline" size={18} color={Colors.textSecondary} />}
          />

          {profileDirty && (
            <Button
              label="Save Profile"
              onPress={() => void handleSaveProfile()}
              loading={profileSaving}
              fullWidth
              variant="primary"
            />
          )}
        </View>

        {/* ── Email (read-only) ──────────────────────────────────────── */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.readOnlyRow}>
            <View style={styles.readOnlyIcon}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={styles.readOnlyInfo}>
              <Text style={styles.readOnlyLabel}>Email Address</Text>
              <Text style={styles.readOnlyValue}>{session?.user?.email ?? '—'}</Text>
            </View>
            <View style={styles.readOnlyLock}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.textLight} />
            </View>
          </View>
          <Text style={styles.readOnlyHint}>
            Email cannot be changed. Contact support@toureez.com if you need to update it.
          </Text>
        </View>

        {/* ── Change password ────────────────────────────────────────── */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a strong password with at least 8 characters.
          </Text>

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Minimum 8 characters"
            secureTextEntry={!showNewPassword}
            autoComplete="new-password"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
            rightIcon={
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
                onPress={() => setShowNewPassword((v) => !v)}
              />
            }
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
            rightIcon={
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
                onPress={() => setShowConfirmPassword((v) => !v)}
              />
            }
          />

          <Button
            label="Update Password"
            onPress={() => void handleChangePassword()}
            loading={passwordSaving}
            fullWidth
            variant="outline"
            disabled={!newPassword || !confirmPassword}
          />
        </View>

        {/* ── App info ───────────────────────────────────────────────── */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.appInfoRow}>
            <View style={styles.appIcon}>
              <Ionicons name="briefcase" size={20} color={Colors.textWhite} />
            </View>
            <View>
              <Text style={styles.appName}>{Config.appName}</Text>
              <Text style={styles.appVersion}>Version {Config.appVersion}</Text>
            </View>
          </View>

          <Pressable
            style={styles.infoLink}
            onPress={() => Alert.alert('Help & Support', 'Please contact support@toureez.com for any assistance.')}
          >
            <Ionicons name="help-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.infoLinkText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
          </Pressable>

          <Pressable
            style={styles.infoLink}
            onPress={() => Alert.alert('Privacy Policy', 'View at https://toureez.com/privacy')}
          >
            <Ionicons name="shield-outline" size={18} color={Colors.info} />
            <Text style={styles.infoLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
          </Pressable>

          <Pressable
            style={styles.infoLink}
            onPress={() => Alert.alert('Terms of Service', 'View at https://toureez.com/terms')}
          >
            <Ionicons name="document-text-outline" size={18} color={Colors.info} />
            <Text style={styles.infoLinkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* ── Danger zone ────────────────────────────────────────────── */}
        <Pressable
          style={[styles.signOutBtn, Shadows.sm]}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  saveLink: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveLinkDisabled: { opacity: 0.4 },
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  avatarInfo: { flex: 1 },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  readOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyInfo: { flex: 1 },
  readOnlyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginTop: 1,
  },
  readOnlyLock: {
    padding: 4,
  },
  readOnlyHint: {
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 16,
    marginTop: 4,
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
  },
  appVersion: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.navy,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
});
