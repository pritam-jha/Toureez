import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { cancelBooking, getBookingDetail, getBookingInvoiceUrl, bookingPackageTitle } from '../../lib/api/bookings';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingDetail(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', id] }),
  });

  async function handleInvoice() {
    const res = await getBookingInvoiceUrl(id!);
    if (res.data?.url) window.open(res.data.url, '_blank');
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) {
    return <ErrorState message="Failed to load booking" onRetry={() => query.refetch()} />;
  }

  const booking = query.data.data;

  return (
    <div className="site-content">
      <h1>{bookingPackageTitle(booking)}</h1>
      <StatusBadge status={booking.status} />

      <Card className="detail-section">
        <p>Travel date: {booking.travel_date}</p>
        <p>Total amount: ₹{booking.total_amount}</p>
        <p>Booked on: {new Date(booking.created_at).toLocaleDateString()}</p>
      </Card>

      <div className="detail-actions">
        <button className="btn btn-outline" onClick={handleInvoice}>Download Invoice</button>
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <button className="btn btn-outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        )}
        {booking.status === 'completed' && (
          <Link className="btn btn-primary" to={`/app/review/${booking.id}`}>Write a Review</Link>
        )}
      </div>
    </div>
  );
}
