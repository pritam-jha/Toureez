/**
 * @file app/(tabs)/profile.tsx
 * @description NEXTTRP profile screen.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { useWishlistIds } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import { Shadows } from '../../constants/shadows';
import { useSlideUp } from '../../utils/animations';
import type { UpdateProfilePayload } from '../../lib/api/users';

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

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

function MenuItem({ icon, label, onPress, isLast = false }: MenuItemProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

function MenuSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={[styles.menuCard, Shadows.soft]}>{children}</View>
    </View>
  );
}

function StateSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (state: string) => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.stateSelectorContainer}>
      <Text style={styles.stateSelectorLabel}>State</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stateChipsContent}
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

export default function ProfileScreen(): React.ReactElement {
  const { user } = useAuth();
  const session = useAuthStore((state) => state.session);
  const wishlistCount = useWishlistStore(
    (state) => state.wishlistedIds.size + state.wishlistedDestinationIds.size
  );
  const signOutMutation = useSignOut();
  const updateProfileMutation = useUpdateProfile();
  const { uploading, uploadAvatar, uploadError } = useUploadAvatar();
  const slideUp = useSlideUp();

  useWishlistIds();

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
  }, [isEditing, user]);

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
  }, [updateProfileMutation, user]);

  const handleCancel = useCallback(() => {
    updateProfileMutation.reset();
    setIsEditing(false);
  }, [updateProfileMutation]);

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
      onError: (error) => {
        setToast({
          visible: true,
          message: error.message || 'Failed to save profile.',
          type: 'error',
        });
      },
    });
  }, [form, updateProfileMutation]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOutMutation.mutate() },
    ]);
  }, [signOutMutation]);

  const handleToastHide = useCallback(() => {
    setToast((current) => ({ ...current, visible: false }));
  }, []);

  const email = session?.user?.email ?? '';
  const displayName = user?.full_name || 'Traveller';
  const isSaving = updateProfileMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.animatedRoot, slideUp.animatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isEditing ? (
            <>
              <View style={styles.heroCard}>
                <Avatar
                  uri={user?.avatar_url}
                  name={displayName}
                  size={80}
                  onPress={() => void uploadAvatar()}
                  loading={uploading}
                />
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{email || 'Add your email'}</Text>
              </View>

              <MenuSection label="GENERAL">
                <MenuItem icon="person-outline" label="My Profile" onPress={handleEnterEdit} />
                <MenuItem icon="settings-outline" label="Account Settings" onPress={() => router.push('/account' as never)} />
                <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications' as never)} />
                <MenuItem icon="chatbubbles-outline" label="My Enquiries" onPress={() => router.push('/enquiry' as never)} isLast />
              </MenuSection>

              <MenuSection label="TRIPS">
                <MenuItem icon="calendar-outline" label="My Bookings" onPress={() => router.push('/(tabs)/bookings' as never)} />
                <MenuItem icon="heart-outline" label={`Wishlist (${wishlistCount})`} onPress={() => router.push('/(tabs)/wishlist' as never)} />
                <MenuItem icon="git-compare-outline" label="Compare Packages" onPress={() => router.push('/compare' as never)} isLast />
              </MenuSection>

              <MenuSection label="SUPPORT">
                <MenuItem
                  icon="chatbubble-outline"
                  label="App Feedback"
                  onPress={() =>
                    void Linking.openURL('mailto:support@nexttrp.com?subject=App%20Feedback')
                  }
                />
                <MenuItem
                  icon="help-circle-outline"
                  label="Help Center"
                  onPress={() =>
                    Alert.alert(
                      'Help & Support',
                      'For any assistance, please email us at:\nsupport@nexttrp.com\n\nWe typically respond within 24 hours.',
                      [
                        { text: 'Send Email', onPress: () => void Linking.openURL('mailto:support@nexttrp.com?subject=Help%20Request') },
                        { text: 'OK', style: 'cancel' },
                      ]
                    )
                  }
                  isLast
                />
              </MenuSection>

              <TouchableOpacity
                style={styles.logout}
                onPress={handleSignOut}
                disabled={signOutMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <Text style={styles.logoutText}>
                  {signOutMutation.isPending ? 'Logging out...' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editSection}>
              {/* ── Header row ──────────────────────────────── */}
              <View style={styles.editHeader}>
                <TouchableOpacity
                  style={styles.editBackBtn}
                  onPress={handleCancel}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="arrow-back" size={22} color={Colors.navy} />
                </TouchableOpacity>
                <Text style={styles.editTitle}>Edit Profile</Text>
                <View style={styles.editHeaderSpacer} />
              </View>

              {/* ── Avatar card ─────────────────────────────── */}
              <View style={[styles.avatarCard, Shadows.soft]}>
                <Avatar
                  uri={user?.avatar_url}
                  name={displayName}
                  size={84}
                  onPress={() => void uploadAvatar()}
                  loading={uploading}
                />
                <Text style={styles.avatarHint}>Tap photo to update</Text>
              </View>

              {/* ── Form fields ─────────────────────────────── */}
              <View style={styles.editForm}>
                <Input
                  label="Full Name"
                  value={form.full_name}
                  onChangeText={(value) => setForm((current) => ({ ...current, full_name: value }))}
                  placeholder="Your full name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSaving}
                  leftIcon={<Ionicons name="person-outline" size={18} color={Colors.primary} />}
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                  leftIcon={<Ionicons name="call-outline" size={18} color={Colors.primary} />}
                />
                <Input
                  label="City"
                  value={form.city}
                  onChangeText={(value) => setForm((current) => ({ ...current, city: value }))}
                  placeholder="e.g. Mumbai"
                  autoCapitalize="words"
                  editable={!isSaving}
                  leftIcon={<Ionicons name="business-outline" size={18} color={Colors.primary} />}
                />
                <StateSelector
                  value={form.state}
                  onChange={(value) => setForm((current) => ({ ...current, state: value }))}
                  disabled={isSaving}
                />

                {/* ── Action buttons ────────────────────────── */}
                <View style={styles.editActions}>
                  <Button
                    label="Save Changes"
                    onPress={handleSave}
                    loading={isSaving}
                    fullWidth
                  />
                  <Button
                    label="Discard Changes"
                    variant="outline"
                    onPress={handleCancel}
                    disabled={isSaving}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={handleToastHide}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  animatedRoot: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    margin: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  name: {
    color: Colors.navy,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  menuSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  sectionLabel: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: Colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 14,
    width: 36,
  },
  menuLabel: {
    color: Colors.navy,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  logout: {
    alignItems: 'center',
    padding: 24,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  // ── Edit profile section ──────────────────────────────────────────────────
  editSection: {
    // No alignItems here — children must stretch to full width naturally.
  },
  editHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  editBackBtn: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  editTitle: {
    color: Colors.navy,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  // Balances the back button so the title stays visually centred.
  editHeaderSpacer: {
    width: 40,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 12,
    paddingVertical: 24,
  },
  avatarHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },
  editForm: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  editActions: {
    gap: 12,
    marginTop: 8,
    paddingBottom: 32,
  },
  // ── State selector ────────────────────────────────────────────────────────
  stateSelectorContainer: {
    marginBottom: 16,
  },
  stateSelectorLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  stateChipsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  stateChip: {
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stateChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stateChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  stateChipTextSelected: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
});
