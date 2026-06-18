import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary SDK instance.
 *
 * Configuration is applied lazily — the server starts even if Cloudinary
 * credentials are not yet set. The first actual upload attempt will throw
 * a clear error message if the credentials are missing.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

const cloudName  = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '';
const apiKey     = process.env.CLOUDINARY_API_KEY?.trim()     ?? '';
const apiSecret  = process.env.CLOUDINARY_API_SECRET?.trim()  ?? '';

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

/**
 * Returns the configured Cloudinary instance.
 * Throws a descriptive error if credentials were not supplied,
 * so the mistake is caught at the call site rather than at startup.
 */
function getCloudinary(): typeof cloudinary {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. ' +
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET ' +
      'in your environment variables.',
    );
  }
  return cloudinary;
}

export { getCloudinary as cloudinary };
