import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import { Card, PageHeader } from '../../components/ui';
import { Config } from '../../constants/config';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone, city, state })
      .eq('id', user.id);
    setSaving(false);
    if (!error) {
      setUser({ ...user, fullName, phone, city, state });
      setEditing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  return (
    <div className="site-content">
      <PageHeader title="My Profile" />

      <Card className="detail-section">
        {editing ? (
          <>
            <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label>City<input value={city} onChange={(e) => setCity(e.target.value)} /></label>
            <label>
              State
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select state</option>
                {Config.indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="detail-actions">
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Discard</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>{user?.fullName ?? '—'}</strong></p>
            <p className="muted">{user?.email}</p>
            <p className="muted">{user?.phone ?? 'No phone set'}</p>
            <p className="muted">{[user?.city, user?.state].filter(Boolean).join(', ') || 'No location set'}</p>
            <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </Card>

      <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
    </div>
  );
}
