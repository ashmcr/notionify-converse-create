import { Message } from './types.ts';

export function validateMessages(messages: any[]): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  return messages.map(msg => {
    if (!msg.content || typeof msg.content !== 'string') {
      throw new Error('Each message must have a content string');
    }

    if (!['user', 'assistant'].includes(msg.role)) {
      throw new Error('Message role must be either "user" or "assistant"');
    }

    return {
      role: msg.role,
      content: msg.content.trim()
    };
  });
}