/**
 * @file components/admin/AuditLogItem.tsx
 * Human-readable audit log row.
 *
 * Converts raw DB action strings and metadata into plain-English sentences
 * so administrators can understand the activity trail at a glance.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import type { AdminAuditLog } from '../../types/admin';

// ── Action label map ──────────────────────────────────────────────────────────
// Maps raw DB action keys to short, plain-English sentences.

const ACTION_LABELS: Record<string, string> = {
  // Vendor
  approve_vendor:               'Approved vendor',
  reject_vendor:                'Rejected vendor',
  verify_vendor:                'Verified vendor',
  // Package
  approve_package:              'Approved package',
  reject_package:               'Rejected package',
  feature_package:              'Featured package',
  unfeature_package:            'Removed featured flag',
  set_bestseller_package:       'Marked package as bestseller',
  unset_bestseller_package:     'Removed bestseller badge',
  // Booking
  update_booking_status_confirmed: 'Confirmed booking',
  update_booking_status_cancelled: 'Cancelled booking',
  update_booking_status_completed: 'Completed booking',
  update_booking_status_pending:   'Reset booking to pending',
  // Reviews
  publish_review:               'Published review',
  unpublish_review:             'Unpublished review',
  verify_review:                'Verified review',
  // Payouts
  update_payout_status:         'Updated payout status',
  // Users
  update_user_role:             'Changed user role',
  // Categories & Locations
  create_category:              'Created category',
  update_category:              'Updated category',
  delete_category:              'Deleted category',
  create_location:              'Created location',
  update_location:              'Updated location',
  delete_location:              'Deleted location',
};

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Action colour ─────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  approve_vendor:               Colors.success,
  reject_vendor:                Colors.error,
  verify_vendor:                Colors.secondary,
  approve_package:              Colors.success,
  reject_package:               Colors.error,
  feature_package:              Colors.accent,
  unfeature_package:            Colors.textSecondary,
  set_bestseller_package:       Colors.accent,
  unset_bestseller_package:     Colors.textSecondary,
  update_booking_status_confirmed: Colors.success,
  update_booking_status_cancelled: Colors.error,
  update_booking_status_completed: Colors.secondary,
  update_booking_status_pending:   Colors.warning,
  publish_review:               Colors.success,
  unpublish_review:             Colors.warning,
  verify_review:                Colors.secondary,
  update_payout_status:         Colors.primary,
  update_user_role:             Colors.primary,
  create_category:              Colors.primary,
  update_category:              Colors.secondary,
  delete_category:              Colors.error,
  create_location:              Colors.primary,
  update_location:              Colors.secondary,
  delete_location:              Colors.error,
};

export function getActionColor(action: string): string {
  return ACTION_COLORS[action] ?? Colors.textSecondary;
}

// ── Entity icon + label ───────────────────────────────────────────────────────

export type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export const ENTITY_META: Record<string, { icon: MCIcon; label: string }> = {
  vendor:   { icon: 'office-building',  label: 'Vendor' },
  package:  { icon: 'package-variant',  label: 'Package' },
  booking:  { icon: 'calendar-check',   label: 'Booking' },
  review:   { icon: 'star',             label: 'Review' },
  category: { icon: 'tag',              label: 'Category' },
  location: { icon: 'map-marker',       label: 'Location' },
  payout:   { icon: 'cash',             label: 'Payout' },
  user:     { icon: 'account',          label: 'User' },
};

// ── Metadata → human-readable detail lines ────────────────────────────────────

const META_LABELS: Record<string, string> = {
  reason:       'Reason',
  note:         'Note',
  new_status:   'New status',
  new_role:     'New role',
  is_featured:  'Featured',
  is_bestseller:'Bestseller',
  from_role:    'From role',
  to_role:      'To role',
};

function buildDetailLines(metadata: Record<string, unknown>): string[] {
  const lines: string[] = [];

  for (const [key, val] of Object.entries(metadata)) {
    if (val === null || val === undefined || val === '') continue;

    const label = META_LABELS[key];
    if (!label) continue; // skip internal/developer keys we don't want to show

    let display: string;
    if (typeof val === 'boolean') {
      display = val ? 'Yes' : 'No';
    } else if (typeof val === 'string' || typeof val === 'number') {
      display = String(val);
    } else {
      continue;
    }

    lines.push(`${label}: ${display}`);
  }

  return lines;
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';

  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AuditLogItemProps {
  log: AdminAuditLog;
}

export function AuditLogItem({ log }: AuditLogItemProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const actionColor  = getActionColor(log.action);
  const actionLabel  = getActionLabel(log.action);
  const entityMeta   = ENTITY_META[log.entity_type] ?? { icon: 'information-outline' as MCIcon, label: log.entity_type };
  const adminName    = log.admin?.full_name?.trim() || log.admin?.email || 'Admin';
  const detailLines  = buildDetailLines(log.metadata ?? {});

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => setExpanded((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`${actionLabel}, ${entityMeta.label}, by ${adminName}`}
    >
      <View style={styles.row}>
        {/* Colour rail */}
        <View style={[styles.rail, { backgroundColor: actionColor }]} />

        {/* Entity icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: `${actionColor}14` }]}>
          <MaterialCommunityIcons name={entityMeta.icon} size={18} color={actionColor} />
        </View>

        {/* Main content */}
        <View style={styles.body}>
          {/* Line 1: action label + timestamp */}
          <View style={styles.headline}>
            <Text style={[styles.actionLabel, { color: actionColor }]} numberOfLines={1}>
              {actionLabel}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(log.created_at)}</Text>
          </View>

          {/* Line 2: entity type */}
          <Text style={styles.entityLine} numberOfLines={1}>
            {entityMeta.label}
          </Text>

          {/* Line 3: who did it */}
          <Text style={styles.actorLine} numberOfLines={1}>
            By {adminName}
          </Text>

          {/* Expanded: detail lines + full timestamp */}
          {expanded && detailLines.length > 0 && (
            <View style={styles.details}>
              {detailLines.map((line) => (
                <Text key={line} style={styles.detailLine}>
                  {line}
                </Text>
              ))}
            </View>
          )}

          {expanded && (
            <Text style={styles.fullTimestamp}>{formatFullTimestamp(log.created_at)}</Text>
          )}
        </View>

        {/* Expand chevron — only when there are details */}
        {detailLines.length > 0 && (
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textLight}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
  },
  rail: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    flexShrink: 0,
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: FontWeight.medium,
    flexShrink: 0,
  },
  entityLine: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  actorLine: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  details: {
    marginTop: 6,
    gap: 3,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  detailLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  fullTimestamp: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  chevron: {
    marginTop: 10,
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
});
