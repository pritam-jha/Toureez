import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api/admin';
import { packageCoverImage, packageVendorName } from '../../lib/api/packages';
import { Card, LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

const TABS = ['all', 'active', 'pending', 'rejected', 'featured'] as const;

export default function Packages() {
  const [tab, setTab] = useState<typeof TABS[number]>('all');
  const query = useQuery({
    queryKey: ['admin', 'packages', tab],
    queryFn: () =>
      adminApi.listPackages(
        tab === 'featured' ? { isFeatured: true } : tab === 'all' ? undefined : { status: tab }
      ),
  });

  return (
    <div>
      <PageHeader title="Packages" />

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No packages found." />}

      <div className="card-grid">
        {query.data?.data?.map((pkg) => (
          <Link key={pkg.id} to={`/admin/packages/${pkg.id}`}>
            <Card className="package-card">
              {packageCoverImage(pkg) && <img src={packageCoverImage(pkg)!} alt={pkg.title} />}
              <div className="card-body">
                <strong>{pkg.title}</strong>
                <span className="muted">{packageVendorName(pkg)}</span>
                {pkg.status && <StatusBadge status={pkg.status} />}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
