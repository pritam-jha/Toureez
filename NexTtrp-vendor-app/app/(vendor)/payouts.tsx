/**
 * @file app/(vendor)/payouts.tsx
 * @description Vendor payouts screen.
 *
 * Shows payout disbursement history and registered payout accounts (bank/UPI).
 * Vendors can add a new payout account via useCreatePayoutAccount().
 */

import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  useVendorPayouts,
  useVendorPayoutAccounts,
  useCreatePayoutAccount,
} from '../../hooks/useVendorPayouts';
import { useScreenBack } from '../../hooks/useScreenBack';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListLoader } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { PayoutStatus, VendorPayout, VendorPayoutAccount } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPayoutStatusColor(status: PayoutStatus): string {
  switch (status) {
    case 'paid': return Colors.success;
    case 'processing': return Colors.secondary;
    case 'failed': return Colors.error;
    default: return Colors.warning;
  }
}

function getPayoutStatusBg(status: PayoutStatus): string {
  switch (status) {
    case 'paid': return Colors.successLight;
    case 'processing': return Colors.secondaryLight;
    case 'failed': return Colors.errorLight;
    default: return Colors.warningLight;
  }
}

// ── Payout row ────────────────────────────────────────────────────────────────

interface PayoutRowProps {
  payout: VendorPayout;
}

