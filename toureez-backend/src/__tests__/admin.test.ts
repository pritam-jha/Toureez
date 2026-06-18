/**
 * @file src/__tests__/admin.test.ts
 * @description Integration tests for the admin API routes.
 *
 * supabaseAdmin and supabasePublic are fully mocked — no real network calls.
 * The key design rule: mockAuthAsAdmin() adds ONE mockReturnValueOnce to the
 * supabaseAdmin.from() queue (for the auth-middleware role-lookup).  Each
 * test then appends its own mockReturnValueOnce calls for service-layer DB
 * calls.  The calls are consumed in order of registration, so the queues
 * compose cleanly.
 */

// ── Environment stubs (must come before any module imports) ──────────────────
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent'; // suppress pino output during tests

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockSupabaseAdmin = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(),
    admin: {
      getUserById: jest.fn(),
    },
  },
};

const mockSupabasePublic = {
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('../lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  supabasePublic: mockSupabasePublic,
}));

// ── Types and imports ─────────────────────────────────────────────────────────

import request from 'supertest';
import { app } from '../app';

// ── Constants ─────────────────────────────────────────────────────────────────

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000002';
const PACKAGE_ID = '00000000-0000-0000-0000-000000000010';
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000099';
const ADMIN_TOKEN = 'fake-admin-jwt';
const NON_ADMIN_TOKEN = 'fake-traveler-jwt';

// ── Query-builder factory ─────────────────────────────────────────────────────
// Returns a chainable object where every method returns itself (fluent API).

function qb(overrides: Record<string, jest.Mock> = {}): Record<string, jest.Mock> {
  const base: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    ilike: jest.fn(),
    in: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    ...overrides,
  };
  // Make every method return `this` by default (chainable).
  for (const key of Object.keys(base)) {
    if (!overrides[key]) {
      base[key]!.mockReturnValue(base);
    }
  }
  return base;
}

// Shorthand: a query builder whose maybeSingle() resolves with given data.
function qbMaybe(data: unknown): Record<string, jest.Mock> {
  const builder = qb();
  builder['maybeSingle']!.mockResolvedValue({ data, error: null });
  return builder;
}

// Shorthand: a query builder whose single() resolves with given data.
function qbSingle(data: unknown): Record<string, jest.Mock> {
  const builder = qb();
  builder['single']!.mockResolvedValue({ data, error: null });
  return builder;
}

// Shorthand: a query builder for COUNT queries (no data, just count field).
function qbCount(count: number): Record<string, jest.Mock> {
  const builder = qb();
  // PostgREST count queries resolve directly from the chain (eq returns the final promise).
  const result = Promise.resolve({ count, error: null });
  builder['eq']!.mockReturnValue(result);
  return builder;
}

// Shorthand: a query builder for INSERT operations.
function qbInsert(error: unknown = null): Record<string, jest.Mock> {
  const builder = qb();
  builder['insert']!.mockResolvedValue({ error });
  return builder;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Sets up the public-auth mock to return ADMIN_ID user,
 * and enqueues ONE from() response for the role lookup (returns 'admin').
 * Any subsequent from() calls must be enqueued by the test itself.
 */
function mockAuthAsAdmin(): void {
  mockSupabasePublic.auth.getUser.mockResolvedValue({
    data: { user: { id: ADMIN_ID, email: 'admin@test.com' } },
    error: null,
  });
  // The auth middleware's fetchDatabaseRole() calls:
  //   supabaseAdmin.from('users').select('role').eq(ADMIN_ID).maybeSingle()
  mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe({ role: 'admin' }));
}

/**
 * Sets up the public-auth mock to return OTHER_USER_ID traveler user,
 * and enqueues ONE from() response for the role lookup (returns 'traveler').
 */
function mockAuthAsTraveler(): void {
  mockSupabasePublic.auth.getUser.mockResolvedValue({
    data: { user: { id: OTHER_USER_ID, email: 'user@test.com' } },
    error: null,
  });
  mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe({ role: 'traveler' }));
}

// ── Shared sample data ────────────────────────────────────────────────────────

const samplePackageRow = {
  id: PACKAGE_ID,
  company_id: '00000000-0000-0000-0000-000000000020',
  location_id: '00000000-0000-0000-0000-000000000030',
  category_id: '00000000-0000-0000-0000-000000000040',
  title: 'Test Package',
  slug: 'test-package',
  description: null,
  highlights: [],
  duration_days: 3,
  duration_nights: 2,
  min_group_size: 1,
  max_group_size: 10,
  inclusions: [],
  exclusions: [],
  amenities: [],
  status: 'pending',
  is_featured: false,
  is_bestseller: false,
  avg_rating: 0,
  review_count: 0,
  total_bookings: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company: { id: '00000000-0000-0000-0000-000000000020', name: 'Test Co', logo_url: null },
  location: { id: '00000000-0000-0000-0000-000000000030', city: 'Mumbai', state: 'Maharashtra' },
  category: { id: '00000000-0000-0000-0000-000000000040', name: 'adventure', label: 'Adventure', icon: 'mountain' },
  images: [],
};

// ── Authentication tests ──────────────────────────────────────────────────────

