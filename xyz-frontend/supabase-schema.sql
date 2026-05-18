-- ============================================================
-- EXTENSIONS
-- ============================================================
create schema if not exists extensions;

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
-- create extension if not exists "postgis" with schema extensions;
-- Enable PostGIS separately if you want geo-distance queries in a later phase.

set search_path = public, extensions;

-- ============================================================
-- ENUMS
-- ============================================================
do $$
begin
  create type public.company_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.package_status as enum ('draft', 'pending', 'active', 'rejected');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.user_role as enum ('traveler', 'company_owner', 'admin');
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
set check_function_bodies = off;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_company_owner(company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.companies
    where id = $1
      and owner_id = auth.uid()
  );
$$;

create or replace function public.get_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public, auth
as $$
  select role
  from public.users
  where id = auth.uid();
$$;

set check_function_bodies = on;

-- ============================================================
-- TABLES
-- ============================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  region text not null check (region in ('North India', 'South India', 'East India', 'West India', 'Central India')),
  country text not null default 'India',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_popular boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint locations_city_state_country_key unique (city, state, country),
  constraint locations_lat_lng_pair_check check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  )
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  icon text not null,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  constraint categories_name_slug_check check (name ~ '^[a-z0-9-]+$')
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  city text,
  state text,
  role public.user_role not null default 'traveler',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  cover_url text,
  about text,
  gst_number text,
  trade_license_url text,
  pan_number text,
  status public.company_status not null default 'pending',
  is_verified boolean not null default false,
  total_packages integer not null default 0 check (total_packages >= 0),
  avg_rating numeric(3, 2) not null default 0 check (avg_rating between 0 and 5),
  total_reviews integer not null default 0 check (total_reviews >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  category_id uuid not null references public.categories(id),
  title text not null,
  slug text not null unique,
  description text,
  highlights text[] not null default '{}',
  duration_days integer not null check (duration_days > 0),
  duration_nights integer not null check (duration_nights >= 0 and duration_nights <= duration_days),
  min_group_size integer not null default 1 check (min_group_size > 0),
  max_group_size integer not null default 20 check (max_group_size >= min_group_size),
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  amenities text[] not null default '{}',
  status public.package_status not null default 'draft',
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  avg_rating numeric(3, 2) not null default 0 check (avg_rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  total_bookings integer not null default 0 check (total_bookings >= 0),
  fts tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_id_company_unique unique (id, company_id)
);

create table public.package_pricing (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  label text not null,
  min_people integer not null default 1 check (min_people > 0),
  max_people integer not null default 1 check (max_people >= min_people),
  base_price numeric(10, 2) not null check (base_price >= 0),
  discounted_price numeric(10, 2) check (
    discounted_price is null
    or (discounted_price >= 0 and discounted_price <= base_price)
  ),
  currency char(3) not null default 'INR',
  season text not null default 'all' check (season in ('all', 'peak', 'off-peak')),
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint package_pricing_validity_check check (
    valid_from is null
    or valid_until is null
    or valid_until >= valid_from
  ),
  constraint package_pricing_id_package_unique unique (id, package_id)
);

create table public.package_images (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  url text not null,
  public_id text not null,
  alt_text text,
  is_cover boolean not null default false,
  display_order integer not null default 0,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null,
  description text,
  meals text[] not null default '{}',
  accommodation text,
  activities text[] not null default '{}',
  transport text,
  created_at timestamptz not null default now(),
  unique (package_id, day_number)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, package_id)
);

