import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { enquiryPackageTitle } from '../../lib/api/enquiries';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Enquiries() {
  const query = useQuery({ queryKey: ['vendor', 'enquiries'], queryFn: vendorApi.listEnquiries });

  return (
    <div>
      <PageHeader title="Enquiries" />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load enquiries" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No enquiries yet." />}

      {query.data?.data?.map((eq) => (
        <Link key={eq.id} to={`/vendor/enquiries/${eq.id}`}>
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
