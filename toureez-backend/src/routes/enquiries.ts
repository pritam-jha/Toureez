/**
 * @file routes/enquiries.ts
 * @description Traveler-facing enquiry routes (all protected).
 *
 * POST /api/v1/enquiries              — Start a new enquiry about a package
 * GET  /api/v1/enquiries              — List the traveler's enquiry threads
 * GET  /api/v1/enquiries/:id          — Get a single enquiry thread with messages
 * POST /api/v1/enquiries/:id/messages — Post a follow-up message
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import { addUserMessage, createEnquiry, getUserEnquiries, getUserEnquiryDetail } from '../services/enquiryService';
import { success, validationError } from '../utils/response';
import { CreateEnquirySchema, EnquiryMessageSchema, UuidParamSchema } from '../utils/validation';

export const enquiriesRouter = Router();

enquiriesRouter.use(defaultLimiter);
enquiriesRouter.use(requireAuth);

enquiriesRouter.post('/', strictLimiter, async (req, res, next) => {
  try {
    const parsed = CreateEnquirySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await createEnquiry(req.user!.id, parsed.data);
    return success(res, enquiry, 201);
  } catch (err) {
    return next(err);
  }
});

enquiriesRouter.get('/', async (req, res, next) => {
  try {
    const enquiries = await getUserEnquiries(req.user!.id);
    return success(res, enquiries);
  } catch (err) {
    return next(err);
  }
});

enquiriesRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const enquiry = await getUserEnquiryDetail(req.user!.id, id);
    return success(res, enquiry);
  } catch (err) {
    return next(err);
  }
});

enquiriesRouter.post('/:id/messages', strictLimiter, async (req, res, next) => {
  try {
    const { id } = UuidParamSchema.parse(req.params);
    const parsed = EnquiryMessageSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const enquiry = await addUserMessage(req.user!.id, id, parsed.data.message);
    return success(res, enquiry);
  } catch (err) {
    return next(err);
  }
});
