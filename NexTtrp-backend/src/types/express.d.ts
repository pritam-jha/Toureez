import type { AuthenticatedUser } from './index';

declare global {
  namespace Express {
    /**
     * Express request enriched by authentication middleware when a Supabase JWT is valid.
     */
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
