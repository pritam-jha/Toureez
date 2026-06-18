/**
 * @file app/account/delete.tsx
 * @description Permanent account deletion confirmation screen.
 *
 * Requires the user to type "DELETE" before the action is enabled.
 * On success the user is signed out and returned to the login screen.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteUserAccount } from '../../lib/api/users';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function DeleteAccountScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const clearUser = useAuthStore((s) => s.clearUser);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const canDelete = confirmText.trim() === 'DELETE';

  const handleDelete = (): void => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all bookings, and personal data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => void doDelete(),
        },
      ],
    );
  };

  const doDelete = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await deleteUserAccount();
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      await supabase.auth.signOut();
      clearUser();
      router.replace('/(auth)/login' as never);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Warning icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={40} color={Colors.error} />
        </View>

        <Text style={styles.heading}>Delete Account</Text>
        <Text style={styles.body}>
          This will permanently delete your account and all associated data including
          bookings, reviews, and profile information. This action{' '}
          <Text style={{ fontWeight: '800' }}>cannot be undone</Text>.
        </Text>

        {/* What gets deleted */}
        <View style={styles.listBox}>
          {[
            'Your profile and personal information',
            'All booking history',
            'Your reviews and ratings',
            'Wishlist and preferences',
            'Notification history',
          ].map((item) => (
            <View key={item} style={styles.listRow}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.confirmLabel}>
          Type <Text style={styles.confirmHighlight}>DELETE</Text> to confirm
        </Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="Type DELETE here"
          placeholderTextColor={Colors.textLight}
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel="Confirmation input"
        />

        {/* Delete button */}
        <View
          style={[styles.deleteBtn, !canDelete && styles.deleteBtnDisabled]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
          accessibilityState={{ disabled: !canDelete || loading }}
        >
          <Text
            style={[styles.deleteBtnText, !canDelete && styles.deleteBtnTextDisabled]}
            onPress={canDelete && !loading ? handleDelete : undefined}
          >
            {loading ? 'Deleting…' : 'Delete My Account'}
          </Text>
        </View>

        <Text
          style={styles.cancel}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          Cancel
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundBase ?? '#FFF8F0' },
  content: { padding: 24, alignItems: 'center' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorLight ?? '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.navy ?? '#1A1A2E', marginBottom: 12 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  listBox: {
    width: '100%',
    backgroundColor: Colors.errorLight ?? '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 24,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listText: { fontSize: 13, color: Colors.error, flex: 1 },
  confirmLabel: { fontSize: 14, color: Colors.textSecondary, alignSelf: 'flex-start', marginBottom: 8 },
  confirmHighlight: { fontWeight: '800', color: Colors.error },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  deleteBtn: {
    width: '100%',
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteBtnDisabled: { backgroundColor: Colors.borderLight ?? '#EDE8E0', opacity: 0.6 },
  deleteBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  deleteBtnTextDisabled: { color: Colors.textLight },
  cancel: { fontSize: 14, color: Colors.primary, fontWeight: '600', paddingVertical: 8 },
});
