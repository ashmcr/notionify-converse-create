import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages, validateTemplateSpec } from './validation.ts';
import { handleError } from './error-handler.ts';
import { SYSTEM_PROMPT, REFINEMENT_PROMPTS } from './prompts.ts';
import type { ChatRequest } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, refinementType } = await req.json() as ChatRequest;
    
    console.log('Processing template chat request:', { messages, refinementType });

    const validatedMessages = validateMessages(messages);

    const finalMessages = refinementType 
      ? [...validatedMessages, {
          role: 'user',
          content: REFINEMENT_PROMPTS[refinementType as keyof typeof REFINEMENT_PROMPTS]
        }]
      : validatedMessages;

    // Make direct request to Anthropic API instead of using SDK
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: finalMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    try {
      // Validate the template specification in the response
      const templateSpec = JSON.parse(data.content[0].text);
      validateTemplateSpec(templateSpec);
    } catch (error) {
      console.error('Template validation error:', error);
      // Continue with the response even if validation fails
    }

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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      status: error.status
    });

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