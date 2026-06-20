import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function AuditLogs() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'audit-logs', entityType, action],
    queryFn: () => adminApi.listAuditLogs({ entity_type: entityType || undefined, action: action || undefined }),
  });

  return (
    <div>
      <PageHeader title="Audit Logs" />

      <div className="search-filters">
        <input placeholder="Entity type (e.g. package)" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
        <input placeholder="Action (e.g. approved)" value={action} onChange={(e) => setAction(e.target.value)} />
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load audit logs" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No audit log entries found." />}

      <table className="data-table">
        <thead>
          <tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th></tr>
        </thead>
        <tbody>
          {query.data?.data?.map((entry) => (
            <tr key={entry.id}>
              <td>{new Date(entry.created_at).toLocaleString()}</td>
              <td>{entry.admin_email}</td>
              <td>{entry.action}</td>
              <td>{entry.entity_type} {entry.entity_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
