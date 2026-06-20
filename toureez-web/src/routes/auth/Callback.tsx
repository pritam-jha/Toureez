import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

const ROLE_HOME: Record<UserRole, string> = {
  traveler: '/app',
  company_owner: '/vendor',
  admin: '/admin',
};

export default function Callback() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    async function finish() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
        return;
      }
      const { data: user } = await getProfile();
      setSession(user, session);
      navigate(user ? ROLE_HOME[user.role] : '/auth/login');
    }
    void finish();
  }, [navigate, setSession]);

  return <div className="page-loading">Signing you in…</div>;
}
