import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
  isLast?: boolean;
}

function MenuItem({ icon, label, description, onPress, danger = false, isLast = false }: MenuItemProps): React.ReactElement {
  const tint = danger ? Colors.error : Colors.primary;
  return (
    <TouchableOpacity
      style={[styles.item, isLast && styles.itemLast]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, danger && styles.itemLabelDanger]}>{label}</Text>
        {description ? <Text style={styles.itemDesc}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

export default function AccountScreen(): React.ReactElement {
  const handleChangePassword = (): void => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your registered email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Link', onPress: () => router.push('/reset-password' as never) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security section */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            description="Send a reset link to your email"
            onPress={handleChangePassword}
            isLast
          />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <View style={styles.card}>
          <MenuItem
            icon="trash-outline"
            label="Delete Account"
            description="Permanently remove your account and data"
            onPress={() => router.push('/account/delete' as never)}
            danger
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.navy },
  content: { padding: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  itemLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: Colors.errorLight },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemLabelDanger: { color: Colors.error },
  itemDesc: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
});
