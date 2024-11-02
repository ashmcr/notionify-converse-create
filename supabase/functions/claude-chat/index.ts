import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages } from './validation.ts';
import { handleError } from './error-handler.ts';
import { SYSTEM_PROMPT } from './prompts.ts';
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.14.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('Processing template chat request:', { messages });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array');
    }

    const validatedMessages = validateMessages(messages);

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: validatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: 4096,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
    });

    if (!claudeResponse || !claudeResponse.content || claudeResponse.content.length === 0) {
      throw new Error('Empty response from Claude');
    }

    const responseContent = claudeResponse.content[0]?.text;
    
    if (!responseContent) {
      throw new Error('No text content in response');
    }

    // Try to parse the response as JSON to validate it
    try {
      JSON.parse(responseContent);
    } catch (error) {
      console.error('Invalid JSON response from Claude:', responseContent);
      throw new Error('Invalid JSON response from Claude');
    }

    return new Response(
      JSON.stringify({ content: [{ text: responseContent }] }),
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