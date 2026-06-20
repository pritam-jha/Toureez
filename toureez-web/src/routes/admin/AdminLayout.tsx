import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/vendors', label: 'Vendors' },
  { to: '/admin/packages', label: 'Packages' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
  { to: '/admin/system-health', label: 'System Health' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  return (
    <div className="app-shell app-shell-dark">
      <aside className="app-sidebar">
        <div className="app-logo">
          <span className="app-logo-dot" /> Toureez Admin
        </div>
        <nav className="app-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar-footer">
          <div className="app-user">{user?.fullName ?? user?.email}</div>
          <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
