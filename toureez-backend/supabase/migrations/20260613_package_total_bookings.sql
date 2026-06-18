-- packages.total_bookings was never updated when a booking is created, so the
-- admin package detail screen always shows 0 even for packages with bookings.
-- Backfill existing counts from the bookings table and add an atomic
-- increment function the backend calls after inserting a booking.
set search_path = public, extensions;

update public.packages p
set total_bookings = (
  select count(*) from public.bookings b where b.package_id = p.id
)
where p.total_bookings <> (
  select count(*) from public.bookings b where b.package_id = p.id
);

create or replace function public.increment_package_total_bookings(p_package_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.packages
  set total_bookings = total_bookings + 1
  where id = p_package_id;
$$;
