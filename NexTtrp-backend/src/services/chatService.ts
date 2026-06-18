/**
 * @file services/chatService.ts
 * @description Talks to the Google Gemini API to power the Toureez travel assistant.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../constants/errors';

const SYSTEM_PROMPT =
  'You are a helpful travel assistant for Toureez, a travel booking platform. ' +
  'Help users with trip planning, booking queries, vendor recommendations, and travel advice. ' +
  'Keep answers short and friendly. Do not answer questions unrelated to travel.';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

let genAI: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey === undefined || apiKey.trim() === '') {
    throw new AppError('AI assistant is not configured', 503);
  }

  if (genAI === null) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
};

/**
 * Sends the user's message to Gemini, providing prior turns as conversation
 * history, and returns the assistant's reply.
 */
export const getChatReply = async (message: string, history: ChatMessage[]): Promise<string> => {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat({
    history: history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    })),
  });

  try {
    const result = await chat.sendMessage(message);
    const reply = result.response.text().trim();

    if (reply === '') {
      throw new AppError('AI assistant returned an empty response', 502);
    }

    return reply;
  } catch (caughtError) {
    if (caughtError instanceof AppError) {
      throw caughtError;
    }

    throw new AppError('AI assistant is temporarily unavailable', 502);
  }
};
