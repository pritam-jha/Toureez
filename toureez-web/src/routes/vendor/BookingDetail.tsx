import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { bookingPackageTitle } from '../../lib/api/bookings';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

const ACTIONS = ['confirmed', 'cancelled', 'completed'] as const;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'booking', id], queryFn: () => vendorApi.getBooking(id!), enabled: !!id });

  const statusMutation = useMutation({
    mutationFn: (status: string) => vendorApi.updateBookingStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'booking', id] }),
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

      {booking.user && (
        <Card className="detail-section">
          <h2>Traveler</h2>
          <p>{booking.user.full_name ?? '—'}</p>
          <p className="muted">{booking.user.email}</p>
          {booking.user.phone && <p className="muted">{booking.user.phone}</p>}
        </Card>
      )}

      {booking.payment && (
        <Card className="detail-section">
          <h2>Payment</h2>
          <p>Amount paid: ₹{booking.payment.amount_paid ?? 0}</p>
          <p className="muted">Method: {booking.payment.payment_method ?? '—'}</p>
          {booking.payment.paid_at && <p className="muted">Paid on: {new Date(booking.payment.paid_at).toLocaleDateString()}</p>}
        </Card>
      )}

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
