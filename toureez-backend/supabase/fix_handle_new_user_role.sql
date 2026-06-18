-- Fix handle_new_user trigger to respect role passed in signup metadata.
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Problem: vendor/admin signups pass role:'company_owner' in user_metadata
-- but the default trigger ignores it, inserting every user with role='traveler'.
--
-- Solution: read raw_user_meta_data->>'role' and whitelist allowed values.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Only accept whitelisted role values from metadata; default to 'traveler'.
  v_role := CASE new.raw_user_meta_data->>'role'
    WHEN 'company_owner' THEN 'company_owner'
    WHEN 'admin'         THEN 'admin'
    ELSE                      'traveler'
  END;

  INSERT INTO public.users (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        role       = EXCLUDED.role;

  RETURN new;
END;
$$;
