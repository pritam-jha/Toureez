import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { enquiryPackageTitle } from '../../lib/api/enquiries';
import { Card, LoadingState, ErrorState } from '../../components/ui';

export default function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'enquiry', id], queryFn: () => vendorApi.getEnquiry(id!), enabled: !!id });
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: () => vendorApi.postEnquiryMessage(id!, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['vendor', 'enquiry', id] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => vendorApi.updateEnquiryStatus(id!, 'closed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'enquiry', id] }),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load enquiry" onRetry={() => query.refetch()} />;

  const enquiry = query.data.data;

  return (
    <div>
      <div className="detail-header">
        <h1>{enquiryPackageTitle(enquiry)}</h1>
        {enquiry.status !== 'closed' && (
          <button className="btn btn-outline" onClick={() => resolveMutation.mutate()}>Mark Resolved</button>
        )}
      </div>

      <div className="chat-thread">
        {enquiry.messages?.map((m) => (
          <Card key={m.id} className={`chat-bubble ${m.sender_role === 'vendor' ? 'mine' : 'theirs'}`}>
            <p>{m.message}</p>
            <span className="muted">{new Date(m.created_at).toLocaleString()}</span>
          </Card>
        ))}
      </div>

      <div className="chat-input-row">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reply to traveler…" />
        <button className="btn btn-primary" disabled={sendMutation.isPending || !message} onClick={() => sendMutation.mutate()}>
          Send
        </button>
      </div>
    </div>
  );
}
