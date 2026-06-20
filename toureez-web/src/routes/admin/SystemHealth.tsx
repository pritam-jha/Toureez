import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, LoadingState, ErrorState, PageHeader } from '../../components/ui';

interface HealthStatus {
  status: string;
  database?: string;
  uptime_seconds?: number;
  [key: string]: unknown;
}

export default function SystemHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthStatus>('/health'),
    refetchInterval: 30_000,
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load system health" onRetry={() => query.refetch()} />;

  const health = query.data.data;

  return (
    <div>
      <PageHeader title="System Health" subtitle="Auto-refreshes every 30 seconds" />

      <Card className="detail-section">
        <p>Status: <strong>{health.status}</strong></p>
        {health.database && <p>Database: {health.database}</p>}
        {health.uptime_seconds !== undefined && <p>Uptime: {Math.round(health.uptime_seconds / 60)} minutes</p>}
      </Card>

      <pre className="raw-data">{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}
