import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

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

console.log('Edge function loaded with configuration');

serve(async (req) => {
  console.log('Received request:', {
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

    console.log('Received params:', { 
      hasCode: !!code,
      hasState: !!state 
    });

    if (!code) {
      throw new Error('No authorization code provided');
    }

    if (!state) {
      throw new Error('No state token provided');
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Exchange the authorization code for an access token
    console.log('Exchanging code for Notion access token');
    const notionResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${SUPABASE_URL}/functions/v1/notion-oauth`,
      }),
    });

    console.log('Notion API response status:', notionResponse.status);
    const responseText = await notionResponse.text();
    console.log('Notion API response body:', responseText);

    if (!notionResponse.ok) {
      throw new Error(`Notion API error: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Notion OAuth successful:', {
      workspace_id: data.workspace_id,
      workspace_name: data.workspace_name,
    });

    // Get user from state token
    console.log('Getting user from state token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(state);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid session');
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
      throw new Error('Failed to update user profile');
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