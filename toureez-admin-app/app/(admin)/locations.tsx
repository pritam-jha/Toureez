/**
 * @file app/(admin)/locations.tsx
 * @description Admin location CRUD — create, edit, toggle popular/active, delete.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import {
  useAdminLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../../hooks/admin/useAdminLocations';
import type { Location } from '../../types';

type FormMode = 'create' | 'edit';

interface FormState {
  city: string;
  state: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
  is_popular: boolean;
  is_active: boolean;
}

const defaultForm: FormState = {
  city: '',
  state: '',
  region: '',
  country: 'India',
  latitude: '',
  longitude: '',
  is_popular: false,
  is_active: true,
};

function LocationFormModal({
  visible,
  mode,
  initial,
  onSubmit,
  onClose,
  loading,
}: {
  visible: boolean;
  mode: FormMode;
  initial: FormState;
  onSubmit: (f: FormState) => void;
  onClose: () => void;
  loading: boolean;
}): React.ReactElement {
  const [form, setForm] = useState<FormState>(initial);

  React.useEffect(() => { if (visible) setForm(initial); }, [visible, initial]);

  const set = (key: keyof FormState) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const canSubmit =
    form.city.trim().length >= 1 &&
    form.state.trim().length >= 1 &&
    form.region.trim().length >= 1;

  const textFields: Array<{ key: keyof FormState; label: string; placeholder: string; help: string; keyboard?: 'default' | 'decimal-pad' }> = [
    { key: 'city', label: 'City', placeholder: 'e.g. Varanasi', help: 'City name' },
    { key: 'state', label: 'State', placeholder: 'e.g. Uttar Pradesh', help: 'Indian state' },
    { key: 'country', label: 'Country', placeholder: 'India', help: '' },
    { key: 'latitude', label: 'Latitude', placeholder: '25.3176', help: 'Optional — decimal degrees', keyboard: 'decimal-pad' },
    { key: 'longitude', label: 'Longitude', placeholder: '82.9739', help: 'Optional — decimal degrees', keyboard: 'decimal-pad' },
  ];

  // Backend enforces region as exactly one of these values (DB check constraint) — must not be free text.
  const REGION_OPTIONS = ['North India', 'South India', 'East India', 'West India', 'Central India'] as const;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{mode === 'create' ? 'New Location' : 'Edit Location'}</Text>
          <TouchableOpacity onPress={() => canSubmit && onSubmit(form)} disabled={!canSubmit || loading}>
            <Text style={[styles.modalSave, (!canSubmit || loading) && { opacity: 0.4 }]}>
              {loading ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {textFields.map(({ key, label, placeholder, help, keyboard }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
                <TextInput
                  style={styles.fieldInput}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textLight}
                  value={String(form[key])}
                  onChangeText={set(key)}
                  keyboardType={keyboard ?? 'default'}
                  autoCapitalize={keyboard ? 'none' : 'words'}
                />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Region</Text>
              <Text style={styles.fieldHelp}>Geographic region</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {REGION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => set('region')(option)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: form.region === option ? Colors.accent : Colors.border,
                      backgroundColor: form.region === option ? Colors.accent : 'transparent',
                    }}
                  >
                    <Text style={{ color: form.region === option ? Colors.surface : Colors.text }}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Popular Destination</Text>
                <Text style={styles.fieldHelp}>Show in popular destinations list</Text>
              </View>
              <Switch
                value={form.is_popular}
                onValueChange={set('is_popular')}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.surface}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Text style={styles.fieldHelp}>Allow packages for this location</Text>
              </View>
              <Switch
                value={form.is_active}
                onValueChange={set('is_active')}
                trackColor={{ true: Colors.success, false: Colors.border }}
                thumbColor={Colors.surface}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function LocationRow({
  loc,
  onEdit,
  onDelete,
}: {
  loc: Location;
  onEdit: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <MaterialCommunityIcons name="map-marker" size={18} color={Colors.primary} />
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowCity}>{loc.city}</Text>
        <Text style={styles.rowState}>{loc.state} · {loc.region}</Text>
        <View style={styles.rowBadges}>
          {loc.is_popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
          {!loc.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactive</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminLocationsScreen(): React.ReactElement {
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormState>(defaultForm);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useAdminLocations({
    search: search.trim() || undefined,
  });
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const del = useDeleteLocation();

  const filtered = data?.items ?? [];

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setInitialForm(defaultForm);
    setModalVisible(true);
  };

  const openEdit = (loc: Location) => {
    setMode('edit');
    setEditingId(loc.id);
    setInitialForm({
      city: loc.city,
      state: loc.state,
      region: loc.region,
      country: loc.country,
      latitude: loc.latitude != null ? String(loc.latitude) : '',
      longitude: loc.longitude != null ? String(loc.longitude) : '',
      is_popular: loc.is_popular,
      is_active: loc.is_active,
    });
    setModalVisible(true);
  };

  const handleSubmit = (form: FormState) => {
    const payload = {
      city: form.city.trim(),
      state: form.state.trim(),
      region: form.region.trim(),
      country: form.country.trim() || 'India',
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
      is_popular: form.is_popular,
      is_active: form.is_active,
    };

    if (mode === 'create') {
      create.mutate(payload, {
        onSuccess: () => setModalVisible(false),
        onError: (e) => Alert.alert('Error', e.message),
      });
    } else {
      update.mutate(
        { id: editingId!, ...payload },
        {
          onSuccess: () => setModalVisible(false),
          onError: (e) => Alert.alert('Error', e.message),
        },
      );
    }
  };

  const handleDelete = (loc: Location) => {
    Alert.alert(
      'Delete Location?',
      `"${loc.city}, ${loc.state}" will be deleted. Packages linked to this location cannot be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            del.mutate(loc.id, {
              onError: (e) => Alert.alert('Error', e.message),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Locations</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search city or state…"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load locations</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Location }) => (
            <LocationRow
              loc={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search ? 'No locations match your search' : 'No locations yet'}
              </Text>
            </View>
          }
          ListFooterComponent={
            (data?.total ?? 0) > 0 ? (
              <Text style={styles.countText}>{data?.total ?? filtered.length} locations total</Text>
            ) : null
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      <LocationFormModal
        visible={modalVisible}
        mode={mode}
        initial={initialForm}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
        loading={create.isPending || update.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  searchRow: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // rowIconText removed — icon now rendered by MaterialCommunityIcons
  rowMeta: { flex: 1, gap: 2 },
  rowCity: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowState: { fontSize: 12, color: Colors.textSecondary },
  rowBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  popularBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: { fontSize: 10, color: Colors.accent, fontWeight: '600' },
  inactiveBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: { fontSize: 10, color: Colors.textLight, fontWeight: '600' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.secondaryLight,
  },
  editBtnText: { color: Colors.secondary, fontWeight: '600', fontSize: 12 },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.errorLight,
  },
  deleteBtnText: { color: Colors.error, fontWeight: '600', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalCancel: { color: Colors.textSecondary, fontSize: 15 },
  modalSave: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  modalContent: { padding: 20, gap: 14, paddingBottom: 40 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  fieldHelp: { fontSize: 11, color: Colors.textLight },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.backgroundSoft,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
});