create table public.compare_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  package_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id),
  check (
    array_length(package_ids, 1) <= 4
    or package_ids = '{}'::uuid[]
  )
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  pricing_id uuid not null references public.package_pricing(id),
  booking_reference text not null unique,
  travel_date date not null,
  num_travelers integer not null check (num_travelers > 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  advance_amount numeric(10, 2) not null default 0 check (advance_amount >= 0),
  balance_amount numeric(10, 2) not null default 0 check (balance_amount >= 0),
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  special_requests text,
  traveler_details jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_amounts_check check (advance_amount + balance_amount = total_amount),
  constraint bookings_traveler_details_check check (jsonb_typeof(traveler_details) = 'array'),
  constraint bookings_package_company_fkey foreign key (package_id, company_id)
    references public.packages(id, company_id) on delete restrict,
  constraint bookings_pricing_package_fkey foreign key (pricing_id, package_id)
    references public.package_pricing(id, package_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount numeric(10, 2) not null check (amount >= 0),
  currency char(3) not null default 'INR',
  status public.payment_status not null default 'pending',
  payment_method text,
  gateway_response jsonb,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  rating_guide numeric(2, 1) check (rating_guide between 1 and 5),
  rating_hotel numeric(2, 1) check (rating_hotel between 1 and 5),
  rating_food numeric(2, 1) check (rating_food between 1 and 5),
  rating_transport numeric(2, 1) check (rating_transport between 1 and 5),
  rating_value numeric(2, 1) check (rating_value between 1 and 5),
  overall_rating numeric(2, 1) check (overall_rating between 1 and 5),
  title text,
  body text,
  is_verified boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (booking_id),
  constraint reviews_at_least_one_rating_check check (
    rating_guide is not null
    or rating_hotel is not null
    or rating_food is not null
    or rating_transport is not null
    or rating_value is not null
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'booking_confirmed',
      'payment_received',
      'review_received',
      'package_approved',
      'wishlist_price_drop'
    )
  ),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  related_id uuid,
  related_type text check (related_type is null or related_type in ('booking', 'package', 'review')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index companies_owner_id_idx on public.companies (owner_id);

create unique index companies_gst_number_uidx on public.companies (gst_number) where gst_number is not null;
create unique index companies_pan_number_uidx on public.companies (pan_number) where pan_number is not null;
create index companies_name_trgm_idx on public.companies using gin (name gin_trgm_ops);

create index packages_company_id_idx on public.packages (company_id);
create index packages_location_id_idx on public.packages (location_id);
create index packages_category_id_idx on public.packages (category_id);
create index packages_status_idx on public.packages (status);
create index packages_is_featured_idx on public.packages (is_featured);
create index packages_is_bestseller_idx on public.packages (is_bestseller);
create index packages_avg_rating_idx on public.packages (avg_rating);
create index packages_location_status_idx on public.packages (location_id, status);
create index packages_category_status_idx on public.packages (category_id, status);
create index packages_status_featured_idx on public.packages (status, is_featured);
create index packages_status_avg_rating_idx on public.packages (status, avg_rating);
create index packages_fts_idx on public.packages using gin (fts);
create index packages_title_trgm_idx on public.packages using gin (title gin_trgm_ops);

create index package_pricing_package_id_idx on public.package_pricing (package_id);

create index package_images_package_id_idx on public.package_images (package_id);
create index package_images_uploaded_by_idx on public.package_images (uploaded_by);
create unique index package_images_one_cover_uidx on public.package_images (package_id) where is_cover = true;

create index itineraries_package_id_idx on public.itineraries (package_id);

create index wishlists_user_id_idx on public.wishlists (user_id);
create index wishlists_package_id_idx on public.wishlists (package_id);

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_package_id_idx on public.bookings (package_id);
create index bookings_company_id_idx on public.bookings (company_id);
create index bookings_pricing_id_idx on public.bookings (pricing_id);
create index bookings_user_status_idx on public.bookings (user_id, status);
create index bookings_company_status_idx on public.bookings (company_id, status);

create index payments_booking_id_idx on public.payments (booking_id);

create index reviews_booking_id_idx on public.reviews (booking_id);
create index reviews_user_id_idx on public.reviews (user_id);
create index reviews_package_id_idx on public.reviews (package_id);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_is_read_idx on public.notifications (is_read);
create index notifications_user_is_read_idx on public.notifications (user_id, is_read);

create index locations_is_popular_idx on public.locations (is_popular);
create index locations_is_active_idx on public.locations (is_active);
create index locations_city_trgm_idx on public.locations using gin (city gin_trgm_ops);
-- Spatial index disabled in the base schema.
-- Enable PostGIS first, then add the optional index from the Phase 3 block below.

create index categories_is_active_idx on public.categories (is_active);
create index categories_display_order_idx on public.categories (display_order);

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

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

create or replace function public.guard_user_role_change()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only admins can change user roles.';
  end if;

  return new;
end;
$$;

create or replace function public.guard_company_owner_managed_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.owner_id and (
    new.status is distinct from old.status
    or new.is_verified is distinct from old.is_verified
    or new.total_packages is distinct from old.total_packages
    or new.avg_rating is distinct from old.avg_rating
    or new.total_reviews is distinct from old.total_reviews
  ) then
    raise exception 'Only admins can change company approval or aggregate fields.';
  end if;

  return new;
end;
$$;

create or replace function public.guard_package_owner_managed_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if public.is_company_owner(old.company_id) and (
    new.status is distinct from old.status
    or new.is_featured is distinct from old.is_featured
    or new.is_bestseller is distinct from old.is_bestseller
    or new.avg_rating is distinct from old.avg_rating
    or new.review_count is distinct from old.review_count
    or new.total_bookings is distinct from old.total_bookings
  ) then
    raise exception 'Only admins can change package approval or aggregate fields.';
  end if;

  return new;
end;
$$;

create or replace function public.guard_review_publication_flags()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.is_published = true or new.is_verified = true then
    raise exception 'Only admins can publish or verify reviews.';
  end if;

  return new;
end;
$$;

create or replace function public.guard_notification_user_updates()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.user_id and (
    new.user_id is distinct from old.user_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.data is distinct from old.data
    or new.related_id is distinct from old.related_id
    or new.related_type is distinct from old.related_type
  ) then
    raise exception 'Users can only mark notifications as read.';
  end if;

  return new;
end;
$$;

create or replace function public.slugify(input_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    trim(both '-' from regexp_replace(lower(coalesce($1, '')), '[^a-z0-9]+', '-', 'g')),
    ''
  );
$$;

create or replace function public.generate_booking_reference()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  booking_year integer := extract(year from now())::integer;
  next_number integer;
begin
  perform pg_advisory_xact_lock(90210, booking_year);

  select coalesce(
    max(split_part(booking_reference, '-', 3)::integer),
    0
  ) + 1
  into next_number
  from public.bookings
  where booking_reference like format('XYZ-%s-%%', booking_year);

  new.booking_reference := format('XYZ-%s-%s', booking_year, lpad(next_number::text, 5, '0'));
  return new;
end;
$$;

create or replace function public.compute_overall_rating()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  computed_rating numeric(2, 1);
begin
  select round(avg(rating_value)::numeric, 1)
  into computed_rating
  from unnest(array[
    new.rating_guide,
    new.rating_hotel,
    new.rating_food,
    new.rating_transport,
    new.rating_value
  ]) as rating_value
  where rating_value is not null;

  new.overall_rating := computed_rating;
  return new;
end;
$$;

create or replace function public.update_package_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_package_ids uuid[];
  target_package_id uuid;
begin
  target_package_ids := array_remove(
    array[
      case when tg_op in ('INSERT', 'UPDATE') then new.package_id end,
      case when tg_op in ('UPDATE', 'DELETE') then old.package_id end
    ],
    null
  );

  if target_package_ids is null then
    return null;
  end if;

  foreach target_package_id in array target_package_ids loop
    update public.packages
    set
      avg_rating = coalesce((
        select round(avg(r.overall_rating)::numeric, 2)
        from public.reviews r
        where r.package_id = target_package_id
          and r.is_published = true
          and r.overall_rating is not null
      ), 0),
      review_count = (
        select count(*)
        from public.reviews r
        where r.package_id = target_package_id
          and r.is_published = true
      )
    where id = target_package_id;
  end loop;

  return null;
end;
$$;

create or replace function public.update_company_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_package_ids uuid[];
  target_company_ids uuid[];
  target_company_id uuid;
begin
  target_package_ids := array_remove(
    array[
      case when tg_op in ('INSERT', 'UPDATE') then new.package_id end,
      case when tg_op in ('UPDATE', 'DELETE') then old.package_id end
    ],
    null
  );

  select array_agg(distinct p.company_id)
  into target_company_ids
  from public.packages p
  where p.id = any(target_package_ids);

  if target_company_ids is null then
    return null;
  end if;

  foreach target_company_id in array target_company_ids loop
    update public.companies
    set
      avg_rating = coalesce((
        select round(avg(r.overall_rating)::numeric, 2)
        from public.reviews r
        join public.packages p on p.id = r.package_id
        where p.company_id = target_company_id
          and r.is_published = true
          and r.overall_rating is not null
      ), 0),
      total_reviews = (
        select count(*)
        from public.reviews r
        join public.packages p on p.id = r.package_id
        where p.company_id = target_company_id
          and r.is_published = true
      )
    where id = target_company_id;
  end loop;

  return null;
end;
$$;

create or replace function public.update_company_package_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_ids uuid[];
  target_company_id uuid;
begin
  target_company_ids := array_remove(
    array[
      case when tg_op in ('INSERT', 'UPDATE') then new.company_id end,
      case when tg_op in ('UPDATE', 'DELETE') then old.company_id end
    ],
    null
  );

  if target_company_ids is null then
    return null;
  end if;

  foreach target_company_id in array target_company_ids loop
    update public.companies
    set total_packages = (
      select count(*)
      from public.packages p
      where p.company_id = target_company_id
        and p.status = 'active'
    )
    where id = target_company_id;
  end loop;

  return null;
end;
$$;

create or replace function public.generate_package_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix_number integer := 2;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := coalesce(public.slugify(new.slug), 'package');
    return new;
  end if;

  base_slug := coalesce(public.slugify(new.title), 'package');
  perform pg_advisory_xact_lock(hashtextextended('package_slug:' || base_slug, 0));

  candidate_slug := base_slug;

  while exists (
    select 1
    from public.packages
    where slug = candidate_slug
  ) loop
    candidate_slug := base_slug || '-' || suffix_number::text;
    suffix_number := suffix_number + 1;
  end loop;

  new.slug := candidate_slug;
  return new;
end;
$$;

create or replace function public.generate_company_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix_number integer := 2;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := coalesce(public.slugify(new.slug), 'company');
    return new;
  end if;

  base_slug := coalesce(public.slugify(new.name), 'company');
  perform pg_advisory_xact_lock(hashtextextended('company_slug:' || base_slug, 0));

  candidate_slug := base_slug;

  while exists (
    select 1
    from public.companies
    where slug = candidate_slug
  ) loop
    candidate_slug := base_slug || '-' || suffix_number::text;
    suffix_number := suffix_number + 1;
  end loop;

  new.slug := candidate_slug;
  return new;
end;
$$;

create or replace function public.update_package_fts()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.fts := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(array_to_string(new.highlights, ' '), '')
  );
  return new;
end;
$$;

-- Automatically creates a public profile row whenever a new auth user signs up.
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Automatically refreshes updated_at on profile changes.
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Prevents non-admin users from changing their own role.
create trigger users_guard_role_change
before update on public.users
for each row execute function public.guard_user_role_change();

-- Automatically refreshes updated_at on company changes.
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- Prevents company owners from changing admin-managed company fields.
create trigger companies_guard_managed_fields
before update on public.companies
for each row execute function public.guard_company_owner_managed_fields();

-- Automatically refreshes updated_at on package changes.
create trigger packages_set_updated_at
before update on public.packages
for each row execute function public.set_updated_at();

-- Prevents company owners from changing admin-managed package fields.
create trigger packages_guard_managed_fields
before update on public.packages
for each row execute function public.guard_package_owner_managed_fields();

-- Automatically keeps the package full-text search vector in sync.
create trigger packages_update_fts
before insert or update on public.packages
for each row execute function public.update_package_fts();

-- Automatically refreshes updated_at on booking changes.
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Automatically refreshes updated_at on compare session changes.
create trigger compare_sessions_set_updated_at
before update on public.compare_sessions
for each row execute function public.set_updated_at();

-- Automatically generates a booking reference before a booking is inserted.
create trigger bookings_generate_reference
before insert on public.bookings
for each row execute function public.generate_booking_reference();

-- Automatically computes overall review rating from the component scores.
create trigger reviews_compute_overall_rating
before insert or update on public.reviews
for each row execute function public.compute_overall_rating();

-- Prevents travelers from publishing or verifying their own reviews.
create trigger reviews_guard_publication_flags
before insert or update on public.reviews
for each row execute function public.guard_review_publication_flags();

-- Prevents users from editing notification content instead of only read state.
create trigger notifications_guard_user_updates
before update on public.notifications
for each row execute function public.guard_notification_user_updates();

-- Automatically keeps package rating aggregates in sync with review changes.
create trigger reviews_update_package_rating
after insert or update or delete on public.reviews
for each row execute function public.update_package_rating();

-- Automatically keeps company rating aggregates in sync with review changes.
create trigger reviews_update_company_rating
after insert or update or delete on public.reviews
for each row execute function public.update_company_rating();

-- Automatically keeps each company's active package count in sync.
create trigger packages_update_company_package_count
after insert or update or delete on public.packages
for each row execute function public.update_company_package_count();

-- Automatically generates a collision-safe package slug before insert.
create trigger packages_generate_slug
before insert on public.packages
for each row execute function public.generate_package_slug();

-- Automatically generates a collision-safe company slug before insert.
create trigger companies_generate_slug
before insert on public.companies
for each row execute function public.generate_company_slug();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.packages enable row level security;
alter table public.package_pricing enable row level security;
alter table public.package_images enable row level security;
alter table public.itineraries enable row level security;
alter table public.wishlists enable row level security;
alter table public.compare_sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

create policy users_select_own
on public.users
for select
using (auth.uid() = id);

create policy users_update_own
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy users_insert_own
on public.users
for insert
with check (auth.uid() = id);

create policy users_select_admin
on public.users
for select
using (public.is_admin());

create policy locations_select_public
on public.locations
for select
to public
using (true);

create policy locations_admin_all
on public.locations
for all
using (public.is_admin())
with check (public.is_admin());

create policy categories_select_public
on public.categories
for select
to public
using (true);

create policy categories_admin_all
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

create policy companies_select_public_approved
on public.companies
for select
to public
using (status = 'approved');

create policy companies_select_owner
on public.companies
for select
using (auth.uid() = owner_id);

create policy companies_select_admin
on public.companies
for select
using (public.is_admin());

create policy companies_insert_owner
on public.companies
for insert
with check (
  auth.uid() = owner_id
  and status = 'pending'
  and is_verified = false
  and total_packages = 0
  and avg_rating = 0
  and total_reviews = 0
);

create policy companies_update_owner
on public.companies
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy companies_update_admin
on public.companies
for update
using (public.is_admin())
with check (public.is_admin());

create policy packages_select_public_active
on public.packages
for select
to public
using (status = 'active');

create policy packages_select_owner
on public.packages
for select
using (public.is_company_owner(company_id));

create policy packages_select_admin
on public.packages
for select
using (public.is_admin());

create policy packages_insert_owner
on public.packages
for insert
with check (
  public.is_company_owner(company_id)
  and status in ('draft', 'pending')
  and is_featured = false
  and is_bestseller = false
  and avg_rating = 0
  and review_count = 0
  and total_bookings = 0
);

create policy packages_update_owner
on public.packages
for update
using (public.is_company_owner(company_id))
with check (public.is_company_owner(company_id));

create policy packages_update_admin
on public.packages
for update
using (public.is_admin())
with check (public.is_admin());

create policy package_pricing_select_public
on public.package_pricing
for select
to public
using (
  is_active = true
  and
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and p.status = 'active'
  )
);

