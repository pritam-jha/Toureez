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
        <Card className="metric-card"><span>Total Bookings</span><strong>{m.total_bookings}</strong></Card>
        <Card className="metric-card"><span>Revenue (this month)</span><strong>₹{m.this_month_revenue}</strong></Card>
        <Card className="metric-card"><span>Active Packages</span><strong>{m.active_packages}</strong></Card>
        <Card className="metric-card"><span>Pending Packages</span><strong>{m.pending_packages}</strong></Card>
      </div>
      <div className="metric-grid">
        <Card className="metric-card"><span>Avg Rating</span><strong>★ {m.avg_rating} ({m.total_reviews})</strong></Card>
        <Card className="metric-card"><span>Pending Payouts</span><strong>₹{m.pending_payouts}</strong></Card>
        <Card className="metric-card"><span>Confirmed Bookings</span><strong>{m.confirmed_bookings}</strong></Card>
        <Card className="metric-card"><span>Cancelled Bookings</span><strong>{m.cancelled_bookings}</strong></Card>
      </div>

      <div className="detail-actions">
        <Link className="btn btn-outline" to="/vendor/bookings">View Bookings</Link>
        <Link className="btn btn-outline" to="/vendor/packages">Manage Packages</Link>
      </div>
    </div>
  );
}
