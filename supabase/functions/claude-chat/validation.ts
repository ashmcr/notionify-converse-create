import { Message } from './types.ts';

const VALID_PROPERTY_TYPES = [
  'title', 'rich_text', 'number', 'select', 
  'multi_select', 'date', 'formula', 'relation',
  'rollup', 'files', 'checkbox', 'url', 'email',
  'phone_number', 'created_time', 'created_by',
  'last_edited_time', 'last_edited_by', 'text'
];

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

export function validateTemplateSpec(spec: any): boolean {
  if (!spec?.template) {
    throw new Error('Missing template object in specification');
  }

  if (!spec.template.properties || typeof spec.template.properties !== 'object') {
    throw new Error('Missing or invalid properties configuration');
  }

  // Validate properties
  for (const [key, prop] of Object.entries(spec.template.properties)) {
    if (!prop || typeof prop !== 'object') {
      throw new Error(`Invalid property configuration for "${key}"`);
    }

    const typedProp = prop as { type: string };
    
    // Convert 'text' type to 'rich_text' for Notion API compatibility
    if (typedProp.type === 'text') {
      typedProp.type = 'rich_text';
    }
    
    if (!typedProp.type || !VALID_PROPERTY_TYPES.includes(typedProp.type)) {
      throw new Error(`Invalid property type for "${key}": ${typedProp.type}`);
    }
  }

  // Validate views
  if (!Array.isArray(spec.template.views)) {
    throw new Error('Missing or invalid views configuration');
  }

  for (const view of spec.template.views) {
    if (!view.type || !view.name) {
      throw new Error('Invalid view configuration: missing type or name');
    }
  }

  return true;
}