create policy package_pricing_select_owner
on public.package_pricing
for select
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_pricing_modify_owner
on public.package_pricing
for insert
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_pricing_update_owner
on public.package_pricing
for update
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
)
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_pricing_delete_owner
on public.package_pricing
for delete
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_pricing_admin_all
on public.package_pricing
for all
using (public.is_admin())
with check (public.is_admin());

create policy package_images_select_public
on public.package_images
for select
to public
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and p.status = 'active'
  )
);

create policy package_images_select_owner
on public.package_images
for select
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_images_insert_owner
on public.package_images
for insert
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_images_update_owner
on public.package_images
for update
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
)
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_images_delete_owner
on public.package_images
for delete
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy package_images_admin_all
on public.package_images
for all
using (public.is_admin())
with check (public.is_admin());

create policy itineraries_select_public
on public.itineraries
for select
to public
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and p.status = 'active'
  )
);

create policy itineraries_select_owner
on public.itineraries
for select
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy itineraries_insert_owner
on public.itineraries
for insert
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy itineraries_update_owner
on public.itineraries
for update
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
)
with check (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy itineraries_delete_owner
on public.itineraries
for delete
using (
  exists (
    select 1
    from public.packages p
    where p.id = package_id
      and public.is_company_owner(p.company_id)
  )
);

create policy itineraries_admin_all
on public.itineraries
for all
using (public.is_admin())
with check (public.is_admin());

create policy wishlists_select_own
on public.wishlists
for select
using (auth.uid() = user_id);

create policy wishlists_insert_own
on public.wishlists
for insert
with check (auth.uid() = user_id);

create policy wishlists_delete_own
on public.wishlists
for delete
using (auth.uid() = user_id);

create policy compare_sessions_select_own
on public.compare_sessions
for select
using (auth.uid() = user_id);

create policy compare_sessions_insert_own
on public.compare_sessions
for insert
with check (auth.uid() = user_id);

create policy compare_sessions_update_own
on public.compare_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy compare_sessions_delete_own
on public.compare_sessions
for delete
using (auth.uid() = user_id);

create policy bookings_select_own
on public.bookings
for select
using (auth.uid() = user_id);

create policy bookings_select_company_owner
on public.bookings
for select
using (public.is_company_owner(company_id));

create policy bookings_select_admin
on public.bookings
for select
using (public.is_admin());

create policy bookings_insert_own
on public.bookings
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and payment_status = 'pending'
);

