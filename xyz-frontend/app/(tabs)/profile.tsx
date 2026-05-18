/**
 * @file app/(tabs)/profile.tsx
 * @description Profile screen with view mode and edit mode.
 *
 * View mode:
 * - Circular avatar (image or initials fallback)
 * - Full name, email, phone, city, state
 * - Wishlist count from Zustand store
 * - "Edit Profile" and "Sign Out" buttons
 *
 * Edit mode:
 * - Tappable avatar → triggers useUploadAvatar flow
 * - Editable full_name, phone, city, state fields
 * - "Save Changes" → useUpdateProfile mutation
 * - "Cancel" → reverts all fields to original values
 * - Inline error if save fails
 * - Loading state during save
 *
 * Architecture rules:
 * - Zero business logic in this file — all in hooks
 * - All colours from constants/colors.ts
 * - StyleSheet.create for all styles — zero inline style objects
 * - Sign out redirects via auth gate in _layout.tsx (not manual navigation)
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

import { Avatar } from '../../components/common/Avatar';
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.ReactElement {
  const { user } = useAuth();
  const session = useAuthStore((state) => state.session);
  const signOutMutation = useSignOut();
  const updateProfileMutation = useUpdateProfile();
  const { uploading, uploadAvatar, uploadError } = useUploadAvatar();
  const wishlistCount = useWishlistStore(
    (state) => state.wishlistedIds.size
  );

  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  // Edit form state — initialised from user on mount and when user changes
  const [form, setForm] = useState<EditFormState>({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
  });

  // Keep form in sync if user data changes (e.g. after a successful save)
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

  // Show upload error as a toast
  useEffect(() => {
    if (uploadError) {
      setToast({ visible: true, message: uploadError, type: 'error' });
    }
  }, [uploadError]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleEnterEdit = useCallback(() => {
    // Snapshot current user values into the form before entering edit mode
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
    // Revert form to original user values — no partial saves
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
        setToast({
          visible: true,
          message: 'Profile updated successfully.',
          type: 'success',
        });
      },
      onError: (err) => {
        // Error is also shown inline via updateProfileMutation.error
        setToast({
          visible: true,
          message: err.message ?? 'Failed to save profile.',
          type: 'error',
        });
      },
    });
  }, [form, updateProfileMutation]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Auth gate in _layout.tsx handles the redirect to /(auth)/login
            // when user becomes null — no manual router.replace needed
            signOutMutation.mutate();
          },
        },
      ]
    );
  }, [signOutMutation]);

  const handleToastHide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────────

  const isSaving = updateProfileMutation.isPending;
  const saveError = updateProfileMutation.error?.message ?? null;
  const isSigningOut = signOutMutation.isPending;

  // Email lives on the Supabase session, not in public.users — read-only
  const email = session?.user?.email ?? '—';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : '—';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Profile
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

        {/* ── Avatar section ── */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={user?.avatar_url}
            name={user?.full_name}
            size={96}
            onPress={isEditing ? uploadAvatar : undefined}
            loading={uploading}
          />
          {isEditing && (
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          )}
        </View>

        {/* ── View mode ── */}
        {!isEditing && (
          <View style={styles.viewSection}>
            {/* Name + location */}
            <Text style={styles.displayName}>
              {user?.full_name ?? 'Traveller'}
            </Text>
            {user?.city && user?.state && (
              <Text style={styles.displayLocation}>
                {user.city}, {user.state}
              </Text>
            )}

            {/* Stats row */}
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

            {/* Info card */}
            <View style={styles.infoCard}>
              <InfoRow label="Full name" value={user?.full_name ?? '—'} />
              <InfoRow label="Email" value={email} isLast={false} />
              <InfoRow label="Phone" value={user?.phone ?? '—'} />
              <InfoRow label="City" value={user?.city ?? '—'} />
              <InfoRow
                label="State"
                value={user?.state ?? '—'}
                isLast
              />
            </View>

            {/* Actions */}
            <Button
              label="Edit Profile"
              onPress={handleEnterEdit}
              style={styles.actionButton}
            />
            <Button
              label="Sign Out"
              variant="outline"
              onPress={handleSignOut}
              loading={isSigningOut}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* ── Edit mode ── */}
        {isEditing && (
          <View style={styles.editSection}>
            <Input
              label="Full Name"
              value={form.full_name}
              onChangeText={(v) =>
                setForm((prev) => ({ ...prev, full_name: v }))
              }
              placeholder="Your full name"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isSaving}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChangeText={(v) =>
                setForm((prev) => ({ ...prev, phone: v }))
              }
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              returnKeyType="next"
              editable={!isSaving}
            />

            <Input
              label="City"
              value={form.city}
              onChangeText={(v) =>
                setForm((prev) => ({ ...prev, city: v }))
              }
              placeholder="e.g. Mumbai"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isSaving}
            />

            {/* State picker — rendered as a scrollable list of chips */}
            <StateSelector
              value={form.state}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, state: v }))
              }
              disabled={isSaving}
            />

            {/* Inline save error */}
            {saveError && (
              <View
                style={styles.errorPanel}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            )}

            {/* Save / Cancel */}
            <Button
              label="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              style={styles.actionButton}
            />
            <Button
              label="Cancel"
              variant="outline"
              onPress={handleCancel}
              disabled={isSaving}
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>

      {/* ── Toast ── */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={handleToastHide}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ label, value, isLast = false }: InfoRowProps): React.ReactElement {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

interface StateSelectorProps {
  value: string;
  onChange: (state: string) => void;
  disabled?: boolean;
}

function StateSelector({
  value,
  onChange,
  disabled = false,
}: StateSelectorProps): React.ReactElement {
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
              <Text
                style={[
                  styles.stateChipText,
                  isSelected && styles.stateChipTextSelected,
                ]}
              >
                {stateName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editLink: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },

  // ── Avatar ──────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── View mode ───────────────────────────────────────────────
  viewSection: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  displayLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Info card
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },

  // ── Edit mode ───────────────────────────────────────────────
  editSection: {
    flex: 1,
  },

  // State selector
  stateSelectorContainer: {
    marginBottom: 16,
  },
  stateSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  stateChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stateChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stateChipTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Error panel
  errorPanel: {
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },

  // Shared action buttons
  actionButton: {
    marginBottom: 12,
  },
});
