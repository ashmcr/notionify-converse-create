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

    // Make direct request to Anthropic API
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
        system: SYSTEM_PROMPT + "\nIMPORTANT: You must ALWAYS respond with valid JSON that matches the template specification format. Never include any natural language responses.",
        messages: finalMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Claude API response:', data);
    
    let templateSpec;
    try {
      // The response from Anthropic API has a different structure
      if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const content = data.content[0].text;
      console.log('Attempting to parse content:', content);
      
      // Try to find JSON in the response if there's any surrounding text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response content:', content);
        throw new Error('No JSON found in response');
      }
      
      templateSpec = JSON.parse(jsonMatch[0]);
      validateTemplateSpec(templateSpec);
      
      if (!templateSpec.template) {
        throw new Error('Missing template object in response');
      }
    } catch (error) {
      console.error('Template validation error:', error);
      throw new Error(`Invalid template format: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ content: [{ text: JSON.stringify(templateSpec) }] }),
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