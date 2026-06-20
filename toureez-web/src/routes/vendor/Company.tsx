import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { Card, LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Company() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'company'], queryFn: vendorApi.getCompany });
  const accountsQuery = useQuery({ queryKey: ['vendor', 'payout-accounts'], queryFn: vendorApi.listPayoutAccounts });

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [gst, setGst] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (query.data?.data && !initialized) {
    setName(query.data.data.name ?? '');
    setAbout(query.data.data.about ?? '');
    setGst(query.data.data.gst_number ?? '');
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name, about, gst_number: gst || undefined };
      return query.data?.data ? vendorApi.updateCompany(payload) : vendorApi.createCompany(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'company'] }),
  });

  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const addAccountMutation = useMutation({
    mutationFn: () =>
      vendorApi.addPayoutAccount({
        account_holder_name: accountHolder,
        bank_name: bankName || undefined,
        account_number: accountNumber || undefined,
        ifsc_code: ifsc || undefined,
      }),
    onSuccess: () => {
      setAccountHolder('');
      setBankName('');
      setAccountNumber('');
      setIfsc('');
      queryClient.invalidateQueries({ queryKey: ['vendor', 'payout-accounts'] });
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError && query.error) return <ErrorState message="Failed to load company profile" onRetry={() => query.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle={query.data?.data?.status ? `Status: ${query.data.data.status}${query.data.data.is_verified ? ' · Verified' : ''}` : 'Complete onboarding to start listing packages'}
      />

      <Card className="detail-section">
        <label>Company name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>About (min 10 characters)<textarea value={about} onChange={(e) => setAbout(e.target.value)} /></label>
        <label>GST number<input value={gst} onChange={(e) => setGst(e.target.value)} /></label>

        <button className="btn btn-primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Saving…' : 'Save Company Profile'}
        </button>
      </Card>

      <section className="home-section">
        <h2>Payout Accounts</h2>
        {accountsQuery.data?.data && accountsQuery.data.data.length === 0 && <EmptyState message="No payout accounts on file." />}
        {accountsQuery.data?.data?.map((acc) => (
          <Card key={acc.id} className="list-card">
            <div>
              <strong>{acc.account_holder_name}</strong>
              <p className="muted">{acc.bank_name ?? acc.upi_id ?? '—'} {acc.account_number ? `··· ${acc.account_number.slice(-4)}` : ''}</p>
            </div>
            {acc.is_primary && <span className="muted">Primary</span>}
          </Card>
        ))}

        <Card className="detail-section">
          <label>Account holder name<input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required /></label>
          <label>Bank name<input value={bankName} onChange={(e) => setBankName(e.target.value)} /></label>
          <label>Account number<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></label>
          <label>IFSC code<input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" /></label>
          <button className="btn btn-outline" disabled={addAccountMutation.isPending || !accountHolder} onClick={() => addAccountMutation.mutate()}>
            {addAccountMutation.isPending ? 'Adding…' : 'Add Payout Account'}
          </button>
        </Card>
      </section>
    </div>
  );
}
