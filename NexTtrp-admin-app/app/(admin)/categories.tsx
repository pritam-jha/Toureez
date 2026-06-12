/**
 * @file app/(admin)/categories.tsx
 * @description Admin category CRUD — create, edit, toggle active, delete.
 */

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
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/admin/useAdminCategories';
import type { Category } from '../../types';

type FormMode = 'create' | 'edit';

interface FormState {
  name: string;
  label: string;
  icon: string;
  description: string;
  is_active: boolean;
  display_order: string;
}

const defaultForm: FormState = { name: '', label: '', icon: '🏷️', description: '', is_active: true, display_order: '0' };

function CategoryFormModal({
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

  // Reset when opened
  React.useEffect(() => { if (visible) setForm(initial); }, [visible, initial]);

  const set = (key: keyof FormState) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const canSubmit = form.name.trim().length >= 1 && form.label.trim().length >= 1 && form.icon.trim().length >= 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{mode === 'create' ? 'New Category' : 'Edit Category'}</Text>
          <TouchableOpacity onPress={() => canSubmit && onSubmit(form)} disabled={!canSubmit || loading}>
            <Text style={[styles.modalSave, (!canSubmit || loading) && { opacity: 0.4 }]}>
              {loading ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {[
              { key: 'name', label: 'Name (slug)', placeholder: 'e.g. pilgrimage', help: 'Unique internal identifier' },
              { key: 'label', label: 'Display Label', placeholder: 'e.g. Pilgrimage', help: 'Shown to users' },
              { key: 'icon', label: 'Icon', placeholder: '🕌', help: 'Emoji or icon key' },
              { key: 'description', label: 'Description', placeholder: 'Short description…', help: '' },
              { key: 'display_order', label: 'Display Order', placeholder: '0', help: 'Lower = shown first' },
            ].map(({ key, label, placeholder, help }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
                <TextInput
                  style={styles.fieldInput}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textLight}
                  value={String(form[key as keyof FormState])}
                  onChangeText={set(key as keyof FormState)}
                  keyboardType={key === 'display_order' ? 'number-pad' : 'default'}
                  autoCapitalize="none"
                />
              </View>
            ))}
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
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

function CategoryRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{cat.icon}</Text>
      <View style={styles.rowMeta}>
        <Text style={styles.rowLabel}>{cat.label}</Text>
        <Text style={styles.rowName}>{cat.name} · order {cat.display_order}</Text>
      </View>
      <View style={styles.rowActions}>
        {!cat.is_active && <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>Inactive</Text></View>}
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}><Text style={styles.deleteBtnText}>Del</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminCategoriesScreen(): React.ReactElement {
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormState>(defaultForm);

  const { data: categories, isLoading, isError, refetch } = useAdminCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const openCreate = () => { setMode('create'); setEditingId(null); setInitialForm(defaultForm); setModalVisible(true); };
  const openEdit = (cat: Category) => {
    setMode('edit');
    setEditingId(cat.id);
    setInitialForm({ name: cat.name, label: cat.label, icon: cat.icon, description: cat.description ?? '', is_active: cat.is_active, display_order: String(cat.display_order) });
    setModalVisible(true);
  };

  const handleSubmit = (form: FormState) => {
    const payload = { ...form, display_order: Number(form.display_order) || 0 };
    if (mode === 'create') {
      create.mutate(payload, {
        onSuccess: () => setModalVisible(false),
        onError: (e) => Alert.alert('Error', e.message),
      });
    } else {
      update.mutate({ id: editingId!, ...payload }, {
        onSuccess: () => setModalVisible(false),
        onError: (e) => Alert.alert('Error', e.message),
      });
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Delete Category?', `"${cat.label}" will be deleted. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(cat.id, { onError: (e) => Alert.alert('Error', e.message) }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}><Text style={styles.addBtnText}>+ New</Text></TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load categories</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Category }) => (
            <CategoryRow cat={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />
          )}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No categories yet</Text></View>}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      <CategoryFormModal
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { fontSize: 24, width: 32 },
  rowMeta: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowName: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inactiveBadge: { backgroundColor: Colors.borderLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactiveText: { fontSize: 10, color: Colors.textLight, fontWeight: '600' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: Colors.secondaryLight },
  editBtnText: { color: Colors.secondary, fontWeight: '600', fontSize: 12 },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: Colors.errorLight },
  deleteBtnText: { color: Colors.error, fontWeight: '600', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  // Modal styles
  modalSafe: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalCancel: { color: Colors.textSecondary, fontSize: 15 },
  modalSave: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  modalContent: { padding: 20, gap: 14, paddingBottom: 40 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  fieldHelp: { fontSize: 11, color: Colors.textLight },
  fieldInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.backgroundSoft },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
});
