import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load dashboard" onRetry={() => query.refetch()} />;

  const m = query.data.data;

  return (
    <div>
      <PageHeader title="Admin Dashboard" />

      <div className="metric-grid">
        <Card className="metric-card"><span>Total Users</span><strong>{m.total_users}</strong></Card>
        <Card className="metric-card"><span>Total Vendors</span><strong>{m.total_vendors}</strong></Card>
        <Card className="metric-card"><span>Total Bookings</span><strong>{m.total_bookings}</strong></Card>
        <Card className="metric-card"><span>Revenue (month)</span><strong>₹{m.revenue_month}</strong></Card>
      </div>
    </div>
  );
}