create policy bookings_update_admin
on public.bookings
for update
using (public.is_admin())
with check (public.is_admin());

create policy payments_select_own_booking
on public.payments
for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and b.user_id = auth.uid()
  )
);

create policy payments_select_admin
on public.payments
for select
using (public.is_admin());

create policy payments_insert_admin
on public.payments
for insert
with check (public.is_admin());

create policy reviews_select_public_published
on public.reviews
for select
to public
using (is_published = true);

create policy reviews_select_own
on public.reviews
for select
using (auth.uid() = user_id);

create policy reviews_select_admin
on public.reviews
for select
using (public.is_admin());

create policy reviews_insert_completed_booking
on public.reviews
for insert
with check (
  auth.uid() = user_id
  and is_published = false
  and is_verified = false
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and b.user_id = auth.uid()
      and b.package_id = package_id
      and b.status = 'completed'
  )
);

create policy reviews_update_own
on public.reviews
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy reviews_update_admin
on public.reviews
for update
using (public.is_admin())
with check (public.is_admin());

create policy notifications_select_own
on public.notifications
for select
using (auth.uid() = user_id);

create policy notifications_update_own
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy notifications_insert_admin
on public.notifications
for insert
with check (public.is_admin());

-- ============================================================
-- SEED DATA
-- ============================================================
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'seed-admin@xyz.travel',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"XYZ Seed Admin"}'::jsonb,
  false,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update
set
  instance_id = excluded.instance_id,
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  is_super_admin = excluded.is_super_admin,
  updated_at = excluded.updated_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change;

insert into public.users (
  id,
  full_name,
  avatar_url,
  role
)
values (
  '00000000-0000-0000-0000-000000000001',
  'XYZ Seed Admin',
  null,
  'admin'
)
on conflict (id) do update
set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  role = excluded.role,
  updated_at = now();

insert into public.locations (
  city,
  state,
  region,
  latitude,
  longitude,
  is_popular
)
values
  ('Goa', 'Panaji', 'West India', 15.490900, 73.827800, true),
  ('Manali', 'Manali', 'North India', 32.239600, 77.188700, true),
  ('Alleppey', 'Kerala', 'South India', 9.498100, 76.338800, true),
  ('Jaipur', 'Rajasthan', 'North India', 26.912400, 75.787300, true),
  ('Varanasi', 'Uttar Pradesh', 'North India', 25.317600, 82.973900, false),
  ('Rishikesh', 'Uttarakhand', 'North India', 30.086900, 78.267600, false),
  ('Port Blair', 'Andaman', 'East India', 11.623400, 92.726500, false),
  ('Leh', 'Ladakh', 'North India', 34.152600, 77.577100, true),
  ('Coorg', 'Karnataka', 'South India', 12.337500, 75.806900, false),
  ('Ooty', 'Tamil Nadu', 'South India', 11.410200, 76.695000, false),
  ('Srinagar', 'Jammu & Kashmir', 'North India', 34.083700, 74.797300, true),
  ('Dehradun', 'Uttarakhand', 'North India', 30.316500, 78.032200, false),
  ('Shirdi', 'Maharashtra', 'West India', 19.766800, 74.477900, false),
  ('Tirupati', 'Andhra Pradesh', 'South India', 13.628800, 79.419200, false),
  ('Munnar', 'Kerala', 'South India', 10.088900, 77.059500, false);

insert into public.categories (
  name,
  label,
  icon,
  description,
  display_order
)
values
  ('pilgrimage', 'Pilgrimage Tours', 'map-pin', 'Sacred journeys across India''s most revered shrines and spiritual circuits.', 1),
  ('adventure', 'Adventure Tours', 'mountain', 'Thrilling trips packed with trekking, rafting, biking, diving, and outdoor action.', 2),
  ('leisure', 'Leisure Holidays', 'umbrella-beach', 'Relaxed escapes focused on comfort, scenery, and slow travel experiences.', 3),
  ('honeymoon', 'Honeymoon Packages', 'heart', 'Romantic getaways designed for couples seeking privacy, beauty, and memorable stays.', 4),
  ('family', 'Family Holidays', 'users', 'Fun-filled trips crafted for all age groups with easy pacing and shared experiences.', 5),
  ('wildlife', 'Wildlife Safaris', 'paw', 'Nature-led adventures through forests, reserves, and wildlife habitats.', 6),
  ('cultural', 'Cultural Tours', 'landmark', 'Heritage-rich itineraries centered around history, art, food, and local traditions.', 7);

-- Replace owner_id with real admin user UUID after first admin signup.
insert into public.companies (
  owner_id,
  name,
  about,
  gst_number,
  status,
  is_verified
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Divine Yatra Pvt Ltd',
    'India''s most trusted pilgrimage tour operator, known for dependable temple circuits, senior-friendly planning, and smooth darshan logistics.',
    '27AABCD1234E1Z5',
    'approved',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Char Dham Tours',
    'Specialists in Char Dham and North India pilgrimages with experienced local teams, guided rituals, and mountain route expertise.',
    '05AABCE2345F1Z6',
    'approved',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Peak Adventures India',
    'Premier adventure sports and trekking company offering curated camps, expeditions, and activity-led mountain escapes.',
    '02AABCF3456G1Z7',
    'approved',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Go Explore Holidays',
    'Curating unforgettable holiday experiences across beaches, islands, and scenic destinations with a sharp focus on comfort and value.',
    '30AABCG4567H1Z8',
    'approved',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Romantic Escapes India',
    'Crafting perfect honeymoon and romantic getaways with private transfers, premium stays, and experience-first itineraries.',
    '32AABCH5678I1Z9',
    'approved',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Happy Families Travel',
    'Family holidays designed for lasting memories, balancing sightseeing, downtime, and kid-friendly planning for Indian travelers.',
    '10AABCI6789J2Z0',
    'approved',
    true
  );

