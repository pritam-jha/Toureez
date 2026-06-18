-- Adds support for attaching photos to a review.
-- Each element: { "url": "<cloudinary secure_url>", "public_id": "<cloudinary public_id>" }
alter table public.reviews
  add column if not exists images jsonb not null default '[]'::jsonb;
