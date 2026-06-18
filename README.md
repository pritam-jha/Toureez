# Toureez — Travel Package Comparison App

A full-stack travel package comparison app for India.

- **Frontend:** Expo + React Native + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database/Auth:** Supabase
- **State:** Zustand + TanStack Query

---

## Getting Started (after cloning)

### Prerequisites

- Node.js 18+
- npm
- Expo Go app on your phone (iOS or Android)
- Your phone and laptop on the **same WiFi network**

---

### 1. Find your machine's LAN IP

**Windows:**
```
ipconfig
```
Look for **IPv4 Address** — e.g. `192.168.1.42`

**Mac/Linux:**
```
ifconfig
```
Look for `inet` under your WiFi adapter.

---

### 2. Set up the backend `.env`

Create `Toureez-backend/.env` (copy from `Toureez-backend/.env.example`):

```env
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

SUPABASE_URL=https://rtyvmyvidkrwmeeeioww.supabase.co
SUPABASE_ANON_KEY=<get from project owner>
SUPABASE_SERVICE_ROLE_KEY=<get from project owner>

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081,http://<YOUR_LAN_IP>:8081,exp://<YOUR_LAN_IP>:8081

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Replace `<YOUR_LAN_IP>` with the IP from Step 1.

---

### 3. Set up the frontend `.env`

Create `Toureez-frontend/.env` (copy from `Toureez-frontend/.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://rtyvmyvidkrwmeeeioww.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<get from project owner>

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_PRESET=Toureez-unsigned

# Replace with YOUR machine's LAN IP — NOT localhost
# localhost does not work on a physical Android/iOS device
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:3000/api/v1
```

Replace `<YOUR_LAN_IP>` with the IP from Step 1.

---

### 4. Install dependencies

```bash
# Backend
cd Toureez-backend
npm install

# Frontend
cd Toureez-frontend
npm install
```

---

### 5. Start the backend

```bash
cd Toureez-backend
npm run dev
```

You should see: `Toureez API server listening on port 3000`

---

### 6. Start the frontend

```bash
cd Toureez-frontend
npx expo start --clear
```

- Press `Y` if asked to use a different port (e.g. 8082)
- Scan the QR code with **Expo Go** on your phone

---

## Why the home screen shows only skeletons

The skeleton loaders are the loading state for API calls. If they never resolve, it means:

1. **`.env` file is missing** — the app has no API URL
2. **Backend is not running** — nothing is listening on port 3000
3. **Wrong IP in `.env`** — `localhost` doesn't work on a physical device; use your LAN IP
4. **Phone not on same WiFi** — the phone can't reach your laptop

---

## Project Structure

```
Toureez/
├── Toureez-backend/          # Node.js/Express API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, rate limiting, logging
│   │   └── lib/          # Supabase client
│   └── .env.example
│
└── Toureez-frontend/         # Expo React Native app
    ├── app/              # Expo Router screens
    ├── components/       # UI components
    ├── hooks/            # TanStack Query hooks
    ├── store/            # Zustand stores
    ├── lib/              # API client, Supabase
    ├── constants/        # Colors, config
    └── .env.example
```

---

## Environment Variables Reference

### Backend (`Toureez-backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase JWT anon key (starts with `eyJ...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role JWT key for backend-only admin access |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Frontend (`Toureez-frontend/.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase JWT anon key |
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL — use LAN IP, not localhost |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `EXPO_PUBLIC_CLOUDINARY_PRESET` | Cloudinary unsigned upload preset |
