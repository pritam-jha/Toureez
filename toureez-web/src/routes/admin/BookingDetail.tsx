import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

const ACTIONS = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'booking', id], queryFn: () => adminApi.getBooking(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateBookingStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;

  const booking = query.data.data;

  return (
    <div>
      <h1>{bookingPackageTitle(booking)}</h1>
      <StatusBadge status={booking.status} />

      <Card className="detail-section">
        <p>Travel date: {booking.travel_date}</p>
        <p>Total amount: ₹{booking.total_amount}</p>
      </Card>

      <div className="detail-actions">
        {ACTIONS.map((a) => (
          <button key={a} className="btn btn-outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(a)}>
            Mark {a}
          </button>
        ))}
      </div>
    </div>
  );
}
