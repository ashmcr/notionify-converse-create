export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  refinementType?: string;
}

export interface ErrorResponse {
  type: string;
  message: string;
  details: string;
}