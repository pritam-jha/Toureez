import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Users() {
  const query = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.listUsers() });

  return (
    <div>
      <PageHeader title="Users" />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load users" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No users found." />}

      {query.data?.data?.map((u) => (
        <Link key={u.id} to={`/admin/users/${u.id}`}>
          <Card className="list-card">
            <div>
              <strong>{u.full_name}</strong>
              <p className="muted">{u.email}</p>
            </div>
            <span className="muted">{u.role}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
