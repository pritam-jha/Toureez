import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

export default function Payouts() {
  const query = useQuery({ queryKey: ['vendor', 'payouts'], queryFn: vendorApi.listPayouts });
  const accountsQuery = useQuery({ queryKey: ['vendor', 'payout-accounts'], queryFn: vendorApi.listPayoutAccounts });

  return (
    <div>
      <PageHeader title="Payouts" />

      <section className="home-section">
        <h2>Payout History</h2>
        {query.isLoading && <LoadingState />}
        {query.isError && <ErrorState message="Failed to load payouts" onRetry={() => query.refetch()} />}
        {query.data?.data && query.data.data.length === 0 && <EmptyState message="No payouts yet." />}
        {query.data?.data?.map((p) => (
          <Card key={p.id} className="list-card">
            <span>{new Date(p.created_at).toLocaleDateString()}</span>
            <div className="list-card-meta">
              <StatusBadge status={p.status} />
              <span>₹{p.amount}</span>
            </div>
          </Card>
        ))}
      </section>

      <section className="home-section">
        <h2>Bank Accounts</h2>
        {accountsQuery.data?.data && accountsQuery.data.data.length === 0 && (
          <EmptyState message="No payout accounts on file." />
        )}
        {accountsQuery.data?.data?.map((acc) => (
          <Card key={acc.id} className="list-card">
            <div>
              <strong>{acc.account_holder_name}</strong>
              <p className="muted">{acc.bank_name ?? acc.upi_id ?? '—'}</p>
            </div>
            {acc.is_primary && <span className="muted">Primary</span>}
          </Card>
        ))}
      </section>
    </div>
  );
}