with package_seed as (
  select *
  from (
    values
      (
        'Char Dham Yatra - Complete Tour',
        'Divine Yatra Pvt Ltd',
        'Dehradun',
        'pilgrimage',
        'A complete Char Dham circuit covering Yamunotri, Gangotri, Kedarnath, and Badrinath with guided darshan, mountain drives, and comfortable stays.',
        array['Yamunotri Darshan', 'Gangotri Darshan', 'Kedarnath Trek', 'Badrinath Temple', 'Haridwar Ganga Aarti']::text[],
        12,
        11,
        true,
        true,
        4.70::numeric,
        234
      ),
      (
        'Varanasi Spiritual Journey',
        'Divine Yatra Pvt Ltd',
        'Varanasi',
        'pilgrimage',
        'A serene Varanasi experience with temple visits, Ganga Aarti, heritage lanes, and guided spiritual rituals along the ghats.',
        array['Ganga Aarti', 'Kashi Vishwanath Temple', 'Sunrise Boat Ride', 'Sarnath Excursion']::text[],
        4,
        3,
        false,
        false,
        4.50::numeric,
        189
      ),
      (
        'Shirdi Sai Baba Darshan',
        'Char Dham Tours',
        'Shirdi',
        'pilgrimage',
        'A short and convenient Shirdi darshan package with priority planning, comfortable hotel stays, and local temple assistance.',
        array['Sai Baba Temple Darshan', 'Dwarkamai Visit', 'Prasadalaya Meals', 'Nearby Temple Stops']::text[],
        3,
        2,
        false,
        false,
        4.30::numeric,
        156
      ),
      (
        'Tirupati Balaji Special',
        'Char Dham Tours',
        'Tirupati',
        'pilgrimage',
        'A focused Tirupati pilgrimage package built for smooth darshan, restful stays, and efficient local travel for devotees.',
        array['Balaji Darshan', 'Padmavathi Temple', 'Local Transfers', 'Pilgrim Assistance']::text[],
        3,
        2,
        false,
        false,
        4.40::numeric,
        98
      ),
      (
        'Rishikesh Spiritual Retreat',
        'Divine Yatra Pvt Ltd',
        'Rishikesh',
        'pilgrimage',
        'A calm retreat combining yoga, riverside prayer, ashram visits, and spiritual time in one of India''s most peaceful destinations.',
        array['Ganga Aarti', 'Ashram Stay Experience', 'Yoga Sessions', 'Temple Visits']::text[],
        5,
        4,
        false,
        false,
        4.60::numeric,
        143
      ),
      (
        'Manali Adventure Camp',
        'Peak Adventures India',
        'Manali',
        'adventure',
        'A high-energy Manali camp blending river crossings, rope challenges, mountain views, and group adventure in the Himalayas.',
        array['Adventure Camp Stay', 'Bonfire Nights', 'Mountain Activities', 'Local Sightseeing']::text[],
        6,
        5,
        true,
        true,
        4.80::numeric,
        312
      ),
      (
        'Ladakh Bike Expedition',
        'Peak Adventures India',
        'Leh',
        'adventure',
        'A bucket-list Leh and Ladakh riding circuit featuring dramatic passes, high-altitude camps, and expert route support.',
        array['Motorbike Expedition', 'Khardung La Ride', 'Pangong Lake', 'Backup Vehicle Support']::text[],
        10,
        9,
        true,
        false,
        4.90::numeric,
        87
      ),
      (
        'Rishikesh River Rafting Camp',
        'Go Explore Holidays',
        'Rishikesh',
        'adventure',
        'An action-packed rafting camp in Rishikesh with riverside tents, group fun, and outdoor adventure led by trained crews.',
        array['River Rafting', 'Riverside Camping', 'Bonfire Evening', 'Outdoor Games']::text[],
        3,
        2,
        false,
        false,
        4.60::numeric,
        267
      ),
      (
        'Andaman Scuba Diving Package',
        'Go Explore Holidays',
        'Port Blair',
        'adventure',
        'An island adventure focused on scuba sessions, clear-water exploration, beach leisure, and guided Andaman activities.',
        array['Scuba Diving Session', 'Island Transfers', 'Beach Time', 'Marine Life Experience']::text[],
        5,
        4,
        false,
        false,
        4.70::numeric,
        134
      ),
      (
        'Coorg Trek & Nature Camp',
        'Peak Adventures India',
        'Coorg',
        'adventure',
        'A refreshing Coorg trip with forest trails, camp vibes, scenic viewpoints, and soft adventure in lush green surroundings.',
        array['Guided Trek', 'Nature Camp', 'Sunrise Viewpoint', 'Campfire Evening']::text[],
        4,
        3,
        false,
        false,
        4.40::numeric,
        76
      ),
      (
        'Goa Beach Holiday',
        'Go Explore Holidays',
        'Goa',
        'leisure',
        'A classic Goa escape covering beach time, nightlife, sightseeing, and just the right amount of laid-back holiday energy.',
        array['North Goa Beaches', 'Sunset Cruise', 'Leisure Resort Stay', 'Private Transfers']::text[],
        5,
        4,
        false,
        true,
        4.50::numeric,
        341
      ),
      (
        'Ooty Hill Station Escape',
        'Happy Families Travel',
        'Ooty',
        'leisure',
        'A cool-weather Ooty holiday with easy sightseeing, tea gardens, mountain charm, and a relaxing pace for all travelers.',
        array['Tea Garden Visit', 'Toy Train Views', 'Lake Leisure', 'Hill Station Stay']::text[],
        4,
        3,
        false,
        false,
        4.20::numeric,
        124
      ),
      (
        'Kashmir Paradise Tour',
        'Go Explore Holidays',
        'Srinagar',
        'leisure',
        'A premium Kashmir circuit through Srinagar''s lakes, gardens, mountain vistas, and timeless valley experiences.',
        array['Shikara Ride', 'Mughal Gardens', 'Gulmarg Excursion', 'Scenic Valley Stays']::text[],
        6,
        5,
        true,
        false,
        4.80::numeric,
        198
      ),
      (
        'Coorg Coffee Trails',
        'Go Explore Holidays',
        'Coorg',
        'leisure',
        'A short and elegant Coorg getaway centered around plantations, local flavors, mellow sightseeing, and boutique comfort.',
        array['Coffee Estate Visit', 'Plantation Walk', 'Local Tastings', 'Nature Views']::text[],
        3,
        2,
        false,
        false,
        4.30::numeric,
        89
      ),
      (
        'Andaman Island Explorer',
        'Go Explore Holidays',
        'Port Blair',
        'leisure',
        'A balanced Andaman holiday featuring beaches, island-hopping, leisure stays, and easy-paced sightseeing.',
        array['Island Hopping', 'Beach Leisure', 'Cellular Jail Visit', 'Private Boat Transfers']::text[],
        6,
        5,
        false,
        false,
        4.60::numeric,
        112
      ),
      (
        'Kerala Honeymoon Dream',
        'Romantic Escapes India',
        'Alleppey',
        'honeymoon',
        'A romantic Kerala route through backwaters, hill stations, heritage corners, and beachside moments designed for couples.',
        array['Private Houseboat', 'Couple Candlelight Dinner', 'Tea Hills', 'Beach Resort Stay']::text[],
        6,
        5,
        true,
        true,
        4.90::numeric,
        276
      ),
      (
        'Kashmir Romantic Escape',
        'Romantic Escapes India',
        'Srinagar',
        'honeymoon',
        'A dreamy Kashmir honeymoon with scenic houseboat stays, mountain excursions, and intimate curated experiences.',
        array['Houseboat Stay', 'Shikara Ride', 'Valley Sightseeing', 'Romantic Room Decor']::text[],
        7,
        6,
        true,
        false,
        4.80::numeric,
        167
      ),
      (
        'Goa Honeymoon Special',
        'Romantic Escapes India',
        'Goa',
        'honeymoon',
        'A playful Goa honeymoon with beach sunsets, couple-friendly stays, nightlife options, and personalized downtime.',
        array['Beachfront Stay', 'Sunset Dinner', 'Private Airport Transfers', 'Couple Leisure Time']::text[],
        5,
        4,
        false,
        false,
        4.60::numeric,
        223
      ),
      (
        'Manali Honeymoon Package',
        'Romantic Escapes India',
        'Manali',
        'honeymoon',
        'A snowy Manali honeymoon built around cozy stays, mountain views, charming cafes, and romantic sightseeing.',
        array['Snow Point Visit', 'Romantic Room Setup', 'Mountain Excursions', 'Private Cab']::text[],
        6,
        5,
        false,
        false,
        4.70::numeric,
        145
      ),
      (
        'Andaman Honeymoon Bliss',
        'Romantic Escapes India',
        'Port Blair',
        'honeymoon',
        'An upscale island honeymoon with turquoise waters, private experiences, and resort stays across the Andamans.',
        array['Resort Stay', 'Private Island Excursions', 'Candlelight Dinner', 'Beach Photography Spots']::text[],
        7,
        6,
        false,
        false,
        4.80::numeric,
        98
      ),
      (
        'Goa Family Fun',
        'Happy Families Travel',
        'Goa',
        'family',
        'A family-first Goa package with comfortable stays, beach time, sightseeing, and enough flexibility for all age groups.',
        array['Family Resort Stay', 'Beach Day', 'Cruise Experience', 'Easy Transfers']::text[],
        5,
        4,
        false,
        true,
        4.40::numeric,
        189
      ),
      (
        'Manali Family Adventure',
        'Happy Families Travel',
        'Manali',
        'family',
        'A scenic mountain holiday with soft adventure, easy sightseeing, and family-friendly hotels across Manali.',
        array['Solang Valley', 'Family Excursions', 'Mountain Views', 'Kid-Friendly Stay']::text[],
        6,
        5,
        false,
        false,
        4.50::numeric,
        134
      ),
      (
        'Ooty Family Holiday',
        'Happy Families Travel',
        'Ooty',
        'family',
        'A smooth and comfortable Ooty itinerary for families who want cool weather, greenery, and easy local sightseeing.',
        array['Botanical Garden', 'Ooty Lake', 'Tea Factory Visit', 'Comfortable Hotel Stay']::text[],
        4,
        3,
        false,
        false,
        4.30::numeric,
        97
      ),
      (
        'Jaipur Family Heritage Tour',
        'Happy Families Travel',
        'Jaipur',
        'family',
        'A family-focused Jaipur itinerary that mixes forts, culture, shopping, and manageable sightseeing with guided support.',
        array['Amber Fort', 'City Palace', 'Heritage Walk', 'Local Shopping Stops']::text[],
        4,
        3,
        true,
        false,
        4.50::numeric,
        156
      ),
      (
        'Munnar Family Retreat',
        'Happy Families Travel',
        'Munnar',
        'family',
        'A peaceful Munnar break designed around tea hills, fresh air, light sightseeing, and roomy family accommodations.',
        array['Tea Gardens', 'Scenic Lookouts', 'Family Resort Stay', 'Nature Walks']::text[],
        5,
        4,
        false,
        false,
        4.40::numeric,
        88
      )
  ) as seeded(
    title,
    company_name,
    location_city,
    category_name,
    description,
    highlights,
    duration_days,
    duration_nights,
    is_featured,
    is_bestseller,
    avg_rating,
    review_count
  )
)
insert into public.packages (
  company_id,
  location_id,
  category_id,
  title,
  description,
  highlights,
  duration_days,
  duration_nights,
  min_group_size,
  max_group_size,
  inclusions,
  exclusions,
  amenities,
  status,
  is_featured,
  is_bestseller,
  avg_rating,
  review_count
)
select
  c.id,
  l.id,
  cat.id,
  ps.title,
  ps.description,
  ps.highlights,
  ps.duration_days,
  ps.duration_nights,
  1,
  20,
  array['Accommodation', 'Sightseeing', 'Local Transfers', 'Trip Assistance']::text[],
  array['Flights', 'Personal Expenses', 'Optional Activities']::text[],
  array['Comfort Stay', 'Guided Support', 'Curated Itinerary']::text[],
  'active',
  ps.is_featured,
  ps.is_bestseller,
  ps.avg_rating,
  ps.review_count
