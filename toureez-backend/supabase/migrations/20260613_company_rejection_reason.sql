-- Admin "Reject vendor" writes a rejection_reason onto companies, but the
-- column was never added — every reject request fails with a column-not-found
-- error from PostgREST. Add it so admin rejections can persist their reason.
set search_path = public, extensions;

alter table public.companies
  add column if not exists rejection_reason text;
