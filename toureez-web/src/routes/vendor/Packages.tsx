import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api/vendor';
import { packageCoverImage, packagePrice } from '../../lib/api/packages';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const STATUSES = ['all', 'active', 'pending', 'draft', 'rejected'] as const;

export default function Packages() {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['vendor', 'packages', status],
    queryFn: () => vendorApi.listPackages(status === 'all' ? undefined : status),
  });

  const filtered = query.data?.data?.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Packages" actions={<Link className="btn btn-primary" to="/vendor/packages/new">+ New Package</Link>} />

      <div className="search-filters">
        <input placeholder="Search packages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="tab-row">
        {STATUSES.map((s) => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
      {filtered && filtered.length === 0 && <EmptyState message="No packages found." />}

      <div className="card-grid">
        {filtered?.map((pkg) => (
          <Link key={pkg.id} to={`/vendor/packages/${pkg.id}`}>
            <Card className="package-card">
              {packageCoverImage(pkg) && <img src={packageCoverImage(pkg)!} alt={pkg.title} />}
              <div className="card-body">
                <strong>{pkg.title}</strong>
                {pkg.status && <StatusBadge status={pkg.status} />}
                {packagePrice(pkg) !== undefined && <span className="price">₹{packagePrice(pkg)}</span>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