from package_seed ps
join public.companies c on c.name = ps.company_name
join public.locations l on l.city = ps.location_city
join public.categories cat on cat.name = ps.category_name;

with pricing_seed as (
  select *
  from (
    values
      ('Char Dham Yatra - Complete Tour', 28000::numeric, 24999::numeric),
      ('Varanasi Spiritual Journey', 8500::numeric, 7499::numeric),
      ('Shirdi Sai Baba Darshan', 6500::numeric, 5999::numeric),
      ('Tirupati Balaji Special', 7500::numeric, 6799::numeric),
      ('Rishikesh Spiritual Retreat', 12000::numeric, 10499::numeric),
      ('Manali Adventure Camp', 15000::numeric, 13499::numeric),
      ('Ladakh Bike Expedition', 35000::numeric, 31999::numeric),
      ('Rishikesh River Rafting Camp', 8000::numeric, 6999::numeric),
      ('Andaman Scuba Diving Package', 22000::numeric, 19499::numeric),
      ('Coorg Trek & Nature Camp', 9500::numeric, 8499::numeric),
      ('Goa Beach Holiday', 12000::numeric, 10999::numeric),
      ('Ooty Hill Station Escape', 9000::numeric, 7999::numeric),
      ('Kashmir Paradise Tour', 25000::numeric, 22499::numeric),
      ('Coorg Coffee Trails', 7500::numeric, 6799::numeric),
      ('Andaman Island Explorer', 28000::numeric, 25499::numeric),
      ('Kerala Honeymoon Dream', 32000::numeric, 28999::numeric),
      ('Kashmir Romantic Escape', 38000::numeric, 34499::numeric),
      ('Goa Honeymoon Special', 18000::numeric, 15999::numeric),
      ('Manali Honeymoon Package', 22000::numeric, 19499::numeric),
      ('Andaman Honeymoon Bliss', 42000::numeric, 37999::numeric),
      ('Goa Family Fun', 20000::numeric, 17999::numeric),
      ('Manali Family Adventure', 24000::numeric, 21499::numeric),
      ('Ooty Family Holiday', 14000::numeric, 12499::numeric),
      ('Jaipur Family Heritage Tour', 16000::numeric, 14499::numeric),
      ('Munnar Family Retreat', 18000::numeric, 15999::numeric)
  ) as seeded(title, base_price, discounted_price)
)
insert into public.package_pricing (
  package_id,
  label,
  min_people,
  max_people,
  base_price,
  discounted_price,
  currency,
  season,
  is_active
)
select
  p.id,
  pricing_option.label,
  pricing_option.min_people,
  pricing_option.max_people,
  pricing_option.base_price,
  pricing_option.discounted_price,
  'INR',
  'all',
  true
