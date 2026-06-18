# Toureez Admin App

Standalone React Native (Expo) admin portal for the Toureez platform.

## Setup

```bash
cd toureez-admin-app
npm install

# Copy env file and fill in your values
cp .env.example .env
```

`.env` values needed:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

> Use the **same** Supabase URL and anon key as `toureez-user`.  
> Use the **same** backend API URL pointing to `toureez-backend`.

## Run

```bash
npm start          # Expo Go / dev build
npm run android
npm run ios
```

## Login

Only accounts with `role = 'admin'` in `public.users` can sign in.  
Any other role is rejected at the login screen with "Access denied."

To promote a user to admin:
```sql
UPDATE public.users SET role = 'admin' WHERE id = '<user-uuid>';
```

## Structure

```
app/
├── _layout.tsx          Root — auth bootstrap, TanStack Query, routing
├── (auth)/login.tsx     Admin sign-in screen
└── (admin)/
    ├── index.tsx        Dashboard
    ├── vendors/         Vendor approval / rejection
    ├── packages/        Package moderation
    ├── users/           User role management
    ├── bookings/        Booking status management
    ├── reviews/         Review publish / verify
    ├── categories.tsx   Category CRUD
    ├── locations.tsx    Location CRUD
    ├── payouts.tsx      Payout management
    └── audit-logs.tsx   Audit trail viewer
```

## Assets

Replace the placeholder files in `assets/` with your actual icons before building:
- `assets/icon.png` (1024×1024)
- `assets/adaptive-icon.png` (1024×1024, Android)
- `assets/splash.png`
