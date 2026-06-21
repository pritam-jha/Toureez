import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Notifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'notifications'], queryFn: vendorApi.listNotifications });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => vendorApi.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => vendorApi.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] }),
  });

  return (
    <div>
      <PageHeader title="Notifications" actions={<button className="btn btn-outline" onClick={() => markAllMutation.mutate()}>Mark all read</button>} />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load notifications" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No notifications." />}

      {query.data?.data?.map((n) => (
        <Card key={n.id} className={`list-card ${n.is_read ? "" : "unread"}`} onClick={() => markReadMutation.mutate(n.id)}>
          <div>
            <strong>{n.title}</strong>
            <p className="muted">{n.body}</p>
          </div>
          <span className="muted">{new Date(n.created_at).toLocaleDateString()}</span>
        </Card>
      ))}
    </div>
  );
}
