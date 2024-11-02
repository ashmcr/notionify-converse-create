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

    // Validate the response structure
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid or empty API response structure:', data);
      throw new Error('Invalid or empty API response structure');
    }

    // Get the first content item's text
    const contentItem = data.content[0];
    if (!contentItem || typeof contentItem.text !== 'string') {
      console.error('Invalid content structure:', contentItem);
      throw new Error('Invalid content structure in response');
    }

    // Try to extract JSON from the content using regex
    const jsonMatch = contentItem.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', contentItem.text);
      throw new Error('No valid JSON found in response');
    }

    try {
      const templateSpec = JSON.parse(jsonMatch[0]);
      
      if (!templateSpec.template_name || !templateSpec.description || !templateSpec.blocks) {
        throw new Error('Invalid template format: Missing required fields');
      }

      return new Response(
        JSON.stringify({ content: [{ text: jsonMatch[0] }] }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to parse template JSON from response: ${parseError.message}`);
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