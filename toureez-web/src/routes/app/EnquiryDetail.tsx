import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getEnquiryDetail, postEnquiryMessage, enquiryPackageTitle } from '../../lib/api/enquiries';
import { Card, LoadingState, ErrorState } from '../../components/ui';

export default function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['enquiry', id], queryFn: () => getEnquiryDetail(id!), enabled: !!id });
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: () => postEnquiryMessage(id!, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data?.data) return <ErrorState message="Failed to load enquiry" onRetry={() => query.refetch()} />;

  const enquiry = query.data.data;

  return (
    <div className="site-content">
      <h1>{enquiryPackageTitle(enquiry)}</h1>

      <div className="chat-thread">
        {enquiry.messages?.map((m) => (
          <Card key={m.id} className={`chat-bubble ${m.sender_role === 'user' ? 'mine' : 'theirs'}`}>
            <p>{m.message}</p>
            <span className="muted">{new Date(m.created_at).toLocaleString()}</span>
          </Card>
        ))}
      </div>

      <div className="chat-input-row">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message…" />
        <button className="btn btn-primary" disabled={sendMutation.isPending || !message} onClick={() => sendMutation.mutate()}>
          Send
        </button>
      </div>
    </div>
  );
}
