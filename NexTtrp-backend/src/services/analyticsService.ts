/**
 * @file services/analyticsService.ts
 * @description Analytics aggregation for vendor and admin dashboards.
 *
 * Returns time-series and summary data used by chart components.
 */

import { supabaseAdmin } from '../lib/supabase';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { logger } from '../utils/logger';

const throwDb = (op: string, err: unknown): never => {
  logger.error({ err, op: `analyticsService.${op}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  revenue: number;
  bookings: number;
}

export interface VendorAnalytics {
  monthly_revenue: MonthlyRevenue[];
  top_packages: {
    id: string;
    title: string;
    total_bookings: number;
    total_revenue: number;
    avg_rating: number;
  }[];
  cancellation_rate: number;
  completion_rate: number;
  this_month_vs_last: {
    revenue_change_pct: number;
    bookings_change_pct: number;
  };
}

export interface AdminAnalytics {
  monthly_revenue: MonthlyRevenue[];
  user_growth: { month: string; new_users: number }[];
  top_categories: { name: string; label: string; booking_count: number }[];
  vendor_stats: { approved: number; pending: number; rejected: number };
  booking_funnel: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

function lastN(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 7);
}

// ── Vendor analytics ──────────────────────────────────────────────────────────

export async function getVendorAnalytics(companyId: string): Promise<VendorAnalytics> {
  const since = lastN(6); // 6 months of history

  // Monthly revenue + bookings for this vendor
  const { data: bookingsData, error: bookingsErr } = await supabaseAdmin
    .from('bookings')
    .select('id, total_amount, status, created_at, package_id, packages!inner(company_id)')
    .eq('packages.company_id', companyId)
    .gte('created_at', `${since}-01`)
    .order('created_at', { ascending: true });

  if (bookingsErr !== null) throwDb('getVendorAnalytics.bookings', bookingsErr);

  const rows = (bookingsData as Record<string, unknown>[] | null) ?? [];

  // Aggregate by month
  const monthMap = new Map<string, { revenue: number; bookings: number }>();
  let totalCancelled = 0;
  let totalCompleted = 0;

  rows.forEach((row) => {
    const month = String(row['created_at']).slice(0, 7);
    const amount = typeof row['total_amount'] === 'number' ? row['total_amount'] : 0;
    const status = String(row['status']);

    if (!monthMap.has(month)) monthMap.set(month, { revenue: 0, bookings: 0 });
    const entry = monthMap.get(month)!;
    entry.bookings += 1;
    if (status === 'confirmed' || status === 'completed') entry.revenue += amount;
    if (status === 'cancelled') totalCancelled++;
    if (status === 'completed') totalCompleted++;
  });

  const monthly_revenue: MonthlyRevenue[] = Array.from(monthMap.entries())
    .map(([month, v]) => ({ month, revenue: v.revenue, bookings: v.bookings }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const cancellation_rate = rows.length > 0 ? Math.round((totalCancelled / rows.length) * 100) : 0;
  const completion_rate = rows.length > 0 ? Math.round((totalCompleted / rows.length) * 100) : 0;

  // This month vs last month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = lastN(2);
  const thisMData = monthMap.get(thisMonth) ?? { revenue: 0, bookings: 0 };
  const lastMData = monthMap.get(lastMonth) ?? { revenue: 0, bookings: 0 };

  // Top packages for this vendor
  const { data: pkgData, error: pkgErr } = await supabaseAdmin
    .from('packages')
    .select('id, title, total_bookings, avg_rating')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('total_bookings', { ascending: false })
    .limit(5);

  if (pkgErr !== null) throwDb('getVendorAnalytics.packages', pkgErr);

  const top_packages = ((pkgData as Record<string, unknown>[] | null) ?? []).map((p) => ({
    id: String(p['id']),
    title: String(p['title']),
    total_bookings: typeof p['total_bookings'] === 'number' ? p['total_bookings'] : 0,
    total_revenue: 0,
    avg_rating: typeof p['avg_rating'] === 'number' ? p['avg_rating'] : 0,
  }));

  return {
    monthly_revenue,
    top_packages,
    cancellation_rate,
    completion_rate,
    this_month_vs_last: {
      revenue_change_pct: pct(thisMData.revenue, lastMData.revenue),
      bookings_change_pct: pct(thisMData.bookings, lastMData.bookings),
    },
  };
}

// ── Admin analytics ───────────────────────────────────────────────────────────

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const since = lastN(6);

  const [bookingsRes, usersRes, companiesRes, _categoriesRes] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('id, total_amount, status, created_at')
      .gte('created_at', `${since}-01`),
    supabaseAdmin
      .from('users')
      .select('id, created_at')
      .gte('created_at', `${since}-01`),
    supabaseAdmin
      .from('companies')
      .select('id, status'),
    supabaseAdmin
      .from('packages')
      .select('id, category:categories(name, label)')
      .eq('status', 'active'),
  ]);

  if (bookingsRes.error) throwDb('getAdminAnalytics.bookings', bookingsRes.error);
  if (usersRes.error) throwDb('getAdminAnalytics.users', usersRes.error);
  if (companiesRes.error) throwDb('getAdminAnalytics.companies', companiesRes.error);

  const bookings = (bookingsRes.data as Record<string, unknown>[] | null) ?? [];
  const users = (usersRes.data as Record<string, unknown>[] | null) ?? [];
  const companies = (companiesRes.data as Record<string, unknown>[] | null) ?? [];

  // Monthly revenue
  const revenueMap = new Map<string, { revenue: number; bookings: number }>();
  const funnelCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  bookings.forEach((b) => {
    const month = String(b['created_at']).slice(0, 7);
    const amount = typeof b['total_amount'] === 'number' ? b['total_amount'] : 0;
    const status = String(b['status']) as keyof typeof funnelCounts;

    if (!revenueMap.has(month)) revenueMap.set(month, { revenue: 0, bookings: 0 });
    const entry = revenueMap.get(month)!;
    entry.bookings += 1;
    if (status === 'confirmed' || status === 'completed') entry.revenue += amount;
    if (status in funnelCounts) funnelCounts[status]++;
  });

  const monthly_revenue: MonthlyRevenue[] = Array.from(revenueMap.entries())
    .map(([month, v]) => ({ month, revenue: v.revenue, bookings: v.bookings }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // User growth by month
  const userGrowthMap = new Map<string, number>();
  users.forEach((u) => {
    const month = String(u['created_at']).slice(0, 7);
    userGrowthMap.set(month, (userGrowthMap.get(month) ?? 0) + 1);
  });

  const user_growth = Array.from(userGrowthMap.entries())
    .map(([month, new_users]) => ({ month, new_users }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Vendor stats
  const vendor_stats = { approved: 0, pending: 0, rejected: 0 };
  companies.forEach((c) => {
    const status = String(c['status']) as keyof typeof vendor_stats;
    if (status in vendor_stats) vendor_stats[status]++;
  });

  // Category booking breakdown (simplified)
  const top_categories: AdminAnalytics['top_categories'] = [];

  return {
    monthly_revenue,
    user_growth,
    top_categories,
    vendor_stats,
    booking_funnel: funnelCounts,
  };
}
