import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getPackageDetail, packagePrice, packagePricingId } from '../../lib/api/packages';
import { createBooking, createRazorpayOrder, verifyRazorpayPayment, type TravelerDetail } from '../../lib/api/bookings';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { LoadingState, ErrorState, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

const emptyTraveler: TravelerDetail = { name: '', age: 18, gender: 'male', id_type: 'aadhaar', id_number: '', is_primary: false };

function tomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingFlow() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const packageQuery = useQuery({
    queryKey: ['package', packageId],
    queryFn: () => getPackageDetail(packageId!),
    enabled: !!packageId,
  });

  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details');
  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
  const [travelDate, setTravelDate] = useState(tomorrowDateString());
  const [travelers, setTravelers] = useState<TravelerDetail[]>([{ ...emptyTraveler, is_primary: true }]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (packageQuery.isLoading) return <LoadingState />;
  if (packageQuery.isError || !packageQuery.data?.data) {
    return <ErrorState message="Failed to load package" onRetry={() => packageQuery.refetch()} />;
  }

  const pkg = packageQuery.data.data;
  const pricingId = packagePricingId(pkg);
  const total = (packagePrice(pkg) ?? 0) * travelers.length;

  function updateTraveler(index: number, field: keyof TravelerDetail, value: string | number | boolean) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pricingId) {
      setError('This package has no active pricing tier and cannot be booked yet.');
      return;
    }

    setSubmitting(true);

    const res = await createBooking({
      package_id: pkg.id,
      pricing_id: pricingId,
      travel_date: travelDate,
      num_travelers: travelers.length,
      traveler_details: travelers,
      payment_type: paymentType,
      primary_contact: {
        full_name: contactName,
        email: contactEmail,
        phone: contactPhone,
        city,
        state,
      },
    });

    setSubmitting(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to create booking.');
      return;
    }

    setBookingId(res.data.booking.id);
    setStep('payment');
  }

  async function handleRazorpayPayment() {
    if (!bookingId) return;
    setError(null);
    setSubmitting(true);

    const orderRes = await createRazorpayOrder(bookingId);
    if (orderRes.error || !orderRes.data) {
      setSubmitting(false);
      setError(orderRes.error ?? 'Failed to start payment.');
      return;
    }

    const order = orderRes.data;

    try {
      await openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Toureez',
        description: pkg.title,
        prefill: { name: contactName, email: contactEmail, contact: contactPhone },
        theme: { color: '#E8631A' },
        handler: (response) => {
          void (async () => {
            const verifyRes = await verifyRazorpayPayment({
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSubmitting(false);
            if (verifyRes.error) {
              setError(verifyRes.error);
              return;
            }
            setStep('confirmed');
          })();
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
    } catch {
      setSubmitting(false);
      setError('Could not load the payment gateway. Check your connection and try again.');
    }
  }

  return (
    <div className="site-content">
      <h1>Book: {pkg.title}</h1>

      {step === 'details' && (
        <form className="booking-form" onSubmit={handleDetailsSubmit}>
          <Card className="price-card">Total: ₹{total} for {travelers.length} traveler(s)</Card>

          <h2>Contact Details</h2>
          <label>Full name<input value={contactName} onChange={(e) => setContactName(e.target.value)} required /></label>
          <label>Email<input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required /></label>
          <label>Phone (10-digit Indian mobile)<input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required /></label>
          <div className="auth-form-row">
            <label>City<input value={city} onChange={(e) => setCity(e.target.value)} required /></label>
            <label>
              State
              <select value={state} onChange={(e) => setState(e.target.value)} required>
                <option value="">Select state</option>
                {Config.indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label>Travel date<input type="date" min={tomorrowDateString()} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} required /></label>
          <label>
            Payment type
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'full' | 'advance')}>
              <option value="full">Pay in full</option>
              <option value="advance">Pay advance now, balance later</option>
            </select>
          </label>

          <h2>Travelers</h2>
          {travelers.map((t, i) => (
            <Card key={i} className="traveler-card">
              <label>Name<input value={t.name} onChange={(e) => updateTraveler(i, 'name', e.target.value)} required /></label>
              <label>Age<input type="number" value={t.age} onChange={(e) => updateTraveler(i, 'age', Number(e.target.value))} required /></label>
              <label>
                Gender
                <select value={t.gender} onChange={(e) => updateTraveler(i, 'gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                ID type
                <select value={t.id_type} onChange={(e) => updateTraveler(i, 'id_type', e.target.value)}>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </label>
              <label>ID number<input value={t.id_number} onChange={(e) => updateTraveler(i, 'id_number', e.target.value)} required /></label>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={t.is_primary}
                  onChange={() => setTravelers((prev) => prev.map((tr, idx) => ({ ...tr, is_primary: idx === i })))}
                />
                Primary traveler
              </label>
              {travelers.length > 1 && (
                <button type="button" className="btn btn-outline" onClick={() => setTravelers((prev) => prev.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </Card>
          ))}
          <button type="button" className="btn btn-outline" onClick={() => setTravelers((prev) => [...prev, { ...emptyTraveler }])}>
            + Add Traveler
          </button>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating booking…' : 'Continue to Payment'}
          </button>
        </form>
      )}

      {step === 'payment' && (
        <div>
          <Card className="price-card">Pay ₹{total} to confirm your booking</Card>
          {error && <div className="auth-error">{error}</div>}
          <div className="detail-actions">
            <button className="btn btn-primary" disabled={submitting} onClick={handleRazorpayPayment}>
              {submitting ? 'Processing…' : 'Pay with Razorpay'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="state-block">
          <h2>Booking Confirmed!</h2>
          <button className="btn btn-primary" onClick={() => navigate(`/app/bookings/${bookingId}`)}>View Booking</button>
        </div>
      )}
    </div>
  );
}
