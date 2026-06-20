import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/vendor', label: 'Dashboard', end: true },
  { to: '/vendor/packages', label: 'Packages' },
  { to: '/vendor/bookings', label: 'Bookings' },
  { to: '/vendor/enquiries', label: 'Enquiries' },
  { to: '/vendor/reviews', label: 'Reviews' },
  { to: '/vendor/analytics', label: 'Analytics' },
  { to: '/vendor/payouts', label: 'Payouts' },
  { to: '/vendor/company', label: 'Company' },
  { to: '/vendor/notifications', label: 'Notifications' },
];

export default function VendorLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-logo">
          <span className="app-logo-dot" /> Toureez Vendor
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
