/**
 * @file components/admin/AdminUserRolePicker.tsx
 * @description Inline role picker for the admin user management screen.
 *
 * Renders three role options as styled cards. Fires onSelect when the
 * admin taps a different role. Prevents the admin from changing their own role.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import type { UserRole } from '../../types';

const ROLE_META: Record<UserRole, { label: string; description: string; icon: string }> = {
  traveler: {
    label: 'Traveler',
    description: 'Can browse and book packages',
    icon: '🧳',
  },
  company_owner: {
    label: 'Vendor',
    description: 'Can list and manage travel packages',
    icon: '🏢',
  },
  admin: {
    label: 'Admin',
    description: 'Full platform management access',
    icon: '🛡️',
  },
};

const ROLES: UserRole[] = ['traveler', 'company_owner', 'admin'];

interface AdminUserRolePickerProps {
  currentRole: UserRole;
  onSelect: (role: UserRole) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AdminUserRolePicker({
  currentRole,
  onSelect,
  disabled = false,
  loading = false,
}: AdminUserRolePickerProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>User Role</Text>
      {ROLES.map((role) => {
        const meta = ROLE_META[role];
        const selected = role === currentRole;
        return (
          <TouchableOpacity
            key={role}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => !selected && onSelect(role)}
            disabled={disabled || loading || selected}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{meta.icon}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                {meta.label}
              </Text>
              <Text style={styles.roleDescription}>{meta.description}</Text>
            </View>
            {selected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
  },
  icon: {
    fontSize: 20,
  },
  cardText: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  roleLabelSelected: {
    color: Colors.primary,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
});
