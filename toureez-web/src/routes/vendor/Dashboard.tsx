import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const query = useQuery({ queryKey: ['vendor', 'dashboard'], queryFn: vendorApi.dashboard });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load dashboard" onRetry={() => query.refetch()} />;

  const m = query.data.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={<Link className="btn btn-primary" to="/vendor/packages/new">+ New Package</Link>}
      />

      <div className="metric-grid">
        <Card className="metric-card"><span>Bookings (month)</span><strong>{m.total_bookings_month}</strong></Card>
        <Card className="metric-card"><span>Revenue (month)</span><strong>₹{m.revenue_month}</strong></Card>
        <Card className="metric-card"><span>Active Packages</span><strong>{m.active_packages}</strong></Card>
        <Card className="metric-card"><span>Pending Approvals</span><strong>{m.pending_approvals}</strong></Card>
      </div>

      <div className="detail-actions">
        <Link className="btn btn-outline" to="/vendor/bookings">View Bookings</Link>
        <Link className="btn btn-outline" to="/vendor/packages">Manage Packages</Link>
      </div>
    </div>
  );
}
