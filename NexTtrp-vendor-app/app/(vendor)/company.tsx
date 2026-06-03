/**
 * @file app/(vendor)/company.tsx
 * @description Company profile edit screen.
 *
 * Loads the existing company profile via useVendorCompany() and allows the
 * vendor to update name, about, GST number, and logo. Changes are persisted
 * via useUpdateCompany() which applies an optimistic update in the cache.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useVendorCompany, useUpdateCompany } from '../../hooks/useVendorCompany';
import { useScreenBack } from '../../hooks/useScreenBack';
import { pickAndUploadImage } from '../../lib/cloudinary';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

export default function CompanyScreen(): React.ReactElement {
  const { data: company, isLoading } = useVendorCompany();
  const updateCompany = useUpdateCompany();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const onBack = useScreenBack();

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [nameError, setNameError] = useState('');

  // Pre-fill form when company data loads
  useEffect(() => {
    if (company != null) {
      setName(company.name);
      setAbout(company.about ?? '');
      setGstNumber(company.gst_number ?? '');
      setLogoUrl(company.logo_url);
    }
  }, [company]);

  const validate = (): boolean => {
    setNameError('');
    if (!name.trim()) {
      setNameError('Company name is required.');
      return false;
    }
    if (name.trim().length < 3) {
      setNameError('Company name must be at least 3 characters.');
      return false;
    }
    return true;
  };

  const handleLogoUpload = async (): Promise<void> => {
    setLogoUploading(true);
    try {
      const result = await pickAndUploadImage({ allowsEditing: true, aspect: [1, 1] });
      if (result !== null) {
        setLogoUrl(result.secure_url);
        // Auto-save the new logo URL immediately — no need to click "Save Changes"
        await updateCompany.mutateAsync({ logo_url: result.secure_url });
        Alert.alert('Logo Updated', 'Your company logo has been saved.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload logo.';
      Alert.alert('Upload Failed', message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!validate()) return;

    try {
      await updateCompany.mutateAsync({
        name: name.trim(),
        about: about.trim() || undefined,
        gst_number: gstNumber.trim() || undefined,
        logo_url: logoUrl ?? undefined,
      });
      Alert.alert('Saved', 'Company profile updated successfully.', [
        { text: 'OK', onPress: () => from === 'account' ? router.replace('/(vendor)/account') : router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes.';
      Alert.alert('Save Failed', message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <Header title="Company Profile" showBack onBack={onBack} />
        <InlineLoader message="Loading company details…" />
      </View>
    );
  }

  if (company == null) {
    return (
      <View style={styles.flex}>
        <Header title="Company Profile" showBack onBack={onBack} />
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No company found</Text>
          <Text style={styles.emptyBody}>Complete onboarding to create your company profile.</Text>
          <Button
            label="Go to Onboarding"
            onPress={() => router.replace('/(vendor)/onboarding')}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Company Profile"
        showBack
        rightAction={
          <Pressable
            onPress={() => void handleSave()}
            disabled={updateCompany.isPending}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={[styles.saveLink, updateCompany.isPending && styles.saveLinkDisabled]}>
              Save
            </Text>
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Verification status */}
        <View style={[
          styles.statusBanner,
          {
            backgroundColor: company.is_verified
              ? Colors.successLight
              : company.status === 'rejected'
                ? Colors.errorLight
                : Colors.warningLight,
          },
        ]}>
          <Ionicons
            name={company.is_verified ? 'shield-checkmark' : 'time-outline'}
            size={16}
            color={company.is_verified ? Colors.success : company.status === 'rejected' ? Colors.error : Colors.warning}
          />
          <Text style={[
            styles.statusBannerText,
            {
              color: company.is_verified
                ? Colors.success
                : company.status === 'rejected'
                  ? Colors.error
                  : Colors.warning,
            },
          ]}>
            {company.is_verified
              ? 'Your company is verified and live on NEXTTRP.'
              : company.status === 'rejected'
                ? 'Your company verification was rejected. Please contact support.'
                : 'Your company is pending verification by the NEXTTRP team.'}
          </Text>
        </View>

        {/* Logo */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Company Logo</Text>
          <View style={styles.logoRow}>
            <Pressable
              onPress={() => void handleLogoUpload()}
              disabled={logoUploading}
              style={styles.logoWrapper}
              accessibilityRole="button"
            >
              {logoUrl != null ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={24} color={Colors.textLight} />
                </View>
              )}
              <View style={styles.logoEditBadge}>
                <Ionicons
                  name={logoUploading ? 'cloud-upload-outline' : 'pencil'}
                  size={12}
                  color={Colors.textWhite}
                />
              </View>
            </Pressable>
            <View style={styles.logoHint}>
              <Text style={styles.logoHintTitle}>Company Logo</Text>
              <Text style={styles.logoHintBody}>
                {logoUploading ? 'Uploading…' : 'Tap to upload or change your logo. PNG or JPG recommended.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic info */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <View style={styles.fields}>
            <Input
              label="Company Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="e.g. Himalayan Trails Tours"
              autoCapitalize="words"
              error={nameError}
              leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textSecondary} />}
            />
            <Input
              label="About Your Company"
              value={about}
              onChangeText={setAbout}
              placeholder="Tell travelers what makes your company special…"
              multiline
              numberOfLines={4}
              hint="A good description helps build trust with travelers."
              leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />}
            />
            <Input
              label="GST Number"
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder="e.g. 22AAAAA0000A1Z5"
              autoCapitalize="characters"
              leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textSecondary} />}
            />
          </View>
        </View>

        {/* Read-only stats */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Stats (Read-only)</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{company.total_packages}</Text>
              <Text style={styles.statLabel}>Packages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{company.avg_rating > 0 ? company.avg_rating.toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{company.total_reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <Button
          label="Save Changes"
          onPress={() => void handleSave()}
          loading={updateCompany.isPending}
          fullWidth
          size="large"
          variant="primary"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  saveLink: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveLinkDisabled: {
    opacity: 0.4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 4,
  },
  fields: { gap: 4 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoWrapper: { position: 'relative' },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSoft,
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundWhite,
  },
  logoHint: { flex: 1 },
  logoHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  logoHintBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
