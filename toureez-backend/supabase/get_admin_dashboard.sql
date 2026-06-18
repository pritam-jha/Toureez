-- =============================================================
-- Run this once in the Supabase SQL Editor to create the RPC
-- that replaces the 13-query Promise.all in getAdminDashboard().
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER        -- runs as the DB owner so no RLS interference
SET search_path = public
AS $$
DECLARE
  v_month_start  timestamptz := date_trunc('month', now());
  v_result       jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users',            (SELECT COUNT(*)          FROM users),
    'new_users_this_month',   (SELECT COUNT(*)          FROM users        WHERE created_at >= v_month_start),
    'total_vendors',          (SELECT COUNT(*)          FROM companies),
    'pending_vendors',        (SELECT COUNT(*)          FROM companies    WHERE status = 'pending'),
    'total_packages',         (SELECT COUNT(*)          FROM packages),
    'pending_packages',       (SELECT COUNT(*)          FROM packages     WHERE status = 'pending'),
    'active_packages',        (SELECT COUNT(*)          FROM packages     WHERE status = 'active'),
    'total_bookings',         (SELECT COUNT(*)          FROM bookings),
    'bookings_this_month',    (SELECT COUNT(*)          FROM bookings     WHERE created_at >= v_month_start),
    'total_revenue',          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid'),
    'revenue_this_month',     (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid' AND created_at >= v_month_start),
    'pending_reviews',        (SELECT COUNT(*)          FROM reviews      WHERE is_published = false),
    'pending_payouts',        (SELECT COUNT(*)          FROM vendor_payouts WHERE status = 'pending')
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to the service-role used by supabaseAdmin
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO service_role;
