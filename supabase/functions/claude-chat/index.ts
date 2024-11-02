import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function makeRequest(messages: any[], retryCount = 0) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  try {
    console.log('Making request to Claude API with messages:', JSON.stringify(messages));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages,
        max_tokens: 4096,
      }),
    });

    const responseData = await response.json();
    console.log('Claude API response:', JSON.stringify(responseData));

    if (!response.ok) {
      console.error('Claude API error response:', responseData);
      
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        console.log(`Rate limited. Retrying request (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return makeRequest(messages, retryCount + 1);
      }

      throw new Error(responseData.error?.message || 'Failed to get response from Claude');
    }

    return responseData;
  } catch (error) {
    console.error('Error in makeRequest:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { messages } = await req.json();
    console.log('Received request with messages:', messages);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages format. Expected non-empty array.');
    }

    const response = await makeRequest(messages);
    console.log('Successfully processed request');

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      },
    });
  } catch (error) {
    console.error('Error in claude-chat function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
      }
    );
  }
});