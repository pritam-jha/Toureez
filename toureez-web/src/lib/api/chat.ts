import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[]) {
  return apiClient.post<{ reply: string }>('/chat', { messages }, false);
}