from pricing_seed ps
join public.packages p on p.title = ps.title
cross join lateral (
  values
    ('Standard'::text, 1, 6, ps.base_price, ps.discounted_price),
    ('Group (7+)'::text, 7, 20, round(ps.base_price * 0.85, 0), round(ps.discounted_price * 0.85, 0))
) as pricing_option(label, min_people, max_people, base_price, discounted_price);

insert into public.itineraries (
  package_id,
  day_number,
  title,
  description,
  meals,
  accommodation,
  activities,
  transport
)
values
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    1,
    'Arrival in Haridwar',
    'Check-in, Ganga Aarti at Har Ki Pauri',
    array['Dinner']::text[],
    'Hotel Ganga View, Haridwar',
    array['Ganga Aarti', 'Temple Visit', 'Market Walk']::text[],
    'Airport/Station pickup included'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    2,
    'Haridwar to Barkot',
    'Via Mussoorie and Kempty Falls',
    array['Breakfast', 'Dinner']::text[],
    'Hotel Shiv, Barkot',
    array['Kempty Falls visit', 'Mussoorie sightseeing']::text[],
    'Private AC cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    3,
    'Barkot to Yamunotri',
    'Trek to Yamunotri temple',
    array['Breakfast', 'Lunch', 'Dinner']::text[],
    'Camp near Janki Chatti',
    array['Yamunotri Temple Darshan', 'Hot Springs visit', 'Divya Shila']::text[],
    'Cab to Janki Chatti, then 6km trek'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    4,
    'Yamunotri to Uttarkashi',
    'Drive through scenic valleys',
    array['Breakfast', 'Dinner']::text[],
    'Hotel Alaknanda, Uttarkashi',
    array['Vishwanath Temple', 'Nehru Institute of Mountaineering visit']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    5,
    'Uttarkashi to Gangotri',
    'Visit Gangotri Glacier',
    array['Breakfast', 'Lunch', 'Dinner']::text[],
    'Hotel near Gangotri',
    array['Gangotri Temple Darshan', 'Bhagirathi River', 'Suryakund']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    6,
    'Gangotri to Guptkashi',
    'Scenic mountain drive',
    array['Breakfast', 'Dinner']::text[],
    'Hotel Kedar, Guptkashi',
    array['Ardh Narishwar Temple', 'Kashi Vishwanath Temple Guptkashi']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    7,
    'Guptkashi to Kedarnath',
    'Trek to Kedarnath',
    array['Breakfast', 'Lunch', 'Dinner']::text[],
    'GMVN guest house, Kedarnath',
    array['Kedarnath Temple Darshan', 'Bhairavnath Temple']::text[],
    'Cab to Gaurikund, then 16km trek or helicopter'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    8,
    'Kedarnath to Badrinath',
    'Via Joshimath',
    array['Breakfast', 'Dinner']::text[],
    'Hotel Devlok, Badrinath',
    array['Vasuki Tal trek optional', 'Chopta sightseeing']::text[],
    'Private cab via Joshimath'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    9,
    'Badrinath Darshan',
    'Full day at Badrinath',
    array['Breakfast', 'Lunch', 'Dinner']::text[],
    'Hotel Devlok, Badrinath',
    array['Badrinath Temple Darshan', 'Mana Village', 'Bhim Pul', 'Tapt Kund']::text[],
    'Local sightseeing by cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    10,
    'Badrinath to Rudraprayag',
    'Return journey begins',
    array['Breakfast', 'Dinner']::text[],
    'Hotel at Rudraprayag',
    array['Rudraprayag Sangam', 'Chamunda Devi Temple']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    11,
    'Rudraprayag to Rishikesh',
    'Scenic drive via Devprayag',
    array['Breakfast', 'Dinner']::text[],
    'Hotel Ganga Inn, Rishikesh',
    array['Devprayag Sangam', 'Ram Jhula', 'Laxman Jhula']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Char Dham Yatra - Complete Tour'),
    12,
    'Rishikesh to Haridwar',
    'Departure',
    array['Breakfast']::text[],
    'N/A - Departure day',
    array['Morning Yoga optional', 'Drop to station/airport']::text[],
    'Private cab to Haridwar'
  ),
  (
    (select id from public.packages where title = 'Goa Beach Holiday'),
    1,
    'Arrival in Goa',
    'North Goa beaches and nightlife',
    array['Dinner']::text[],
    '4-star resort, Calangute',
    array['Calangute Beach', 'Baga Beach', 'Anjuna flea market', 'Sunset cruise']::text[],
    'Airport pickup'
  ),
  (
    (select id from public.packages where title = 'Goa Beach Holiday'),
    2,
    'North Goa sightseeing',
    'Forts, churches, spice plantation',
    array['Breakfast', 'Dinner']::text[],
    '4-star resort, Calangute',
    array['Fort Aguada', 'Basilica of Bom Jesus', 'Spice Plantation tour', 'Dudhsagar Falls optional']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Goa Beach Holiday'),
    3,
    'South Goa',
    'Serene beaches and temples',
    array['Breakfast', 'Dinner']::text[],
    '4-star resort, Calangute',
    array['Palolem Beach', 'Colva Beach', 'Shri Mangueshi Temple', 'Local market']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Goa Beach Holiday'),
    4,
    'Water sports and leisure',
    'Adventure activities',
    array['Breakfast', 'Dinner']::text[],
    '4-star resort, Calangute',
    array['Jet skiing', 'Parasailing', 'Banana boat ride', 'Casino Night optional']::text[],
    'Hotel transfers'
  ),
  (
    (select id from public.packages where title = 'Goa Beach Holiday'),
    5,
    'Departure',
    'Morning beach walk and checkout',
    array['Breakfast']::text[],
    'N/A - Departure',
    array['Morning beach walk', 'Souvenir shopping', 'Airport drop']::text[],
    'Airport drop included'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    1,
    'Arrival in Cochin',
    'Colonial charm and romance',
    array['Dinner']::text[],
    'Heritage boutique hotel, Fort Kochi',
    array['Chinese Fishing Nets', 'Fort Kochi walk', 'Kathakali show', 'Sunset at seafront']::text[],
    'Airport pickup in decorated car'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    2,
    'Cochin to Munnar',
    'Tea gardens and mist',
    array['Breakfast', 'Dinner']::text[],
    'Luxury tea estate resort, Munnar',
    array['Tea Museum', 'Mattupetty Dam', 'Echo Point', 'Rose Garden']::text[],
    'Private cab through scenic ghats'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    3,
    'Munnar sightseeing',
    'Nature and romance',
    array['Breakfast', 'Dinner']::text[],
    'Luxury tea estate resort, Munnar',
    array['Eravikulam National Park', 'Attukal Waterfalls', 'Spice market', 'Couple spa']::text[],
    'Local sightseeing cab'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    4,
    'Munnar to Alleppey',
    'Backwaters await',
    array['Breakfast', 'Dinner']::text[],
    'Private houseboat, Alleppey backwaters',
    array['Houseboat check-in', 'Backwater cruise', 'Village walk', 'Canoe ride']::text[],
    'Cab to Alleppey jetty'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    5,
    'Alleppey to Kovalam',
    'Beach finale',
    array['Breakfast', 'Dinner']::text[],
    'Beach resort, Kovalam',
    array['Lighthouse beach', 'Ayurvedic massage', 'Seafood dinner by beach', 'Romantic bonfire']::text[],
    'Private cab'
  ),
  (
    (select id from public.packages where title = 'Kerala Honeymoon Dream'),
    6,
    'Kovalam departure',
    'Farewell to Kerala',
    array['Breakfast']::text[],
    'N/A - Departure',
    array['Morning beach walk', 'Souvenir shopping', 'Airport drop']::text[],
    'Airport drop in decorated car'
  );

