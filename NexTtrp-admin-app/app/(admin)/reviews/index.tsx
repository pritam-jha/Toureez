/**
 * @file app/(admin)/reviews/index.tsx
 * @description Admin review moderation screen.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { useAdminReviews, usePublishReview, useUnpublishReview, useVerifyReview } from '../../../hooks/admin/useAdminReviews';
import type { Review } from '../../../types';

type PublishedFilter = 'all' | 'published' | 'unpublished';

const FILTER_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Published', value: 'published' as PublishedFilter },
  { label: 'Unpublished', value: 'unpublished' as PublishedFilter },
];

function StarBar({ rating }: { rating: number }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 10, color: s <= Math.round(rating) ? Colors.star : Colors.border }}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ review, onPublish, onUnpublish, onVerify, loading }: {
  review: Review;
  onPublish: () => void;
  onUnpublish: () => void;
  onVerify: () => void;
  loading: boolean;
}): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.reviewerName}>{review.user.display_name}</Text>
          <StarBar rating={review.overall_rating} />
        </View>
        <View style={styles.cardBadges}>
          <View style={[styles.badge, { backgroundColor: review.is_published ? Colors.successLight : Colors.errorLight }]}>
            <Text style={[styles.badgeText, { color: review.is_published ? Colors.success : Colors.error }]}>
              {review.is_published ? 'Published' : 'Hidden'}
            </Text>
          </View>
          {review.is_verified && (
            <View style={[styles.badge, { backgroundColor: Colors.secondaryLight }]}>
              <Text style={[styles.badgeText, { color: Colors.secondary }]}>✓ Verified</Text>
            </View>
          )}
        </View>
      </View>

      {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
      {review.body && <Text style={styles.reviewBody} numberOfLines={3}>{review.body}</Text>}
      <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('en-IN')}</Text>

      <View style={styles.actions}>
        {review.is_published ? (
          <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={onUnpublish} disabled={loading}>
            <Text style={styles.actionDangerText}>Unpublish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.actionSuccess]} onPress={onPublish} disabled={loading}>
            <Text style={styles.actionSuccessText}>Publish</Text>
          </TouchableOpacity>
        )}
        {!review.is_verified && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} onPress={onVerify} disabled={loading}>
            <Text style={styles.actionSecondaryText}>Verify</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AdminReviewsScreen(): React.ReactElement {
  const [filter, setFilter] = useState<PublishedFilter>('all');

  const { data, isLoading, isError, refetch } = useAdminReviews({
    is_published: filter === 'all' ? undefined : filter === 'published',
    limit: 30,
  });

  const publish = usePublishReview();
  const unpublish = useUnpublishReview();
  const verify = useVerifyReview();

  const anyMutating = publish.isPending || unpublish.isPending || verify.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
        <View style={styles.backBtn} />
      </View>

      <StatusFilterTabs tabs={FILTER_TABS} selected={filter} onSelect={setFilter} />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load reviews</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Review }) => (
            <ReviewCard
              review={item}
              loading={anyMutating}
              onPublish={() => publish.mutate(item.id, { onError: (e) => Alert.alert('Error', e.message) })}
              onUnpublish={() => unpublish.mutate(item.id, { onError: (e) => Alert.alert('Error', e.message) })}
              onVerify={() => verify.mutate(item.id, { onError: (e) => Alert.alert('Error', e.message) })}
            />
          )}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No reviews found</Text></View>}
          ListFooterComponent={data ? <Text style={styles.countText}>{data.total} reviews total</Text> : null}
          contentContainerStyle={{ padding: 12, paddingBottom: 32, flexGrow: 1, gap: 10 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  cardBadges: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  reviewTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  reviewBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  reviewDate: { fontSize: 11, color: Colors.textLight, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionSuccess: { backgroundColor: Colors.successLight },
  actionSuccessText: { color: Colors.success, fontWeight: '600', fontSize: 13 },
  actionDanger: { backgroundColor: Colors.errorLight },
  actionDangerText: { color: Colors.error, fontWeight: '600', fontSize: 13 },
  actionSecondary: { backgroundColor: Colors.secondaryLight },
  actionSecondaryText: { color: Colors.secondary, fontWeight: '600', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
