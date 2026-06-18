/**
 * @file services/deviceTokenService.ts
 * @description Push notification device token management.
 *
 * Saves Expo push tokens per device so notifications can be sent
 * to specific users via the Expo Push API.
 */

import { supabaseAdmin } from '../lib/supabase';
import { AppError, ERROR_MESSAGES } from '../constants/errors';
import { logger } from '../utils/logger';

const throwDb = (op: string, err: unknown): never => {
  logger.error({ err, op: `deviceTokenService.${op}` }, 'DB error');
  throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 500);
};

/**
 * Upserts a device push token for the given user.
 * If the same token already exists it is refreshed; old tokens for the
 * same device are replaced.
 */
export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android',
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('device_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );

  if (error !== null) throwDb('saveDeviceToken', error);
}

/**
 * Removes a device token on logout so the user no longer receives push notifications.
 */
export async function removeDeviceToken(token: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('device_tokens')
    .delete()
    .eq('token', token);

  if (error !== null) throwDb('removeDeviceToken', error);
}

/**
 * Returns all active push tokens for a user (across their devices).
 */
export async function getTokensForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error !== null) throwDb('getTokensForUser', error);

  return ((data as { token: string }[] | null) ?? []).map((r) => r.token);
}
