import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState } from '../../components/ui';

const ROLES = ['traveler', 'company_owner', 'admin'] as const;

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => adminApi.getUser(id!), enabled: !!id });

  const roleMutation = useMutation({
    mutationFn: (role: string) => adminApi.updateUserRole(id!, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load user" onRetry={() => query.refetch()} />;

  const user = query.data.data;

  return (
    <div>
      <h1>{user.full_name}</h1>
      <Card className="detail-section">
        <p>{user.email}</p>
        <p className="muted">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
        <p>Current role: <strong>{user.role}</strong></p>
      </Card>

      <div className="detail-actions">
        {ROLES.map((r) => (
          <button
            key={r}
            className="btn btn-outline"
            disabled={roleMutation.isPending || r === user.role}
            onClick={() => roleMutation.mutate(r)}
          >
            Set role: {r}
          </button>
        ))}
      </div>
    </div>
  );
}
