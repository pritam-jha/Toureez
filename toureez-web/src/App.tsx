import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { getProfile } from './lib/api/auth';
import { useAuthStore } from './store/authStore';
import { RequireRole } from './components/RequireRole';
import { Config } from './constants/config';

import Login from './routes/auth/Login';
import Signup from './routes/auth/Signup';
import ForgotPassword from './routes/auth/ForgotPassword';
import ResetPassword from './routes/auth/ResetPassword';
import Callback from './routes/auth/Callback';

import TravelerLayout from './routes/app/TravelerLayout';
import Home from './routes/app/Home';
import Search from './routes/app/Search';
import PackageDetail from './routes/app/PackageDetail';
import Bookings from './routes/app/Bookings';
import Wishlist from './routes/app/Wishlist';
import Profile from './routes/app/Profile';
import Compare from './routes/app/Compare';
import Enquiries from './routes/app/Enquiries';
import EnquiryDetail from './routes/app/EnquiryDetail';
import NotificationsScreen from './routes/app/Notifications';
import Chat from './routes/app/Chat';
import BookingFlow from './routes/app/BookingFlow';
import BookingDetail from './routes/app/BookingDetail';
import ReviewForm from './routes/app/ReviewForm';

import VendorLayout from './routes/vendor/VendorLayout';
import VendorDashboard from './routes/vendor/Dashboard';
import VendorPackages from './routes/vendor/Packages';
import VendorPackageDetail from './routes/vendor/PackageDetail';
import VendorPackageNew from './routes/vendor/PackageNew';
import VendorBookings from './routes/vendor/Bookings';
import VendorBookingDetail from './routes/vendor/BookingDetail';
import VendorCompany from './routes/vendor/Company';
import VendorPayouts from './routes/vendor/Payouts';
import VendorReviews from './routes/vendor/Reviews';
import VendorEnquiries from './routes/vendor/Enquiries';
import VendorEnquiryDetail from './routes/vendor/EnquiryDetail';
import VendorAnalytics from './routes/vendor/Analytics';
import VendorNotifications from './routes/vendor/Notifications';

import AdminLayout from './routes/admin/AdminLayout';
import AdminDashboard from './routes/admin/Dashboard';
import AdminUsers from './routes/admin/Users';
import AdminUserDetail from './routes/admin/UserDetail';
import AdminVendors from './routes/admin/Vendors';
import AdminVendorDetail from './routes/admin/VendorDetail';
import AdminPackages from './routes/admin/Packages';
import AdminPackageDetail from './routes/admin/PackageDetail';
import AdminBookings from './routes/admin/Bookings';
import AdminBookingDetail from './routes/admin/BookingDetail';
import AdminReviews from './routes/admin/Reviews';
import AdminCategories from './routes/admin/Categories';
import AdminLocations from './routes/admin/Locations';
import AdminPayouts from './routes/admin/Payouts';
import AdminAuditLogs from './routes/admin/AuditLogs';
import AdminSystemHealth from './routes/admin/SystemHealth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Config.queryStaleTimeMs,
      gcTime: Config.queryCacheTimeMs,
      retry: 1,
    },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await getProfile();
        setSession(user, session);
      }
      setLoading(false);
      setReady(true);
    }
    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        useAuthStore.getState().clearUser();
        return;
      }
      void getProfile().then(({ data: user }) => setSession(user, session));
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession, setLoading]);

  if (!ready) return <div className="page-loading">Loading Toureez…</div>;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />

            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<Callback />} />

            <Route path="/app" element={<TravelerLayout />}>
              {/* Public — browsable without logging in */}
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="package/:id" element={<PackageDetail />} />
              <Route path="compare" element={<Compare />} />

              {/* Requires login */}
              <Route path="bookings" element={<RequireRole roles={['traveler']}><Bookings /></RequireRole>} />
              <Route path="bookings/:id" element={<RequireRole roles={['traveler']}><BookingDetail /></RequireRole>} />
              <Route path="booking/:packageId" element={<RequireRole roles={['traveler']}><BookingFlow /></RequireRole>} />
              <Route path="wishlist" element={<RequireRole roles={['traveler']}><Wishlist /></RequireRole>} />
              <Route path="enquiries" element={<RequireRole roles={['traveler']}><Enquiries /></RequireRole>} />
              <Route path="enquiries/:id" element={<RequireRole roles={['traveler']}><EnquiryDetail /></RequireRole>} />
              <Route path="notifications" element={<RequireRole roles={['traveler']}><NotificationsScreen /></RequireRole>} />
              <Route path="chat" element={<RequireRole roles={['traveler']}><Chat /></RequireRole>} />
              <Route path="profile" element={<RequireRole roles={['traveler']}><Profile /></RequireRole>} />
              <Route path="review/:bookingId" element={<RequireRole roles={['traveler']}><ReviewForm /></RequireRole>} />
            </Route>

            <Route
              path="/vendor"
              element={
                <RequireRole roles={['company_owner']}>
                  <VendorLayout />
                </RequireRole>
              }
            >
              <Route index element={<VendorDashboard />} />
              <Route path="packages" element={<VendorPackages />} />
              <Route path="packages/new" element={<VendorPackageNew />} />
              <Route path="packages/:id" element={<VendorPackageDetail />} />
              <Route path="bookings" element={<VendorBookings />} />
              <Route path="bookings/:id" element={<VendorBookingDetail />} />
              <Route path="company" element={<VendorCompany />} />
              <Route path="payouts" element={<VendorPayouts />} />
              <Route path="reviews" element={<VendorReviews />} />
              <Route path="enquiries" element={<VendorEnquiries />} />
              <Route path="enquiries/:id" element={<VendorEnquiryDetail />} />
              <Route path="analytics" element={<VendorAnalytics />} />
              <Route path="notifications" element={<VendorNotifications />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireRole roles={['admin']}>
                  <AdminLayout />
                </RequireRole>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="vendors/:id" element={<AdminVendorDetail />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="packages/:id" element={<AdminPackageDetail />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="bookings/:id" element={<AdminBookingDetail />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="locations" element={<AdminLocations />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="system-health" element={<AdminSystemHealth />} />
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
