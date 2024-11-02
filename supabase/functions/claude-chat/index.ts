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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('Processing template chat request:', { messages });

    // Validate incoming messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array');
    }

    const validatedMessages = validateMessages(messages);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    // Get template specification from Claude
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

    // Validate Claude's response
    if (!claudeResponse || !claudeResponse.content || claudeResponse.content.length === 0) {
      console.error('Empty response from Claude:', claudeResponse);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Empty response from Claude',
            details: 'The AI response was empty. Please try again.'
          }
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Get the text content
    const responseContent = claudeResponse.content[0]?.text;
    
    if (!responseContent) {
      console.error('No text content in response:', claudeResponse);
      return new Response(
        JSON.stringify({
          error: {
            message: 'No text content in response',
            details: 'The AI response contained no text content.'
          }
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Extract and validate JSON from the response
    const templateSpec = extractJsonFromResponse(responseContent);
    
    if (!templateSpec) {
      console.error('Failed to extract valid JSON from response:', responseContent);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid template specification',
            details: 'Could not extract valid JSON from AI response'
          }
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
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
    console.error('Error in claude-chat function:', {
      message: error.message,
      stack: error.stack,
      response: error.response
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

function extractJsonFromResponse(response: string): any {
  try {
    // First try to find JSON in code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (validateTemplateSpec(parsed)) {
        return parsed;
      }
    }

    // If no valid JSON in code blocks, try to parse the entire response
    const parsed = JSON.parse(response);
    if (validateTemplateSpec(parsed)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('JSON parsing error:', error);
    return null;
  }
}

function validateTemplateSpec(spec: any): boolean {
  if (!spec || typeof spec !== 'object') return false;

  const requiredFields = ['template_name', 'description', 'blocks', 'database_properties'];
  for (const field of requiredFields) {
    if (!spec[field]) return false;
  }

  if (!Array.isArray(spec.blocks)) return false;
  if (typeof spec.database_properties !== 'object') return false;

  return true;
}