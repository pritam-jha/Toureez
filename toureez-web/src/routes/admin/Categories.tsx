import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api/admin';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Categories() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.listCategories });
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  const createMutation = useMutation({
    mutationFn: () => adminApi.createCategory({ name, label, icon }),
    onSuccess: () => { setName(''); setLabel(''); setIcon(''); invalidate(); },
  });
  const deleteMutation = useMutation({ mutationFn: (id: string) => adminApi.deleteCategory(id), onSuccess: invalidate });

  return (
    <div>
      <PageHeader title="Categories" />

      <div className="search-filters">
        <input placeholder="Name (slug, e.g. adventure)" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Label (display name)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input placeholder="Icon (e.g. mountain)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <button className="btn btn-primary" disabled={createMutation.isPending || !name || !label || !icon} onClick={() => createMutation.mutate()}>
          Add Category
        </button>
      </div>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState message="Failed to load categories" onRetry={() => query.refetch()} />}
      {query.data?.data && query.data.data.length === 0 && <EmptyState message="No categories yet." />}

      {query.data?.data?.map((c) => (
        <Card key={c.id} className="list-card">
          <div>
            <strong>{c.label ?? c.name}</strong>
            <p className="muted">{c.name}</p>
          </div>
          <button className="btn btn-outline" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(c.id)}>
            Delete
          </button>
        </Card>
      ))}
    </div>
  );
}
