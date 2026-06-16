-- Admin approve/reject actions for vendors and packages never sent notifications
-- because the required types were missing from the check constraint.
-- Add vendor_approved, vendor_rejected, and package_rejected so the backend
-- can notify company owners when their account or listing is actioned.
set search_path = public, extensions;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'booking_confirmed',
      'payment_received',
      'review_received',
      'package_approved',
      'package_rejected',
      'vendor_approved',
      'vendor_rejected',
      'wishlist_price_drop',
      'booking_received'
    )
  );
