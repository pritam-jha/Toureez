/**
 * @file app/(tabs)/profile.tsx
 * @description Profile / Account screen matching the reference "Account" design.
 * Large avatar top-center, name, email, then menu sections with chevrons.
 * All hooks, stores, and functionality preserved.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { useAuth, useSignOut } from '../../hooks/useAuth';
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import type { UpdateProfilePayload } from '../../lib/api/users';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditFormState {
  full_name: string;
  phone: string;
  city: string;
  state: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ── Menu item component ───────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, isLast = false, danger = false }: MenuItemProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? Colors.error : Colors.primary}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

// ── State selector ────────────────────────────────────────────────────────────

interface StateSelectorProps {
  value: string;
  onChange: (state: string) => void;
  disabled?: boolean;
}

function StateSelector({ value, onChange, disabled = false }: StateSelectorProps): React.ReactElement {
  return (
    <View style={styles.stateSelectorContainer}>
      <Text style={styles.stateSelectorLabel}>State</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stateChipsContent}
        style={styles.stateChipsScroll}
      >
        {Config.indianStates.map((stateName) => {
          const isSelected = value === stateName;
          return (
            <TouchableOpacity
              key={stateName}
              onPress={() => onChange(stateName)}
              disabled={disabled}
              style={[styles.stateChip, isSelected && styles.stateChipSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={stateName}
            >
              <Text style={[styles.stateChipText, isSelected && styles.stateChipTextSelected]}>
                {stateName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.ReactElement {
  const { user } = useAuth();
  const session = useAuthStore((state) => state.session);
  const signOutMutation = useSignOut();
  const updateProfileMutation = useUpdateProfile();
  const { uploading, uploadAvatar, uploadError } = useUploadAvatar();
  const wishlistCount = useWishlistStore((state) => state.wishlistedIds.size);

  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [form, setForm] = useState<EditFormState>({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
  });

  useEffect(() => {
    if (!isEditing) {
      setForm({
        full_name: user?.full_name ?? '',
        phone: user?.phone ?? '',
        city: user?.city ?? '',
        state: user?.state ?? '',
      });
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (uploadError) {
      setToast({ visible: true, message: uploadError, type: 'error' });
    }
  }, [uploadError]);

  const handleEnterEdit = useCallback(() => {
    setForm({
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      city: user?.city ?? '',
      state: user?.state ?? '',
    });
    updateProfileMutation.reset();
    setIsEditing(true);
  }, [user, updateProfileMutation]);

  const handleCancel = useCallback(() => {
    setForm({
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      city: user?.city ?? '',
      state: user?.state ?? '',
    });
    updateProfileMutation.reset();
    setIsEditing(false);
  }, [user, updateProfileMutation]);

  const handleSave = useCallback(() => {
    const payload: UpdateProfilePayload = {
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
    };
    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setIsEditing(false);
        setToast({ visible: true, message: 'Profile updated successfully.', type: 'success' });
      },
      onError: (err) => {
        setToast({ visible: true, message: err.message ?? 'Failed to save profile.', type: 'error' });
      },
    });
  }, [form, updateProfileMutation]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => { signOutMutation.mutate(); },
      },
    ]);
  }, [signOutMutation]);

  const handleToastHide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const isSaving = updateProfileMutation.isPending;
  const saveError = updateProfileMutation.error?.message ?? null;
  const isSigningOut = signOutMutation.isPending;
  const email = session?.user?.email ?? '—';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Screen title ── */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle} accessibilityRole="header">
            Account
          </Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={handleEnterEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Avatar + name + email ── */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={user?.avatar_url}
            name={user?.full_name}
            size="xl"
            onPress={isEditing ? uploadAvatar : undefined}
            loading={uploading}
          />
          {isEditing ? (
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          ) : (
            <>
              <Text style={styles.displayName}>
                {user?.full_name ?? 'Traveller'}
              </Text>
              <Text style={styles.displayEmail}>{email}</Text>
            </>
          )}
        </View>

        {/* ── Stats row ── */}
        {!isEditing && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlisted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{memberSince}</Text>
              <Text style={styles.statLabel}>Member since</Text>
            </View>
          </View>
        )}

        {/* ── View mode: menu sections ── */}
        {!isEditing && (
          <>
            {/* General section */}
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionLabelText}>GENERAL</Text>
            </View>
            <View style={styles.menuCard}>
              <MenuItem
                icon="person-outline"
                label="My Profile"
                onPress={handleEnterEdit}
              />
              <MenuItem
                icon="calendar-outline"
                label="My Bookings"
                onPress={() => router.push('/(tabs)/bookings' as never)}
              />
              <MenuItem
                icon="heart-outline"
                label="My Wishlist"
                onPress={() => router.push('/(tabs)/wishlist' as never)}
              />
              <MenuItem
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push('/notifications' as never)}
                isLast
              />
            </View>

            {/* Support section */}
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionLabelText}>SUPPORT</Text>
            </View>
            <View style={styles.menuCard}>
              <MenuItem
                icon="chatbubble-outline"
                label="App Feedback"
                onPress={() => {}}
              />
              <MenuItem
                icon="help-circle-outline"
                label="Help Center"
                onPress={() => {}}
                isLast
              />
            </View>

            {/* Sign out */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text style={styles.signOutText}>
                {isSigningOut ? 'Signing out…' : 'Log Out'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Edit mode ── */}
        {isEditing && (
          <View style={styles.editSection}>
            <Input
              label="Full Name"
              value={form.full_name}
              onChangeText={(v) => setForm((prev) => ({ ...prev, full_name: v }))}
              placeholder="Your full name"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isSaving}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              returnKeyType="next"
              editable={!isSaving}
            />
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => setForm((prev) => ({ ...prev, city: v }))}
              placeholder="e.g. Mumbai"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isSaving}
            />
            <StateSelector
              value={form.state}
              onChange={(v) => setForm((prev) => ({ ...prev, state: v }))}
              disabled={isSaving}
            />

            {saveError && (
              <View style={styles.errorPanel} accessibilityRole="alert">
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            )}

            <Button
              label="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              style={styles.actionButton}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={handleCancel}
              disabled={isSaving}
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={handleToastHide}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundBase,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    flexGrow: 1,
  },

  // ── Screen header ────────────────────────────────────────────
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },

  // ── Avatar section ───────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  displayName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  displayEmail: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ── Stats row ────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 28,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.surfaceBorder,
  },

  // ── Section label ────────────────────────────────────────────
  sectionLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },

  // ── Menu card ────────────────────────────────────────────────
  menuCard: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorderDim,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconWrapDanger: {
    backgroundColor: Colors.errorLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuLabelDanger: {
    color: Colors.error,
  },

  // ── Sign out ─────────────────────────────────────────────────
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },

  // ── Edit mode ────────────────────────────────────────────────
  editSection: {
    flex: 1,
  },
  stateSelectorContainer: {
    marginBottom: 16,
  },
  stateSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  stateChipsScroll: {
    flexGrow: 0,
  },
  stateChipsContent: {
    paddingRight: 8,
    gap: 8,
    flexDirection: 'row',
  },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorderStrong,
    backgroundColor: Colors.surfacePrimary,
  },
  stateChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stateChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stateChipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.20)',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    marginBottom: 12,
  },
});
