import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getPackagesForCompare, packageLocationLabel, packagePrice } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';
import { Config } from '../../constants/config';

export default function Compare() {
  const [params] = useSearchParams();
  const prefillIds = params.get('ids')?.split(',').filter(Boolean) ?? [];
  const [ids, setIds] = useState<string[]>(prefillIds);
  const [inputId, setInputId] = useState('');

  const query = useQuery({
    queryKey: ['packages', 'compare', ids],
    queryFn: () => getPackagesForCompare(ids),
    enabled: ids.length > 0,
  });

  function addId() {
    if (inputId && ids.length < Config.maxCompareItems && !ids.includes(inputId)) {
      setIds((prev) => [...prev, inputId]);
      setInputId('');
    }
  }

  return (
    <div className="site-content">
      <PageHeader title="Compare Packages" subtitle={`Add up to ${Config.maxCompareItems} packages to compare`} />

      <div className="search-filters">
        <input placeholder="Package ID" value={inputId} onChange={(e) => setInputId(e.target.value)} />
        <button className="btn btn-primary" onClick={addId} disabled={ids.length >= Config.maxCompareItems}>Add</button>
      </div>

      {ids.length === 0 && <EmptyState message="Add packages from search results to compare them here." />}

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}

      {query.data?.data && query.data.data.length > 0 && (
        <table className="compare-table">
          <thead>
            <tr>
              <th>Field</th>
              {query.data.data.map((p) => (
                <th key={p.id}>
                  <Link to={`/app/package/${p.id}`}>{p.title}</Link>
                  <button className="btn btn-outline" onClick={() => setIds((prev) => prev.filter((i) => i !== p.id))}>Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><td>Price</td>{query.data.data.map((p) => <td key={p.id}>₹{packagePrice(p)}</td>)}</tr>
            <tr><td>Duration</td>{query.data.data.map((p) => <td key={p.id}>{p.duration_days} days</td>)}</tr>
            <tr><td>Rating</td>{query.data.data.map((p) => <td key={p.id}>★ {p.avg_rating}</td>)}</tr>
            <tr><td>Location</td>{query.data.data.map((p) => <td key={p.id}>{packageLocationLabel(p)}</td>)}</tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
