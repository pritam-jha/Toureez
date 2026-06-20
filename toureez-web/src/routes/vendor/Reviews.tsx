import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Reviews() {
  const query = useQuery({ queryKey: ['vendor', 'reviews'], queryFn: vendorApi.listReviews });

  return (
    <div>
      <PageHeader title="Reviews" />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load reviews" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No reviews yet." />}

      {query.data?.data?.map((r) => (
        <Card key={r.id} className="review-card">
          <strong>{r.title}</strong>
          <p>{r.body}</p>
          <span className="muted">★ {r.overall_rating} — {r.user.display_name ?? 'Traveler'}</span>
        </Card>
      ))}
    </div>
  );
}
