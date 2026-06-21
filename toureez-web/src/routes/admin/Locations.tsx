import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Locations() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'locations'], queryFn: adminApi.listLocations });
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [region, setRegion] = useState('North India');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createLocation({ city, state, region }),
    onSuccess: () => { setCity(''); setState(''); setRegion(''); invalidate(); },
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => adminApi.deleteLocation(id), onSuccess: invalidate });
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => adminApi.updateLocation(id, { is_popular: value }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader title="Locations" />

      <div className="search-filters">
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="North India">North India</option>
          <option value="South India">South India</option>
          <option value="East India">East India</option>
          <option value="West India">West India</option>
          <option value="Central India">Central India</option>
        </select>
        <button className="btn btn-primary" disabled={createMutation.isPending || !city || !state || !region} onClick={() => createMutation.mutate()}>
          Add Location
        </button>
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load locations" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No locations yet." />}

      {query.data?.data?.map((l) => (
        <Card key={l.id} className="list-card">
          <div>
            <strong>{l.city}</strong>
            <span className="muted"> {l.state} · {l.region}</span>
          </div>
          <div className="detail-actions">
            <button
              className="btn btn-outline"
              onClick={() => toggleFeaturedMutation.mutate({ id: l.id, value: !l.is_popular })}
            >
              {l.is_popular ? 'Unfeature' : 'Feature'}
            </button>
            <button className="btn btn-outline" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(l.id)}>
              Delete
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
