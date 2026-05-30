/**
 * @file app/(vendor)/onboarding.tsx
 * @description Company onboarding screen — shown when the vendor has not yet
 * created their company profile.
 *
 * Creates the company via useCreateCompany() and redirects to the dashboard
 * on success. The vendor may also upload a logo via Cloudinary.
 */

import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCreateCompany } from '../../hooks/useVendorCompany';
import { pickAndUploadImage } from '../../lib/cloudinary';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

export default function OnboardingScreen(): React.ReactElement {
  const createCompany = useCreateCompany();

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [nameError, setNameError] = useState('');

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
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload logo.';
      Alert.alert('Upload Failed', message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;

    try {
      await createCompany.mutateAsync({
        name: name.trim(),
        about: about.trim() || undefined,
        gst_number: gstNumber.trim() || undefined,
        logo_url: logoUrl ?? undefined,
      });
      router.replace('/(vendor)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create company.';
      Alert.alert('Setup Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoContainer}>
            <Ionicons name="briefcase" size={32} color={Colors.textWhite} />
          </View>
          <Text style={styles.brandName}>NEXTTRP</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.heading}>Set Up Your Business</Text>
          <Text style={styles.subheading}>
            Tell us about your travel company to start creating packages and receiving bookings.
          </Text>

          {/* Logo upload */}
          <Text style={styles.fieldLabel}>Company Logo <Text style={styles.optional}>(optional)</Text></Text>
          <Pressable
            style={styles.logoUpload}
            onPress={() => void handleLogoUpload()}
            disabled={logoUploading}
            accessibilityRole="button"
            accessibilityLabel="Upload company logo"
          >
            {logoUrl != null ? (
              <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons
                  name={logoUploading ? 'cloud-upload-outline' : 'camera-outline'}
                  size={28}
                  color={Colors.textLight}
                />
                <Text style={styles.logoPlaceholderText}>
                  {logoUploading ? 'Uploading…' : 'Upload Logo'}
                </Text>
              </View>
            )}
            {logoUrl != null && (
              <View style={styles.logoEditBadge}>
                <Ionicons name="pencil" size={12} color={Colors.textWhite} />
              </View>
            )}
          </Pressable>

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
            hint="Optional — required for GST invoices."
            leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textSecondary} />}
          />

          <Button
            label="Create Company Profile"
            onPress={() => void handleSubmit()}
            loading={createCompany.isPending}
            fullWidth
            size="large"
            variant="primary"
          />

          <View style={styles.note}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textLight} />
            <Text style={styles.noteText}>
              Your company profile will be reviewed by the NEXTTRP team before going live.
            </Text>
          </View>
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
    paddingTop: 48,
    paddingBottom: 40,
    gap: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.navy,
    letterSpacing: 1,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 8,
  },
  optional: {
    color: Colors.textLight,
    fontWeight: '400',
  },
  logoUpload: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSoft,
    gap: 4,
  },
  logoPlaceholderText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundWhite,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 18,
  },
});