update public.companies c
set
  avg_rating = company_stats.avg_rating,
  total_reviews = company_stats.total_reviews
from (
  select
    p.company_id,
    round((sum(p.avg_rating * p.review_count) / nullif(sum(p.review_count), 0))::numeric, 2) as avg_rating,
    sum(p.review_count) as total_reviews
  from public.packages p
  group by p.company_id
) as company_stats
where c.id = company_stats.company_id;

-- ============================================================
-- HOW TO ADD A NEW LOCATION
-- ============================================================
-- Required: city, state, region
-- Optional: country, latitude, longitude, is_popular, is_active
-- Example:
-- insert into public.locations (
--   city,
--   state,
--   region,
--   country,
--   latitude,
--   longitude,
--   is_popular,
--   is_active
-- )
-- values (
--   'Mysuru',
--   'Karnataka',
--   'South India',
--   'India',
--   12.295800,
--   76.639400,
--   false,
--   true
-- );

-- ============================================================
-- HOW TO ADD A NEW CATEGORY
-- ============================================================
-- Required: name, label, icon
-- Optional: description, is_active, display_order
-- Example:
-- insert into public.categories (
--   name,
--   label,
--   icon,
--   description,
--   is_active,
--   display_order
-- )
-- values (
--   'wellness',
--   'Wellness Retreats',
--   'sparkles',
--   'Relaxing packages focused on spa stays, yoga, healing, and mindful travel.',
--   true,
--   8
-- );

-- ============================================================
-- HOW TO ADD A NEW PACKAGE
-- ============================================================
-- Step 1: Insert the package row.
-- insert into public.packages (
--   company_id,
--   location_id,
--   category_id,
--   title,
--   description,
--   highlights,
--   duration_days,
--   duration_nights,
--   min_group_size,
--   max_group_size,
--   inclusions,
--   exclusions,
--   amenities,
--   status,
--   is_featured,
--   is_bestseller
-- )
-- values (
--   (select id from public.companies where slug = 'go-explore-holidays'),
--   (select id from public.locations where city = 'Munnar'),
--   (select id from public.categories where name = 'leisure'),
--   'Munnar Tea Valley Escape',
--   'A scenic Munnar holiday with tea estates, waterfalls, and easy-paced leisure.',
--   array['Tea Estate Tour', 'Waterfall Visit', 'Valley Viewpoints']::text[],
--   4,
--   3,
--   1,
--   12,
--   array['Hotel Stay', 'Breakfast', 'Sightseeing', 'Transfers']::text[],
--   array['Flights', 'Lunch', 'Personal Expenses']::text[],
--   array['Mountain View Rooms', 'Private Transfers', 'Curated Itinerary']::text[],
--   'draft',
--   false,
--   false
-- );
--
-- Step 2: Insert pricing rows.
-- insert into public.package_pricing (
--   package_id,
--   label,
--   min_people,
--   max_people,
--   base_price,
--   discounted_price,
--   currency,
--   season,
--   is_active
-- )
-- values
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     'Standard',
--     1,
--     6,
--     14500,
--     12999,
--     'INR',
--     'all',
--     true
--   ),
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     'Group (7+)',
--     7,
--     20,
--     12325,
--     11049,
--     'INR',
--     'all',
--     true
--   );
--
-- Step 3: Insert package images.
-- insert into public.package_images (
--   package_id,
--   url,
--   public_id,
--   alt_text,
--   is_cover,
--   display_order,
--   uploaded_by
-- )
-- values
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     'https://res.cloudinary.com/demo/image/upload/xyz/munnar-cover.jpg',
--     'xyz/munnar-cover',
--     'Tea gardens in Munnar',
--     true,
--     1,
--     '00000000-0000-0000-0000-000000000001'
--   ),
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     'https://res.cloudinary.com/demo/image/upload/xyz/munnar-viewpoint.jpg',
--     'xyz/munnar-viewpoint',
--     'Viewpoint in Munnar',
--     false,
--     2,
--     '00000000-0000-0000-0000-000000000001'
--   );
--
-- Step 4: Insert itinerary days.
-- insert into public.itineraries (
--   package_id,
--   day_number,
--   title,
--   description,
--   meals,
--   accommodation,
--   activities,
--   transport
-- )
-- values
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     1,
--     'Arrival in Munnar',
--     'Check-in and evening plantation walk',
--     array['Dinner']::text[],
--     'Tea estate resort, Munnar',
--     array['Check-in', 'Plantation walk', 'Bonfire']::text[],
--     'Private pickup from Cochin'
--   ),
--   (
--     (select id from public.packages where title = 'Munnar Tea Valley Escape'),
--     2,
--     'Munnar sightseeing',
--     'Tea museum, viewpoints, and waterfalls',
--     array['Breakfast', 'Dinner']::text[],
--     'Tea estate resort, Munnar',
--     array['Tea Museum', 'Echo Point', 'Waterfall stop']::text[],
--     'Local sightseeing cab'
--   );

-- ============================================================
-- HOW TO APPROVE A COMPANY
-- ============================================================
-- update public.companies
-- set
--   status = 'approved',
--   is_verified = true,
--   updated_at = now()
-- where id = '11111111-1111-1111-1111-111111111111';

-- ============================================================
-- HOW TO PUBLISH A PACKAGE
-- ============================================================
-- update public.packages
-- set
--   status = 'active',
--   updated_at = now()
-- where id = '22222222-2222-2222-2222-222222222222';

-- ============================================================
-- HOW TO CREATE AN ADMIN USER
-- ============================================================
-- 1. Sign up normally through Supabase Auth.
-- 2. Then run:
-- update public.users
-- set role = 'admin'
-- where id = '<uuid>';

-- ============================================================
-- OPTIONAL PHASE 3: POSTGIS
-- ============================================================
-- Enable PostGIS only when you need proximity or map-based queries.
-- create extension if not exists "postgis" with schema extensions;
--
-- create index locations_coordinates_gix on public.locations
--   using gist ((st_setsrid(st_makepoint(longitude, latitude), 4326)::geography))
--   where latitude is not null and longitude is not null;
