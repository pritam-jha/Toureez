/**
 * @file app/(vendor)/packages/new.tsx
 * @description Create new package screen.
 *
 * Collects the minimum required fields for a draft package:
 *   - Title (required, min 5 chars)
 *   - Location (required — packages.location_id is NOT NULL in DB)
 *   - Category (required — packages.category_id is NOT NULL in DB)
 *   - Duration (optional)
 *
 * On success navigates to the package detail screen for further editing.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCreatePackage } from '../../../hooks/useVendorPackages';
import { useVendorCompany } from '../../../hooks/useVendorCompany';
import { listLocations, listCategories } from '../../../lib/api/vendor';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { InlineLoader } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocationItem { id: string; city: string; state: string; is_popular: boolean }
interface CategoryItem { id: string; name: string; label: string; icon: string }

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NewPackageScreen(): React.ReactElement {
  const createPackage = useCreatePackage();
  const { data: company, isLoading: companyLoading } = useVendorCompany();

  // Form fields
  const [title, setTitle] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [durationNights, setDurationNights] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedLocationLabel, setSelectedLocationLabel] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Lookups
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Location picker modal
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [durationError, setDurationError] = useState('');

  // Redirect to onboarding if vendor hasn't created a company yet
  useEffect(() => {
    if (!companyLoading && company === null) {
      router.replace('/(vendor)/onboarding');
    }
  }, [company, companyLoading]);

  // Load locations and categories once on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [locRes, catRes] = await Promise.all([listLocations(), listCategories()]);
      if (cancelled) return;
      if (locRes.data) setLocations(locRes.data);
      if (catRes.data) setCategories(catRes.data);
      setLocationsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtered location list for the search modal
  const filteredLocations = useMemo(() => {
    const q = locationSearch.toLowerCase().trim();
    if (!q) return locations;
    return locations.filter(
      (l) => l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q),
    );
  }, [locations, locationSearch]);

  const handleSelectLocation = useCallback((loc: LocationItem) => {
    setSelectedLocationId(loc.id);
    setSelectedLocationLabel(`${loc.city}, ${loc.state}`);
    setLocationError('');
    setLocationModalVisible(false);
    setLocationSearch('');
  }, []);

  const validate = (): boolean => {
    let valid = true;
    setTitleError('');
    setLocationError('');
    setCategoryError('');
    setDurationError('');

    if (!title.trim()) {
      setTitleError('Package title is required.');
      valid = false;
    } else if (title.trim().length < 5) {
      setTitleError('Title must be at least 5 characters.');
      valid = false;
    }

    if (!selectedLocationId) {
      setLocationError('Please select a destination.');
      valid = false;
    }

    if (!selectedCategoryId) {
      setCategoryError('Please select a category.');
      valid = false;
    }

    const days = parseInt(durationDays, 10);
    const nights = parseInt(durationNights, 10);

    if (durationDays && (isNaN(days) || days < 1)) {
      setDurationError('Duration must be at least 1 day.');
      valid = false;
    }
    if (durationNights && (isNaN(nights) || nights < 0)) {
      setDurationError('Nights cannot be negative.');
      valid = false;
    }

    return valid;
  };

  const handleCreate = async (): Promise<void> => {
    if (!validate()) return;

    try {
      const pkg = await createPackage.mutateAsync({
        title: title.trim(),
        location_id: selectedLocationId,
        category_id: selectedCategoryId,
        duration_days: durationDays ? parseInt(durationDays, 10) : undefined,
        duration_nights: durationNights ? parseInt(durationNights, 10) : undefined,
      });
      router.replace({ pathname: '/(vendor)/packages/[id]', params: { id: pkg.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create package.';
      Alert.alert('Create Failed', message);
    }
  };

  if (locationsLoading) {
    return (
      <View style={styles.flex}>
        <Header title="New Package" showBack />
        <InlineLoader />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="New Package" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={[styles.infoBanner, Shadows.sm]}>
          <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            Fill in the basics to create a draft. You can add pricing, itinerary, and images in the next step.
          </Text>
        </View>

        {/* ── Title ── */}
        <View style={[styles.card, Shadows.sm]}>
          <Input
            label="Package Title"
            required
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Golden Triangle Tour — Delhi, Agra & Jaipur"
            autoCapitalize="words"
            error={titleError}
            hint="Choose a descriptive title that will attract travelers."
            leftIcon={<Ionicons name="briefcase-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>

        {/* ── Location ── */}
        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.fieldLabel}>Destination <Text style={styles.required}>*</Text></Text>
          <Pressable
            style={[styles.picker, locationError ? styles.pickerError : null]}
            onPress={() => setLocationModalVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={selectedLocationId ? Colors.navy : Colors.textLight}
              style={styles.pickerIcon}
            />
            <Text style={[styles.pickerText, !selectedLocationId && styles.pickerPlaceholder]}>
              {selectedLocationId ? selectedLocationLabel : 'Select a destination…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textLight} />
          </Pressable>
          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
        </View>

        {/* ── Category ── */}
        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.fieldLabel}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => { setSelectedCategoryId(cat.id); setCategoryError(''); }}
                >
                  <Text style={[styles.categoryChipIcon]}>{cat.icon}</Text>
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
        </View>

        {/* ── Duration ── */}
        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.fieldLabel}>Duration <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Input
                label="Days"
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder="e.g. 5"
                keyboardType="number-pad"
                error={durationError}
                leftIcon={<Ionicons name="sunny-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
            <View style={styles.durationField}>
              <Input
                label="Nights"
                value={durationNights}
                onChangeText={setDurationNights}
                placeholder="e.g. 4"
                keyboardType="number-pad"
                leftIcon={<Ionicons name="moon-outline" size={18} color={Colors.textSecondary} />}
              />
            </View>
          </View>
        </View>

        <Button
          label="Create Draft Package"
          onPress={() => void handleCreate()}
          loading={createPackage.isPending}
          fullWidth
          size="large"
          variant="primary"
        />
      </ScrollView>

      {/* ── Location picker modal ── */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <Pressable onPress={() => setLocationModalVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.navy} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.modalSearchWrapper}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={styles.modalSearchIcon} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search city or state…"
              placeholderTextColor={Colors.textLight}
              value={locationSearch}
              onChangeText={setLocationSearch}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.locationRow,
                  pressed && styles.locationRowPressed,
                  selectedLocationId === item.id && styles.locationRowSelected,
                ]}
                onPress={() => handleSelectLocation(item)}
              >
                <Ionicons
                  name={item.is_popular ? 'star' : 'location-outline'}
                  size={16}
                  color={item.is_popular ? Colors.warning : Colors.textSecondary}
                  style={styles.locationRowIcon}
                />
                <View style={styles.locationRowText}>
                  <Text style={styles.locationCity}>{item.city}</Text>
                  <Text style={styles.locationState}>{item.state}</Text>
                </View>
                {selectedLocationId === item.id && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No locations found for "{locationSearch}"</Text>
              </View>
            }
          />
        </View>
      </Modal>
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
    paddingBottom: 40,
    gap: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  required: { color: Colors.error },
  optional: { color: Colors.textLight, fontWeight: '400' },

  // ── Location picker ──────────────────────────────────────────
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pickerError: { borderColor: Colors.error },
  pickerIcon: { marginRight: 2 },
  pickerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  pickerPlaceholder: { color: Colors.textLight, fontWeight: '400' },

  // ── Category grid ────────────────────────────────────────────
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSoft,
  },
  categoryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryChipIcon: { fontSize: 14 },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: { color: Colors.primary, fontWeight: '700' },

  // ── Duration ─────────────────────────────────────────────────
  durationRow: { flexDirection: 'row', gap: 12 },
  durationField: { flex: 1 },

  // ── Error text ────────────────────────────────────────────────
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 2,
  },

  // ── Location modal ────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  modalSearchIcon: {},
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  locationRowPressed: { backgroundColor: Colors.backgroundSoft },
  locationRowSelected: { backgroundColor: Colors.primaryUltraLight },
  locationRowIcon: {},
  locationRowText: { flex: 1 },
  locationCity: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.navy,
  },
  locationState: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emptySearch: {
    padding: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
