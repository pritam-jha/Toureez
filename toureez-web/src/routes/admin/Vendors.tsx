import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'pending', 'approved', 'rejected'] as const;

export default function Vendors() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const query = useQuery({
    queryKey: ['admin', 'vendors', status],
    queryFn: () => adminApi.listVendors(status === 'all' ? undefined : status),
  });

  return (
    <div>
      <PageHeader title="Vendors" />

      <div className="tab-row">
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load vendors" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No vendors found." />}

      {query.data?.data?.map((v) => (
        <Link key={v.id} to={`/admin/vendors/${v.id}`}>
          <Card className="list-card">
            <div>
              <strong>{v.name}</strong>
              <p className="muted">{v.owner?.full_name ?? v.owner?.email}</p>
            </div>
            <div className="list-card-meta">
              <StatusBadge status={v.status} />
              {v.is_verified && <span className="muted">Verified</span>}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
