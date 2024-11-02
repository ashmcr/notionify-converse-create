import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const SYSTEM_PROMPT = `You are a helpful assistant trained to create Notion templates based on user input and specifications. Your responses should be clear, detailed, and follow Notion API specifications where applicable.`

const ErrorTypes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

function validateMessages(messages: any[]): { role: string; content: string; }[] {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  return messages.map(msg => {
    if (!msg.content || typeof msg.content !== 'string') {
      throw new Error('Each message must have a content string');
    }

    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      throw new Error('Message role must be either "user", "system", or "assistant"');
    }

    return {
      role: msg.role,
      content: msg.content.trim()
    };
  });
}

function handleError(error: any) {
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    status: error.status
  });

  if (error.status === 400) {
    return {
      type: ErrorTypes.INVALID_REQUEST,
      message: 'Invalid request format',
      details: error.message
    };
  }

  if (error.status === 429) {
    return {
      type: ErrorTypes.RATE_LIMIT,
      message: 'Rate limit exceeded',
      details: error.message
    };
  }

  if (error.message?.includes('validation')) {
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      message: 'Message validation failed',
      details: error.message
    };
  }

  return {
    type: ErrorTypes.API_ERROR,
    message: 'Internal server error',
    details: error.message
  };
}

const REFINEMENT_PROMPTS = {
  properties: `Based on the template specification provided, suggest additional properties that would enhance the functionality. Include exact Notion API configurations for each suggestion.`,
  views: `Analyze the current view configurations and recommend additional views that would improve data visualization and workflow. Provide complete view specifications.`,
  automations: `Review the template structure and suggest advanced automations using Notion formulas, relations, and rollups. Include exact formula syntax and configuration details.`,
  optimization: `Evaluate the current template specification and suggest optimizations for performance and usability. Include specific technical improvements.`
};

const ERROR_PROMPTS = {
  invalidProperty: `The property configuration is invalid. Please provide a corrected specification that matches the Notion API requirements. Current error: {error}`,
  invalidView: `The view configuration is incorrect. Please provide a valid view specification according to the Notion API documentation. Current error: {error}`,
  formulaError: `The formula syntax is invalid. Please provide a corrected formula that follows Notion's formula syntax. Current error: {error}`
};

function validateTemplateSpec(content: string): { isValid: boolean; error?: string } {
  try {
    const spec = JSON.parse(content);
    if (!spec.template) {
      return { isValid: false, error: 'Missing template object in specification' };
    }
    
    if (!spec.template.properties) {
      return { isValid: false, error: 'Missing properties configuration' };
    }

    for (const [key, prop] of Object.entries(spec.template.properties)) {
      if (!prop.type) {
        return { 
          isValid: false, 
          error: `Invalid property configuration for "${key}": missing type`,
          errorType: 'invalidProperty'
        };
      }
    }

    if (!spec.template.views || !Array.isArray(spec.template.views)) {
      return { isValid: false, error: 'Missing or invalid views configuration' };
    }

    for (const view of spec.template.views) {
      if (!view.type || !view.name) {
        return { 
          isValid: false, 
          error: 'Invalid view configuration: missing type or name',
          errorType: 'invalidView'
        };
      }
    }

    const formulas = Object.values(spec.template.properties)
      .filter((prop: any) => prop.type === 'formula');
    
    for (const formula of formulas) {
      if (!formula.formula?.expression) {
        return { 
          isValid: false, 
          error: 'Invalid formula configuration: missing expression',
          errorType: 'formulaError'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { messages, refinementType } = await req.json();
    
    console.log('Processing template chat request:', { messages, refinementType });

    // Validate messages
    const validatedMessages = validateMessages(messages);

    const lastAssistantMessage = validatedMessages
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastAssistantMessage) {
      const validation = validateTemplateSpec(lastAssistantMessage.content);
      if (!validation.isValid && validation.errorType) {
        validatedMessages.push({
          role: 'user',
          content: ERROR_PROMPTS[validation.errorType as keyof typeof ERROR_PROMPTS]
            .replace('{error}', validation.error || 'Unknown error')
        });
      }
    }

    const finalMessages = refinementType 
      ? [
          ...validatedMessages,
          {
            role: 'user',
            content: REFINEMENT_PROMPTS[refinementType as keyof typeof REFINEMENT_PROMPTS]
          }
        ]
      : validatedMessages;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          ...finalMessages.map(msg => ({
            role: msg.role,
            content: `${msg.role === 'user' && !refinementType ? 'Create a Notion template for: ' : ''}${msg.content}`
          }))
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data));

    const validation = validateTemplateSpec(data.content[0].text);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid template specification format');
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in claude-chat function:', error);
    
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify({ error: errorResponse }),
      { 
        status: error.status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
