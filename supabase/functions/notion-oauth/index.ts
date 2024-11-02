import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { verifyJWT } from "./auth.ts";
import { exchangeCodeForToken } from "./notion.ts";
import { corsHeaders, createErrorResponse } from "./utils.ts";

const FRONTEND_URL = 'https://notionify-converse-create.vercel.app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('[server] Received request:', {
    method: req.method,
    url: req.url,
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

    console.log('[server] Received params:', { 
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
    console.log('[server] Verifying state token...');
    const payload = await verifyJWT(state);
    if (!payload) {
      return createErrorResponse(401, 'Invalid or expired state token');
    }

    // Exchange code for Notion access token
    const notionData = await exchangeCodeForToken(code);
    if (!notionData) {
      return createErrorResponse(500, 'Failed to exchange code for access token');
    }

    // Initialize Supabase client
    console.log('[server] Updating user profile');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from state token
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    
    if (authError || !user) {
      console.error('[server] Auth error:', authError);
      return createErrorResponse(401, 'Invalid session');
    }

    console.log('[server] User authenticated:', user.id);

    // Update the user's profile with Notion credentials
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notion_workspace_id: notionData.workspace_id,
        notion_access_token: notionData.access_token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[server] Profile update error:', updateError);
      return createErrorResponse(500, 'Failed to update user profile');
    }

    console.log('[server] Profile updated successfully');

    // Redirect back to the frontend with success parameter
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?success=true`,
      },
    });

  } catch (error) {
    console.error('[server] Error in notion-oauth function:', error);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/settings?error=${encodeURIComponent(error.message)}`,
      },
    });
  }
});