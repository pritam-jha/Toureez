# NEXTTRP Backend

NEXTTRP Backend is the Node.js and Express API layer for an India-focused travel package comparison app. The Expo mobile app calls this backend for business logic, while Supabase provides PostgreSQL, Auth, and Storage; this service verifies Supabase JWTs, uses the Supabase service role key for trusted server-side data access, and exposes versioned routes under `/api/v1`.

## Tech Stack

- Node.js
- Express
- TypeScript
- Supabase JavaScript SDK
- PostgreSQL via Supabase
- Zod
- Helmet
- CORS
- Morgan
- Express Rate Limit
- Cloudinary

## Local Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

4. Fill in the Supabase URL, anon key, service role key, Cloudinary credentials, API base URL, CORS origins, and rate limit values in `.env`. The backend requires `SUPABASE_SERVICE_ROLE_KEY` at startup because trusted server-side routes use the Supabase admin client.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. In a second terminal, verify that the centralized API client can reach the Node.js server:

   ```bash
   npm run test:api-client
   ```

   Set `API_BASE_URL` in `.env` or the shell to redirect all calls made by `src/lib/api/client.ts`.

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | Check that the Node.js API server is reachable. |
| GET | `/api/v1/packages` | Public | Search and filter active packages with pagination. |
| GET | `/api/v1/packages/compare?ids=id1,id2` | Public | Compare 2 to 4 active packages with computed badges. |
| GET | `/api/v1/packages/featured` | Public | Fetch up to 6 featured active packages ordered by rating. |
| GET | `/api/v1/packages/:id` | Public | Fetch package details with images, itinerary, pricing, company, location, and category. |
| GET | `/api/v1/wishlist` | Bearer JWT | Fetch the authenticated user's wishlisted packages. |
| POST | `/api/v1/wishlist/toggle` | Bearer JWT | Add or remove a package from the authenticated user's wishlist. |
| GET | `/api/v1/users/profile` | Bearer JWT | Fetch the authenticated user's public profile. |
| PATCH | `/api/v1/users/profile` | Bearer JWT | Update the authenticated user's public profile. |
| GET | `/api/v1/locations` | Public | Fetch active locations, optionally filtered with `?popular=true`. |
| GET | `/api/v1/categories` | Public | Fetch active categories ordered by `display_order`. |

## Railway Deployment

1. Push the repository to GitHub.
2. Connect the GitHub repository to Railway.
3. Add all required environment variables from `.env.example` in Railway.
4. Set the Railway start command:

   ```bash
   npm start
   ```

5. Railway will install dependencies, build the project, and auto-deploy on every push.
