import { Router } from 'express';
import { success } from '../utils/response';

interface HealthCheck {
  service: string;
  status: 'ok';
  uptime_seconds: number;
  timestamp: string;
}

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const health: HealthCheck = {
    service: 'xyz-backend',
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return success(res, health);
});
