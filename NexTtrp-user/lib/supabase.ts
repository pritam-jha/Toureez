/**
 * @file lib/supabase.ts
 * @description Supabase client singleton with AsyncStorage session persistence.
 *
 * IMPORTANT: Import `supabase` from this file only inside lib/api/* files.
 * Screens and components must NEVER import supabase directly — all data
 * access goes through the typed API layer in lib/api/*.
 */

/*
 * ============================================================
 * SUPABASE SQL SCHEMA — Run this in Supabase SQL Editor
 * ============================================================
 *
 * -- ============================================================
 * -- EXTENSIONS
 * -- ============================================================
 * create extension if not exists "uuid-ossp";
 * create extension if not exists "pg_trgm";
 *
 * -- ============================================================
 * -- ENUMS
 * -- ============================================================
 * create type company_status as enum ('pending', 'approved', 'rejected');
 * create type package_status as enum ('draft', 'pending', 'active', 'rejected');
 * create type package_category as enum ('pilgrimage', 'adventure', 'leisure', 'honeymoon', 'family');
 *
 * -- ============================================================
 * -- TABLES
 * -- ============================================================
 *
 * -- 1. USERS (extends auth.users)
 * create table public.users (
 *   id            uuid primary key references auth.users(id) on delete cascade,
 *   full_name     text,
 *   avatar_url    text,
 *   phone         text,
 *   city          text,
 *   state         text,
 *   created_at    timestamptz not null default now(),
 *   updated_at    timestamptz not null default now()
 * );
 *
 * -- 2. COMPANIES
 * create table public.companies (
 *   id                  uuid primary key default uuid_generate_v4(),
 *   owner_id            uuid not null references auth.users(id) on delete cascade,
 *   name                text not null,
 *   logo_url            text,
 *   cover_url           text,
 *   about               text,
 *   gst_number          text,
 *   trade_license_url   text,
 *   status              company_status not null default 'pending',
 *   is_verified         boolean not null default false,
 *   created_at          timestamptz not null default now(),
 *   updated_at          timestamptz not null default now()
 * );
 *
 * -- 3. PACKAGES
 * create table public.packages (
 *   id                uuid primary key default uuid_generate_v4(),
 *   company_id        uuid not null references public.companies(id) on delete cascade,
 *   title             text not null,
 *   description       text,
 *   destination       text not null,
 *   state             text not null,
 *   category          package_category not null,
 *   duration_days     integer not null check (duration_days > 0),
 *   price             numeric(10,2) not null check (price >= 0),
 *   discounted_price  numeric(10,2) check (discounted_price >= 0),
 *   max_group_size    integer not null default 20,
 *   inclusions        text[] not null default '{}',
 *   exclusions        text[] not null default '{}',
 *   amenities         text[] not null default '{}',
 *   status            package_status not null default 'draft',
 *   rating            numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
 *   review_count      integer not null default 0,
 *   fts               tsvector generated always as (
 *                       to_tsvector('english',
 *                         coalesce(title, '') || ' ' ||
 *                         coalesce(destination, '') || ' ' ||
 *                         coalesce(state, ''))
 *                     ) stored,
 *   created_at        timestamptz not null default now(),
 *   updated_at        timestamptz not null default now()
 * );
 *
 * create index packages_fts_idx on public.packages using gin(fts);
 * create index packages_destination_idx on public.packages(destination);
 * create index packages_category_idx on public.packages(category);
 * create index packages_price_idx on public.packages(price);
 * create index packages_status_idx on public.packages(status);
 *
 * -- 4. PACKAGE IMAGES
 * create table public.package_images (
 *   id              uuid primary key default uuid_generate_v4(),
 *   package_id      uuid not null references public.packages(id) on delete cascade,
 *   url             text not null,
 *   public_id       text not null,
 *   is_cover        boolean not null default false,
 *   display_order   integer not null default 0,
 *   created_at      timestamptz not null default now()
 * );
 *
 * create index package_images_package_idx on public.package_images(package_id);
 *
 * -- 5. WISHLISTS
 * create table public.wishlists (
 *   id          uuid primary key default uuid_generate_v4(),
 *   user_id     uuid not null references auth.users(id) on delete cascade,
 *   package_id  uuid not null references public.packages(id) on delete cascade,
 *   created_at  timestamptz not null default now(),
 *   unique(user_id, package_id)
 * );
 *
 * create index wishlists_user_idx on public.wishlists(user_id);
 *
 * -- ============================================================
 * -- TRIGGERS
 * -- ============================================================
 *
 * -- Auto-create user profile on signup
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.users (id, full_name, avatar_url)
 *   values (
 *     new.id,
 *     new.raw_user_meta_data->>'full_name',
 *     new.raw_user_meta_data->>'avatar_url'
 *   );
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 *
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 *
 * -- Auto-update updated_at on all tables
 * create or replace function public.set_updated_at()
 * returns trigger as $$
 * begin
 *   new.updated_at = now();
 *   return new;
 * end;
 * $$ language plpgsql;
 *
 * create trigger users_updated_at
 *   before update on public.users
 *   for each row execute procedure public.set_updated_at();
 *
 * create trigger companies_updated_at
 *   before update on public.companies
 *   for each row execute procedure public.set_updated_at();
 *
 * create trigger packages_updated_at
 *   before update on public.packages
 *   for each row execute procedure public.set_updated_at();
 *
 * -- ============================================================
 * -- ROW LEVEL SECURITY (RLS)
 * -- ============================================================
 *
 * alter table public.users enable row level security;
 * alter table public.companies enable row level security;
 * alter table public.packages enable row level security;
 * alter table public.package_images enable row level security;
 * alter table public.wishlists enable row level security;
 *
 * -- USERS
 * create policy "Users can view their own profile"
 *   on public.users for select using (auth.uid() = id);
 * create policy "Users can insert their own profile"
 *   on public.users for insert with check (auth.uid() = id);
 * create policy "Users can update their own profile"
 *   on public.users for update using (auth.uid() = id);
 *
 * -- COMPANIES
 * create policy "Anyone can view approved companies"
 *   on public.companies for select using (status = 'approved');
 * create policy "Owner can view their own company"
 *   on public.companies for select using (auth.uid() = owner_id);
 * create policy "Owner can insert their own company"
 *   on public.companies for insert with check (auth.uid() = owner_id);
 * create policy "Owner can update their own company"
 *   on public.companies for update using (auth.uid() = owner_id);
 *
 * -- PACKAGES
 * create policy "Anyone can view active packages"
 *   on public.packages for select using (status = 'active');
 * create policy "Company owner can view all their packages"
 *   on public.packages for select
 *   using (exists (
 *     select 1 from public.companies
 *     where companies.id = packages.company_id
 *     and companies.owner_id = auth.uid()
 *   ));
 * create policy "Company owner can insert packages"
 *   on public.packages for insert
 *   with check (exists (
 *     select 1 from public.companies
 *     where companies.id = company_id
 *     and companies.owner_id = auth.uid()
 *   ));
 * create policy "Company owner can update their packages"
 *   on public.packages for update
 *   using (exists (
 *     select 1 from public.companies
 *     where companies.id = packages.company_id
 *     and companies.owner_id = auth.uid()
 *   ));
 *
 * -- PACKAGE IMAGES
 * create policy "Anyone can view images of active packages"
 *   on public.package_images for select
 *   using (exists (
 *     select 1 from public.packages
 *     where packages.id = package_images.package_id
 *     and packages.status = 'active'
 *   ));
 * create policy "Company owner can manage their package images"
 *   on public.package_images for all
 *   using (exists (
 *     select 1 from public.packages
 *     join public.companies on companies.id = packages.company_id
 *     where packages.id = package_images.package_id
 *     and companies.owner_id = auth.uid()
 *   ));
 *
 * -- WISHLISTS
 * create policy "Users can view their own wishlist"
 *   on public.wishlists for select using (auth.uid() = user_id);
 * create policy "Users can add to their own wishlist"
 *   on public.wishlists for insert with check (auth.uid() = user_id);
 * create policy "Users can remove from their own wishlist"
 *   on public.wishlists for delete using (auth.uid() = user_id);
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/config';

/**
 * Singleton Supabase client configured with:
 * - AsyncStorage for session persistence across app restarts
 * - Auto token refresh enabled
 * - detectSessionInUrl disabled (not applicable in React Native)
 *
 * The `auth.storage` override is what makes sessions survive app restarts
 * on both iOS and Android — without it, users would be logged out every time.
 */
export const supabase = createClient(
  Config.supabaseUrl,
  Config.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
