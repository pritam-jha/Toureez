import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../lib/api/wishlist';
import { packageCoverImage, packageLocationLabel } from '../../lib/api/packages';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['wishlist'], queryFn: getWishlist });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromWishlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return (
    <div className="site-content">
      <PageHeader title="Wishlist" />

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load wishlist" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && (
        <EmptyState message="Your wishlist is empty." action={<Link className="btn btn-primary" to="/app/search">Browse packages</Link>} />
      )}

      <div className="card-grid">
        {query.data?.data?.map((pkg) => (
          <Card key={pkg.id} className="package-card">
            <Link to={`/app/package/${pkg.id}`}>
              {packageCoverImage(pkg) && <img src={packageCoverImage(pkg)!} alt={pkg.title} />}
              <div className="card-body">
                <strong>{pkg.title}</strong>
                <span className="muted">{packageLocationLabel(pkg)}</span>
              </div>
            </Link>
            <button className="btn btn-outline" onClick={() => removeMutation.mutate(pkg.id)}>Remove</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
