/**
 * @file app/(vendor)/packages/[id]/itinerary.tsx
 * @description Itinerary editor for a vendor package.
 *
 * Allows vendors to build a day-by-day itinerary. Each day has a title,
 * description, meals, accommodation, activities, and transport fields.
 * The full itinerary is replaced on save via useUpsertItinerary().
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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useVendorPackage, useUpsertItinerary } from '../../../../hooks/useVendorPackages';
import { Header } from '../../../../components/ui/Header';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { InlineLoader } from '../../../../components/ui/LoadingSpinner';
import { Colors } from '../../../../constants/colors';
import { Shadows } from '../../../../constants/shadows';
import type { VendorItineraryDay } from '../../../../types';

// ── Day draft type ────────────────────────────────────────────────────────────

interface DayDraft {
  id?: string;
  day_number: number;
  title: string;
  description: string;
  meals: string[];
  accommodation: string;
  activities: string[];
  transport: string;
}

function dayToFormDraft(day: VendorItineraryDay): DayDraft {
  return {
    id: day.id,
    day_number: day.day_number,
    title: day.title,
    description: day.description ?? '',
    meals: day.meals ?? [],
    accommodation: day.accommodation ?? '',
    activities: day.activities ?? [],
    transport: day.transport ?? '',
  };
}

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'All Meals'];
const INDIVIDUAL_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

// ── Day card ──────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: DayDraft;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof DayDraft, value: string | string[]) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function DayCard({
  day,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: DayCardProps): React.ReactElement {
  const [activityDraft, setActivityDraft] = useState('');

  const toggleMeal = (meal: string): void => {
    if (meal === 'All Meals') {
      if (day.meals.includes('All Meals')) {
        // Deselect everything
        onChange('meals', []);
      } else {
        // Select all: All Meals + individual meals
        onChange('meals', ['All Meals', ...INDIVIDUAL_MEALS]);
      }
    } else {
      const withoutAll = day.meals.filter((m) => m !== 'All Meals');
      const updated = withoutAll.includes(meal)
        ? withoutAll.filter((m) => m !== meal)
        : [...withoutAll, meal];
      // If all three individual meals are now selected, also add "All Meals"
      const allSelected = INDIVIDUAL_MEALS.every((m) => updated.includes(m));
      onChange('meals', allSelected ? ['All Meals', ...updated] : updated);
    }
  };

  const handleAddActivity = (): void => {
    const trimmed = activityDraft.trim();
    if (trimmed) {
      onChange('activities', [...day.activities, trimmed]);
      setActivityDraft('');
    }
  };

  const removeActivity = (activity: string): void => {
    onChange('activities', day.activities.filter((a) => a !== activity));
  };

  return (
    <View style={[cardStyles.card, Shadows.sm]}>
      {/* Day header */}
      <Pressable style={cardStyles.header} onPress={onToggle}>
        <View style={cardStyles.dayBadge}>
          <Text style={cardStyles.dayNumber}>Day {day.day_number}</Text>
        </View>
        <Text style={cardStyles.dayTitle} numberOfLines={1}>
          {day.title || 'Untitled Day'}
        </Text>
        <View style={cardStyles.headerActions}>
          {!isFirst && (
            <Pressable onPress={onMoveUp} hitSlop={8} style={cardStyles.iconBtn}>
              <Ionicons name="arrow-up" size={16} color={Colors.textSecondary} />
            </Pressable>
          )}
          {!isLast && (
            <Pressable onPress={onMoveDown} hitSlop={8} style={cardStyles.iconBtn}>
              <Ionicons name="arrow-down" size={16} color={Colors.textSecondary} />
            </Pressable>
          )}
          <Pressable onPress={onRemove} hitSlop={8} style={cardStyles.iconBtn}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </Pressable>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textLight}
          />
        </View>
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View style={cardStyles.body}>
          <Input
            label="Day Title"
            required
            value={day.title}
            onChangeText={(v) => onChange('title', v)}
            placeholder="e.g. Arrival in Delhi & City Tour"
            autoCapitalize="words"
            leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            label="Description"
            value={day.description}
            onChangeText={(v) => onChange('description', v)}
            placeholder="Describe the day's activities and experiences…"
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />}
          />

          {/* Meals */}
          <Text style={cardStyles.fieldLabel}>Meals Included</Text>
          <View style={cardStyles.mealRow}>
            {MEAL_OPTIONS.map((meal) => (
              <Pressable
                key={meal}
                style={[cardStyles.mealChip, day.meals.includes(meal) && cardStyles.mealChipActive]}
                onPress={() => toggleMeal(meal)}
              >
                <Text style={[cardStyles.mealText, day.meals.includes(meal) && cardStyles.mealTextActive]}>
                  {meal}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Accommodation"
            value={day.accommodation}
            onChangeText={(v) => onChange('accommodation', v)}
            placeholder="e.g. 3-star hotel in Delhi"
            leftIcon={<Ionicons name="bed-outline" size={18} color={Colors.textSecondary} />}
          />

          {/* Activities */}
          <Text style={cardStyles.fieldLabel}>Activities</Text>
          <View style={cardStyles.activityRow}>
            <TextInput
              style={cardStyles.activityInput}
              value={activityDraft}
              onChangeText={setActivityDraft}
              placeholder="Add activity…"
              placeholderTextColor={Colors.textLight}
              onSubmitEditing={handleAddActivity}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <Pressable style={cardStyles.addBtn} onPress={handleAddActivity}>
              <Ionicons name="add" size={18} color={Colors.textWhite} />
            </Pressable>
          </View>
          {day.activities.length > 0 && (
            <View style={cardStyles.tags}>
              {day.activities.map((a) => (
                <View key={a} style={cardStyles.tag}>
                  <Text style={cardStyles.tagText}>{a}</Text>
                  <Pressable onPress={() => removeActivity(a)} hitSlop={4}>
                    <Ionicons name="close" size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Input
            label="Transport"
            value={day.transport}
            onChangeText={(v) => onChange('transport', v)}
            placeholder="e.g. Private AC cab"
            leftIcon={<Ionicons name="car-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  dayBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: { padding: 4 },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 8,
    marginTop: 8,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mealChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealChipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  mealText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mealTextActive: {
    color: Colors.textWhite,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  activityInput: {
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
    marginBottom: 8,
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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ItineraryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading } = useVendorPackage(id ?? '');
  const upsertItinerary = useUpsertItinerary(id ?? '');

  const [days, setDays] = useState<DayDraft[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    if (pkg?.itinerary != null) {
      const sorted = [...pkg.itinerary].sort((a, b) => a.day_number - b.day_number);
      setDays(sorted.map(dayToFormDraft));
    }
  }, [pkg?.itinerary]);

  const handleToggle = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleChange = useCallback(
    (index: number, field: keyof DayDraft, value: string | string[]) => {
      setDays((prev) =>
        prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const handleRemove = useCallback((index: number) => {
    Alert.alert('Remove Day', `Remove Day ${index + 1} from the itinerary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setDays((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((d, i) => ({ ...d, day_number: i + 1 }));
          });
          setExpandedIndex(null);
        },
      },
    ]);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setDays((prev) => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((d, i) => ({ ...d, day_number: i + 1 }));
    });
    setExpandedIndex(index - 1);
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setDays((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((d, i) => ({ ...d, day_number: i + 1 }));
    });
    setExpandedIndex(index + 1);
  }, []);

  const handleAddDay = useCallback(() => {
    setDays((prev) => {
      const newDay: DayDraft = {
        day_number: prev.length + 1,
        title: '',
        description: '',
        meals: [],
        accommodation: '',
        activities: [],
        transport: '',
      };
      setExpandedIndex(prev.length);
      return [...prev, newDay];
    });
  }, []);

  const handleSave = async (): Promise<void> => {
    for (let i = 0; i < days.length; i++) {
      if (!days[i].title.trim()) {
        Alert.alert('Validation', `Day ${i + 1}: Title is required.`);
        return;
      }
    }
    try {
      await upsertItinerary.mutateAsync({
        packageId: id ?? '',
        days: days.map((d) => ({
          id: d.id,
          day_number: d.day_number,
          title: d.title.trim(),
          description: d.description.trim() || undefined,
          meals: d.meals,
          accommodation: d.accommodation.trim() || undefined,
          activities: d.activities,
          transport: d.transport.trim() || undefined,
        })),
      });
      Alert.alert('Saved', 'Itinerary saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save itinerary.';
      Alert.alert('Save Failed', message);
    }
  };

  if (isLoading || pkg == null) {
    return (
      <View style={styles.flex}>
        <Header title="Itinerary" showBack />
        <InlineLoader message="Loading itinerary…" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={`Itinerary (${days.length} ${days.length === 1 ? 'day' : 'days'})`}
        showBack
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {days.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No itinerary yet</Text>
            <Text style={styles.emptyBody}>Add days to build your day-by-day travel plan.</Text>
          </View>
        ) : (
          days.map((day, index) => (
            <DayCard
              key={day.id ?? `day-${index}`}
              day={day}
              isExpanded={expandedIndex === index}
              onToggle={() => handleToggle(index)}
              onChange={(field, value) => handleChange(index, field, value)}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === days.length - 1}
            />
          ))
        )}

        <Pressable style={styles.addDayBtn} onPress={handleAddDay}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addDayText}>Add Day {days.length + 1}</Text>
        </Pressable>

        {days.length > 0 && (
          <Button
            label="Save Itinerary"
            onPress={() => void handleSave()}
            loading={upsertItinerary.isPending}
            fullWidth
            size="large"
            variant="primary"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 16,
  },
  addDayText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
