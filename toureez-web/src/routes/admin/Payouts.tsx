import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'pending', 'processing', 'paid', 'failed'] as const;

export default function Payouts() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'payouts', status],
    queryFn: () => adminApi.listPayouts(status === 'all' ? undefined : status),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => adminApi.updatePayoutStatus(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  });

  return (
    <div>
      <PageHeader title="Payouts" />

      <div className="tab-row">
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load payouts" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No payouts found." />}

      {query.data?.data?.map((p) => (
        <Card key={p.id} className="list-card">
          <span>{new Date(p.created_at).toLocaleDateString()}</span>
          <div className="list-card-meta">
            <StatusBadge status={p.status} />
            <span>₹{p.amount}</span>
            <button className="btn btn-outline" onClick={() => statusMutation.mutate({ id: p.id, value: 'paid' })}>
              Mark Paid
            </button>
            <button className="btn btn-outline" onClick={() => statusMutation.mutate({ id: p.id, value: 'failed' })}>
              Mark Failed
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
