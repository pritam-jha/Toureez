/**
 * @file lib/api/chat.ts
 * @description Backend API calls for the AI travel assistant (Gemini-powered).
 */

import { apiClient } from './client';
import type { ApiResponse, BackendApiResponse } from '../../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function toApiResponse<T>(response: BackendApiResponse<T>): ApiResponse<T> {
  return {
    data: response.data,
    error: response.error,
  };
}

/**
 * Sends a message to the AI travel assistant, along with recent conversation
 * history for multi-turn context, and returns the assistant's reply.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ApiResponse<{ reply: string }>> {
  const response = await apiClient.post<{ reply: string }>('/chat', { message, history });
  return toApiResponse(response);
}
