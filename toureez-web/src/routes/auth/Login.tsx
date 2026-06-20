import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

const ROLE_HOME: Record<UserRole, string> = {
  traveler: '/app',
  company_owner: '/vendor',
  admin: '/admin',
};

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: user, error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError || !user) {
      setError(signInError ?? 'Login failed.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    setSession(user, session);
    navigate(ROLE_HOME[user.role]);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to your Toureez account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-outline auth-google"
          onClick={() => void signInWithGoogle()}
        >
          Continue with Google
        </button>

        <div className="auth-links">
          <Link to="/auth/forgot-password">Forgot password?</Link>
          <span>·</span>
          <Link to="/auth/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
