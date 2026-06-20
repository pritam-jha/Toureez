import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

const TABS = ['all', 'published', 'unpublished', 'verified'] as const;

export default function Reviews() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'reviews', tab],
    queryFn: () =>
      adminApi.listReviews(
        tab === 'published' ? { is_published: true }
        : tab === 'unpublished' ? { is_published: false }
        : tab === 'verified' ? { is_verified: true }
        : undefined
      ),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
  const publishMutation = useMutation({ mutationFn: (id: string) => adminApi.publishReview(id), onSuccess: invalidate });
  const unpublishMutation = useMutation({ mutationFn: (id: string) => adminApi.unpublishReview(id), onSuccess: invalidate });
  const verifyMutation = useMutation({ mutationFn: (id: string) => adminApi.verifyReview(id), onSuccess: invalidate });

  return (
    <div>
      <PageHeader title="Reviews" />

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load reviews" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No reviews found." />}

      {query.data?.data?.map((r) => (
        <Card key={r.id} className="review-card">
          <strong>{r.title ?? 'Untitled review'}</strong>
          <p>{r.body}</p>
          <span className="muted">
            ★ {r.overall_rating} — {r.user.display_name} ({r.is_published ? 'published' : 'pending'}{r.is_verified ? ', verified' : ''})
          </span>
          <div className="detail-actions">
            <button className="btn btn-outline" onClick={() => publishMutation.mutate(r.id)}>Publish</button>
            <button className="btn btn-outline" onClick={() => unpublishMutation.mutate(r.id)}>Unpublish</button>
            <button className="btn btn-outline" onClick={() => verifyMutation.mutate(r.id)}>Verify</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
