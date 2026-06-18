-- Vendors never received any notifications because the notifications table's
-- check constraint didn't allow a vendor-facing "new booking received" type.
-- Widen it so the backend can notify a company's owner when their package
-- gets booked.
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
      'wishlist_price_drop',
      'booking_received'
    )
  );
