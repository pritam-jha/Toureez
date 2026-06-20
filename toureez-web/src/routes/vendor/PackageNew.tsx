import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { getCategories } from '../../lib/api/categories';
import { getLocations } from '../../lib/api/locations';
import { LoadingState, ErrorState } from '../../components/ui';

export default function PackageNew() {
  const navigate = useNavigate();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const locationsQuery = useQuery({ queryKey: ['locations', 'all'], queryFn: () => getLocations(false) });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [basePrice, setBasePrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (categoriesQuery.isLoading || locationsQuery.isLoading) return <LoadingState />;
  if (categoriesQuery.isError || locationsQuery.isError) {
    return <ErrorState message="Failed to load categories/locations" onRetry={() => { categoriesQuery.refetch(); locationsQuery.refetch(); }} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters.');
      return;
    }
    if (!categoryId || !locationId) {
      setError('Please select a category and location.');
      return;
    }

    setSubmitting(true);

    const res = await vendorApi.createPackage({
      title,
      description,
      category_id: categoryId,
      location_id: locationId,
      duration_days: durationDays,
    });

    if (res.error || !res.data) {
      setSubmitting(false);
      setError(res.error ?? 'Failed to create package.');
      return;
    }

    await vendorApi.updatePricing(res.data.id, [
      { label: 'Standard', min_people: 1, max_people: 20, base_price: basePrice, currency: 'INR' },
    ]);

    setSubmitting(false);
    navigate(`/vendor/packages/${res.data.id}`);
  }

  return (
    <div>
      <h1>New Package</h1>
      <form className="booking-form" onSubmit={handleSubmit}>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} /></label>
        <label>Description (min 20 characters)<textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categoriesQuery.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.label ?? c.name}</option>)}
          </select>
        </label>
        <label>
          Location
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
            <option value="">Select location</option>
            {locationsQuery.data?.data?.map((l) => <option key={l.id} value={l.id}>{l.city}{l.state ? `, ${l.state}` : ''}</option>)}
          </select>
        </label>
        <label>Duration (days)<input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} /></label>
        <label>Base price (₹)<input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} /></label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Package'}
        </button>
      </form>
    </div>
  );
}
