/**
 * @file app/(vendor)/packages/[id].tsx
 * @description Package detail and edit screen.
 *
 * Displays all editable package fields (title, description, highlights,
 * inclusions, exclusions, group sizes) and provides navigation buttons to
 * the pricing, itinerary, and images sub-screens.
 *
 * Vendors can submit the package for review once all required fields are
 * completed. Shows the rejection reason if status is 'rejected'.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  useVendorPackage,
  useUpdatePackage,
  useSubmitPackage,
  useDeletePackage,
} from '../../../hooks/useVendorPackages';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PackageStatusBadge } from '../../../components/ui/Badge';
import { InlineLoader } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';

// ── Multi-value tag input helper ──────────────────────────────────────────────

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function TagInput({ label, values, onChange, placeholder }: TagInputProps): React.ReactElement {
  const [draft, setDraft] = useState('');

  const handleAdd = (): void => {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setDraft('');
    }
  };

  const handleRemove = (value: string): void => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <View style={tagStyles.container}>
      <Text style={tagStyles.label}>{label}</Text>
      <View style={tagStyles.inputRow}>
        <TextInput
          style={tagStyles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          placeholderTextColor={Colors.textLight}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <Pressable style={tagStyles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={18} color={Colors.textWhite} />
        </Pressable>
      </View>
      {values.length > 0 && (
        <View style={tagStyles.tags}>
          {values.map((v) => (
            <View key={v} style={tagStyles.tag}>
              <Text style={tagStyles.tagText}>{v}</Text>
              <Pressable onPress={() => handleRemove(v)} hitSlop={4}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
});

// ── Navigation button ─────────────────────────────────────────────────────────

interface NavButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  count?: number;
  onPress: () => void;
}

function NavButton({ icon, label, subtitle, count, onPress }: NavButtonProps): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [navBtnStyles.btn, pressed && navBtnStyles.pressed]}
      onPress={onPress}
    >
      <View style={navBtnStyles.icon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={navBtnStyles.text}>
        <Text style={navBtnStyles.label}>{label}</Text>
        <Text style={navBtnStyles.subtitle}>{count != null ? `${count} ${subtitle}` : subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </Pressable>
  );
}

const navBtnStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  pressed: { opacity: 0.7 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.navy,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PackageDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading } = useVendorPackage(id ?? '');
  const updatePackage = useUpdatePackage();
  const submitPackage = useSubmitPackage();
  const deletePackage = useDeletePackage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [durationNights, setDurationNights] = useState('');
  const [minGroup, setMinGroup] = useState('');
  const [maxGroup, setMaxGroup] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Only seed local form state from the fetched package once per package id —
  // not every time the cached `pkg` object changes reference (e.g. after
  // saving pricing on another screen), otherwise unsaved edits made here get
  // overwritten by the stale server values when navigating back.
  useEffect(() => {
    if (pkg != null) {
      setTitle(pkg.title);
      setDescription(pkg.description ?? '');
      setDurationDays(String(pkg.duration_days));
      setDurationNights(String(pkg.duration_nights));
      setMinGroup(String(pkg.min_group_size));
      setMaxGroup(String(pkg.max_group_size));
      setHighlights(pkg.highlights ?? []);
      setInclusions(pkg.inclusions ?? []);
      setExclusions(pkg.exclusions ?? []);
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg?.id]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Package title is required.');
      return;
    }
    try {
      const parsedDays    = parseInt(durationDays, 10);
      const parsedNights  = parseInt(durationNights, 10);
      const parsedMinGrp  = parseInt(minGroup, 10);
      const parsedMaxGrp  = parseInt(maxGroup, 10);
      await updatePackage.mutateAsync({
        packageId: id ?? '',
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          duration_days:    Number.isFinite(parsedDays)   ? parsedDays   : undefined,
          duration_nights:  Number.isFinite(parsedNights) ? parsedNights : undefined,
          min_group_size:   Number.isFinite(parsedMinGrp) ? parsedMinGrp : undefined,
          max_group_size:   Number.isFinite(parsedMaxGrp) ? parsedMaxGrp : undefined,
          highlights,
          inclusions,
          exclusions,
        },
      });
      setIsDirty(false);
      Alert.alert('Saved', 'Package details updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save.';
      Alert.alert('Save Failed', message);
    }
  };

  const handleDelete = (): void => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to permanently delete this package? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deletePackage.mutateAsync(id ?? '').then(() => {
              router.replace('/(vendor)/packages');
            }).catch((err) => {
              const message = err instanceof Error ? err.message : 'Failed to delete package.';
              Alert.alert('Delete Failed', message);
            });
          },
        },
      ],
    );
  };

  const handleSubmit = (): void => {
    Alert.alert(
      'Submit for Review',
      'Once submitted, your package will be reviewed by the Toureez team. You cannot edit it while it is pending.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            void submitPackage.mutateAsync(id ?? '').catch((err) => {
              const message = err instanceof Error ? err.message : 'Failed to submit.';
              Alert.alert('Submit Failed', message);
            });
          },
        },
      ],
    );
  };

  if (isLoading || pkg == null) {
    return (
      <View style={styles.flex}>
        <Header title="Package Details" showBack />
        <InlineLoader message="Loading package…" />
      </View>
    );
  }

  const canSubmit = pkg.status === 'draft' || pkg.status === 'rejected';
  const isEditable = pkg.status === 'draft' || pkg.status === 'rejected';
  const canDelete = (pkg.status === 'draft' || pkg.status === 'rejected') && pkg.total_bookings === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Package Details"
        showBack
        rightAction={
          isDirty ? (
            <Pressable
              onPress={() => void handleSave()}
              disabled={updatePackage.isPending}
              hitSlop={8}
            >
              <Text style={[styles.saveLink, updatePackage.isPending && styles.saveLinkDisabled]}>
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
        {/* Status row */}
        <View style={styles.statusRow}>
          <PackageStatusBadge status={pkg.status} />
          {pkg.total_bookings > 0 && (
            <Text style={styles.bookingCount}>{pkg.total_bookings} bookings</Text>
          )}
        </View>

        {/* Rejection reason */}
        {pkg.status === 'rejected' && pkg.rejection_reason != null && (
          <View style={styles.rejectionBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <View style={styles.rejectionText}>
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionBody}>{pkg.rejection_reason}</Text>
            </View>
          </View>
        )}

        {/* Basic info */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Input
            label="Title"
            required
            value={title}
            onChangeText={(v) => { setTitle(v); markDirty(); }}
            placeholder="Package title"
            autoCapitalize="words"
            editable={isEditable}
            leftIcon={<Ionicons name="briefcase-outline" size={18} color={Colors.textSecondary} />}
          />
          <Input
            label="Description"
            value={description}
            onChangeText={(v) => { setDescription(v); markDirty(); }}
            placeholder="Describe what travelers will experience…"
            multiline
            numberOfLines={5}
            editable={isEditable}
            leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>

        {/* Duration & group */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Duration & Group</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Input
                label="Days"
                value={durationDays}
                onChangeText={(v) => { setDurationDays(v); markDirty(); }}
                keyboardType="number-pad"
                editable={isEditable}
                leftIcon={<Ionicons name="sunny-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Nights"
                value={durationNights}
                onChangeText={(v) => { setDurationNights(v); markDirty(); }}
                keyboardType="number-pad"
                editable={isEditable}
                leftIcon={<Ionicons name="moon-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Input
                label="Min Group"
                value={minGroup}
                onChangeText={(v) => { setMinGroup(v); markDirty(); }}
                keyboardType="number-pad"
                editable={isEditable}
                leftIcon={<Ionicons name="people-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Max Group"
                value={maxGroup}
                onChangeText={(v) => { setMaxGroup(v); markDirty(); }}
                keyboardType="number-pad"
                editable={isEditable}
                leftIcon={<Ionicons name="people-circle-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
          </View>
        </View>

        {/* Highlights, inclusions, exclusions */}
        {isEditable && (
          <View style={[styles.section, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Highlights & Inclusions</Text>
            <TagInput
              label="Highlights"
              values={highlights}
              onChange={(v) => { setHighlights(v); markDirty(); }}
              placeholder="Add a highlight…"
            />
            <TagInput
              label="What's Included"
              values={inclusions}
              onChange={(v) => { setInclusions(v); markDirty(); }}
              placeholder="Add an inclusion…"
            />
            <TagInput
              label="What's Not Included"
              values={exclusions}
              onChange={(v) => { setExclusions(v); markDirty(); }}
              placeholder="Add an exclusion…"
            />
          </View>
        )}

        {/* Navigation to sub-screens */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Package Content</Text>
          <NavButton
            icon="cash-outline"
            label="Pricing Tiers"
            subtitle="tiers configured"
            count={pkg.pricing?.length ?? 0}
            onPress={() => router.push({ pathname: '/(vendor)/packages/[id]/pricing', params: { id } })}
          />
          <NavButton
            icon="map-outline"
            label="Itinerary"
            subtitle="days planned"
            count={pkg.itinerary?.length ?? 0}
            onPress={() => router.push({ pathname: '/(vendor)/packages/[id]/itinerary', params: { id } })}
          />
          <NavButton
            icon="images-outline"
            label="Gallery Images"
            subtitle="images uploaded"
            count={pkg.images?.length ?? 0}
            onPress={() => router.push({ pathname: '/(vendor)/packages/[id]/images', params: { id } })}
          />
        </View>

        {/* Save / Submit actions */}
        <View style={styles.actions}>
          {isDirty && (
            <Button
              label="Save Changes"
              onPress={() => void handleSave()}
              loading={updatePackage.isPending}
              fullWidth
              variant="primary"
            />
          )}
          {canSubmit && (
            <Button
              label={pkg.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
              onPress={handleSubmit}
              loading={submitPackage.isPending}
              fullWidth
              variant={pkg.status === 'rejected' ? 'outline' : 'success'}
            />
          )}
          {pkg.status === 'active' && (
            <>
              <View style={styles.liveNote}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.liveNoteText}>
                  This package is live on Toureez and accepting bookings.
                </Text>
              </View>
              {/* Allow vendor to move active package back to draft (hides it from travellers) */}
              <Button
                label="Hide Package (Move to Draft)"
                onPress={() => {
                  Alert.alert(
                    'Hide Package',
                    'This will move the package back to draft and hide it from travellers. Existing bookings are not affected.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Hide',
                        style: 'destructive',
                        onPress: () => {
                          void updatePackage.mutateAsync({
                            packageId: id ?? '',
                            updates: { status: 'draft' } as Parameters<typeof updatePackage.mutateAsync>[0]['updates'],
                          }).catch((err) => {
                            Alert.alert('Failed', err instanceof Error ? err.message : 'Failed to hide package.');
                          });
                        },
                      },
                    ],
                  );
                }}
                loading={updatePackage.isPending}
                fullWidth
                variant="outline"
              />
            </>
          )}
          {pkg.status === 'pending' && (
            <View style={styles.pendingNote}>
              <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
              <Text style={styles.pendingNoteText}>
                Under review by the Toureez team. Editing is locked until reviewed.
              </Text>
            </View>
          )}
          {canDelete && (
            <Button
              label="Delete Package"
              onPress={handleDelete}
              loading={deletePackage.isPending}
              fullWidth
              variant="danger"
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  saveLink: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveLinkDisabled: { opacity: 0.4 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  rejectionText: { flex: 1 },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  rejectionBody: {
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
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
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: { flex: 1 },
  actions: { gap: 12 },
  liveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
  },
  liveNoteText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
    flex: 1,
  },
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  pendingNoteText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
    flex: 1,
  },
});
