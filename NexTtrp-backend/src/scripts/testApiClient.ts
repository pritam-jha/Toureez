import { config } from '../config';
import { apiClient, logApiClientError } from '../lib/api/client';
import type { ApiResponse } from '../types';

interface HealthCheck {
  service: string;
  status: 'ok';
  uptime_seconds: number;
  timestamp: string;
}

const endpoint = '/api/v1/health';

const run = async (): Promise<void> => {
  console.log(`[api-client-test] API_BASE_URL=${config.API_BASE_URL}`);
  console.log(`[api-client-test] GET ${apiClient.resolveUrl(endpoint)}`);

  try {
    const response = await apiClient.get<ApiResponse<HealthCheck>>(endpoint);
    console.log('[api-client-test] Success:', response);
  } catch (caughtError) {
    logApiClientError(caughtError, endpoint);
    process.exitCode = 1;
  }
};

void run();