function PayoutRow({ payout }: PayoutRowProps): React.ReactElement {
  const date = payout.processed_at
    ? new Date(payout.processed_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : new Date(payout.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });

  const period = payout.period_start && payout.period_end
    ? `${new Date(payout.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(payout.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : null;

  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconBg, { backgroundColor: getPayoutStatusBg(payout.status) }]}>
        <Ionicons
          name={payout.status === 'paid' ? 'checkmark-circle' : 'time-outline'}
          size={20}
          color={getPayoutStatusColor(payout.status)}
        />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.amount}>₹{payout.amount.toLocaleString('en-IN')}</Text>
        {period != null && <Text style={rowStyles.period}>{period}</Text>}
        <Text style={rowStyles.date}>{date}</Text>
      </View>
      <View style={[rowStyles.statusBadge, { backgroundColor: getPayoutStatusBg(payout.status) }]}>
        <Text style={[rowStyles.statusText, { color: getPayoutStatusColor(payout.status) }]}>
          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  period: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ── Account card ──────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: VendorPayoutAccount;
}

function AccountCard({ account }: AccountCardProps): React.ReactElement {
  const isUpi = account.upi_id != null;

  return (
    <View style={accountStyles.card}>
      <View style={accountStyles.iconBg}>
        <Ionicons name={isUpi ? 'phone-portrait-outline' : 'card-outline'} size={20} color={Colors.secondary} />
      </View>
      <View style={accountStyles.info}>
        <Text style={accountStyles.holderName}>{account.account_holder_name}</Text>
        {isUpi ? (
          <Text style={accountStyles.detail}>UPI: {account.upi_id}</Text>
        ) : (
          <>
            {account.bank_name != null && <Text style={accountStyles.detail}>{account.bank_name}</Text>}
            {account.account_number_last4 != null && (
              <Text style={accountStyles.detail}>Account ending ···· {account.account_number_last4}</Text>
            )}
            {account.ifsc_code != null && <Text style={accountStyles.detail}>IFSC: {account.ifsc_code}</Text>}
          </>
        )}
      </View>
      <View style={accountStyles.badges}>
        {account.is_primary && (
          <View style={accountStyles.primaryBadge}>
            <Text style={accountStyles.primaryText}>Primary</Text>
          </View>
        )}
        {account.is_verified && (
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        )}
      </View>
    </View>
  );
}

const accountStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  holderName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  detail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
});

// ── Add Account Modal ─────────────────────────────────────────────────────────

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

function AddAccountModal({ visible, onClose }: AddAccountModalProps): React.ReactElement {
  const createAccount = useCreatePayoutAccount();
  const [holderName, setHolderName] = useState('');
  const [useUpi, setUseUpi] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);

  const handleReset = (): void => {
    setHolderName('');
    setUseUpi(false);
    setUpiId('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setIsPrimary(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!holderName.trim()) {
      Alert.alert('Validation', 'Account holder name is required.');
      return;
    }
    if (useUpi && !upiId.trim()) {
      Alert.alert('Validation', 'UPI ID is required.');
      return;
    }
    if (!useUpi && (!accountNumber.trim() || !ifscCode.trim())) {
      Alert.alert('Validation', 'Account number and IFSC code are required for bank accounts.');
      return;
    }

    try {
      await createAccount.mutateAsync({
        account_holder_name: holderName.trim(),
        upi_id: useUpi ? upiId.trim() : undefined,
        bank_name: !useUpi && bankName.trim() ? bankName.trim() : undefined,
        account_number: !useUpi ? accountNumber.trim() : undefined,
        ifsc_code: !useUpi ? ifscCode.trim().toUpperCase() : undefined,
        is_primary: isPrimary,
      });
      handleReset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add account.';
      Alert.alert('Failed', message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Add Payout Account</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.navy} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={modalStyles.content} keyboardShouldPersistTaps="handled">
          <Input
            label="Account Holder Name"
            required
            value={holderName}
            onChangeText={setHolderName}
            placeholder="Full name as per bank records"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />

          <View style={modalStyles.toggleRow}>
            <Text style={modalStyles.toggleLabel}>Use UPI ID instead of bank account</Text>
            <Switch
              value={useUpi}
              onValueChange={setUseUpi}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={useUpi ? Colors.primary : Colors.textLight}
            />
          </View>

          {useUpi ? (
            <Input
              label="UPI ID"
              required
              value={upiId}
              onChangeText={setUpiId}
              placeholder="name@upi"
              autoCapitalize="none"
              leftIcon={<Ionicons name="phone-portrait-outline" size={18} color={Colors.textSecondary} />}
            />
          ) : (
            <>
              <Input
                label="Bank Name"
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g. HDFC Bank"
                autoCapitalize="words"
                leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textSecondary} />}
              />
              <Input
                label="Account Number"
                required
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Bank account number"
                keyboardType="number-pad"
                leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textSecondary} />}
              />
              <Input
                label="IFSC Code"
                required
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="e.g. HDFC0001234"
                autoCapitalize="characters"
                leftIcon={<Ionicons name="code-outline" size={18} color={Colors.textSecondary} />}
              />
            </>
          )}

          <View style={modalStyles.primaryRow}>
            <Text style={modalStyles.primaryLabel}>Set as primary account</Text>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={isPrimary ? Colors.primary : Colors.textLight}
            />
          </View>

          <Button
            label="Save Account"
            onPress={() => void handleSave()}
            loading={createAccount.isPending}
            fullWidth
            size="large"
            variant="primary"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.backgroundWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  content: {
    padding: 20,
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.navy,
    flex: 1,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 16,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.navy,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PayoutsScreen(): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const { data: payoutsData, isLoading: payoutsLoading, refetch } = useVendorPayouts(1);
  const { data: accounts, isLoading: accountsLoading } = useVendorPayoutAccounts();
  const onBack = useScreenBack();

  const payouts = payoutsData?.items ?? [];

  return (
    <View style={styles.flex}>
      <Header
        title="Payouts"
        showBack
        onBack={onBack}
        rightAction={
          <Pressable
            onPress={() => setShowModal(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add payout account"
          >
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        {/* Payout accounts */}
        <View style={[styles.section, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payout Accounts</Text>
            <Pressable onPress={() => setShowModal(true)}>
              <Text style={styles.addLink}>+ Add</Text>
            </Pressable>
          </View>
          {accountsLoading ? (
            <Text style={styles.loadingText}>Loading accounts…</Text>
          ) : (accounts == null || accounts.length === 0) ? (
            <View style={styles.emptyAccounts}>
              <Ionicons name="card-outline" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>No payout accounts added.</Text>
              <Text style={styles.emptySubtext}>Add your bank or UPI account to receive payouts.</Text>
            </View>
          ) : (
            accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))
          )}
        </View>

        {/* Payout history */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          {payoutsLoading ? (
            <ListLoader />
          ) : payouts.length === 0 ? (
            <View style={styles.emptyAccounts}>
              <Ionicons name="wallet-outline" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>No payouts yet.</Text>
              <Text style={styles.emptySubtext}>
                Payouts are processed after bookings are completed.
              </Text>
            </View>
          ) : (
            payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))
          )}
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Payouts are typically processed within 7–10 business days after a booking is completed.
            Contact support@nexttrp.com for payout inquiries.
          </Text>
        </View>
      </ScrollView>

      <AddAccountModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
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
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  addLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingVertical: 8,
  },
  emptyAccounts: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
