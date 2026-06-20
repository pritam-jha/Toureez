import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitReview } from '../../lib/api/reviews';
import { getBookingDetail, bookingPackageTitle } from '../../lib/api/bookings';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState } from '../../components/ui';

const CATEGORIES = ['guide', 'hotel', 'food', 'transport', 'value'] as const;

export default function ReviewForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const bookingQuery = useQuery({ queryKey: ['booking', bookingId], queryFn: () => getBookingDetail(bookingId!), enabled: !!bookingId });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ratings, setRatings] = useState<Record<typeof CATEGORIES[number], number>>({
    guide: 5, hotel: 5, food: 5, transport: 5, value: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (bookingQuery.isLoading) return <LoadingState />;
  if (bookingQuery.isError || !bookingQuery.data?.data) {
    return <ErrorState message="Failed to load booking" onRetry={() => bookingQuery.refetch()} />;
  }

  const booking = bookingQuery.data.data;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await submitReview({
      booking_id: booking.id,
      package_id: booking.package_id,
      title,
      body,
      rating_guide: ratings.guide,
      rating_hotel: ratings.hotel,
      rating_food: ratings.food,
      rating_transport: ratings.transport,
      rating_value: ratings.value,
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    navigate('/app/bookings');
  }

  return (
    <div className="site-content">
      <h1>Review: {bookingPackageTitle(booking)}</h1>

      <form className="booking-form" onSubmit={handleSubmit}>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>Review<textarea value={body} onChange={(e) => setBody(e.target.value)} required /></label>

        <Card className="detail-section">
          {CATEGORIES.map((c) => (
            <label key={c}>
              {c[0].toUpperCase() + c.slice(1)} ({ratings[c]}/5)
              <input
                type="range"
                min="1"
                max="5"
                value={ratings[c]}
                onChange={(e) => setRatings((prev) => ({ ...prev, [c]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </Card>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
