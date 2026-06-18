import { z } from 'zod';

const indianMobileRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

const optionalTrimmedString = (minLength = 1, maxLength = 255): z.ZodOptional<z.ZodString> =>
  z.string().trim().min(minLength).max(maxLength).optional();

const optionalNumberFromQuery = (schema: z.ZodNumber): z.ZodOptional<z.ZodEffects<z.ZodTypeAny, number, unknown>> =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value[0];
      }

      return value;
    }, schema)
    .optional();

const optionalBooleanFromQuery = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const rawValue = Array.isArray(value) ? value[0] : value;

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return rawValue;
  }, z.boolean())
  .optional();

const amenitiesFromQuery = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }, z.array(z.string().min(1)).min(1))
  .optional();

/**
 * Validates and normalizes public package search query parameters.
 */
export const SearchFiltersSchema = z
  .object({
    destination: optionalTrimmedString(1, 120),
    state: optionalTrimmedString(1, 120),
    category: optionalTrimmedString(1, 120),
    min_price: optionalNumberFromQuery(z.coerce.number().min(0)),
    max_price: optionalNumberFromQuery(z.coerce.number().min(0)),
    duration_days: optionalNumberFromQuery(z.coerce.number().int().min(1)),
    min_rating: optionalNumberFromQuery(z.coerce.number().min(0).max(5)),
    amenities: amenitiesFromQuery,
    is_featured: optionalBooleanFromQuery,
    page: z
      .preprocess((value) => (value === undefined || value === '' ? 1 : value), z.coerce.number().int().min(1))
      .default(1),
    limit: z
      .preprocess((value) => (value === undefined || value === '' ? 10 : value), z.coerce.number().int().min(1).max(50))
      .default(10),
  })
  .refine(
    (value) =>
      value.min_price === undefined ||
      value.max_price === undefined ||
      value.min_price <= value.max_price,
    {
      message: 'min_price cannot be greater than max_price',
      path: ['min_price'],
    },
  );

/**
 * Validates comma-separated package UUIDs for comparison.
 */
export const CompareIdsSchema = z.object({
  ids: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    )
    .pipe(z.array(z.string().uuid()).min(2).max(4)),
});

/**
 * Validates profile fields accepted by the profile update endpoint.
 */
export const UpdateProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().regex(indianMobileRegex, 'Invalid Indian mobile number').optional(),
    city: z.string().trim().min(1).max(120).optional(),
    state: z.string().trim().min(1).max(120).optional(),
    avatar_url: z.string().trim().url().optional(),
  })
  .strict();

/**
 * Validates wishlist toggle request bodies.
 */
export const ToggleWishlistSchema = z
  .object({
    package_id: z.string().uuid(),
  })
  .strict();

/**
 * Validates a UUID route parameter named id.
 */
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Validates query parameters for the locations endpoint.
 */
export const LocationsQuerySchema = z.object({
  popular: optionalBooleanFromQuery,
});

/**
 * Validates both :id and :imageId UUID route parameters for image endpoints.
 */
export const ImageParamsSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
});

/**
 * Validates the body when a vendor saves a Cloudinary-uploaded image.
 * The file is uploaded directly from the client to Cloudinary; only the
 * resulting metadata (URL + public_id) is sent to our backend.
 *
 * Security: we validate that the URL is served from Cloudinary's CDN
 * to prevent vendors from injecting arbitrary external URLs as "images".
 */
export const PackageImageSaveSchema = z
  .object({
    url: z
      .string()
      .url('url must be a valid URL')
      .refine((url) => {
        try {
          const parsed = new URL(url);
          return (
            parsed.protocol === 'https:' &&
            (parsed.hostname === 'res.cloudinary.com' ||
              parsed.hostname.endsWith('.cloudinary.com'))
          );
        } catch {
          return false;
        }
      }, 'Image URL must be served from Cloudinary (https://res.cloudinary.com)'),
    public_id: z.string().trim().min(1).max(500),
    alt_text: z.string().trim().max(200).optional(),
    is_cover: z.boolean().optional().default(false),
  })
  .strict();

export type PackageImageSaveInput = z.infer<typeof PackageImageSaveSchema>;

/**
 * Profile update input after validation and normalization.
 */
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Validates the body for POST /api/v1/enquiries.
 */
export const CreateEnquirySchema = z
  .object({
    package_id: z.string().uuid(),
    message: z.string().trim().min(1).max(2000),
  })
  .strict();

/**
 * Validates the body for posting a follow-up message to an enquiry thread,
 * from either the traveler or vendor side.
 */
export const EnquiryMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
  })
  .strict();

/**
 * Validates the body for POST /api/v1/chat.
 * `history` is capped at 20 turns — enough for multi-turn context without
 * letting a client blow past the Gemini free-tier token budget.
 */
export const ChatRequestSchema = z
  .object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(2000),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().trim().min(1).max(2000),
        }),
      )
      .max(20)
      .optional(),
  })
  .strict();
