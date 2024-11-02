import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateMessages } from './validation.ts';
import { SYSTEM_PROMPT } from './prompts.ts';
import { Anthropic } from 'https://esm.sh/@anthropic-ai/sdk@0.14.1';

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

    if (!claudeResponse?.content?.[0]?.text) {
      throw new Error('Invalid response from Claude');
    }

    const responseContent = claudeResponse.content[0].text;
    
    // Validate JSON structure
    try {
      const parsed = JSON.parse(responseContent);
      if (!parsed.template_name || !parsed.description || !parsed.blocks) {
        throw new Error('Invalid template structure');
      }
    } catch (error) {
      console.error('JSON validation error:', error);
      throw new Error('Invalid template structure returned by Claude');
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
    return new Response(
      JSON.stringify({ 
        error: {
          message: error.message || 'Internal server error',
          details: error.stack
        }
      }),
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