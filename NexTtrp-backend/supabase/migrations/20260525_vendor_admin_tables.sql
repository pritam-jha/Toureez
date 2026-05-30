-- FIXED: 8 - Add vendor/admin support tables with safe re-run guards.
set search_path = public, extensions;

do $$
begin
  create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

-- FIXED: 8 - Ensure the updated_at trigger function exists for the new tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- FIXED: 8 - Company compliance documents uploaded by company owners.
create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  document_type text not null,
  file_url text not null,
  public_id text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FIXED: 8 - Package lifecycle history for owner/admin review workflows.
create table if not exists public.package_status_history (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null,
  company_id uuid not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  from_status public.package_status,
  to_status public.package_status not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint package_status_history_package_company_fkey
    foreign key (package_id, company_id)
    references public.packages(id, company_id)
    on delete cascade
);

-- FIXED: 8 - Admin and trusted workflow audit trail.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FIXED: 8 - Company payout destination accounts.
create table if not exists public.vendor_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  account_holder_name text not null,
  bank_name text,
  account_number_last4 text check (account_number_last4 is null or account_number_last4 ~ '^[0-9]{4}$'),
  ifsc_code text,
  upi_id text,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_payout_accounts_company_destination_check
    check (bank_name is not null or upi_id is not null),
  constraint vendor_payout_accounts_id_company_unique unique (id, company_id)
);

-- FIXED: 8 - Vendor payout requests and processing state.
create table if not exists public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  payout_account_id uuid not null,
  requested_by uuid references auth.users(id) on delete set null,
  processed_by uuid references auth.users(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null default 'INR',
  status public.payout_status not null default 'pending',
  period_start date,
  period_end date,
  processed_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_payouts_period_check
    check (period_start is null or period_end is null or period_end >= period_start),
  constraint vendor_payouts_account_company_fkey
    foreign key (payout_account_id, company_id)
    references public.vendor_payout_accounts(id, company_id)
    on delete restrict
);

-- FIXED: 8 - Booking status timeline events visible to admins and owning companies.
create table if not exists public.booking_status_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  changed_by uuid not null references auth.users(id) on delete restrict,
  from_status public.booking_status,
  to_status public.booking_status not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FIXED: 8 - Indexes for company ownership joins and admin moderation filters.
create index if not exists company_documents_company_id_idx on public.company_documents (company_id);
create index if not exists company_documents_uploaded_by_idx on public.company_documents (uploaded_by);
create index if not exists company_documents_verification_status_idx on public.company_documents (verification_status);
create index if not exists package_status_history_package_id_idx on public.package_status_history (package_id);
create index if not exists package_status_history_company_id_idx on public.package_status_history (company_id);
create index if not exists package_status_history_changed_by_idx on public.package_status_history (changed_by);
create index if not exists package_status_history_created_at_idx on public.package_status_history (created_at desc);
create index if not exists admin_audit_logs_actor_user_id_idx on public.admin_audit_logs (actor_user_id);
create index if not exists admin_audit_logs_company_id_idx on public.admin_audit_logs (company_id);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists vendor_payout_accounts_company_id_idx on public.vendor_payout_accounts (company_id);
create unique index if not exists vendor_payout_accounts_one_primary_uidx
  on public.vendor_payout_accounts (company_id)
  where is_primary = true;
create index if not exists vendor_payouts_company_status_idx on public.vendor_payouts (company_id, status);
create index if not exists vendor_payouts_payout_account_id_idx on public.vendor_payouts (payout_account_id);
create index if not exists vendor_payouts_status_idx on public.vendor_payouts (status);
create index if not exists vendor_payouts_period_idx on public.vendor_payouts (period_start, period_end);
create index if not exists booking_status_events_booking_id_idx on public.booking_status_events (booking_id);
create index if not exists booking_status_events_company_id_idx on public.booking_status_events (company_id);
create index if not exists booking_status_events_changed_by_idx on public.booking_status_events (changed_by);
create index if not exists booking_status_events_created_at_idx on public.booking_status_events (created_at desc);

-- FIXED: 8 - Updated_at triggers for every new mutable table.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'company_documents_set_updated_at') then
    create trigger company_documents_set_updated_at
    before update on public.company_documents
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'package_status_history_set_updated_at') then
    create trigger package_status_history_set_updated_at
    before update on public.package_status_history
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'admin_audit_logs_set_updated_at') then
    create trigger admin_audit_logs_set_updated_at
    before update on public.admin_audit_logs
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'vendor_payout_accounts_set_updated_at') then
    create trigger vendor_payout_accounts_set_updated_at
    before update on public.vendor_payout_accounts
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'vendor_payouts_set_updated_at') then
    create trigger vendor_payouts_set_updated_at
    before update on public.vendor_payouts
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'booking_status_events_set_updated_at') then
    create trigger booking_status_events_set_updated_at
    before update on public.booking_status_events
    for each row execute function public.set_updated_at();
  end if;
end
$$;

-- FIXED: 9 - Enable RLS on all new vendor/admin tables.
alter table public.company_documents enable row level security;
alter table public.package_status_history enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.vendor_payout_accounts enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.booking_status_events enable row level security;

