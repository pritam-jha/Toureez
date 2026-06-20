import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listBookings, bookingPackageTitle } from '../../lib/api/bookings';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const TABS = ['all', 'upcoming', 'completed', 'cancelled'] as const;

export default function Bookings() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const query = useQuery({
    queryKey: ['bookings', tab],
    queryFn: () => listBookings(tab === 'all' ? undefined : tab),
  });

  return (
    <div className="site-content">
      <PageHeader title="My Bookings" />

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load bookings" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && (
        <EmptyState message="No bookings yet." action={<Link className="btn btn-primary" to="/app/search">Browse packages</Link>} />
      )}

      {query.data?.data?.map((b) => (
        <Link key={b.id} to={`/app/bookings/${b.id}`}>
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
