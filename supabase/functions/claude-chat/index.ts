import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateMessages } from './validation.ts';
import { handleError } from './error-handler.ts';
import { SYSTEM_PROMPT, REFINEMENT_PROMPTS, ERROR_PROMPTS } from './prompts.ts';
import type { ChatRequest } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { messages, refinementType } = await req.json() as ChatRequest;
    
    console.log('Processing template chat request:', { messages, refinementType });

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
      ? [...validatedMessages, {
          role: 'user',
          content: REFINEMENT_PROMPTS[refinementType as keyof typeof REFINEMENT_PROMPTS]
        }]
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
        messages: finalMessages,
        system: SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data));

    return new Response(
      JSON.stringify(data),
      { 
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