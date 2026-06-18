import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { success } from '../utils/response';
import { logger } from '../utils/logger';

interface HealthCheck {
  service: string;
  status: 'ok' | 'degraded';
  uptime_seconds: number;
  timestamp: string;
  checks: {
    database: 'ok' | 'error';
  };
}

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';

  try {
    // Lightweight DB ping — fetches zero rows from users (always exists, no table scan).
    // Using limit(0) keeps network cost near-zero while confirming the connection is alive.
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(0);
    if (error) {
      dbStatus = 'error';
      logger.warn({ err: error }, 'Health check: database ping failed');
    }
  } catch (err) {
    dbStatus = 'error';
    logger.warn({ err }, 'Health check: database ping threw');
  }

  const overall: HealthCheck['status'] = dbStatus === 'error' ? 'degraded' : 'ok';

  const health: HealthCheck = {
    service: 'toureez-backend',
    status: overall,
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database: dbStatus },
  };

  // Return 200 even when degraded so load-balancers keep routing traffic
  // while the database recovers; dashboards use the status field to alert.
  return success(res, health);
});