-- FIXED: 9 - company_documents policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'company_documents_admin_all') then
    create policy company_documents_admin_all on public.company_documents
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'company_documents_company_owner_select') then
    create policy company_documents_company_owner_select on public.company_documents
    for select
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = company_documents.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'company_documents_company_owner_insert') then
    create policy company_documents_company_owner_insert on public.company_documents
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and uploaded_by = auth.uid()
      and exists (
        select 1 from public.companies c
        where c.id = company_documents.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'company_documents' and policyname = 'company_documents_company_owner_update') then
    create policy company_documents_company_owner_update on public.company_documents
    for update
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = company_documents.company_id
          and c.owner_id = auth.uid()
      )
    )
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = company_documents.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;
end
$$;

-- FIXED: 9 - package_status_history policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'package_status_history' and policyname = 'package_status_history_admin_all') then
    create policy package_status_history_admin_all on public.package_status_history
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'package_status_history' and policyname = 'package_status_history_company_owner_select') then
    create policy package_status_history_company_owner_select on public.package_status_history
    for select
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = package_status_history.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'package_status_history' and policyname = 'package_status_history_company_owner_insert') then
    create policy package_status_history_company_owner_insert on public.package_status_history
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and changed_by = auth.uid()
      and exists (
        select 1 from public.companies c
        where c.id = package_status_history.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'package_status_history' and policyname = 'package_status_history_company_owner_update') then
    create policy package_status_history_company_owner_update on public.package_status_history
    for update
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = package_status_history.company_id
          and c.owner_id = auth.uid()
      )
    )
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = package_status_history.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;
end
$$;

-- FIXED: 9 - admin_audit_logs policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_audit_logs' and policyname = 'admin_audit_logs_admin_all') then
    create policy admin_audit_logs_admin_all on public.admin_audit_logs
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_audit_logs' and policyname = 'admin_audit_logs_company_owner_insert') then
    create policy admin_audit_logs_company_owner_insert on public.admin_audit_logs
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and actor_user_id = auth.uid()
      and (
        company_id is null
        or exists (
          select 1 from public.companies c
          where c.id = admin_audit_logs.company_id
            and c.owner_id = auth.uid()
        )
      )
    );
  end if;
end
$$;

-- FIXED: 9 - vendor_payout_accounts policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payout_accounts' and policyname = 'vendor_payout_accounts_admin_all') then
    create policy vendor_payout_accounts_admin_all on public.vendor_payout_accounts
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payout_accounts' and policyname = 'vendor_payout_accounts_company_owner_select') then
    create policy vendor_payout_accounts_company_owner_select on public.vendor_payout_accounts
    for select
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payout_accounts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payout_accounts' and policyname = 'vendor_payout_accounts_company_owner_insert') then
    create policy vendor_payout_accounts_company_owner_insert on public.vendor_payout_accounts
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and created_by = auth.uid()
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payout_accounts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payout_accounts' and policyname = 'vendor_payout_accounts_company_owner_update') then
    create policy vendor_payout_accounts_company_owner_update on public.vendor_payout_accounts
    for update
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payout_accounts.company_id
          and c.owner_id = auth.uid()
      )
    )
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payout_accounts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;
end
$$;

-- FIXED: 9 - vendor_payouts policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payouts' and policyname = 'vendor_payouts_admin_all') then
    create policy vendor_payouts_admin_all on public.vendor_payouts
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payouts' and policyname = 'vendor_payouts_company_owner_select') then
    create policy vendor_payouts_company_owner_select on public.vendor_payouts
    for select
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payouts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payouts' and policyname = 'vendor_payouts_company_owner_insert') then
    create policy vendor_payouts_company_owner_insert on public.vendor_payouts
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and requested_by = auth.uid()
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payouts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vendor_payouts' and policyname = 'vendor_payouts_company_owner_update') then
    create policy vendor_payouts_company_owner_update on public.vendor_payouts
    for update
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payouts.company_id
          and c.owner_id = auth.uid()
      )
    )
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = vendor_payouts.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;
end
$$;

-- FIXED: 9 - booking_status_events policies.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_status_events' and policyname = 'booking_status_events_admin_all') then
    create policy booking_status_events_admin_all on public.booking_status_events
    for all
    using ((select role from public.users where id = auth.uid()) = 'admin')
    with check ((select role from public.users where id = auth.uid()) = 'admin');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_status_events' and policyname = 'booking_status_events_company_owner_select') then
    create policy booking_status_events_company_owner_select on public.booking_status_events
    for select
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = booking_status_events.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_status_events' and policyname = 'booking_status_events_company_owner_insert') then
    create policy booking_status_events_company_owner_insert on public.booking_status_events
    for insert
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and changed_by = auth.uid()
      and exists (
        select 1 from public.companies c
        where c.id = booking_status_events.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_status_events' and policyname = 'booking_status_events_company_owner_update') then
    create policy booking_status_events_company_owner_update on public.booking_status_events
    for update
    using (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = booking_status_events.company_id
          and c.owner_id = auth.uid()
      )
    )
    with check (
      (select role from public.users where id = auth.uid()) = 'company_owner'
      and exists (
        select 1 from public.companies c
        where c.id = booking_status_events.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;
end
$$;
