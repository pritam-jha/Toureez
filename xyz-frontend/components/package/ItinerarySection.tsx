/**
 * @file components/package/ItinerarySection.tsx
 * @description Day-by-day accordion itinerary. First day expanded by default.
 * Each day shows description, meals, accommodation, activities, and transport.
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { Itinerary } from '../../types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ItinerarySectionProps {
  itineraries: Itinerary[];
}

// ── Meal pill ─────────────────────────────────────────────────────────────────

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍱',
  dinner: '🍽️',
};

function MealPill({ meal }: { meal: string }): React.ReactElement {
  const key = meal.toLowerCase();
  const icon = MEAL_ICONS[key] ?? '🍴';
  return (
    <View style={mealStyles.pill}>
      <Text style={mealStyles.icon}>{icon}</Text>
      <Text style={mealStyles.label} numberOfLines={1}>
        {meal}
      </Text>
    </View>
  );
}

const mealStyles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 6,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  icon: {
    fontSize: 13,
    lineHeight: 18,
    marginRight: 5,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'capitalize',
  },
});

// ── Day accordion item ────────────────────────────────────────────────────────

interface DayItemProps {
  item: Itinerary;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

function DayItem({ item, isExpanded, onToggle }: DayItemProps): React.ReactElement {
  return (
    <View style={dayStyles.container}>
      {/* Header */}
      <Pressable
        style={dayStyles.header}
        onPress={() => onToggle(item.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`Day ${item.day_number}: ${item.title}`}
      >
        <View style={dayStyles.dayBadge}>
          <Text style={dayStyles.dayNumber} numberOfLines={1}>
            {item.day_number}
          </Text>
        </View>
        <Text style={dayStyles.dayTitle} numberOfLines={2}>
          Day {item.day_number} — {item.title}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textTertiary}
        />
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View style={dayStyles.content}>
          {/* Description */}
          {item.description ? (
            <Text style={dayStyles.description}>{item.description}</Text>
          ) : null}

          {/* Meals */}
          {item.meals.length > 0 && (
            <View style={dayStyles.block}>
              <Text style={dayStyles.blockLabel} numberOfLines={1}>Meals</Text>
              <View style={dayStyles.mealsRow}>
                {item.meals.map((meal, i) => (
                  <MealPill key={i} meal={meal} />
                ))}
              </View>
            </View>
          )}

          {/* Accommodation */}
          {item.accommodation ? (
            <View style={dayStyles.inlineRow}>
              <Ionicons name="bed-outline" size={15} color={Colors.primary} />
              <Text style={dayStyles.inlineText} numberOfLines={2}>
                {item.accommodation}
              </Text>
            </View>
          ) : null}

          {/* Activities */}
          {item.activities.length > 0 && (
            <View style={dayStyles.block}>
              <Text style={dayStyles.blockLabel} numberOfLines={1}>Activities</Text>
              {item.activities.map((activity, i) => (
                <View key={i} style={dayStyles.bulletRow}>
                  <View style={dayStyles.bullet} />
                  <Text style={dayStyles.bulletText}>{activity}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Transport */}
          {item.transport ? (
            <View style={dayStyles.inlineRow}>
              <Ionicons name="car-outline" size={15} color={Colors.primary} />
              <Text style={dayStyles.inlineText} numberOfLines={2}>
                {item.transport}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const dayStyles = StyleSheet.create({
  container: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    minWidth: 32,
    paddingHorizontal: 6,
  },
  dayNumber: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  dayTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginRight: 8,
  },
  content: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 12,
  },
  block: {
    marginBottom: 12,
  },
  blockLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 6,
  },
  mealsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inlineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
  },
  inlineText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginLeft: 8,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    height: 6,
    marginRight: 10,
    marginTop: 7,
    width: 6,
  },
  bulletText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export function ItinerarySection({
  itineraries,
}: ItinerarySectionProps): React.ReactElement | null {
  const sorted = [...itineraries].sort((a, b) => a.day_number - b.day_number);

  // First day expanded by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(sorted[0] ? [sorted[0].id] : [])
  );

  const allExpanded = expandedIds.size === sorted.length;

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(sorted.map((d) => d.id)));
    }
  }, [allExpanded, sorted]);

  if (sorted.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          Day-by-Day Itinerary
        </Text>
        <Pressable
          onPress={handleExpandAll}
          accessibilityRole="button"
          accessibilityLabel={allExpanded ? 'Collapse all days' : 'Expand all days'}
          hitSlop={8}
        >
          <Text style={styles.toggleText} numberOfLines={1}>
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </Text>
        </Pressable>
      </View>

      {sorted.map((item) => (
        <DayItem
          key={item.id}
          item={item}
          isExpanded={expandedIds.has(item.id)}
          onToggle={handleToggle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginRight: 12,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});
