-- Add Razorpay columns to the payments table.
-- Safe to re-run: uses IF NOT EXISTS guards.
-- Run once in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- Add payment_method column if missing
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'razorpay';

-- Add Razorpay-specific columns if missing
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id   text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature  text,
  ADD COLUMN IF NOT EXISTS currency            text NOT NULL DEFAULT 'INR';

-- Index on razorpay_payment_id for fast lookups
CREATE INDEX IF NOT EXISTS payments_razorpay_payment_id_idx
  ON public.payments(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Verify the table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;
