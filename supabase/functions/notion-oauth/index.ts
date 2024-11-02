import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const NOTION_CLIENT_ID = Deno.env.get('NOTION_CLIENT_ID')!;
const NOTION_CLIENT_SECRET = Deno.env.get('NOTION_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FRONTEND_URL = 'https://notionify-converse-create.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const createErrorResponse = (status: number, message: string, details?: any) => {
  console.error(`Error: ${message}`, details);
  return new Response(
    JSON.stringify({
      error: {
        message,
        details,
        status,
      }
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    }
  );
};

async function verifyJWT(token: string) {
  try {
    const jwt = token.replace('Bearer ', '');
    const { payload } = await jose.jwtVerify(
      jwt,
      new TextEncoder().encode(Deno.env.get('JWT_SECRET'))
    );
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    console.log('Received params:', { 
      hasCode: !!code,
      hasState: !!state 
    });

    if (!code) {
      return createErrorResponse(400, 'No authorization code provided');
    }

    if (!state) {
      return createErrorResponse(400, 'No state token provided');
    }

    // Verify JWT from state parameter
    const payload = await verifyJWT(state);
    if (!payload) {
      return createErrorResponse(401, 'Invalid or expired state token');
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Exchange the authorization code for an access token with retry logic
    console.log('Exchanging code for Notion access token');
    let notionResponse;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        notionResponse = await fetch('https://api.notion.com/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`)}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${SUPABASE_URL}/functions/v1/notion-oauth`,
          }),
        });

        if (notionResponse.ok) break;

        if (notionResponse.status === 429) {
          const retryAfter = notionResponse.headers.get('Retry-After') || '5';
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        } else if (!notionResponse.ok) {
          throw new Error(`Notion API error: ${await notionResponse.text()}`);
        }

        retryCount++;
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        if (retryCount === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }

    if (!notionResponse?.ok) {
      return createErrorResponse(notionResponse?.status || 500, 'Failed to exchange code for access token');
    }

    const data = await notionResponse.json();
    console.log('Notion OAuth successful:', {
      workspace_id: data.workspace_id,
      workspace_name: data.workspace_name,
    });

    // Get user from state token
    console.log('Getting user from state token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return createErrorResponse(401, 'Invalid session');
    }

    console.log('User authenticated:', user.id);

    // Update the user's profile with Notion credentials
    console.log('Updating user profile');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notion_workspace_id: data.workspace_id,
        notion_access_token: data.access_token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return createErrorResponse(500, 'Failed to update user profile');
    }

    console.log('Profile updated successfully');

    // Redirect back to the frontend with success parameter
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?success=true`,
      },
    });

  } catch (error) {
    console.error('Error in notion-oauth function:', error);
    // Redirect back to the frontend with error parameter
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?error=${encodeURIComponent(error.message)}`,
      },
    });
  }
});