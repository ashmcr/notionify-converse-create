export interface Message {
  role: 'user' | 'assistant';
  content: string | { type: string; text: string }[];
}

export interface ChatResponse {
  content: { text: string }[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TemplateResponse {
  success: boolean;
  url?: string;
  error?: {
    message: string;
    details?: string;
  };
}

export interface ChatError {
  code: string;
  message: string;
  status?: number;
}

export interface TemplateStructure {
  template_name: string;
  description: string;
  blocks: any[];
  database_properties: Record<string, any>;
  sample_data?: any[];
}