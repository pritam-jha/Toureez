import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { createEnquiry, listEnquiries, enquiryPackageTitle } from '../../lib/api/enquiries';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Enquiries() {
  const [params] = useSearchParams();
  const prefillPackage = params.get('package') ?? '';
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['enquiries'], queryFn: listEnquiries });

  const [packageId, setPackageId] = useState(prefillPackage);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(!!prefillPackage);

  const createMutation = useMutation({
    mutationFn: () => createEnquiry(packageId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setMessage('');
      setShowForm(false);
    },
  });

  return (
    <div className="site-content">
      <PageHeader
        title="Enquiries"
        actions={<button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>New Enquiry</button>}
      />

      {showForm && (
        <Card className="detail-section">
          <label>Package ID<input value={packageId} onChange={(e) => setPackageId(e.target.value)} /></label>
          <label>Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <button className="btn btn-primary" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Sending…' : 'Send Enquiry'}
          </button>
        </Card>
      )}

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load enquiries" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No enquiries yet." />}

      {query.data?.data?.map((eq) => (
        <Link key={eq.id} to={`/app/enquiries/${eq.id}`}>
          <Card className="list-card">
            <div>
              <strong>{enquiryPackageTitle(eq)}</strong>
              <p className="muted">{eq.last_message_preview}</p>
            </div>
            <span className="muted">{eq.status}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
