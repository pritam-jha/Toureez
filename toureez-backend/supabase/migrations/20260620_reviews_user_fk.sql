-- Fixes the foreign key from reviews.user_id so it points at public.users.id
-- instead of auth.users.id.
--
-- Root cause of the GET /api/v1/reviews/package/:id 500 error: reviewService.ts
-- and vendorService.ts query reviews with the PostgREST embedded-relationship
-- syntax `user:users(full_name, avatar_url)`, which resolves "users" to
-- public.users. When the reviews table was first created, Postgres
-- auto-generated a default-named constraint `reviews_user_id_fkey` pointing
-- at auth.users (the implicit target at the time) instead of public.users.
-- PostgREST couldn't find a reviews -> public.users relationship and returned
-- a "could not find relationship" (PGRST200) error, surfaced by the backend
-- as a generic 500.
--
-- public.users.id is always equal to auth.users.id (created 1:1 via the
-- handle_new_user trigger), so repointing the FK is safe against existing data.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'reviews_user_id_fkey'
      and confrelid::regclass::text = 'auth.users'
  ) then
    alter table public.reviews drop constraint reviews_user_id_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_user_id_fkey'
  ) then
    alter table public.reviews
      add constraint reviews_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end $$;

-- PostgREST caches the schema graph; reload it so the new relationship is
-- visible to the embedded-resource queries immediately instead of waiting
-- for the next automatic refresh.
notify pgrst, 'reload schema';
