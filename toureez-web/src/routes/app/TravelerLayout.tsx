import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/search', label: 'Search' },
  { to: '/app/bookings', label: 'Bookings' },
  { to: '/app/wishlist', label: 'Wishlist' },
  { to: '/app/compare', label: 'Compare' },
  { to: '/app/enquiries', label: 'Enquiries' },
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/notifications', label: 'Notifications' },
];

export default function TravelerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    clearUser();
    navigate('/auth/login');
  }

  const loginHref = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/app" className="site-logo">
            <span className="app-logo-dot" /> Toureez
          </NavLink>
          <nav className="site-nav-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-actions">
            {user ? (
              <>
                <NavLink to="/app/profile" className="btn btn-outline btn-pill site-actions-profile">{user.fullName ?? 'Profile'}</NavLink>
                <button className="btn btn-primary btn-pill" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to={loginHref} className="btn btn-outline btn-pill">Log In</NavLink>
                <NavLink to={`/auth/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="btn btn-primary btn-pill">
                  Sign Up
                </NavLink>
              </>
            )}
            <button className="hamburger-btn" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <Outlet />
    </div>
  );
}
