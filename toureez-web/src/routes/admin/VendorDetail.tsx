import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'vendor', id], queryFn: () => adminApi.getVendor(id!), enabled: !!id });
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'vendor', id] });
  const approveMutation = useMutation({ mutationFn: () => adminApi.approveVendor(id!), onSuccess: invalidate });
  const rejectMutation = useMutation({ mutationFn: () => adminApi.rejectVendor(id!, rejectReason), onSuccess: invalidate });
  const verifyMutation = useMutation({ mutationFn: () => adminApi.verifyVendor(id!), onSuccess: invalidate });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load vendor" onRetry={() => query.refetch()} />;

  const vendor = query.data.data;

  return (
    <div>
      <h1>{vendor.name}</h1>
      <StatusBadge status={vendor.status} />

      <Card className="detail-section">
        <p>Owner: {vendor.owner?.full_name ?? '—'} ({vendor.owner?.email})</p>
        {vendor.owner?.phone && <p className="muted">{vendor.owner.phone}</p>}
        <p className="muted">Verified: {vendor.is_verified ? 'Yes' : 'No'}</p>
        <p className="muted">Rating: {vendor.avg_rating} ({vendor.total_reviews} reviews) · {vendor.total_packages} packages</p>
        {vendor.about && <p>{vendor.about}</p>}
      </Card>

      <div className="detail-actions">
        <button className="btn btn-primary" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</button>
        <button className="btn btn-outline" disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>Verify</button>
      </div>

      <Card className="detail-section">
        <label>Rejection reason<input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></label>
        <button className="btn btn-outline" disabled={rejectMutation.isPending || !rejectReason} onClick={() => rejectMutation.mutate()}>
          Reject Vendor
        </button>
      </Card>
    </div>
  );
}
