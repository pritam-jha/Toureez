import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    throw new Error(`${key} environment variable is required`);
  }

  return value;
};

cloudinary.config({
  cloud_name: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  api_key: getRequiredEnv('CLOUDINARY_API_KEY'),
  api_secret: getRequiredEnv('CLOUDINARY_API_SECRET'),
});

/**
 * Cloudinary SDK instance configured from environment variables.
 */
export { cloudinary };
