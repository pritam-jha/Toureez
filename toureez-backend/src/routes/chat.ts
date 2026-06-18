/**
 * @file routes/chat.ts
 * @description AI travel assistant chat endpoint, powered by Google Gemini.
 *
 * POST /api/v1/chat — Send a message (with optional history) and get a reply.
 */

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { chatLimiter } from '../middleware/rateLimiter';
import { getChatReply } from '../services/chatService';
import { success, validationError } from '../utils/response';
import { ChatRequestSchema } from '../utils/validation';

export const chatRouter = Router();

chatRouter.use(optionalAuth);

chatRouter.post('/', chatLimiter, async (req, res, next) => {
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);

    const { message, history } = parsed.data;
    const reply = await getChatReply(message, history ?? []);

    return success(res, { reply });
  } catch (err) {
    return next(err);
  }
});
