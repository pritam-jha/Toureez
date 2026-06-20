import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, PageHeader } from '../../components/ui';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analytics() {
  const [month, setMonth] = useState(currentMonth());
  const query = useQuery({ queryKey: ['vendor', 'earnings', month], queryFn: () => vendorApi.earnings(month) });

  return (
    <div>
      <PageHeader
        title="Analytics"
        actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
      />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load analytics" onRetry={() => query.refetch()} />}

      {query.data?.data && (
        <div className="metric-grid">
          <Card className="metric-card"><span>Revenue ({query.data.data.month})</span><strong>₹{query.data.data.revenue}</strong></Card>
          <Card className="metric-card"><span>Confirmed/Completed Bookings</span><strong>{query.data.data.bookings}</strong></Card>
        </div>
      )}
    </div>
  );
}
