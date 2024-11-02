import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages } from './validation.ts';
import { handleError } from './error-handler.ts';
import { SYSTEM_PROMPT } from './prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('Processing template chat request:', { messages });

    const validatedMessages = validateMessages(messages);

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
        messages: validatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Claude API response:', data);

    // The Claude-3 API returns the response in a different structure
    if (!data.content || !Array.isArray(data.content)) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    // Extract the text content from the response
    const content = data.content[0]?.text;
    if (!content) {
      console.error('No content in response:', data);
      throw new Error('No content in response');
    }

    // Try to parse JSON from the response
    try {
      const templateSpec = JSON.parse(content);
      
      if (!templateSpec.template_name || !templateSpec.description || !templateSpec.blocks) {
        throw new Error('Invalid template format: Missing required fields');
      }

      return new Response(
        JSON.stringify({ content: [{ text: content }] }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse template JSON from response');
    }

  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
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