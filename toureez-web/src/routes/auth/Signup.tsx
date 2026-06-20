import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data: user, error: signUpError } = await signUp(email, password, fullName, phone, city, state);
    setLoading(false);

    if (signUpError || !user) {
      setError(signUpError ?? 'Sign up failed.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    setSession(user, session);

    const redirect = params.get('redirect');
    navigate(redirect ? decodeURIComponent(redirect) : '/app');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-sub">Join Toureez and start exploring</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </label>
          <div className="auth-form-row">
            <label>
              City
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label>
              State
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select state</option>
                {Config.indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          <Link to={`/auth/login${params.get('redirect') ? `?redirect=${params.get('redirect')}` : ''}`}>Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
}
