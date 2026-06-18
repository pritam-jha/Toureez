-- Enquiry system: lets travelers message a vendor about a package without
-- exposing either party's contact details. All access goes through the
-- backend (supabaseAdmin), but RLS is enabled for defence in depth.
set search_path = public, extensions;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  user_unread_count integer not null default 0,
  vendor_unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiry_messages (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'vendor')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_user_id_idx on public.enquiries (user_id);
create index if not exists enquiries_company_id_idx on public.enquiries (company_id);
create index if not exists enquiries_package_id_idx on public.enquiries (package_id);
create index if not exists enquiries_last_message_at_idx on public.enquiries (last_message_at desc);
create index if not exists enquiry_messages_enquiry_id_idx on public.enquiry_messages (enquiry_id, created_at);

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'enquiries'
      and trigger_name = 'enquiries_updated_at'
  ) then
    create trigger enquiries_updated_at
      before update on public.enquiries
      for each row execute procedure public.set_updated_at();
  end if;
end
$$;

alter table public.enquiries enable row level security;
alter table public.enquiry_messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'enquiries_user_select') then
    create policy enquiries_user_select on public.enquiries
    for select
    using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'enquiries_company_owner_select') then
    create policy enquiries_company_owner_select on public.enquiries
    for select
    using (
      exists (
        select 1 from public.companies c
        where c.id = enquiries.company_id
          and c.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'enquiries_user_insert') then
    create policy enquiries_user_insert on public.enquiries
    for insert
    with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiry_messages' and policyname = 'enquiry_messages_participant_select') then
    create policy enquiry_messages_participant_select on public.enquiry_messages
    for select
    using (
      exists (
        select 1 from public.enquiries e
        where e.id = enquiry_messages.enquiry_id
          and (
            e.user_id = auth.uid()
            or exists (
              select 1 from public.companies c
              where c.id = e.company_id and c.owner_id = auth.uid()
            )
          )
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiry_messages' and policyname = 'enquiry_messages_participant_insert') then
    create policy enquiry_messages_participant_insert on public.enquiry_messages
    for insert
    with check (
      sender_id = auth.uid()
      and exists (
        select 1 from public.enquiries e
        where e.id = enquiry_messages.enquiry_id
          and (
            e.user_id = auth.uid()
            or exists (
              select 1 from public.companies c
              where c.id = e.company_id and c.owner_id = auth.uid()
            )
          )
      )
    );
  end if;
end
$$;
