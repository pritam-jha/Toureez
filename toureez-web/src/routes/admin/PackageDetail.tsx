import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { packagePrice, packageVendorName } from '../../lib/api/packages';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'package', id], queryFn: () => adminApi.getPackage(id!), enabled: !!id });
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'package', id] });
  const approveMutation = useMutation({ mutationFn: () => adminApi.approvePackage(id!), onSuccess: invalidate });
  const rejectMutation = useMutation({ mutationFn: () => adminApi.rejectPackage(id!, rejectReason), onSuccess: invalidate });
  const featureMutation = useMutation({ mutationFn: (v: boolean) => adminApi.featurePackage(id!, v), onSuccess: invalidate });
  const bestsellerMutation = useMutation({ mutationFn: (v: boolean) => adminApi.bestsellerPackage(id!, v), onSuccess: invalidate });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load package" onRetry={() => query.refetch()} />;

  const pkg = query.data.data;

  return (
    <div>
      <h1>{pkg.title}</h1>
      {pkg.status && <StatusBadge status={pkg.status} />}

      <Card className="detail-section">
        <p>{pkg.description}</p>
        <p className="muted">Vendor: {packageVendorName(pkg)}</p>
        <p className="muted">Price: ₹{packagePrice(pkg)}</p>
      </Card>

      <div className="detail-actions">
        <button className="btn btn-primary" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</button>
        <button className="btn btn-outline" disabled={featureMutation.isPending} onClick={() => featureMutation.mutate(!pkg.is_featured)}>
          {pkg.is_featured ? 'Unfeature' : 'Feature'}
        </button>
        <button className="btn btn-outline" disabled={bestsellerMutation.isPending} onClick={() => bestsellerMutation.mutate(true)}>
          Mark Bestseller
        </button>
      </div>

      <Card className="detail-section">
        <label>Rejection reason<input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></label>
        <button className="btn btn-outline" disabled={rejectMutation.isPending || !rejectReason} onClick={() => rejectMutation.mutate()}>
          Reject Package
        </button>
      </Card>
    </div>
  );
}