describe('Authentication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('valid admin token → 200', async () => {
    mockAuthAsAdmin();

    // After auth passes, the route calls supabaseAdmin.rpc('get_admin_dashboard').
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: {
        total_users: 10, new_users_this_month: 2,
        total_vendors: 3, pending_vendors: 1,
        total_packages: 20, pending_packages: 4, active_packages: 15,
        total_bookings: 50, bookings_this_month: 8,
        total_revenue: 100000, revenue_this_month: 12000,
        pending_reviews: 2, pending_payouts: 1,
      },
      error: null,
    });

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('missing token → 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  test('non-admin token → 403', async () => {
    mockAuthAsTraveler();

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${NON_ADMIN_TOKEN}`);

    expect(res.status).toBe(403);
  });
});

// ── Role management tests ─────────────────────────────────────────────────────

describe('Role management', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin changes another user role → 200', async () => {
    mockAuthAsAdmin(); // enqueues: [authRoleQb]

    // updateUserRole checks current role of OTHER_USER_ID → traveler (no last-admin check)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe({ role: 'traveler' }));

    // updateUserRole updates the user
    const updatedUser = {
      id: OTHER_USER_ID, role: 'company_owner',
      full_name: 'Test User', avatar_url: null,
      phone: null, city: null, state: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe(updatedUser));

    // logAdminAction insert (fire-and-forget)
    mockSupabaseAdmin.from.mockReturnValue(qbInsert());

    // queue at this point: [authRoleQb, currentRoleQb, updateQb, insertDefault]

    const res = await request(app)
      .patch(`/api/v1/admin/users/${OTHER_USER_ID}/role`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'company_owner' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('admin tries to change their own role → 403', async () => {
    mockAuthAsAdmin();

    // The route checks id === adminUser.id before calling the service.
    // No additional DB calls needed — the 403 is returned immediately.

    const res = await request(app)
      .patch(`/api/v1/admin/users/${ADMIN_ID}/role`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'traveler' });

    expect(res.status).toBe(403);
  });

  test('admin tries to remove last admin → 409', async () => {
    mockAuthAsAdmin(); // [authRoleQb]

    // updateUserRole: current role of OTHER_USER_ID is 'admin'
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe({ role: 'admin' }));

    // updateUserRole: count of admins → 1 (last admin)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbCount(1));

    const res = await request(app)
      .patch(`/api/v1/admin/users/${OTHER_USER_ID}/role`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'traveler' });

    expect(res.status).toBe(409);
  });

  test('non-existent user → 404', async () => {
    mockAuthAsAdmin(); // [authRoleQb]

    // updateUserRole: current role → traveler (skip last-admin check)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe({ role: 'traveler' }));

    // updateUserRole: update returns null data → service throws AppError(404)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe(null));

    const res = await request(app)
      .patch(`/api/v1/admin/users/${NONEXISTENT_ID}/role`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ role: 'company_owner' });

    expect(res.status).toBe(404);
  });
});

// ── Package approval tests ────────────────────────────────────────────────────

describe('Package approval', () => {
  beforeEach(() => jest.clearAllMocks());

  test('approve existing package → 200', async () => {
    mockAuthAsAdmin(); // [authRoleQb]

    // getPackageById (called inside approvePackage)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe(samplePackageRow));

    // approvePackage update → single() (not maybeSingle)
    const activePkg = { ...samplePackageRow, status: 'active' };
    mockSupabaseAdmin.from.mockReturnValueOnce(qbSingle(activePkg));

    // recordPackageStatusHistory insert (fire-and-forget, void)
    // logAdminAction insert (fire-and-forget, void)
    mockSupabaseAdmin.from.mockReturnValue(qbInsert());

    const res = await request(app)
      .patch(`/api/v1/admin/packages/${PACKAGE_ID}/approve`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ note: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('approve non-existent package → 404', async () => {
    mockAuthAsAdmin(); // [authRoleQb]

    // getPackageById returns null data → AppError(404)
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe(null));

    const res = await request(app)
      .patch(`/api/v1/admin/packages/${NONEXISTENT_ID}/approve`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({});

    expect(res.status).toBe(404);
  });

  test('reject package with reason → 200', async () => {
    mockAuthAsAdmin(); // [authRoleQb]

    // getPackageById
    mockSupabaseAdmin.from.mockReturnValueOnce(qbMaybe(samplePackageRow));

    // rejectPackage update
    const rejectedPkg = { ...samplePackageRow, status: 'rejected' };
    mockSupabaseAdmin.from.mockReturnValueOnce(qbSingle(rejectedPkg));

    // history + audit inserts
    mockSupabaseAdmin.from.mockReturnValue(qbInsert());

    const res = await request(app)
      .patch(`/api/v1/admin/packages/${PACKAGE_ID}/reject`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ reason: 'Poor quality images' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── Revenue dashboard tests ───────────────────────────────────────────────────

describe('Revenue dashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  const fullMetrics = {
    total_users: 42, new_users_this_month: 5,
    total_vendors: 8, pending_vendors: 2,
    total_packages: 30, pending_packages: 3, active_packages: 25,
    total_bookings: 120, bookings_this_month: 15,
    total_revenue: 500000, revenue_this_month: 45000,
    pending_reviews: 7, pending_payouts: 4,
  };

  test('returns numeric revenue values (not arrays)', async () => {
    mockAuthAsAdmin();
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: fullMetrics, error: null });

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    const data = res.body.data as Record<string, unknown>;
    expect(typeof data['total_revenue']).toBe('number');
    expect(typeof data['revenue_this_month']).toBe('number');
    expect(Array.isArray(data['total_revenue'])).toBe(false);
    expect(Array.isArray(data['revenue_this_month'])).toBe(false);
  });

  test('returns correct structure matching DashboardStats type', async () => {
    mockAuthAsAdmin();
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: fullMetrics, error: null });

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    const data = res.body.data as Record<string, unknown>;

    const expectedKeys = [
      'total_users', 'new_users_this_month',
      'total_vendors', 'pending_vendors',
      'total_packages', 'pending_packages', 'active_packages',
      'total_bookings', 'bookings_this_month',
      'total_revenue', 'revenue_this_month',
      'pending_reviews', 'pending_payouts',
    ] as const;

    for (const key of expectedKeys) {
      expect(data).toHaveProperty(key);
      expect(typeof data[key]).toBe('number');
    }
  });
});
