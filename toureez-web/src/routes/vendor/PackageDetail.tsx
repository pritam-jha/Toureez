import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { packagePrice } from '../../lib/api/packages';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'package', id], queryFn: () => vendorApi.getPackage(id!), enabled: !!id });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [initialized, setInitialized] = useState(false);

  if (query.data?.data && !initialized) {
    setTitle(query.data.data.title);
    setDescription(query.data.data.description ?? '');
    setBasePrice(packagePrice(query.data.data) ?? 0);
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const result = await vendorApi.updatePackage(id!, { title, description });
      await vendorApi.updatePricing(id!, [
        { label: 'Standard', min_people: 1, max_people: 20, base_price: basePrice, currency: 'INR' },
      ]);
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'package', id] }),
  });

  const submitMutation = useMutation({
    mutationFn: () => vendorApi.submitPackage(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'package', id] }),
  });

  const duplicateMutation = useMutation({ mutationFn: () => vendorApi.duplicatePackage(id!) });
  const deleteMutation = useMutation({ mutationFn: () => vendorApi.deletePackage(id!) });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load package" onRetry={() => query.refetch()} />;

  const pkg = query.data.data;

  return (
    <div>
      <div className="detail-header">
        <h1>{pkg.title}</h1>
        {pkg.status && <StatusBadge status={pkg.status} />}
      </div>

      <Card className="detail-section">
        <h2>General Info</h2>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label>Base price (₹)<input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} /></label>
        <button className="btn btn-primary" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </Card>

      <div className="detail-actions">
        {pkg.status === 'draft' && (
          <button className="btn btn-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
            Submit for Approval
          </button>
        )}
        <button className="btn btn-outline" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
          Duplicate
        </button>
        {pkg.status === 'draft' && (
          <button className="btn btn-outline" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
