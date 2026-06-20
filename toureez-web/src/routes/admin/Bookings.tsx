import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'confirmed', 'pending', 'cancelled', 'completed'] as const;

export default function Bookings() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const query = useQuery({
    queryKey: ['admin', 'bookings', status],
    queryFn: () => adminApi.listBookings(status === 'all' ? undefined : status),
  });

  return (
    <div>
      <PageHeader title="Bookings" />

      <div className="tab-row">
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load bookings" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No bookings found." />}

      {query.data?.data?.map((b) => (
        <Link key={b.id} to={`/admin/bookings/${b.id}`}>
          <Card className="list-card">
            <div>
              <strong>{bookingPackageTitle(b)}</strong>
              <p className="muted">Travel date: {b.travel_date}</p>
            </div>
            <div className="list-card-meta">
              <StatusBadge status={b.status} />
              <span>₹{b.total_amount}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
